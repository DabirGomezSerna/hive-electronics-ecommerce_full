# Test Plan — Hive Electronics Ecommerce API

**Project:** hive-electronics-ecommerce_api  
**Test Framework:** Vitest 4.x  
**Database:** mongodb-memory-server (isolated, in-memory, per test file)  
**HTTP Client:** supertest  
**Last Updated:** 2026-07-01 (diagnostic audit pass)

---

## Environment Setup

### Install dependencies (already done)

```bash
npm install --save-dev vitest @vitest/coverage-v8 mongodb-memory-server supertest
```

### Run commands

| Command | Description |
|---|---|
| `npm test` | Run all tests once (CI mode) |
| `npm run test:watch` | Run in watch mode (development) |
| `npm run test:coverage` | Run with V8 coverage report |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |

### Required environment variables (`.env`)

```env
MONGODB_URI=mongodb://localhost:27017/hiveElectronicsDB
JWT_SECRET=<any string>
JWT_REFRESH_TOKEN=<any string>
```

> Tests use their own in-memory values set in `tests/helpers/setup.js`.  
> `MONGODB_URI` is not used during testing — MongoMemoryServer provides the URI.

---

## Architecture

```
tests/
├── helpers/
│   ├── setup.js                        — Sets JWT env vars (loaded by vitest.config.js setupFiles)
│   ├── db.js                           — MongoMemoryServer connect/close/clear helpers
│   └── fixtures.js                     — Data factories: users, categories, products, addresses, payments
├── unit/
│   ├── middleware/
│   │   ├── authMiddleware.test.js
│   │   ├── isAdminMiddleware.test.js
│   │   └── validation.test.js
│   └── models/
│       ├── user.model.test.js
│       ├── category.model.test.js
│       ├── product.model.test.js
│       ├── cart.model.test.js
│       ├── order.model.test.js
│       ├── paymentMethod.model.test.js
│       └── shippingAddress.model.test.js
├── integration/
│   ├── auth.test.js
│   ├── users.test.js
│   ├── products.test.js
│   ├── categories.test.js
│   ├── cart.test.js
│   ├── addresses.test.js
│   ├── paymentMethods.test.js
│   ├── orders.test.js
│   └── diagnostic.test.js             — Critical/High gaps found in 2026-07-01 audit
└── TEST-PLAN.md                        — this file
```

---

## Pre-existing Bugs (confirmed by code inspection)

Tests for these cases are written to assert CURRENT behavior and are marked clearly.  
Once the bug is fixed, the test expectation must be updated to the CORRECT behavior.

| Bug ID | Location | Description | Affected Tests | Current Behavior | Expected After Fix |
|---|---|---|---|---|---|
| BUG-001 | `orderController.js:7-9` | `Order.find()` returns an array; calling `.populate()` on an array throws `TypeError: orders.populate is not a function` | TC-INT-ORD-001 | 500 | 200 |
| BUG-002 | `paymentMethodController.js:91` | `existing.user` referenced but `existing` is never declared in `updatePaymentMethod`. Throws `ReferenceError` when `isDefault: true` | TC-INT-PAY-014 | 500 | 200 |
| BUG-003 | `shippingAddressController.js:74` | Destructures `postalcode` (lowercase c) but schema field is `postalCode` (uppercase C). `postalCode` updates are silently ignored | TC-INT-ADDR-016 | 200 (value unchanged) | 200 (value updated) |
| BUG-004 | `paymentMethodController.js:17-19` | `getPaymentMethodById` calls `.populate("user")` before null check. If not found, throws on null | TC-INT-PAY-005 | 500 | 404 |
| BUG-005 | `categoryController.js:35,52` | Controller uses field name `imageURL` (uppercase L) but schema defines `imageUrl` (lowercase l). Passed value is silently discarded | No dedicated test — schema default always used | Schema default | Passed value stored |
| BUG-006 | `cartController.js` | `removeFromCart` always decrements product quantity by 1 regardless of the quantity provided in the request body | TC-INT-CART-013 | Decrements by 1 | Decrements by requested qty |
| BUG-007 | `userController.js:44-56` | `searchUsers` with `email` or `role` param but **no** `q` builds `{ $regex: undefined }` → BSON serializes `undefined` to `null` → MongoDB rejects `$regex: null` → 500 crash | TC-DIAG-001 | 500 | 200 with filtered results |
| BUG-008 | `cartController.js:186-196` | `removeProductFromCart` "product not in cart" path sends `res.status(404)` then **falls through** and calls `res.json(cart)` — double-response | TC-DIAG-005 | 404 + double-response in server | 404 only (add `return`) |
| BUG-009 | `orderController.js:99-101` | `updateOrderStatus` returns `204` (No Content) instead of `404` when order is not found | TC-DIAG-006 | 204 | 404 |
| BUG-010 | `userRoutes.js:73-79` | `DELETE /users/:id` chains `userIdValidation` but never calls `validate` → invalid ObjectId bypasses check → CastError → 500 | TC-DIAG-003 | 500 | 422 |
| BUG-011 | `cartRoutes.js:135` | `DELETE /carts/:id` chains `cartIdValidation` but never calls `validate` → same CastError path → 500 | TC-DIAG-004 | 500 | 422 |
| BUG-012 | `authController.js:74` | `login` calls `generateToken(userExist._id, userExist.name, …)` but User schema has `displayName` not `name` → JWT payload contains no `name` field | TC-DIAG-002 | `name` undefined in JWT | `name` = user's displayName |
| BUG-013 | `userController.js:96-111` | `createUser` does not check for duplicate email before `User.create()` → Mongoose unique index throws → caught → 500 (unlike `register` which checks first) | TC-DIAG-013 | 500 | 400 or 409 |

### Additional Security Gaps (not bugs, but documented)

| Gap ID | Location | Description |
|---|---|---|
| SEC-001 | `userRoutes.js:63` | `POST /api/users` has no auth middleware — anyone can create a user with any role including `admin` |
| SEC-002 | `shippingAddressRoutes.js:51,53` | `GET /api/addresses` and `GET /api/addresses/:id` require `isAdmin`. No `GET /api/addresses/user/:id` exists. Customers cannot list their own addresses. Blocks checkout. |

---

## Test Matrix

Legend: `⬜ Not Started` `✅ Pass` `❌ Fail` `🐛 Expected Fail (Bug)` `⚠️ Security Gap`

### Unit Tests — Middleware (auth)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-MW-001 | authMiddleware returns 401 when no Authorization header | Unit | ✅ | High |
| TC-UNIT-MW-002 | authMiddleware returns 401 when Bearer token is missing | Unit | ✅ | High |
| TC-UNIT-MW-003 | authMiddleware returns 401 with tampered token | Unit | ✅ | High |
| TC-UNIT-MW-004 | authMiddleware calls next() and sets req.user on valid token | Unit | ✅ | High |
| TC-UNIT-MW-005 | authMiddleware returns 401 for expired token | Unit | ✅ | High |
| TC-UNIT-MW-006 | authMiddleware returns 401 for wrong secret | Unit | ✅ | High |

### Unit Tests — Middleware (isAdmin)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-ADM-001 | isAdminMiddleware returns 401 when req.user is undefined | Unit | ✅ | High |
| TC-UNIT-ADM-002 | isAdminMiddleware returns 403 for customer role | Unit | ✅ | High |
| TC-UNIT-ADM-003 | isAdminMiddleware calls next() for admin role | Unit | ✅ | High |
| TC-UNIT-ADM-004 | isAdminMiddleware returns 403 for any role not exactly 'admin' | Unit | ✅ | Medium |

### Unit Tests — Middleware (validate)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-VAL-001 | validate calls next() once when there are no validation errors | Unit | ✅ | High |
| TC-UNIT-VAL-002 | validate returns 422 status when validation errors are present | Unit | ✅ | High |
| TC-UNIT-VAL-003 | validate response body contains errors array when errors are present | Unit | ✅ | High |
| TC-UNIT-VAL-004 | validate does NOT call next() when validation errors are present | Unit | ✅ | High |
| TC-UNIT-VAL-005 | validate does NOT call res.status or res.json when there are no errors | Unit | ✅ | Medium |

### Unit Tests — Model Schema: User

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-USR-SCHEMA-001 | Valid document passes validateSync() | Unit | ✅ | High |
| TC-UNIT-USR-SCHEMA-002 | Missing displayName fails validation | Unit | ✅ | High |
| TC-UNIT-USR-SCHEMA-003 | Missing email fails validation | Unit | ✅ | High |
| TC-UNIT-USR-SCHEMA-004 | Missing password fails validation | Unit | ✅ | High |
| TC-UNIT-USR-SCHEMA-005 | role defaults to 'customer' when not provided | Unit | ✅ | Medium |
| TC-UNIT-USR-SCHEMA-006 | Invalid role value fails enum validation | Unit | ✅ | High |
| TC-UNIT-USR-SCHEMA-007 | isActive defaults to true when not provided | Unit | ✅ | Medium |
| TC-UNIT-USR-SCHEMA-008 | avatar field has a non-empty default value | Unit | ✅ | Low |

### Unit Tests — Model Schema: Category

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-CAT-SCHEMA-001 | Valid document with name passes validateSync() | Unit | ✅ | High |
| TC-UNIT-CAT-SCHEMA-002 | Missing name fails validation | Unit | ✅ | High |
| TC-UNIT-CAT-SCHEMA-003 | parentCategory defaults to null when not provided | Unit | ✅ | Medium |
| TC-UNIT-CAT-SCHEMA-004 | imageUrl has a non-empty default value | Unit | ✅ | Low |

### Unit Tests — Model Schema: Product

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-PROD-SCHEMA-001 | Valid document passes validateSync() | Unit | ✅ | High |
| TC-UNIT-PROD-SCHEMA-002 | Missing name fails validation | Unit | ✅ | High |
| TC-UNIT-PROD-SCHEMA-003 | Missing category fails validation | Unit | ✅ | High |
| TC-UNIT-PROD-SCHEMA-004 | price defaults to 0 when not provided | Unit | ✅ | Medium |
| TC-UNIT-PROD-SCHEMA-005 | stock defaults to 0 when not provided | Unit | ✅ | Medium |
| TC-UNIT-PROD-SCHEMA-006 | price below 0 fails min validation | Unit | ✅ | High |
| TC-UNIT-PROD-SCHEMA-007 | stock below 0 fails min validation | Unit | ✅ | High |

### Unit Tests — Model Schema: Cart

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-CART-SCHEMA-001 | Valid cart with user and products passes validateSync() | Unit | ✅ | High |
| TC-UNIT-CART-SCHEMA-002 | Missing user fails validation | Unit | ✅ | High |
| TC-UNIT-CART-SCHEMA-003 | Product quantity below 1 fails min validation | Unit | ✅ | High |

### Unit Tests — Model Schema: Order

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-ORD-SCHEMA-001 | Valid document passes validateSync() | Unit | ✅ | High |
| TC-UNIT-ORD-SCHEMA-002 | Missing user fails validation | Unit | ✅ | High |
| TC-UNIT-ORD-SCHEMA-003 | Missing totalPrice fails validation | Unit | ✅ | High |
| TC-UNIT-ORD-SCHEMA-004 | status defaults to 'pending' when not provided | Unit | ✅ | Medium |
| TC-UNIT-ORD-SCHEMA-005 | paymentStatus defaults to 'pending' when not provided | Unit | ✅ | Medium |
| TC-UNIT-ORD-SCHEMA-006 | Invalid status value fails enum validation | Unit | ✅ | High |
| TC-UNIT-ORD-SCHEMA-007 | Invalid paymentStatus value fails enum validation | Unit | ✅ | High |

### Unit Tests — Model Schema: PaymentMethod

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-PAY-SCHEMA-001 | Valid document passes validateSync() | Unit | ✅ | High |
| TC-UNIT-PAY-SCHEMA-002 | Missing user fails validation | Unit | ✅ | High |
| TC-UNIT-PAY-SCHEMA-003 | Missing type fails validation | Unit | ✅ | High |
| TC-UNIT-PAY-SCHEMA-004 | Invalid type value fails enum validation | Unit | ✅ | High |
| TC-UNIT-PAY-SCHEMA-005 | isDefault defaults to false when not provided | Unit | ✅ | Medium |
| TC-UNIT-PAY-SCHEMA-006 | isActive defaults to true when not provided | Unit | ✅ | Medium |

### Unit Tests — Model Schema: ShippingAddress

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-UNIT-ADDR-SCHEMA-001 | Valid document passes validateSync() | Unit | ✅ | High |
| TC-UNIT-ADDR-SCHEMA-002 | Missing user fails validation | Unit | ✅ | High |
| TC-UNIT-ADDR-SCHEMA-003 | Missing address1 fails validation | Unit | ✅ | High |
| TC-UNIT-ADDR-SCHEMA-004 | Missing postalCode fails validation | Unit | ✅ | High |
| TC-UNIT-ADDR-SCHEMA-005 | Missing city fails validation | Unit | ✅ | High |
| TC-UNIT-ADDR-SCHEMA-006 | Missing country fails validation | Unit | ✅ | High |
| TC-UNIT-ADDR-SCHEMA-007 | defaultAddress defaults to false when not provided | Unit | ✅ | Medium |

### Integration Tests — Auth (`/api/register`, `/api/login`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-AUTH-001 | Register returns 201 with user (no password field) | Integration | ✅ | Critical |
| TC-INT-AUTH-002 | Register returns 400 when email already registered | Integration | ✅ | High |
| TC-INT-AUTH-003 | Password is stored as bcrypt hash | Integration | ✅ | Critical |
| TC-INT-AUTH-004 | Register always creates customer role (admin body param ignored) | Integration | ✅ | Critical |
| TC-INT-AUTH-005 | Email normalized to lowercase on register | Integration | ✅ | Medium |
| TC-INT-AUTH-006 | Login returns 200 with token and refreshToken | Integration | ✅ | Critical |
| TC-INT-AUTH-007 | Login returns 400 for non-existent email | Integration | ✅ | High |
| TC-INT-AUTH-008 | Login returns 400 with 'Invalid Credentials' for wrong password | Integration | ✅ | High |
| TC-INT-AUTH-009 | JWT contains userId and role | Integration | ✅ | High |
| TC-INT-AUTH-010 | Login is case-insensitive on email | Integration | ✅ | Medium |

### Integration Tests — Users (`/api/users`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-USR-001 | Admin gets user list (no passwords) | Integration | ✅ | High |
| TC-INT-USR-002 | GET /users returns 401 without token | Integration | ✅ | Critical |
| TC-INT-USR-003 | GET /users returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-USR-004 | Admin can search users with pagination | Integration | ✅ | Medium |
| TC-INT-USR-005 | GET /users/search returns 401 without token | Integration | ✅ | High |
| TC-INT-USR-006 | GET /users/search returns 403 with customer token | Integration | ✅ | High |
| TC-INT-USR-007 | Admin gets user by id (no password) | Integration | ✅ | High |
| TC-INT-USR-008 | GET /users/:id returns 404 for non-existent id | Integration | ✅ | High |
| TC-INT-USR-009 | GET /users/:id returns 422 for non-MongoId param | Integration | ✅ | Medium |
| TC-INT-USR-010 | GET /users/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-USR-011 | GET /users/:id returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-USR-012 | POST /users creates user without auth ⚠️ SEC-001 | Integration | ⚠️ | Critical |
| TC-INT-USR-013 | POST /users creates admin without auth ⚠️ SEC-001 | Integration | ⚠️ | Critical |
| TC-INT-USR-014 | POST /users returns 422 when displayName missing | Integration | ✅ | High |
| TC-INT-USR-015 | POST /users returns 422 for invalid email | Integration | ✅ | High |
| TC-INT-USR-016 | POST /users returns 422 when password < 6 chars | Integration | ✅ | High |
| TC-INT-USR-017 | POST /users returns 422 for invalid role | Integration | ✅ | High |
| TC-INT-USR-018 | POST /users returns 422 for invalid avatar URL | Integration | ✅ | Medium |
| TC-INT-USR-019 | Authenticated user can update profile | Integration | ✅ | High |
| TC-INT-USR-020 | PUT /users/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-USR-021 | PUT /users/:id returns 422 for non-MongoId | Integration | ✅ | Medium |
| TC-INT-USR-022 | Admin deletes user (204) | Integration | ✅ | High |
| TC-INT-USR-023 | DELETE /users/:id returns 404 for non-existent | Integration | ✅ | Medium |
| TC-INT-USR-024 | DELETE /users/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-USR-025 | DELETE /users/:id returns 403 with customer token | Integration | ✅ | Critical |

### Integration Tests — Products (`/api/products`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-PROD-001 | GET /products returns all products (public) | Integration | ✅ | High |
| TC-INT-PROD-002 | Products include populated category object | Integration | ✅ | High |
| TC-INT-PROD-003 | GET /products returns empty array when none exist | Integration | ✅ | Low |
| TC-INT-PROD-004 | Search filters by q param (name/description) | Integration | ✅ | High |
| TC-INT-PROD-005 | Search filters by category id | Integration | ✅ | High |
| TC-INT-PROD-006 | Search returns pagination metadata | Integration | ✅ | Medium |
| TC-INT-PROD-007 | Search filters inStock=true correctly | Integration | ✅ | Medium |
| TC-INT-PROD-008 | GET /products/:id returns product with category | Integration | ✅ | High |
| TC-INT-PROD-009 | GET /products/:id returns 404 for non-existent | Integration | ✅ | High |
| TC-INT-PROD-010 | GET /products/:id returns 422 for non-MongoId | Integration | ✅ | Medium |
| TC-INT-PROD-011 | Admin creates product (201 with category) | Integration | ✅ | Critical |
| TC-INT-PROD-012 | POST /products returns 401 without token | Integration | ✅ | Critical |
| TC-INT-PROD-013 | POST /products returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-PROD-014 | POST /products returns 422 when name missing | Integration | ✅ | High |
| TC-INT-PROD-015 | POST /products returns 422 when price is 0 | Integration | ✅ | High |
| TC-INT-PROD-016 | POST /products returns 422 for invalid category id | Integration | ✅ | High |
| TC-INT-PROD-017 | Admin updates product price and stock | Integration | ✅ | High |
| TC-INT-PROD-018 | PUT /products/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-PROD-019 | PUT /products/:id returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-PROD-020 | Admin deletes product (204) | Integration | ✅ | High |
| TC-INT-PROD-021 | DELETE returns 404 for non-existent | Integration | ✅ | Medium |
| TC-INT-PROD-022 | DELETE returns 401 without token | Integration | ✅ | Critical |
| TC-INT-PROD-023 | DELETE returns 403 with customer token | Integration | ✅ | Critical |

### Integration Tests — Categories (`/api/categories`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-CAT-001 | GET /categories returns all categories (public) | Integration | ✅ | High |
| TC-INT-CAT-002 | GET /categories returns empty array | Integration | ✅ | Low |
| TC-INT-CAT-003 | Child category has parentCategory populated | Integration | ✅ | High |
| TC-INT-CAT-004 | GET /categories/:id returns category | Integration | ✅ | High |
| TC-INT-CAT-005 | GET /categories/:id returns 404 for non-existent | Integration | ✅ | High |
| TC-INT-CAT-006 | GET /categories/:id returns 422 for non-MongoId | Integration | ✅ | Medium |
| TC-INT-CAT-007 | Admin creates category (201) | Integration | ✅ | Critical |
| TC-INT-CAT-008 | Admin creates child category with parentCategory | Integration | ✅ | High |
| TC-INT-CAT-009 | POST /categories returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CAT-010 | POST /categories returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-CAT-011 | POST /categories returns 422 when name missing | Integration | ✅ | High |
| TC-INT-CAT-012 | POST /categories returns 422 when description missing | Integration | ✅ | High |
| TC-INT-CAT-013 | POST /categories returns 422 for invalid parentCategory | Integration | ✅ | Medium |
| TC-INT-CAT-014 | Admin updates category name | Integration | ✅ | High |
| TC-INT-CAT-015 | PUT /categories/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CAT-016 | PUT /categories/:id returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-CAT-017 | Admin deletes category (204) | Integration | ✅ | High |
| TC-INT-CAT-018 | DELETE /categories/:id returns 404 for non-existent | Integration | ✅ | Medium |
| TC-INT-CAT-019 | DELETE /categories/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CAT-020 | DELETE /categories/:id returns 403 with customer token | Integration | ✅ | Critical |

### Integration Tests — Cart (`/api/carts`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-CART-001 | Admin retrieves all carts | Integration | ✅ | High |
| TC-INT-CART-002 | GET /carts returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CART-003 | GET /carts returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-CART-004 | Authenticated user retrieves cart by user id | Integration | ✅ | High |
| TC-INT-CART-005 | GET /carts/user/:id returns 404 when no cart | Integration | ✅ | High |
| TC-INT-CART-006 | GET /carts/user/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CART-007 | addToCart creates new cart when user has none | Integration | ✅ | Critical |
| TC-INT-CART-008 | addToCart adds product to existing cart | Integration | ✅ | High |
| TC-INT-CART-009 | addToCart increments quantity for duplicate product | Integration | ✅ | High |
| TC-INT-CART-010 | addToCart returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CART-011 | addToCart returns 422 for non-MongoId userId | Integration | ✅ | High |
| TC-INT-CART-012 | removeFromCart removes product when qty is 1 | Integration | ✅ | Critical |
| TC-INT-CART-013 | removeFromCart decrements by 1 🐛 BUG-006 (ignores body qty) | Integration | 🐛 | High |
| TC-INT-CART-014 | removeFromCart returns 404 when no cart exists | Integration | ✅ | High |
| TC-INT-CART-015 | removeFromCart returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CART-016 | POST /carts creates cart with initial products | Integration | ✅ | High |
| TC-INT-CART-017 | POST /carts returns 422 when user missing | Integration | ✅ | High |
| TC-INT-CART-018 | POST /carts returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CART-019 | PUT /carts/:id replaces cart products | Integration | ✅ | High |
| TC-INT-CART-020 | PUT /carts/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-CART-021 | DELETE /carts/:id deletes cart (204) | Integration | ✅ | High |
| TC-INT-CART-022 | DELETE /carts/:id returns 401 without token | Integration | ✅ | Critical |

### Integration Tests — Shipping Addresses (`/api/addresses`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-ADDR-001 | Admin retrieves all addresses | Integration | ✅ | High |
| TC-INT-ADDR-002 | GET /addresses returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ADDR-003 | GET /addresses returns 403 with customer token ⚠️ SEC-002 | Integration | ⚠️ | Critical |
| TC-INT-ADDR-004 | Admin retrieves address by id | Integration | ✅ | High |
| TC-INT-ADDR-005 | GET /addresses/:id returns 404 for non-existent | Integration | ✅ | High |
| TC-INT-ADDR-006 | GET /addresses/:id returns 422 for non-MongoId | Integration | ✅ | Medium |
| TC-INT-ADDR-007 | GET /addresses/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ADDR-008 | GET /addresses/:id returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-ADDR-009 | Customer creates shipping address | Integration | ✅ | Critical |
| TC-INT-ADDR-010 | POST /addresses returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ADDR-011 | POST /addresses returns 422 when address1 missing | Integration | ✅ | High |
| TC-INT-ADDR-012 | POST /addresses returns 422 when postalCode missing | Integration | ✅ | High |
| TC-INT-ADDR-013 | POST /addresses returns 422 when city missing | Integration | ✅ | High |
| TC-INT-ADDR-014 | POST /addresses returns 422 when country missing | Integration | ✅ | High |
| TC-INT-ADDR-015 | Authenticated user updates city and country | Integration | ✅ | High |
| TC-INT-ADDR-016 | postalCode update silently lost 🐛 BUG-003 | Integration | 🐛 | High |
| TC-INT-ADDR-017 | PUT /addresses/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ADDR-018 | DELETE deletes address (204) | Integration | ✅ | High |
| TC-INT-ADDR-019 | DELETE returns 404 for non-existent | Integration | ✅ | Medium |
| TC-INT-ADDR-020 | DELETE returns 401 without token | Integration | ✅ | Critical |

### Integration Tests — Payment Methods (`/api/payment-methods`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-PAY-001 | Admin retrieves all payment methods | Integration | ✅ | High |
| TC-INT-PAY-002 | GET /payment-methods returns 401 without token | Integration | ✅ | Critical |
| TC-INT-PAY-003 | GET /payment-methods returns 403 with customer | Integration | ✅ | Critical |
| TC-INT-PAY-004 | Admin gets payment method by id (cvv excluded) | Integration | ✅ | High |
| TC-INT-PAY-005 | GET /:id returns 500 for non-existent 🐛 BUG-004 | Integration | 🐛 | High |
| TC-INT-PAY-006 | GET /payment-methods/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-PAY-007 | GET /payment-methods/:id returns 403 with customer | Integration | ✅ | Critical |
| TC-INT-PAY-008 | Customer creates payment method | Integration | ✅ | Critical |
| TC-INT-PAY-009 | Creating default PM unsets previous default | Integration | ✅ | High |
| TC-INT-PAY-010 | POST /payment-methods returns 401 without token | Integration | ✅ | Critical |
| TC-INT-PAY-011 | POST /payment-methods returns 422 when type missing | Integration | ✅ | High |
| TC-INT-PAY-012 | POST /payment-methods returns 422 for invalid type | Integration | ✅ | High |
| TC-INT-PAY-013 | Customer updates payment method type | Integration | ✅ | High |
| TC-INT-PAY-014 | PUT with isDefault:true returns 500 🐛 BUG-002 | Integration | 🐛 | High |
| TC-INT-PAY-015 | PUT returns 422 for card number > 16 chars | Integration | ✅ | Medium |
| TC-INT-PAY-016 | PUT /payment-methods/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-PAY-017 | DELETE deletes payment method (204) | Integration | ✅ | High |
| TC-INT-PAY-018 | DELETE returns 404 for non-existent | Integration | ✅ | Medium |
| TC-INT-PAY-019 | DELETE returns 401 without token | Integration | ✅ | Critical |

### Diagnostic Tests — Critical & High gaps (2026-07-01 audit)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-DIAG-001 | searchUsers with email param but no q crashes (BUG-007) | Integration | 🐛 | Critical |
| TC-DIAG-002 | Login JWT name field is undefined — uses userExist.name not displayName (BUG-012) | Integration | 🐛 | Critical |
| TC-DIAG-003 | DELETE /users/bad-id returns 500 not 422 — missing validate middleware (BUG-010) | Integration | 🐛 | Critical |
| TC-DIAG-004 | DELETE /carts/bad-id returns 500 not 422 — missing validate middleware (BUG-011) | Integration | 🐛 | Critical |
| TC-DIAG-005 | removeFromCart product not in cart → 404 with double-response in server (BUG-008) | Integration | 🐛 | Critical |
| TC-DIAG-006 | PUT /orders/:id non-existent order returns 204 instead of 404 (BUG-009) | Integration | 🐛 | Critical |
| TC-DIAG-007 | PUT /users/:id valid-but-non-existent ID returns 404 | Integration | ✅ | High |
| TC-DIAG-008 | PUT /products/:id valid-but-non-existent ID returns 404 | Integration | ✅ | High |
| TC-DIAG-009 | PUT /categories/:id valid-but-non-existent ID returns 404 | Integration | ✅ | High |
| TC-DIAG-010 | PUT /addresses/:id valid-but-non-existent ID returns 404 | Integration | ✅ | High |
| TC-DIAG-011 | GET /carts/:id valid-but-non-existent cart ID returns 404 (admin) | Integration | ✅ | High |
| TC-DIAG-012 | PUT /carts/:id valid-but-non-existent cart ID returns 404 | Integration | ✅ | High |
| TC-DIAG-013 | POST /users duplicate email returns 500 instead of 400 (BUG-013) | Integration | 🐛 | High |
| TC-DIAG-014 | GET /products/search with minPrice filter returns only products at or above price | Integration | ✅ | High |
| TC-DIAG-015 | GET /products/search with maxPrice filter returns only products at or below price | Integration | ✅ | High |
| TC-DIAG-016 | GET /products/search with inStock=false returns only out-of-stock products | Integration | ✅ | High |

### Integration Tests — Orders (`/api/orders`)

| ID | Description | Type | Status | Priority |
|---|---|---|---|---|
| TC-INT-ORD-001 | GET /orders returns 500 🐛 BUG-001 (array.populate) | Integration | 🐛 | Critical |
| TC-INT-ORD-002 | GET /orders returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ORD-003 | GET /orders returns 403 with customer token | Integration | ✅ | Critical |
| TC-INT-ORD-004 | POST /orders calculates totalPrice = (price×qty)+shipping | Integration | ✅ | Critical |
| TC-INT-ORD-005 | POST /orders totalPrice rounded to 2 decimal places | Integration | ✅ | High |
| TC-INT-ORD-006 | POST /orders returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ORD-007 | POST /orders returns 422 when products missing | Integration | ✅ | High |
| TC-INT-ORD-008 | POST /orders returns 422 when address missing | Integration | ✅ | High |
| TC-INT-ORD-009 | POST /orders returns 422 when paymentMethod missing | Integration | ✅ | High |
| TC-INT-ORD-010 | POST /orders returns 422 for negative product price | Integration | ✅ | High |
| TC-INT-ORD-011 | Authenticated user retrieves order by id | Integration | ✅ | High |
| TC-INT-ORD-012 | GET /orders/:id returns 404 for non-existent | Integration | ✅ | High |
| TC-INT-ORD-013 | GET /orders/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ORD-014 | User retrieves their order list | Integration | ✅ | High |
| TC-INT-ORD-015 | GET /orders/user/:id returns empty array | Integration | ✅ | Medium |
| TC-INT-ORD-016 | GET /orders/user/:id returns 401 without token | Integration | ✅ | Critical |
| TC-INT-ORD-017 | PUT /orders/:id updates status to processing | Integration | ✅ | High |
| TC-INT-ORD-018 | PUT /orders/:id updates paymentStatus to paid | Integration | ✅ | High |
| TC-INT-ORD-019 | PUT /orders/:id returns 422 for invalid status | Integration | ✅ | High |
| TC-INT-ORD-020 | PUT /orders/:id returns 401 without token | Integration | ✅ | Critical |

---

## Total Test Count

| Layer | Count | Passing | Bug / Gap Docs |
|---|---|---|---|
| Unit — middleware (auth) | 6 | 6 | 0 |
| Unit — middleware (isAdmin) | 4 | 4 | 0 |
| Unit — middleware (validate) | 5 | 5 | 0 |
| Unit — model schema (User) | 8 | 8 | 0 |
| Unit — model schema (Category) | 4 | 4 | 0 |
| Unit — model schema (Product) | 7 | 7 | 0 |
| Unit — model schema (Cart) | 3 | 3 | 0 |
| Unit — model schema (Order) | 7 | 7 | 0 |
| Unit — model schema (PaymentMethod) | 6 | 6 | 0 |
| Unit — model schema (ShippingAddress) | 7 | 7 | 0 |
| Integration — auth | 10 | 10 | 0 |
| Integration — users | 25 | 23 | 2 ⚠️ |
| Integration — products | 23 | 23 | 0 |
| Integration — categories | 20 | 20 | 0 |
| Integration — cart | 22 | 21 | 1 🐛 |
| Integration — addresses | 20 | 19 | 1 🐛 + 1 ⚠️ |
| Integration — payment methods | 19 | 17 | 2 🐛 |
| Integration — orders | 20 | 19 | 1 🐛 |
| Integration — diagnostic (2026-07-01 audit) | 16 | 9 | 7 🐛 |
| **Total** | **232** | **218** | **14** |

> 🐛 = test passes by asserting current broken behavior (12 bug-documenting tests)  
> ⚠️ = test passes by confirming a security gap exists (3 gap-documenting tests)

---

## Coverage Targets

Configured in `vitest.config.js`:

| Metric | Target |
|---|---|
| Lines | 70% |
| Functions | 70% |
| Branches | 60% |
| Statements | 70% |

Run `npm run test:coverage` to generate reports in `coverage/`.

---

## How to Update This Document

1. After running `npm test`, update the Status column using the legend at the top.
2. When a bug is fixed: change the test expectation to the CORRECT behavior, update Status to `✅ Pass`, and remove the `🐛` marker from the matrix row.
3. When a new endpoint is added: add a row block following the same ID format (`TC-INT-[MODULE]-[NNN]`).
4. When a security gap is resolved: update the `⚠️` row and document the fix in the gap table.
