# Testing Strategy — hive-electronics-ecommerce_app

React 19 frontend. Every data call goes to the real Express API through `src/services/apiClient.js`; unit tests mock that module rather than hitting the network.

**Last updated:** 2026-08-18.

---

## 1. Architecture and key decisions

| Decision | Rationale |
|---|---|
| Vitest + RTL for unit tests | Consistent with the API project (both use Vitest); RTL already installed |
| CRA Jest kept untouched | `react-scripts test` still runs the legacy CRA test runner. No specs match its default patterns — everything lives in `src/__tests__/`, which only Vitest is configured to pick up. |
| Cypress for E2E | Industry standard; handles real browser behavior including page reloads |
| Unit tests mock `apiClient` | The services call `fetch` through one module, so mocking that module isolates components from the network without MSW |
| E2E needs the full stack | Cypress drives the real UI against the real API — the dev server, the API on `:4000`, and MongoDB all have to be running. See E2E-001 in [`../../docs/testing/known-issues.md`](../../docs/testing/known-issues.md). |

### React 19 known limitation — async Action deferred rendering

React 19 treats `async` event handlers as "Actions" and defers intermediate state commits until the handler resolves. This means loading-state DOM updates (`setLoading(true)`) set inside an `async onSubmit` are NOT visible to RTL's synchronous queries mid-flight.

**Impact**: TC-UNIT-FE-049 and TC-UNIT-FE-050 are marked `it.todo` with an explanation — they are the 2 todo entries in the run totals below. The same loading behavior is covered indirectly by TC-UNIT-FE-048 (the error appears only after the full async flow resolves) and TC-UNIT-FE-052 (reload is called after success).

---

## 2. Running tests

```bash
# Unit tests (Vitest, no server needed)
npm run test:unit

# Unit tests in watch mode
npm run test:unit:watch

# Unit tests with coverage
npm run test:unit:coverage

# E2E tests — require the FULL stack, not just the dev server:
#   terminal 1: MongoDB running, then in hive-electronics-ecommerce_api/
#               npm run seed && npm run dev      (API on :4000)
#   terminal 2: npm start                        (CRA on :3000)
npm run test:e2e           # terminal 3 (headless)
npm run test:e2e:open      # terminal 3 (Cypress UI)
```

---

## 3. Unit tests (Vitest 4 + React Testing Library 16)

**Config**: `vite.config.js` → `vitest.setup.js`. The setup file extends `expect` with jest-dom matchers, sets `process.env.REACT_APP_API_URL` to `http://localhost:4000/api` before any import (so `apiClient` never builds an `undefined/...` URL), installs an in-memory `localStorage`, stubs `window.location.reload`, and clears both between every test.

**Location**: `src/__tests__/` — 41 spec files.

### Results: 371 passed | 1 failed | 2 todo (374 total)

Last measured 2026-08-18 on `main` (`bfd20ab`).

> **The suite is currently red.** `TC-UNIT-FE-CHECKOUT-033` in `pages/Checkout.handlers.test.jsx` fails: a failed payment save sets the page-level `error` state, and `Checkout.jsx` renders `error` in a top-level ternary, so the whole page — including the form the test expects to stay open — unmounts. This is a component regression, not a stale test. Tracked as FRONTEND-006 in [`../../docs/testing/known-issues.md`](../../docs/testing/known-issues.md). It also fails the `frontend-unit` CI job.

| Directory | Files | Covers |
|---|---|---|
| `components/` | 17 | Address and payment method forms/items/lists, cart view, product card and details, category details, list, login form, badge, error message, error fallback, summary section, App |
| `pages/` | 9 | Cart, CategoryPage, Checkout, Checkout handlers, Home, Login, Order, Product, ProtectedRoute |
| `services/` | 8 | apiClient, userServices, productServices, categoryServices, orderServices, paymentServices, shippingServices, logger |
| `layout/` | 4 | Header, Footer, Navigation, Layout |
| `context/` | 3 | CartContext (guest and authenticated paths) |

### Async strategy

The service layer no longer wraps responses in `setTimeout` — the old local-JSON simulation is gone, so `vi.useFakeTimers()` is not needed to get past an artificial delay. Service and component specs mock the API module directly:

```js
vi.mock('../../services/apiClient');
```

Two real `setTimeout` calls remain in the app, and only the first affects tests:

- `LoginForm.jsx:21` — an artificial 800 ms delay before calling `login()`.
- `Navigation.jsx:108` — a 200 ms `onBlur` delay before closing the dropdown.

`apiClient.test.js` still uses fake timers deliberately, to advance past the 60-second GET cache TTL and assert that the cache expires.

---

## 4. Test IDs (`data-testid`)

Selectors added to components for stable Cypress targeting:

| Selector | Location |
|---|---|
| `[data-testid="login-form"]` | `LoginForm.jsx` — the `<form>` element |
| `[data-testid="email-input"]` | `LoginForm.jsx` — email `<input>` (via Input `...rest`) |
| `[data-testid="password-input"]` | `LoginForm.jsx` — password `<input>` (via Input `...rest`) |
| `[data-testid="login-submit"]` | `LoginForm.jsx` — submit `<button>` (via Button `...rest`) |
| `[data-testid="login-error"]` | `LoginForm.jsx` — error `<div role="alert">` |
| `[data-testid="signup-form"]` | `SignupForm.jsx` — the `<form>` element |
| `[data-testid="displayName-input"]` | `SignupForm.jsx` — display name `<input>` |
| `[data-testid="email-input"]` | `SignupForm.jsx` — email `<input>` |
| `[data-testid="password-input"]` | `SignupForm.jsx` — password `<input>` |
| `[data-testid="confirmPassword-input"]` | `SignupForm.jsx` — confirm password `<input>` |
| `[data-testid="signup-error"]` | `SignupForm.jsx` — error `<div role="alert">` |
| `[data-testid="signup-submit"]` | `SignupForm.jsx` — submit `<button>` |
| `[data-testid="product-card"]` | `ProductCard.jsx` — card container `<div>` |
| `[data-testid="add-to-cart-btn"]` | `ProductCard.jsx` — "Add to cart" button |
| `[data-testid="cart-item-{id}"]` | `CartView.jsx` — each cart item row |
| `[data-testid="checkout-btn"]` | `Cart.jsx` — "Proceed to payment" button |
| `[data-testid="confirm-payment-btn"]` | `Checkout.jsx` — "Confirm payment" button |
| `[data-testid="order-confirmation"]` | `Order.jsx` — confirmation page root |

`Button` was modified to spread `...rest` onto the underlying `<button>` element, enabling `data-testid` passthrough.

`ErrorMessage` was modified to add `role="alert"` and spread `...rest`, enabling accessible alerts and `data-testid` passthrough.

---

## 5. E2E tests (Cypress 15)

**Config**: `cypress.config.js` (baseUrl: `http://localhost:3000`, defaultCommandTimeout: 8s)

**Location**: `cypress/e2e/`

### Custom commands (`cypress/support/commands.js`)

| Command | Description |
|---|---|
| `cy.loginBySession(email?)` | Sets a JWT-shaped `authToken` + `userData` in localStorage directly (bypasses login form). Call **before** `cy.visit()` so the app reads auth state on mount. |
| `cy.addProductToCart(product?)` | Pushes product into `cart` localStorage key |
| `cy.clearCart()` | Empties `cart` localStorage |
| `cy.logoutSession()` | Removes `authToken` and `userData` from localStorage |

`cy.loginBySession` mirrors the token format and user object that `userServices.login()` writes after a real API login. It builds a **three-segment JWT-shaped token** (`headerB64.payloadB64.cypress-test-signature`) whose payload encodes `{ userId, name, role, iat, exp }`, so `atob(token.split(".")[1])` in `getCurrentUser()` decodes correctly, and stores `userData` under the key `userId` (not `_id`). The token is structurally valid but **not cryptographically signed** — that is sufficient because `isAuthenticated()` only checks for token presence and the frontend never verifies the signature.

The `TEST_USERS` map in `cypress/support/commands.js` hardcodes seeded MongoDB ObjectIds. **Re-seeding the database invalidates them** and the IDs must be updated.

### E2E test matrix

**31 tests across 4 specs.**

#### `auth/login.cy.js` (8 tests)

| Test ID | Description |
|---|---|
| TC-E2E-AUTH-001 | Login page renders email, password, and submit |
| TC-E2E-AUTH-002 | Invalid credentials show error |
| TC-E2E-AUTH-003 | Valid credentials redirect to `/` |
| TC-E2E-AUTH-004 | `authToken` in localStorage after login |
| TC-E2E-AUTH-005 | Header shows display name after `loginBySession` |
| TC-E2E-AUTH-006 | Unauthenticated `/checkout` redirects to `/login` |
| TC-E2E-AUTH-007 | Authenticated user can access `/checkout` |
| TC-E2E-AUTH-008 | Logout clears token and updates header |

#### `auth/signup.cy.js` (6 tests)

| Test ID | Description |
|---|---|
| TC-E2E-AUTH-009 | "Create account" header dropdown link navigates to `/register` |
| TC-E2E-AUTH-010 | Signup page renders displayName, email, password, confirmPassword inputs |
| TC-E2E-AUTH-011 | Too-short password shows a validation error |
| TC-E2E-AUTH-012 | Mismatched passwords show "Passwords do not match" |
| TC-E2E-AUTH-013 / -014 | Valid signup redirects to `/login` without auto-login, and the new account can then log in |
| TC-E2E-AUTH-015 | Signing up with an existing email shows a server error |

#### `cart/cart.cy.js` (9 tests)

| Test ID | Description |
|---|---|
| TC-E2E-CART-001 | Empty cart shows empty state |
| TC-E2E-CART-002 | Home page renders product cards after delay |
| TC-E2E-CART-003 | "Add to cart" button adds product |
| TC-E2E-CART-004 | Cart badge updates on add |
| TC-E2E-CART-005 | Cart page shows item name and price |
| TC-E2E-CART-006 | Quantity "+" button increments count |
| TC-E2E-CART-007 | Remove button removes item |
| TC-E2E-CART-008 | "Empty cart" clears all items |
| TC-E2E-CART-009 | Authenticated user: "Proceed to payment" → `/checkout` |

#### `checkout/checkout.cy.js` (8 tests)

| Test ID | Description |
|---|---|
| TC-E2E-CHECKOUT-001 | Unauthenticated redirect to `/login` |
| TC-E2E-CHECKOUT-002 | Default address pre-selected on load |
| TC-E2E-CHECKOUT-003 | Cart items shown in "Order details" |
| TC-E2E-CHECKOUT-004 | Order summary shows correct subtotal |
| TC-E2E-CHECKOUT-005 | "Confirm payment" enabled when address selected |
| TC-E2E-CHECKOUT-006 | Confirming → redirects to `/order-confirmation` |
| TC-E2E-CHECKOUT-007 | Confirmation page shows "Thank you" and order ID |
| TC-E2E-CHECKOUT-008 | Address form allows adding a new address |

---

## 6. Data strategy

The frontend's data source is the real Express API. The files under `src/data/` are leftovers from the pre-API version and are no longer the app's data source — only `categories.json` is still imported anywhere (`ProductDetails.jsx:4`, as a category-name lookup fallback). `users.json`, `products.json`, and `shippingAddress.json` are unreferenced by application code.

| Layer | Data source | Cleanup |
|---|---|---|
| Unit (components, pages, context) | `vi.mock('../../services/apiClient')` — resolved/rejected values per test | `vi.clearAllMocks()` + `localStorage.clear()` in the global `beforeEach` in `vitest.setup.js` |
| Unit (`apiClient.test.js`) | `fetch` stubbed via `vi.stubGlobal` | Same global `beforeEach`; `clearApiCache()` between cache assertions |
| E2E | Real API on `:4000` against a real MongoDB, seeded with `npm run seed` | `beforeEach(() => cy.clearLocalStorage())` in `cypress/support/e2e.js` |

**E2E isolation**: clearing localStorage prevents cart and auth state leaking between tests. Note that it does **not** roll back the database — signup and checkout specs write real users and real orders to MongoDB, so repeated runs accumulate records, and the "existing email" case (TC-E2E-AUTH-015) depends on data a previous run created.

> **The Cypress test users do not exist in a freshly seeded database.** `cypress/fixtures/users.json` and the `TEST_USERS` map in `cypress/support/commands.js` use `john@email.com` / `john123` and `jane@email.com` / `jane123`, with hardcoded ObjectIds (`67fc9bda…`). The API's seed script creates `admin@hiveelectronics.com`, `john.doe@example.com`, and `jane.smith@example.com` with different passwords and freshly generated ObjectIds. Specs that perform a **real** login (TC-E2E-AUTH-003, TC-E2E-AUTH-004) therefore fail against a seeded database. Specs that use `cy.loginBySession` still pass, because the frontend never verifies the token — but any request they make for that user's carts, addresses, or orders resolves to an ObjectId with no records behind it. Either add these two accounts to `scripts/seed.js` or repoint the fixtures at the seeded accounts.

---

## 7. What critical rules are covered

Beyond line/branch coverage percentages, these tests enforce specific business rules:

| Rule | Where tested |
|---|---|
| Invalid credentials must be rejected | TC-UNIT-FE-004, TC-UNIT-FE-005, TC-E2E-AUTH-002 |
| Auth token stored in localStorage on login | TC-UNIT-FE-002, TC-E2E-AUTH-004 |
| Auth token removed on logout | TC-UNIT-FE-008, TC-E2E-AUTH-008 |
| Protected routes block unauthenticated users | TC-UNIT-FE-074, TC-E2E-AUTH-006 |
| Role-based access denies unauthorized roles | TC-UNIT-FE-077 |
| Adding same product increments quantity, not duplicates | TC-UNIT-FE-030, TC-E2E-CART-003 |
| CartContext throws outside provider | TC-UNIT-FE-042 |
| updateQuantity(0) removes the product | TC-UNIT-FE-036 |
| Cart persisted to localStorage | TC-UNIT-FE-040, TC-UNIT-FE-041 |
| Empty cart state shown when cart is empty | TC-E2E-CART-001 |
| Full checkout flow completes to order confirmation | TC-E2E-CHECKOUT-006, -007 |

---

## 8. CI/CD integration

CI is already implemented — see [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) at the repository root. It covers both projects in five jobs on Node 20, triggered by pushes to `main`/`develop` and pull requests into `main`:

```
backend-unit ─────► backend-integration ─┐
                         (+ coverage)     ├─► e2e
frontend-unit ────► frontend-build ──────┘
   (+ coverage)
```

The two frontend jobs run `npm ci --legacy-peer-deps`, then `npm run test:unit` and `npm run test:unit:coverage` (`frontend-unit`, uploading a `frontend-coverage` artifact), and `npm run build` with `CI: false` (`frontend-build`, because CRA treats warnings as errors when `CI=true`).

Two gaps in the current pipeline:

- **`frontend-unit` is failing on `main`** — see FRONTEND-006 in [`../../docs/testing/known-issues.md`](../../docs/testing/known-issues.md).
- **The `e2e` job starts only the CRA dev server.** It does not start MongoDB or the API, so specs that make real requests have no backend to reach. Closing this means adding a MongoDB service container, running `npm run seed`, starting the API on `:4000`, and waiting on it alongside the existing wait on `:3000`. Tracked as E2E-001.
