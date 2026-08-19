# Known Issues — Hive Electronics Ecommerce

**Last updated:** 2026-08-18

Issues are organized by severity. Each entry includes the test ID that documents current behavior so regressions are caught the moment a fix lands.

Every entry below was re-verified against `main` on 2026-08-18. Open counts as of the latest pass: **7 backend bugs**, **1 security gap**, **2 frontend issues** (REACT19-001, E2E-001).

---

## Backend bugs

### BUG-001 — ✅ RESOLVED — `GET /api/orders` no longer crashes with TypeError

| Field | Value |
|---|---|
| **Location** | `src/controllers/orderController.js:5–17` |
| **Documenting test** | TC-INT-ORD-001 — must be updated to assert `status: 200` and an array body |
| **Resolved in** | `2ef03cb` / `692e89d` |
| **Resolution** | `.populate()` is now chained on the Mongoose **query** before the `await`, not on the resolved array: `const orders = await Order.find().populate("user").populate("products.product").populate("address").populate("paymentMethod")`. Admin order listing works. |

---

### BUG-002 — ✅ RESOLVED — `PUT /api/payment-methods/:id` crashed when `isDefault: true`

| Field | Value |
|---|---|
| **Location** | `src/controllers/paymentMethodController.js` |
| **Documenting test** | TC-INT-PAY-014 (now asserts `status: 200` and that the previous default is unset) |
| **Resolution** | `updatePaymentMethod` now declares `const existing = await PaymentMethod.findById(id)` (with a `404` if not found) before the `isDefault` branch, so `existing.user` is defined when unsetting the previous default. This was the reported "Edit payment method won't save" bug — the crash was only triggered when `isDefault` was truthy, which happens whenever a user edits their existing default payment method (the form pre-populates the checkbox from the record being edited). |

---

### BUG-003 — ✅ RESOLVED — `PUT /api/addresses/:id` postalCode field name fixed

| Field | Value |
|---|---|
| **Location** | `src/controllers/shippingAddressController.js` |
| **Resolved in** | Frontend-backend connection work |
| **Resolution** | Controller now correctly destructures `postalCode` (uppercase `C`) from `req.body` and passes it to `findByIdAndUpdate`. The update is applied and returned in the response. TC-INT-ADDR-016 updated to assert the correct behavior (value changes from `"10001"` to `"90210"`). |

---

### BUG-004 — ✅ RESOLVED — `GET /api/payment-methods/:id` returns 404 for non-existent ID

| Field | Value |
|---|---|
| **Location** | `src/controllers/paymentMethodController.js` — `getPaymentMethodById` |
| **Documenting test** | TC-INT-PAY-005 — must be updated to assert `status: 404` |
| **Resolved in** | `2ef03cb` / `692e89d` |
| **Resolution** | The `if (!paymentMethod)` null check now runs **before** `await paymentMethod.populate("user")`, so a missing record returns `404 { message: "Payment method not found" }` instead of throwing. The query also now applies `.select("-cvv")`, so the CVV is never returned in the response. |

---

### BUG-005 — MEDIUM — Category `imageUrl` silently discarded on create/update

| Field | Value |
|---|---|
| **Location** | `src/controllers/categoryController.js:35, 52` |
| **Documenting test** | None (schema default always applies, no test verifies stored value) |
| **Current behavior** | Controller assigns `imageURL` (uppercase `L`) to the model, but schema field is `imageUrl` (lowercase `l`). The passed value is discarded; the schema default is used. |
| **Expected behavior** | Passed `imageUrl` value is stored. |
| **Fix** | Change `imageURL` → `imageUrl` in the controller assignments. |

---

### BUG-006 — HIGH — `removeFromCart` ignores requested quantity

| Field | Value |
|---|---|
| **Location** | `src/controllers/cartController.js` — `removeProductFromCart` |
| **Documenting test** | TC-INT-CART-013 (asserts quantity decrements by 1 regardless) |
| **Current behavior** | `quantity` **is** destructured from the request body (`const { userId, productId, quantity = 1 } = req.body`) but is never used. The decrement branch is hardcoded: `cart.products[i].quantity === 1 ? splice(...) : (cart.products[i].quantity -= 1)`. Removing 3 of an item removes 1. |
| **Expected behavior** | Decrements by the quantity in the request body. |
| **Fix** | Use the already-destructured `quantity` in the decrement, and guard the splice on `existing.quantity <= quantity` rather than `=== 1`. |

---

### BUG-007 — CRITICAL — `GET /api/users/search` ignores `email` and `role`, and crashes when either is used without `q`

| Field | Value |
|---|---|
| **Location** | `src/controllers/userController.js` — `searchUsers`, the three `if` blocks |
| **Documenting test** | TC-DIAG-001 (asserts `status: 500` or wrong count) |
| **Current behavior** | All three branches (`if (q)`, `if (email)`, `if (role)`) assign an **identical** `$or` built from `q`, and each overwrites the previous one. Two consequences: (1) `email` and `role` are never used as filters at all — passing `?role=admin` returns a `q`-based search, not admins; (2) when `email` or `role` is supplied without `q`, the query becomes `{ $regex: undefined }`, which MongoDB rejects → 500. A third, separate defect is that every branch matches on a `name` field, but the User schema has no `name` — the field is `displayName`, so that half of the `$or` can never match. |
| **Expected behavior** | `200` with users filtered by whichever parameters were supplied. |
| **Fix** | Give each parameter its own independent filter, and match on `displayName` rather than `name`: `if (q) filters.$or = [{ displayName: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }]; if (email) filters.email = { $regex: email, $options: "i" }; if (role) filters.role = role;` |

---

### BUG-008 — ✅ RESOLVED — `removeProductFromCart` no longer sends a double response

| Field | Value |
|---|---|
| **Location** | `src/controllers/cartController.js` — `removeProductFromCart`, the not-found branch |
| **Documenting test** | TC-DIAG-005 (asserts `status: 404`) — still valid |
| **Resolved in** | `2ef03cb` / `692e89d` |
| **Resolution** | The branch is now `return res.status(404).json({ message: "Product not found in cart" })`. Execution stops, so `cart.save()` and the second `res.json(cart)` no longer run. |
| **Note** | `src/middleware/errorHandler.js` now also guards this class of fault generally — if `res.headersSent` is true it delegates to Express's default handler rather than throwing `ERR_HTTP_HEADERS_SENT`. |

---

### BUG-009 — CRITICAL — `PUT /api/orders/:id` returns 204 instead of 404 for non-existent order

| Field | Value |
|---|---|
| **Location** | `src/controllers/orderController.js:99–101` |
| **Documenting test** | TC-DIAG-006 (asserts `status: 204`) |
| **Current behavior** | `if (!updated) return res.status(204).json(...)`. HTTP 204 means "No Content" — wrong for "resource not found". |
| **Expected behavior** | `404` with `{ message: "Order not found" }`. |
| **Fix** | Change `status(204)` to `status(404)`. |

---

### BUG-010 — CRITICAL — `DELETE /api/users/:id` missing `validate` middleware

| Field | Value |
|---|---|
| **Location** | `src/routes/userRoutes.js:73–79` |
| **Documenting test** | TC-DIAG-003 (asserts `status: 500`) |
| **Current behavior** | Route chain: `authMiddleware → isAdmin → userIdValidation → deleteUser`. The `validate` middleware is missing, so validation errors from `userIdValidation` are silently ignored. Invalid MongoId → `User.findByIdAndDelete("not-a-valid-mongo-id")` → Mongoose `CastError` → 500. |
| **Expected behavior** | `422` with `{ errors: [...] }` |
| **Fix** | Insert `validate` between `userIdValidation` and `deleteUser`. |

---

### BUG-011 — CRITICAL — `DELETE /api/carts/:id` missing `validate` middleware

| Field | Value |
|---|---|
| **Location** | `src/routes/cartRoutes.js:135` |
| **Documenting test** | TC-DIAG-004 (asserts `status: 500`) |
| **Current behavior** | Same pattern as BUG-010. `cartIdValidation` runs but `validate` is never called. Invalid ObjectId → CastError → 500. |
| **Expected behavior** | `422` |
| **Fix** | Insert `validate` between `cartIdValidation` and `deleteCart`. |

---

### BUG-012 — ✅ RESOLVED — JWT payload `name` field now contains `displayName`

| Field | Value |
|---|---|
| **Location** | `src/controllers/authController.js:74` |
| **Resolved in** | Frontend-backend connection work |
| **Resolution** | Login now calls `generateToken(userExist._id, userExist.displayName, userExist.role)`. The JWT `name` field correctly contains the user's display name. TC-DIAG-002 updated to assert `payload.name === displayName`. |

---

### BUG-013 — HIGH — `POST /api/users` returns 500 for duplicate email

| Field | Value |
|---|---|
| **Location** | `src/controllers/userController.js:96–111` |
| **Documenting test** | TC-DIAG-013 (asserts `status: 500`) |
| **Current behavior** | `createUser` calls `User.create()` without checking for duplicate email first. The MongoDB unique index throws `E11000 duplicate key error` → caught by generic error handler → 500. |
| **Expected behavior** | `400` or `409` with a descriptive message (same behavior as `authController.register`). |
| **Fix** | Add `const existing = await User.findOne({ email })` check before `User.create()`. |

---

## Security gaps

### SEC-001 — CRITICAL — `POST /api/users` has no authentication

| Field | Value |
|---|---|
| **Location** | `src/routes/userRoutes.js:63` |
| **Documenting test** | TC-INT-USR-012, TC-INT-USR-013 |
| **Current behavior** | Anyone (unauthenticated) can `POST /api/users` and create a user with any role, including `admin`. The route is `router.post("/users", createUserValidation, validate, createUser)` — no `authMiddleware`, no `isAdmin`. |
| **Expected behavior** | Creating users should require authentication; creating admin users should require admin role. |
| **Recommendation** | Add `authMiddleware` and `isAdmin` middleware to the `POST /api/users` route. The public registration endpoint (`POST /api/register`) already exists for self-signup, and it hardcodes `role = "customer"`, so closing this route does not affect signup. |
| **Severity note (2026-08-18)** | Impact is higher than when this was first written: the API is now publicly deployed on Render, so this is a reachable privilege-escalation path against the live service, not just a local one. |

---

### SEC-002 — ✅ RESOLVED — Customer address listing endpoint added

| Field | Value |
|---|---|
| **Location** | `src/routes/shippingAddressRoutes.js` |
| **Resolved in** | Frontend-backend connection work |
| **Resolution** | `GET /api/addresses/user/:id` endpoint added — `authMiddleware` only (no `isAdmin`). `getShippingAddressesByUser` controller function added. Customers can now list their own addresses. Tests in `addresses.test.js` need a new describe block for this route. |

---

## Frontend known issues

### REACT19-001 — Loading state not testable in RTL (React 19 async Actions)

| Field | Value |
|---|---|
| **Affected tests** | TC-UNIT-FE-049, TC-UNIT-FE-050 (marked `it.todo`) |
| **Root cause** | React 19 treats `async` event handlers ("Actions") as transactions and defers ALL intermediate state commits (including `setLoading(true)`) until the handler resolves. RTL's `waitFor` cannot observe intermediate loading state mid-flight. |
| **Impact** | Two loading-state assertions cannot be implemented. Loading behavior is indirectly verified by TC-UNIT-FE-048 (error appears only after full async flow) and TC-UNIT-FE-052 (reload called after success). |
| **Resolution** | None available with current React 19 + RTL constraints. Revisit when RTL adds explicit support for React 19 Actions, or test loading state via Cypress instead. |

---

### FRONTEND-001 — ✅ RESOLVED — Frontend now uses real API

| Field | Value |
|---|---|
| **Resolved in** | Frontend-backend connection work |
| **Resolution** | `userServices.js` now calls the real `/api/login` endpoint via `apiClient`. JWT is decoded from the response and stored in localStorage. All service files (`productServices`, `categoryServices`, `shippingServices`, `paymentServices`, `orderServices`) now use `apiClient` against the real backend. |
| **Remaining work** | None. Both follow-ups are closed: the `userServices` / `productServices` specs were migrated (FRONTEND-004) and Cypress auth seeding now injects a valid JWT shape (FRONTEND-005). |

---

### FRONTEND-002 — ✅ RESOLVED — `Header.jsx` event listener is cleaned up

| Field | Value |
|---|---|
| **Location** | `src/layout/Header/Header.jsx:29,33` |
| **Resolved in** | Verified against current code on 2026-08-18 — no single commit isolates the change. |
| **Resolution** | The file now registers exactly one listener, `window.addEventListener("storage", updateAuthState)`, and its cleanup returns `window.removeEventListener("storage", updateAuthState)` — a matched pair. The `document.addEventListener` click-outside effect this entry described is not present in the current component. |

---

### FRONTEND-003 — ✅ RESOLVED — `debugger` statement removed from `Checkout.jsx`

| Field | Value |
|---|---|
| **Resolved in** | Frontend-backend connection work |
| **Resolution** | The `debugger;` statement previously on line 62 of `src/pages/Checkout/Checkout.jsx` is no longer present in the current code. |

---

### FRONTEND-006 — ✅ RESOLVED — A recoverable Checkout error no longer unmounts the checkout page

| Field | Value |
|---|---|
| **Location** | `src/pages/Checkout/Checkout.jsx` |
| **Documenting tests** | TC-UNIT-FE-CHECKOUT-033 (form stays open), TC-UNIT-FE-CHECKOUT-034 (error reported, page survives), TC-UNIT-FE-CHECKOUT-035 (error clears on cancel) |
| **Original behavior** | `handlePaymentSubmit`'s catch called `setError(...)`. Because `error` is checked in a top-level ternary, setting it replaced the whole page — the cart summary, the selected address, and the payment form all unmounted, leaving only the error text with no control to clear it. |
| **Root cause** | Regression from `74ef5c9` (frontend logger work). Before that commit the catch was `console.error("Failed to save payment method:", err)` with no state change, so the form stayed open. The commit replaced it with `logger.error(...)` **plus** a `setError(...)`, routing a form-level failure into a page-level error slot. |
| **Resolution** | Error state is now scoped to the failure's blast radius. `error` is page-fatal only (the initial `loadData` failure, where there is genuinely nothing to render). Two new states carry recoverable failures: `paymentError`, rendered inside the payment section above the form, and `orderError`, rendered next to the Confirm payment button. `paymentError` is cleared when the payment form is opened, cancelled, toggled, or resubmitted, so a stale message never lingers. `orderError` is cleared at the start of each order attempt. |
| **Verification** | The three documenting tests fail against the pre-fix component and pass after. Full frontend suite: 374 passed, 2 todo, 41/41 files. Production build succeeds. |

---

### E2E-001 — Cypress E2E tests not verified against a full stack in CI

| Field | Value |
|---|---|
| **Affected tests** | All 25 Cypress tests (TC-E2E-AUTH-*, TC-E2E-CART-*, TC-E2E-CHECKOUT-*) |
| **Status** | Partially addressed — a CI `e2e` job now exists in `.github/workflows/ci.yml` |
| **Blocker 1** | ✅ Resolved — the CI job starts the CRA dev server in the background and gates on `npx wait-on http://localhost:3000 --timeout 90000`. |
| **Blocker 2** | **Still open** — the `e2e` job starts *only* the frontend. No API server and no MongoDB are started, so every spec that performs a real request against `localhost:4000` has nothing to talk to. |
| **Blocker 3** | ✅ Resolved — see FRONTEND-005; `cy.loginBySession` now seeds a valid JWT-shaped token. |
| **Blocker 4** | **Newly identified 2026-08-18** — the Cypress test users do not exist in a seeded database. `cypress/fixtures/users.json` and the `TEST_USERS` map in `cypress/support/commands.js` use `john@email.com` / `john123` and `jane@email.com` / `jane123` with hardcoded ObjectIds (`67fc9bda370302bf46079352`, `…350`). `scripts/seed.js` creates `admin@hiveelectronics.com`, `john.doe@example.com`, and `jane.smith@example.com` with different passwords and freshly generated ObjectIds. Specs performing a real login (TC-E2E-AUTH-003, TC-E2E-AUTH-004) fail; specs using `cy.loginBySession` pass auth but reference a user ID with no carts, addresses, or orders behind it. |
| **Resolution** | Add a MongoDB service container to the `e2e` job, start the API against it (seeded via `npm run seed`), and wait on `localhost:4000` alongside the existing wait on `localhost:3000`. Separately, reconcile Blocker 4 — either add the two Cypress accounts to `scripts/seed.js` with fixed ObjectIds, or repoint the fixtures and `TEST_USERS` at the seeded accounts. |

---

### FRONTEND-004 — ✅ RESOLVED — Frontend service tests migrated to the real API layer

| Field | Value |
|---|---|
| **Affected tests** | `src/__tests__/services/userServices.test.js`, `src/__tests__/services/productServices.test.js` |
| **Original problem** | Both files were written against the old simulated service layer (local JSON + `setTimeout` + `validUsers`) and still used `vi.useFakeTimers()` against `setTimeout` delays that no longer existed. |
| **Resolved in** | Verified by running the suite on 2026-08-18. |
| **Resolution** | Both files now pass. `vitest.setup.js` sets `REACT_APP_API_URL = 'http://localhost:4000/api'` before imports, so `apiClient` no longer builds a `fetch("undefined/login")` URL, and the service specs assert against the real `apiClient` contract. A full `npm run test:unit` run reports **371 passed, 2 todo**, with all 7 files in `src/__tests__/services/` green. |

---

### FRONTEND-005 — ✅ RESOLVED — `cy.loginBySession` now injects valid JWT-shaped token

| Field | Value |
|---|---|
| **Resolved in** | QA audit 2026-07-08 |
| **Resolution** | `cypress/support/commands.js` updated. `loginBySession` now constructs a three-segment JWT-shaped token (`headerB64.payloadB64.cypress-test-signature`) using `win.btoa()`. The payload encodes `{ userId, name, role, iat, exp }` so `atob(token.split(".")[1])` decodes correctly. `userData` is now stored with key `userId` (not `_id`) to match the shape `getCurrentUser()` reads after a real API login. `cypress.config.js` now also exposes `env.apiUrl` for future `cy.request()` auth calls if real JWT verification is added. |

---

## Technical debt

| ID | Area | Description | Effort |
|---|---|---|---|
| TD-001 | Frontend | ✅ RESOLVED — Auth rewrite complete; frontend now uses real JWT via real API | — |
| TD-002 | Frontend | ✅ RESOLVED — service specs pass against the `apiClient` layer; see FRONTEND-004 | — |
| TD-003 | Frontend | Coverage thresholds set at 30%/30%/20%/30% — far below aspirational 75%; pages and layout are now partly covered (41 spec files, 376 cases) but thresholds are unchanged | High (raise thresholds as coverage grows) |
| TD-004 | Backend | No controller-level unit tests — only model schema + middleware | Medium (mock Mongoose models) |
| TD-005 | Backend | 7 open bugs documented (BUG-005, 006, 007, 009, 010, 011, 013) — the other 6 are resolved | High |
| TD-006 | Backend | SEC-001 open security gap — unauthenticated user creation, now reachable on the deployed API | Low-Medium (add middleware) |
| TD-007 | Backend | ✅ RESOLVED — SEC-002 endpoint added (`GET /api/addresses/user/:id`) | — |
| TD-008 | Both | No contract validation between API shape and frontend consumption | Medium (add Zod schemas) |
| TD-009 | CI | ✅ RESOLVED — `frontend-unit` passes again; FRONTEND-006 fixed | — |
| TD-010 | CI | The `e2e` job starts only the frontend, so E2E specs run without an API or database; see E2E-001 | Medium (add Mongo service + API startup) |
