# Known Issues — Hive Electronics Ecommerce

**Last updated:** 2026-07-08

Issues are organized by severity. Each entry includes the test ID that documents current behavior so regressions are caught the moment a fix lands.

---

## Backend bugs

### BUG-001 — CRITICAL — `GET /api/orders` crashes with TypeError

| Field | Value |
|---|---|
| **Location** | `src/controllers/orderController.js:7–9` |
| **Documenting test** | TC-INT-ORD-001 (asserts `status: 500`) |
| **Current behavior** | `Order.find()` is awaited, then `.populate()` is chained on the resulting **array**. Arrays have no `.populate()` method. Throws `TypeError: orders.populate is not a function`. |
| **Expected behavior** | `200` with array of orders. |
| **Fix** | Chain `.populate()` on the Mongoose **query** before `await`: `const orders = await Order.find().populate(...)` |
| **Impact** | Admin cannot list any orders. Order management is completely broken for admins. |

---

### BUG-002 — HIGH — `PUT /api/payment-methods/:id` crashes when `isDefault: true`

| Field | Value |
|---|---|
| **Location** | `src/controllers/paymentMethodController.js:91` |
| **Documenting test** | TC-INT-PAY-014 (asserts `status: 500`) |
| **Current behavior** | The "unset previous default" code path references `existing.user` but `existing` was never declared. Throws `ReferenceError: existing is not defined`. |
| **Expected behavior** | `200` — previous default payment method is unset, new one is set. |
| **Fix** | Declare `const existing = await PaymentMethod.findById(id)` before the `isDefault` branch. |

---

### BUG-003 — ✅ RESOLVED — `PUT /api/addresses/:id` postalCode field name fixed

| Field | Value |
|---|---|
| **Location** | `src/controllers/shippingAddressController.js` |
| **Resolved in** | Frontend-backend connection work |
| **Resolution** | Controller now correctly destructures `postalCode` (uppercase `C`) from `req.body` and passes it to `findByIdAndUpdate`. The update is applied and returned in the response. TC-INT-ADDR-016 updated to assert the correct behavior (value changes from `"10001"` to `"90210"`). |

---

### BUG-004 — HIGH — `GET /api/payment-methods/:id` crashes for non-existent ID

| Field | Value |
|---|---|
| **Location** | `src/controllers/paymentMethodController.js:17–19` |
| **Documenting test** | TC-INT-PAY-005 (asserts `status: 500`) |
| **Current behavior** | `.populate("user")` is called on the result of `findById()` before checking for `null`. When the record doesn't exist, `null.populate()` throws. |
| **Expected behavior** | `404` with `{ message: "Payment method not found" }`. |
| **Fix** | Check `if (!paymentMethod)` before calling `.populate()`, or use `findById().populate()` directly in the query. |

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
| **Location** | `src/controllers/cartController.js` |
| **Documenting test** | TC-INT-CART-013 (asserts quantity decrements by 1 regardless) |
| **Current behavior** | Controller always uses `quantity -= 1` instead of `quantity -= req.body.quantity`. |
| **Expected behavior** | Decrements by the quantity in the request body. |
| **Fix** | Replace `existingProduct.quantity -= 1` with `existingProduct.quantity -= (req.body.quantity || 1)`. |

---

### BUG-007 — CRITICAL — `GET /api/users/search` crashes when `email` or `role` param used without `q`

| Field | Value |
|---|---|
| **Location** | `src/controllers/userController.js:44–56` |
| **Documenting test** | TC-DIAG-001 (asserts `status: 500` or wrong count) |
| **Current behavior** | When `email` or `role` is provided without `q`, the controller builds `{ $regex: undefined }` in the query. MongoDB rejects `$regex: null` with an error → 500. |
| **Expected behavior** | `200` with users filtered by the provided parameter. |
| **Fix** | Separate each filter into its own branch: `if (email) filters.email = { $regex: email, $options: 'i' }` etc., independent of `q`. |

---

### BUG-008 — CRITICAL — `removeProductFromCart` sends double response

| Field | Value |
|---|---|
| **Location** | `src/controllers/cartController.js:186–196` |
| **Documenting test** | TC-DIAG-005 (asserts `status: 404`) |
| **Current behavior** | When product is not found in cart, the controller calls `res.status(404).json(...)` but does NOT `return`. Execution continues: `cart.save()` runs and then `res.json(cart)` is called — two responses sent on the same request. |
| **Expected behavior** | 404 response only; no subsequent save or second response. |
| **Fix** | Add `return` before `res.status(404).json(...)` in the not-found branch. |
| **Risk** | Node.js logs "Cannot set headers after they are sent" in production. |

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
| **Current behavior** | Anyone (unauthenticated) can `POST /api/users` and create a user with any role, including `admin`. |
| **Expected behavior** | Creating users should require authentication; creating admin users should require admin role. |
| **Recommendation** | Add `authMiddleware` and `isAdmin` middleware to the `POST /api/users` route. The public registration endpoint (`POST /api/register`) already exists for self-signup. |

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
| **Remaining work** | Frontend unit tests for `userServices` and `productServices` still test the old behavior and are now broken — see FRONTEND-004. Cypress auth seeding still uses `btoa` — see FRONTEND-005. |

---

### FRONTEND-002 — `Header.jsx` event listener memory leak

| Field | Value |
|---|---|
| **Location** | `src/layout/Header/Header.jsx` (cleanup `useEffect`) |
| **Description** | The cleanup function in the `useEffect` that handles click-outside behavior calls `document.addEventListener` instead of `document.removeEventListener`. The event listener is never removed on unmount. |
| **Impact** | Memory leak in long-running sessions; stale listeners may trigger unexpected behavior after navigation. |
| **Test coverage** | No test covers this — it would require an E2E test or a complex RTL test with manual DOM event simulation. |

---

### FRONTEND-003 — ✅ RESOLVED — `debugger` statement removed from `Checkout.jsx`

| Field | Value |
|---|---|
| **Resolved in** | Frontend-backend connection work |
| **Resolution** | The `debugger;` statement previously on line 62 of `src/pages/Checkout/Checkout.jsx` is no longer present in the current code. |

---

### E2E-001 — Cypress E2E tests not verified in CI (and auth seeding broken)

| Field | Value |
|---|---|
| **Affected tests** | All 25 Cypress tests (TC-E2E-AUTH-*, TC-E2E-CART-*, TC-E2E-CHECKOUT-*) |
| **Status** | Tests written and reviewed; not yet run in an automated environment |
| **Blocker 1** | CRA dev server (`npm start`) must be running at `localhost:3000` before Cypress can execute |
| **Blocker 2** | API server (`node server.js` in `hive-electronics-ecommerce_api/`) must be running at `localhost:4000` + a real MongoDB connection — now that the frontend calls the real API, E2E tests require the full stack |
| **Blocker 3** | `cy.loginBySession` seeds localStorage with a `btoa`-encoded token — see FRONTEND-005 |
| **Resolution** | Fix FRONTEND-005 first, then add CI workflow that starts all three services |

---

### FRONTEND-004 — Frontend service tests broken (test removed behavior)

| Field | Value |
|---|---|
| **Affected tests** | `src/__tests__/services/userServices.test.js`, `src/__tests__/services/productServices.test.js` |
| **Root cause** | Both test files were written against the old simulated service layer (local JSON + `setTimeout` + `validUsers`). Since the connection work, these services now call `apiClient`, which calls `fetch()`. The tests still use `vi.useFakeTimers()` and `vi.runAllTimersAsync()` patterns that advance non-existent `setTimeout` delays, and assert credential behavior that no longer exists. |
| **Current behavior** | Running `npm run test:unit` produces failures: `login('john@email.com', 'john123')` calls `fetch("undefined/login")` (because `REACT_APP_API_URL` is not set in tests), then throws a network error. All `login()` / `fetchProducts()` tests fail. |
| **Fix** | Rewrite both test files to mock the `apiClient` module with `vi.mock('../../services/apiClient')`. Remove fake timer usage. See `testing-audit-connection.md` for migration plan. |

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
| TD-002 | Frontend | Service tests need `vi.mock('../../services/apiClient')` to intercept HTTP — fake timer pattern removed; apiClient.test.js needs fetch mock via `vi.stubGlobal` | Medium |
| TD-003 | Frontend | Coverage thresholds set at 30%/30%/20%/30% — far below aspirational 75%; pages and layout have no unit tests | High (write tests for pages, layout, services) |
| TD-004 | Backend | No controller-level unit tests — only model schema + middleware | Medium (mock Mongoose models) |
| TD-005 | Backend | 13 open bugs documented — all critical or high priority | High |
| TD-006 | Backend | SEC-001 open security gap — unauthenticated user creation | Low-Medium (add middleware) |
| TD-007 | Backend | ✅ RESOLVED — SEC-002 endpoint added (`GET /api/addresses/user/:id`) | — |
| TD-008 | Both | No contract validation between API shape and frontend consumption | Medium (add Zod schemas) |
