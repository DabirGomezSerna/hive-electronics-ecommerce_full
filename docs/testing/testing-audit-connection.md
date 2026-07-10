# Testing Audit: Frontend ↔ Backend Connection Impact

## Context

All five testing docs (`strategy.md`, `test-data.md`, `test-matrix.md`, `known-issues.md`, `running-tests.md`) were written when the frontend used local JSON files and fake `btoa`-encoded auth. The frontend has since been fully connected to the real Express API. This document records what must change across tests and docs.

---

## Root Cause: What Changed

| Area | Before (Disconnected) | After (Connected) |
|---|---|---|
| Frontend services | Read `src/data/*.json` + `setTimeout` | `fetch()` via `apiClient.js` → `http://localhost:4000/api` |
| Auth tokens | `btoa("email:timestamp")` | Real JWT from `/api/login` |
| New services | n/a | `orderServices.js`, `paymentServices.js` added |
| Modified services | `userServices`, `productServices`, `shippingServices`, `categoryServices` all rewrote to use `apiClient` | Same files, totally different implementation |
| Backend routes | Unchanged at time of docs | `shippingAddressRoutes.js`, `paymentMethodRoutes.js`, `orderController.js`, `Order.js` all modified (per git status) |

---

## Part 1 — Tests That Can Stay the Same

### Backend (no changes needed)
- **All 55 unit tests** — middleware and model schema tests are completely independent
- **Integration tests for unchanged routes:** `auth.test.js`, `users.test.js`, `categories.test.js`, `products.test.js`, `cart.test.js` — these routes were not modified

### Frontend (pure UI, no API calls)
- `CartContext.test.jsx` (16 tests) — reads/writes localStorage only; no `fetch` calls
- `ProductCard.test.jsx` (11 tests) — pure presentational component
- `AddressForm.test.jsx` (8 tests) — form rendering/validation only; no API call
- `CartView.test.jsx` (9 tests) — reads from `CartContext` (localStorage), no API
- `ProtectedRoute.test.jsx` (5 tests) — checks `isAuthenticated()` which reads localStorage

---

## Part 2 — Tests That Need to Be Updated

### Frontend service tests (currently broken — call real fetch with no mock)

**`__tests__/services/userServices.test.js`**
- Was: testing against hardcoded `validUsers` object with `btoa` tokens
- Must become: mock `POST /api/login` and `POST /api/register` via MSW (or `vi.stubGlobal('fetch', ...)`) returning JWT shape `{ token, refreshToken, user: { displayName, email, role } }`
- Note: `isAuthenticated()` and `getCurrentUser()` still read localStorage — those test cases are fine as-is

**`__tests__/services/productServices.test.js`**
- Was: testing `fetchProducts()` which read `src/data/products.json` via `setTimeout`
- Must become: mock `GET /api/products`, `GET /api/products/:id` to return the same product shape

**`__tests__/components/LoginForm.test.jsx`** (9 tests + 2 todos)
- Currently fires `login()` which now calls real `fetch` — tests that test submit behavior will fail without a network mock
- Must add MSW handler for `POST /api/login` returning success and error shapes

### Backend integration tests for modified routes

**`tests/integration/addresses.test.js`**
- `shippingAddressRoutes.js` was modified — any new routes (e.g. `GET /api/addresses/user/:id` added for frontend) need corresponding tests
- BUG-003 (postalcode field name) needs re-verification if the controller was also modified

**`tests/integration/paymentMethods.test.js`**
- `paymentMethodRoutes.js` and controller were modified — new routes or changed behavior need coverage
- BUG-002 and BUG-004 need re-verification — they may have been fixed during the connection work

**`tests/integration/orders.test.js`**
- `orderController.js` and `Order.js` (model) were modified — test assertions against response shape or status codes may be wrong now

### Cypress E2E (`cypress/`)

**`cy.loginBySession` custom command**
- Was: seeds localStorage with `btoa("email:timestamp")` fake token
- Must become: seed localStorage with a valid JWT shape (either call real `/api/login`, or use `jsonwebtoken` to sign a test token using `JWT_SECRET`)

---

## Part 3 — New Tests to Create

### Frontend — new service files with zero coverage

| File | Endpoints to mock | Priority |
|---|---|---|
| `__tests__/services/categoryServices.test.js` | `GET /api/categories`, `GET /api/categories/:id` | High |
| `__tests__/services/shippingServices.test.js` | GET/POST/PUT/DELETE `/api/addresses` and `/api/addresses/user/:id` | High |
| `__tests__/services/paymentServices.test.js` | GET/POST/PUT/DELETE `/api/payment-methods` and `user/:id` | High |
| `__tests__/services/orderServices.test.js` | `POST /api/orders` | High |
| `__tests__/services/apiClient.test.js` | Token attachment, 401 handling, 204 handling | Medium |

### Frontend — new component/page with no tests

| File | What to test | Priority |
|---|---|---|
| `__tests__/pages/Checkout.test.jsx` | Renders address/payment lists from mocked API; handles empty states; calls `createOrder` on submit | High |
| `__tests__/pages/Order.test.jsx` | Renders order confirmation from `location.state`; handles missing state (redirect or error) | Medium |

### Backend — new routes (if confirmed added during connection)
After the modified route files are read, any new endpoints not present in the original test matrix need integration tests following the existing pattern in `tests/integration/*.test.js`.

---

## Part 4 — Documentation Updates (all 5 files)

### `strategy.md`
- Remove the constraint: *"Frontend has no real HTTP layer — all services read from src/data/*.json"*
- Update Level 3 (Frontend Unit): add MSW as the required network mock layer; describe intercepting `REACT_APP_API_URL` base URL in tests
- Update the note that *"Frontend 'integration' tests don't exist"* — they now make sense via MSW
- Update the constraint *"E2E requires running dev server"* → *"E2E requires running dev server AND API server AND MongoDB"*
- Update test counts once new tests are added

### `test-data.md`
- Replace the entire *"Frontend unit tests"* section: remove `src/data/*.json` references, `setTimeout` delays, hardcoded `validUsers`, and `btoa` token format
- Add new section: **MSW handlers** — describe the handler shape for each API endpoint (success + error responses)
- Replace JWT test data: describe real JWT payload `{ displayName, email, role, iat, exp }`
- Update Cypress section: describe new `cy.loginBySession` approach using real JWT

### `test-matrix.md`
- Mark `userServices.test.js` and `productServices.test.js` as "needs update" (currently testing removed behavior)
- Add rows for all 5 new service test files
- Add rows for `Checkout.test.jsx` and `Order.test.jsx`
- Update backend rows for modified routes (addresses, payment methods, orders)
- Add any new backend routes discovered in modified files

### `known-issues.md`
- **Close FRONTEND-001** (*"Frontend uses simulated auth, not real API"*) — fixed; remove or mark resolved
- **Add FRONTEND-004**: Frontend service tests have no MSW setup — `fetch` calls hit real network (or fail) in test environment; tests for `userServices`, `productServices` are currently broken
- **Add FRONTEND-005**: `cy.loginBySession` injects `btoa`-encoded token — invalid with real JWT-based `isAuthenticated()`; all Cypress specs fail auth seeding

### `running-tests.md`
- Add note to frontend unit section: *"Service tests require MSW to be configured — see test setup"*
- Update E2E prerequisites: add *"API server must be running on port 4000 with MongoDB connected"*; current docs only mention `npm start`
- Add environment variable requirement: `REACT_APP_API_URL=http://localhost:4000/api` must be set (`.env` file)

---

## Verification (after implementation)

1. `npm run test:unit` (backend) — all 55 pass, no change
2. `npm run test:integration` (backend) — re-run against modified routes; confirm BUG-002/003/004 status
3. `npm run test:unit` (frontend) — service tests pass with MSW; 0 tests hit real network
4. `npm run test:e2e` (Cypress) — `cy.loginBySession` seeds valid JWT; login-gated specs pass
