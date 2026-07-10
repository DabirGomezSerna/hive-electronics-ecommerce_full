# Test Matrix — Hive Electronics Ecommerce (Full Stack)

**Last updated:** 2026-07-08  
**Total tests:** 400+ (growing — new page/component/layout tests added; FRONTEND-005 resolved)

Legend:
- `✅` — implemented and passing
- `🐛` — implemented, asserts current broken behavior (test will need updating when bug is fixed)
- `⚠️` — implemented, documents a security gap
- `☐` — not implemented
- `todo` — placeholder with documented reason (React 19 limitation)
- `N/A` — not applicable at this level

---

## Module: Authentication

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| AUTH-001 | Successful registration | N/A | ✅ TC-INT-AUTH-001 | N/A | ☐ | Critical | Partial |
| AUTH-002 | Registration with duplicate email | N/A | ✅ TC-INT-AUTH-002 | N/A | ☐ | High | Partial |
| AUTH-003 | Password stored as bcrypt hash | N/A | ✅ TC-INT-AUTH-003 | N/A | N/A | Critical | ✅ |
| AUTH-004 | Role always 'customer' on register | N/A | ✅ TC-INT-AUTH-004 | N/A | N/A | Critical | ✅ |
| AUTH-005 | Email normalized to lowercase | N/A | ✅ TC-INT-AUTH-005 | N/A | N/A | Medium | ✅ |
| AUTH-006 | Valid login returns token + refreshToken | N/A | ✅ TC-INT-AUTH-006 | ✅ TC-UNIT-FE-SVC-USR-001 | ✅ TC-E2E-AUTH-003 | Critical | ✅ |
| AUTH-007 | Login with non-existent email | N/A | ✅ TC-INT-AUTH-007 | ✅ TC-UNIT-FE-SVC-USR-003 | N/A | High | ✅ |
| AUTH-008 | Login with wrong password | N/A | ✅ TC-INT-AUTH-008 | ✅ TC-UNIT-FE-SVC-USR-003 | ✅ TC-E2E-AUTH-002 | High | ✅ |
| AUTH-009 | JWT contains userId and role | N/A | ✅ TC-INT-AUTH-009 | N/A | N/A | High | ✅ |
| AUTH-010 | JWT name field correct (BUG-012 ✅ RESOLVED) | N/A | ✅ TC-DIAG-002 (updated) | N/A | N/A | Critical | ✅ |
| AUTH-011 | Email login is case-insensitive | N/A | ✅ TC-INT-AUTH-010 | N/A | N/A | Medium | ✅ |
| AUTH-012 | authToken stored in localStorage | N/A | N/A | ✅ TC-UNIT-FE-002 | ✅ TC-E2E-AUTH-004 | Critical | ✅ |
| AUTH-013 | Logout clears token | N/A | N/A | ✅ TC-UNIT-FE-008 | ✅ TC-E2E-AUTH-008 | High | ✅ |
| AUTH-014 | isAuthenticated() returns true with valid token | N/A | N/A | ✅ TC-UNIT-FE-009 | N/A | High | ✅ |
| AUTH-015 | isAuthenticated() returns false with no token | N/A | N/A | ✅ TC-UNIT-FE-010 | N/A | High | ✅ |
| AUTH-016 | getCurrentUser() returns null after logout | N/A | N/A | ✅ TC-UNIT-FE-016 | N/A | Medium | ✅ |

---

## Module: Authorization & Middleware

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| AUTHZ-001 | Missing Authorization header → 401 | ✅ TC-UNIT-MW-001 | ✅ (all protected routes) | N/A | N/A | Critical | ✅ |
| AUTHZ-002 | Expired JWT → 401 | ✅ TC-UNIT-MW-005 | N/A | N/A | N/A | High | ✅ |
| AUTHZ-003 | Wrong JWT secret → 401 | ✅ TC-UNIT-MW-006 | N/A | N/A | N/A | High | ✅ |
| AUTHZ-004 | Tampered JWT → 401 | ✅ TC-UNIT-MW-003 | N/A | N/A | N/A | High | ✅ |
| AUTHZ-005 | Valid JWT attaches req.user | ✅ TC-UNIT-MW-004 | N/A | N/A | N/A | High | ✅ |
| AUTHZ-006 | customer role → 403 on admin route | ✅ TC-UNIT-ADM-002 | ✅ TC-INT-PROD-013 | N/A | N/A | Critical | ✅ |
| AUTHZ-007 | admin role → next() called | ✅ TC-UNIT-ADM-003 | ✅ TC-INT-PROD-011 | N/A | N/A | Critical | ✅ |
| AUTHZ-008 | No req.user → 401 (authMiddleware not chained) | ✅ TC-UNIT-ADM-001 | N/A | N/A | N/A | High | ✅ |
| AUTHZ-009 | Protected route redirects unauthenticated user | N/A | N/A | ✅ TC-UNIT-FE-074 | ✅ TC-E2E-AUTH-006 | Critical | ✅ |
| AUTHZ-010 | Role-based access denies wrong role | N/A | N/A | ✅ TC-UNIT-FE-077 | N/A | High | ✅ |
| AUTHZ-011 | Validation middleware returns 422 on errors | ✅ TC-UNIT-VAL-002 | ✅ (all validation routes) | N/A | N/A | High | ✅ |
| AUTHZ-012 | DELETE /users/bad-id missing validate (BUG-010) | N/A | 🐛 TC-DIAG-003 | N/A | N/A | Critical | 🐛 |
| AUTHZ-013 | DELETE /carts/bad-id missing validate (BUG-011) | N/A | 🐛 TC-DIAG-004 | N/A | N/A | Critical | 🐛 |
| AUTHZ-014 | POST /users open to anyone — no auth (SEC-001) | N/A | ⚠️ TC-INT-USR-012/013 | N/A | N/A | Critical | ⚠️ |

---

## Module: Products

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| PROD-001 | Valid product schema passes | ✅ TC-UNIT-PROD-SCHEMA-001 | N/A | N/A | N/A | High | ✅ |
| PROD-002 | Missing name fails schema | ✅ TC-UNIT-PROD-SCHEMA-002 | ✅ TC-INT-PROD-014 | N/A | N/A | High | ✅ |
| PROD-003 | Missing category fails schema | ✅ TC-UNIT-PROD-SCHEMA-003 | ✅ TC-INT-PROD-016 | N/A | N/A | High | ✅ |
| PROD-004 | Negative price fails validation | ✅ TC-UNIT-PROD-SCHEMA-006 | ✅ TC-INT-PROD-015 | N/A | N/A | High | ✅ |
| PROD-005 | Negative stock fails validation | ✅ TC-UNIT-PROD-SCHEMA-007 | N/A | N/A | N/A | High | ✅ |
| PROD-006 | GET /products returns all (public) | N/A | ✅ TC-INT-PROD-001 | ✅ TC-UNIT-FE-SVC-PROD-001 | ✅ TC-E2E-CART-002 | High | ✅ |
| PROD-007 | Products include populated category | N/A | ✅ TC-INT-PROD-002 | N/A | N/A | High | ✅ |
| PROD-008 | Search by name/description (q param) | N/A | ✅ TC-INT-PROD-004 | ✅ TC-UNIT-FE-SVC-PROD-002 | N/A | High | ✅ |
| PROD-009 | Filter by category | N/A | ✅ TC-INT-PROD-005 | ✅ TC-UNIT-FE-SVC-PROD-004 | N/A | High | ✅ |
| PROD-010 | Filter in-stock products | N/A | ✅ TC-INT-PROD-007 | N/A | N/A | Medium | ✅ |
| PROD-011 | Pagination metadata | N/A | ✅ TC-INT-PROD-006 | N/A | N/A | Medium | ✅ |
| PROD-012 | GET /products/:id returns detail | N/A | ✅ TC-INT-PROD-008 | ✅ TC-UNIT-FE-023 | N/A | High | ✅ |
| PROD-013 | GET /products/:id → 404 not found | N/A | ✅ TC-INT-PROD-009 | N/A | N/A | High | ✅ |
| PROD-014 | Admin creates product → 201 | N/A | ✅ TC-INT-PROD-011 | N/A | N/A | Critical | ✅ |
| PROD-015 | Customer cannot create product → 403 | N/A | ✅ TC-INT-PROD-013 | N/A | N/A | Critical | ✅ |
| PROD-016 | Admin updates product | N/A | ✅ TC-INT-PROD-017 | N/A | N/A | High | ✅ |
| PROD-017 | Admin deletes product → 204 | N/A | ✅ TC-INT-PROD-020 | N/A | N/A | High | ✅ |
| PROD-018 | Out-of-stock disables add to cart | N/A | N/A | ✅ TC-UNIT-FE-057 | N/A | High | ✅ |
| PROD-019 | minPrice / maxPrice / inStock=false search filters | N/A | ✅ TC-DIAG-014/015/016 | N/A | N/A | High | ✅ |

---

## Module: Categories

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| CAT-001 | Valid category schema passes | ✅ TC-UNIT-CAT-SCHEMA-001 | N/A | N/A | N/A | High | ✅ |
| CAT-002 | Missing name fails schema | ✅ TC-UNIT-CAT-SCHEMA-002 | ✅ TC-INT-CAT-011 | N/A | N/A | High | ✅ |
| CAT-003 | parentCategory defaults to null | ✅ TC-UNIT-CAT-SCHEMA-003 | N/A | N/A | N/A | Medium | ✅ |
| CAT-004 | GET /categories returns all (public) | N/A | ✅ TC-INT-CAT-001 | ✅ TC-UNIT-FE-SVC-CAT-001 | N/A | High | ✅ |
| CAT-005 | Child category with parentCategory populated | N/A | ✅ TC-INT-CAT-003/008 | N/A | N/A | High | ✅ |
| CAT-006 | Admin creates category → 201 | N/A | ✅ TC-INT-CAT-007 | N/A | N/A | Critical | ✅ |
| CAT-007 | Admin updates category | N/A | ✅ TC-INT-CAT-014 | N/A | N/A | High | ✅ |
| CAT-008 | Admin deletes category → 204 | N/A | ✅ TC-INT-CAT-017 | N/A | N/A | High | ✅ |
| CAT-009 | imageURL field name mismatch (BUG-005) | N/A | N/A | N/A | N/A | Medium | ☐ (documented only) |

---

## Module: Shopping Cart

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| CART-001 | Valid cart schema passes | ✅ TC-UNIT-CART-SCHEMA-001 | N/A | N/A | N/A | High | ✅ |
| CART-002 | Quantity below 1 fails schema | ✅ TC-UNIT-CART-SCHEMA-003 | N/A | N/A | N/A | High | ✅ |
| CART-003 | Add product to empty cart | N/A | ✅ TC-INT-CART-007 | ✅ TC-UNIT-FE-030 | ✅ TC-E2E-CART-003 | Critical | ✅ |
| CART-004 | Add second product to existing cart | N/A | ✅ TC-INT-CART-008 | N/A | N/A | High | ✅ |
| CART-005 | Same product increments quantity | N/A | ✅ TC-INT-CART-009 | ✅ TC-UNIT-FE-030 | N/A | High | ✅ |
| CART-006 | Remove product (qty=1 → item removed) | N/A | ✅ TC-INT-CART-012 | ✅ TC-UNIT-FE-032 | ✅ TC-E2E-CART-007 | Critical | ✅ |
| CART-007 | Remove always decrements by 1 (BUG-006) | N/A | 🐛 TC-INT-CART-013 | N/A | N/A | High | 🐛 |
| CART-008 | removeFromCart double-response (BUG-008) | N/A | 🐛 TC-DIAG-005 | N/A | N/A | Critical | 🐛 |
| CART-009 | User retrieves their cart | N/A | ✅ TC-INT-CART-004 | N/A | ✅ TC-E2E-CART-005 | High | ✅ |
| CART-010 | Cart persisted to localStorage | N/A | N/A | ✅ TC-UNIT-FE-040/041 | N/A | High | ✅ |
| CART-011 | clearCart empties the cart | N/A | N/A | ✅ TC-UNIT-FE-038 | ✅ TC-E2E-CART-008 | High | ✅ |
| CART-012 | Cart badge updates on add | N/A | N/A | N/A | ✅ TC-E2E-CART-004 | Medium | Partial (E2E only) |
| CART-013 | Unauthenticated GET /carts → 401 | N/A | ✅ TC-INT-CART-002 | N/A | N/A | Critical | ✅ |
| CART-014 | Total calculated correctly | N/A | N/A | ✅ TC-UNIT-FE-039 | ✅ TC-E2E-CHECKOUT-004 | Critical | ✅ |

---

## Module: Shipping Addresses

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| ADDR-001 | Valid address schema passes | ✅ TC-UNIT-ADDR-SCHEMA-001 | N/A | N/A | N/A | High | ✅ |
| ADDR-002 | Required fields enforced | ✅ TC-UNIT-ADDR-SCHEMA-002–006 | ✅ TC-INT-ADDR-011–014 | N/A | N/A | High | ✅ |
| ADDR-003 | Customer creates address | N/A | ✅ TC-INT-ADDR-009 | ✅ TC-UNIT-FE-SVC-ADDR-003 | N/A | Critical | ✅ |
| ADDR-004 | postalCode update (BUG-003 ✅ RESOLVED) | N/A | ✅ TC-INT-ADDR-016 (assertion updated) | N/A | N/A | High | ✅ |
| ADDR-005 | ✅ RESOLVED — Customer retrieves own addresses via GET /addresses/user/:id | N/A | ✅ TC-INT-ADDR-021 (new) | ✅ TC-UNIT-FE-SVC-ADDR-001 | N/A | Critical | ✅ |
| ADDR-006 | Default address pre-selected at checkout | N/A | N/A | ✅ TC-UNIT-FE-CHECKOUT-002 | ✅ TC-E2E-CHECKOUT-002 | High | ✅ |
| ADDR-007 | Add new address via form | N/A | N/A | ✅ TC-UNIT-FE-086 | ✅ TC-E2E-CHECKOUT-008 | High | ✅ |
| ADDR-008 | Form pre-populated in edit mode | N/A | N/A | ✅ TC-UNIT-FE-084 | N/A | Medium | ✅ |

---

## Module: Payment Methods

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| PAY-001 | Valid payment schema passes | ✅ TC-UNIT-PAY-SCHEMA-001 | N/A | N/A | N/A | High | ✅ |
| PAY-002 | Missing type fails schema | ✅ TC-UNIT-PAY-SCHEMA-003 | ✅ TC-INT-PAY-011 | N/A | N/A | High | ✅ |
| PAY-003 | Invalid type fails enum | ✅ TC-UNIT-PAY-SCHEMA-004 | ✅ TC-INT-PAY-012 | N/A | N/A | High | ✅ |
| PAY-004 | Customer creates payment method | N/A | ✅ TC-INT-PAY-008 | ✅ TC-UNIT-FE-SVC-PAY-003 | N/A | Critical | ✅ |
| PAY-005 | Creating default unsets previous default | N/A | ✅ TC-INT-PAY-009 | N/A | N/A | High | ✅ |
| PAY-006 | GET /:id null-pointer crash (BUG-004) | N/A | 🐛 TC-INT-PAY-005 | N/A | N/A | High | 🐛 |
| PAY-007 | Update with isDefault:true crashes (BUG-002) | N/A | 🐛 TC-INT-PAY-014 | N/A | N/A | High | 🐛 |
| PAY-008 | Customer retrieves own payment methods via GET /payment-methods/user/:id | N/A | ✅ TC-INT-PAY-020 (new) | ✅ TC-UNIT-FE-SVC-PAY-001 | N/A | Critical | ✅ |

---

## Module: Orders

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| ORD-001 | Valid order schema passes | ✅ TC-UNIT-ORD-SCHEMA-001 | N/A | N/A | N/A | High | ✅ |
| ORD-002 | Missing user fails schema | ✅ TC-UNIT-ORD-SCHEMA-002 | N/A | N/A | N/A | High | ✅ |
| ORD-003 | Status defaults to 'pending' | ✅ TC-UNIT-ORD-SCHEMA-004 | ✅ TC-INT-ORD-004 | N/A | N/A | High | ✅ |
| ORD-004 | Invalid status fails enum | ✅ TC-UNIT-ORD-SCHEMA-006 | ✅ TC-INT-ORD-019 | N/A | N/A | High | ✅ |
| ORD-005 | GET /orders crashes (BUG-001) | N/A | 🐛 TC-INT-ORD-001 | N/A | N/A | Critical | 🐛 |
| ORD-006 | POST /orders calculates totalPrice (subtotal + 16% IVA + shipping) | N/A | ✅ TC-INT-ORD-004/005 (TC-INT-ORD-004 assertion updated for tax) | ✅ TC-UNIT-FE-SVC-ORD-001 | N/A | Critical | ✅ |
| ORD-007 | Order requires products, address, payment | N/A | ✅ TC-INT-ORD-007/008/009 | N/A | N/A | High | ✅ |
| ORD-008 | User retrieves own orders | N/A | ✅ TC-INT-ORD-014 | N/A | N/A | High | ✅ |
| ORD-009 | Update order status | N/A | ✅ TC-INT-ORD-017/018 | N/A | N/A | High | ✅ |
| ORD-010 | updateOrderStatus → 204 not 404 (BUG-009) | N/A | 🐛 TC-DIAG-006 | N/A | N/A | Critical | 🐛 |
| ORD-011 | Complete checkout → order confirmation | N/A | N/A | ✅ TC-UNIT-FE-CHECKOUT-007 | ✅ TC-E2E-CHECKOUT-006/007 | Critical | ✅ |
| ORD-012 | Cart cleared after order | N/A | N/A | N/A | ✅ TC-E2E-CHECKOUT-006 | High | Partial (E2E only) |

---

## Module: Users (Admin)

| ID | Scenario | Backend unit | API integration | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|---|---|
| USR-001 | Valid user schema passes | ✅ TC-UNIT-USR-SCHEMA-001 | N/A | N/A | N/A | High | ✅ |
| USR-002 | Required fields enforced | ✅ TC-UNIT-USR-SCHEMA-002–004 | ✅ TC-INT-USR-014–016 | N/A | N/A | High | ✅ |
| USR-003 | Role defaults to 'customer' | ✅ TC-UNIT-USR-SCHEMA-005 | N/A | N/A | N/A | Medium | ✅ |
| USR-004 | Admin lists users (no passwords) | N/A | ✅ TC-INT-USR-001 | N/A | N/A | High | ✅ |
| USR-005 | Admin searches users | N/A | ✅ TC-INT-USR-004 | N/A | N/A | Medium | ✅ |
| USR-006 | searchUsers email param crashes (BUG-007) | N/A | 🐛 TC-DIAG-001 | N/A | N/A | Critical | 🐛 |
| USR-007 | POST /users duplicate email → 500 (BUG-013) | N/A | 🐛 TC-DIAG-013 | N/A | N/A | High | 🐛 |
| USR-008 | Admin deletes user | N/A | ✅ TC-INT-USR-022 | N/A | N/A | High | ✅ |
| USR-009 | User updates own profile | N/A | ✅ TC-INT-USR-019 | N/A | N/A | High | ✅ |

---

## Frontend-specific: Service layer (apiClient mock)

> All service tests mock `apiClient` via `vi.mock('../../services/apiClient')`. No real network is used.

### userServices

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| SVC-USR-001 | login() calls POST /login and stores JWT + userData | ✅ TC-UNIT-FE-SVC-USR-001 | Critical | ✅ |
| SVC-USR-002 | login() stores authToken and refreshToken in localStorage | ✅ TC-UNIT-FE-SVC-USR-002 | Critical | ✅ |
| SVC-USR-003 | login() failure returns success:false without touching localStorage | ✅ TC-UNIT-FE-SVC-USR-003 | High | ✅ |
| SVC-USR-004 | register() calls POST /register and returns user | ✅ TC-UNIT-FE-SVC-USR-004 | High | ✅ |
| SVC-USR-005 | logout() clears authToken, refreshToken, userData | ✅ TC-UNIT-FE-SVC-USR-005 | High | ✅ |
| SVC-USR-006 | isAuthenticated() returns true with token present | ✅ TC-UNIT-FE-SVC-USR-006 | High | ✅ |
| SVC-USR-007 | getCurrentUser() returns null when no userData | ✅ TC-UNIT-FE-SVC-USR-007 | High | ✅ |

### productServices

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| SVC-PROD-001 | fetchProducts() calls GET /products and returns array | ✅ TC-UNIT-FE-SVC-PROD-001 | High | ✅ |
| SVC-PROD-002 | searchProducts() calls GET /products/search?q=... | ✅ TC-UNIT-FE-SVC-PROD-002 | High | ✅ |
| SVC-PROD-003 | searchProducts() propagates API error | ✅ TC-UNIT-FE-SVC-PROD-003 | Medium | ✅ |
| SVC-PROD-004 | getProductsByCategory() calls GET /products?category=:id | ✅ TC-UNIT-FE-SVC-PROD-004 | High | ✅ |
| SVC-PROD-005 | getProductById() calls GET /products/:id | ✅ TC-UNIT-FE-SVC-PROD-005 | High | ✅ |

### categoryServices

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| SVC-CAT-001 | fetchCategories() calls GET /categories and returns array | ✅ TC-UNIT-FE-SVC-CAT-001 | High | ✅ |
| SVC-CAT-002 | getCategoryById() calls GET /categories/:id | ✅ TC-UNIT-FE-SVC-CAT-002 | High | ✅ |
| SVC-CAT-003 | getParentCategories() filters categories with null parentCategory | ✅ TC-UNIT-FE-SVC-CAT-003 | Medium | ✅ |
| SVC-CAT-004 | getProductsByCategoryAndChildren() includes child category products | ✅ TC-UNIT-FE-SVC-CAT-004 | High | ✅ |

### shippingServices

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| SVC-ADDR-001 | getShippingAddresses() calls GET /addresses/user/:id | ✅ TC-UNIT-FE-SVC-ADDR-001 | Critical | ✅ |
| SVC-ADDR-002 | createShippingAddress() calls POST /addresses with user from getCurrentUser() | ✅ TC-UNIT-FE-SVC-ADDR-002 | Critical | ✅ |
| SVC-ADDR-003 | updateShippingAddress() calls PUT /addresses/:id | ✅ TC-UNIT-FE-SVC-ADDR-003 | High | ✅ |
| SVC-ADDR-004 | deleteShippingAddress() calls DELETE /addresses/:id | ✅ TC-UNIT-FE-SVC-ADDR-004 | High | ✅ |

### paymentServices

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| SVC-PAY-001 | getPaymentMethods() calls GET /payment-methods/user/:id | ✅ TC-UNIT-FE-SVC-PAY-001 | Critical | ✅ |
| SVC-PAY-002 | createPaymentMethod() calls POST /payment-methods with user from getCurrentUser() | ✅ TC-UNIT-FE-SVC-PAY-002 | Critical | ✅ |
| SVC-PAY-003 | updatePaymentMethod() calls PUT /payment-methods/:id | ✅ TC-UNIT-FE-SVC-PAY-003 | High | ✅ |
| SVC-PAY-004 | deletePaymentMethod() calls DELETE /payment-methods/:id | ✅ TC-UNIT-FE-SVC-PAY-004 | High | ✅ |

### orderServices

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| SVC-ORD-001 | createOrder() calls POST /orders with payload | ✅ TC-UNIT-FE-SVC-ORD-001 | Critical | ✅ |
| SVC-ORD-002 | createOrder() returns the order object from the API | ✅ TC-UNIT-FE-SVC-ORD-002 | Critical | ✅ |

### apiClient

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| API-001 | Attaches Authorization header when authToken is in localStorage | ✅ TC-UNIT-FE-API-001 | Critical | ✅ |
| API-002 | Does not attach Authorization header when no token | ✅ TC-UNIT-FE-API-002 | High | ✅ |
| API-003 | Returns parsed JSON on 200 response | ✅ TC-UNIT-FE-API-003 | High | ✅ |
| API-004 | Returns null on 204 No Content | ✅ TC-UNIT-FE-API-004 | High | ✅ |
| API-005 | Clears localStorage and redirects on 401 | ✅ TC-UNIT-FE-API-005 | Critical | ✅ |
| API-006 | Throws error on non-ok response | ✅ TC-UNIT-FE-API-006 | High | ✅ |

---

## Frontend-specific: Pages

### Checkout page

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-CHECKOUT-001 | Renders loading state while fetching addresses/payment methods | todo (React 19) | N/A | Medium | todo |
| UI-CHECKOUT-002 | Renders address list once loaded (default pre-selected) | ✅ TC-UNIT-FE-CHECKOUT-001 | ✅ TC-E2E-CHECKOUT-002 | High | ✅ |
| UI-CHECKOUT-003 | Renders "no addresses" message when list is empty | ✅ TC-UNIT-FE-CHECKOUT-002 | N/A | High | ✅ |
| UI-CHECKOUT-004 | Renders payment method list | ✅ TC-UNIT-FE-CHECKOUT-003 | N/A | High | ✅ |
| UI-CHECKOUT-005 | Shows error when API load fails | ✅ TC-UNIT-FE-CHECKOUT-004 | N/A | High | ✅ |
| UI-CHECKOUT-006 | Redirects to /cart when cart is empty | ✅ TC-UNIT-FE-CHECKOUT-005 | N/A | Critical | ✅ |
| UI-CHECKOUT-007 | createOrder() called on confirm; navigates to /order-confirmation | ✅ TC-UNIT-FE-CHECKOUT-006 | ✅ TC-E2E-CHECKOUT-006 | Critical | ✅ |

### Order confirmation page

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-ORDER-001 | Renders order details from location.state | ✅ TC-UNIT-FE-ORDER-001 | ✅ TC-E2E-CHECKOUT-007 | High | ✅ |
| UI-ORDER-002 | Redirects to / when location.state has no order | ✅ TC-UNIT-FE-ORDER-002 | N/A | High | ✅ |
| UI-ORDER-003 | Displays formatted total, shipping, IVA | ✅ TC-UNIT-FE-ORDER-003 | N/A | High | ✅ |

---

## Frontend-specific: LoginForm component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-LOGIN-001 | Form renders email, password, submit | ✅ TC-UNIT-FE-043 | ✅ TC-E2E-AUTH-001 | High | ✅ |
| UI-LOGIN-002 | Email field is required | ✅ TC-UNIT-FE-044 | N/A | High | ✅ |
| UI-LOGIN-003 | Password field is type=password | ✅ TC-UNIT-FE-046 | N/A | Medium | ✅ |
| UI-LOGIN-004 | Loading state during submit | todo (React 19) | N/A | Medium | todo |
| UI-LOGIN-005 | Error message shown on failure | ✅ TC-UNIT-FE-048 | ✅ TC-E2E-AUTH-002 | High | ✅ |
| UI-LOGIN-006 | Redirect on success | ✅ TC-UNIT-FE-051 | ✅ TC-E2E-AUTH-003 | Critical | ✅ |

---

## Frontend-specific: Home page

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-HOME-001 | Shows product list when fetchProducts resolves | ✅ TC-UNIT-FE-HOME-001 | ✅ TC-E2E-CART-002 | High | ✅ |
| UI-HOME-002 | Shows ErrorMessage when fetchProducts rejects | ✅ TC-UNIT-FE-HOME-002 | N/A | High | ✅ |
| UI-HOME-003 | Shows "No products found" when array is empty | ✅ TC-UNIT-FE-HOME-003 | N/A | Medium | ✅ |
| UI-HOME-004 | Calls searchProducts when query param exists | ✅ TC-UNIT-FE-HOME-004 | N/A | High | ✅ |
| UI-HOME-005 | Renders "Results for: ..." title with query | ✅ TC-UNIT-FE-HOME-005 | N/A | Medium | ✅ |

---

## Frontend-specific: Cart page

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-CARTPAGE-001 | Shows empty-cart message when cart has no items | ✅ TC-UNIT-FE-CART-001 | N/A | High | ✅ |
| UI-CARTPAGE-002 | Shows CartView when cart has items | ✅ TC-UNIT-FE-CART-003 | ✅ TC-E2E-CART-005 | High | ✅ |
| UI-CARTPAGE-003 | Shows total price | ✅ TC-UNIT-FE-CART-004 | N/A | High | ✅ |
| UI-CARTPAGE-004 | "Empty cart" button calls clearCart() | ✅ TC-UNIT-FE-CART-005 | ✅ TC-E2E-CART-008 | High | ✅ |
| UI-CARTPAGE-005 | "Back to products" navigates to "/" | ✅ TC-UNIT-FE-CART-006 | N/A | Medium | ✅ |
| UI-CARTPAGE-006 | "Proceed to payment" navigates to "/checkout" | ✅ TC-UNIT-FE-CART-007 | ✅ TC-E2E-CART-009 | Critical | ✅ |

---

## Frontend-specific: Navigation component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-NAV-001 | Renders static nav links (Daily offers, etc.) | ✅ TC-UNIT-FE-NAV-001 | N/A | Medium | ✅ |
| UI-NAV-002 | Renders categories from API | ✅ TC-UNIT-FE-NAV-002 | N/A | High | ✅ |
| UI-NAV-003 | Renders gracefully when fetchCategories fails | ✅ TC-UNIT-FE-NAV-003 | N/A | High | ✅ |
| UI-NAV-004 | Mobile layout renders category links | ✅ TC-UNIT-FE-NAV-004 | N/A | Medium | ✅ |
| UI-NAV-005 | "All categories" toggle shows/hides dropdown | ✅ TC-UNIT-FE-NAV-005 | N/A | Medium | ✅ |

---

## Frontend-specific: Header component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-HEADER-001 | Renders Navigation component | ✅ TC-UNIT-FE-HEADER-001 | N/A | High | ✅ |
| UI-HEADER-002 | Renders logo link | ✅ TC-UNIT-FE-HEADER-002 | N/A | Medium | ✅ |
| UI-HEADER-003 | Shows Login/Register when not authenticated | ✅ TC-UNIT-FE-HEADER-003 | N/A | High | ✅ |
| UI-HEADER-004 | Shows user info when authenticated | ✅ TC-UNIT-FE-HEADER-004 | N/A | High | ✅ |
| UI-HEADER-005 | Search form navigates to /?q=term | ✅ TC-UNIT-FE-HEADER-006 | N/A | High | ✅ |
| UI-HEADER-006 | Logout button calls logout() service | ✅ TC-UNIT-FE-HEADER-007 | ✅ TC-E2E-AUTH-008 | High | ✅ |
| UI-HEADER-007 | Cart badge shows item count | ✅ TC-UNIT-FE-HEADER-008 | N/A | Medium | ✅ |

---

## Frontend-specific: CategoryDetails component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-CATDET-001 | Shows loading state initially | ✅ TC-UNIT-FE-CATDET-001 | N/A | High | ✅ |
| UI-CATDET-002 | Shows category name after data loads | ✅ TC-UNIT-FE-CATDET-002 | N/A | High | ✅ |
| UI-CATDET-003 | Renders product cards when products exist | ✅ TC-UNIT-FE-CATDET-003 | N/A | High | ✅ |
| UI-CATDET-004 | Shows "No products found" when no products | ✅ TC-UNIT-FE-CATDET-004 | N/A | Medium | ✅ |
| UI-CATDET-005 | Shows error when getCategoryById rejects | ✅ TC-UNIT-FE-CATDET-005 | N/A | High | ✅ |
| UI-CATDET-006 | Re-fetches when categoryId prop changes | ✅ TC-UNIT-FE-CATDET-006 | N/A | Medium | ✅ |

---

## Frontend-specific: ProductDetails component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-PRODDET-001 | Shows loading state initially | ✅ TC-UNIT-FE-PRODDET-001 | N/A | High | ✅ |
| UI-PRODDET-002 | Shows product name after load | ✅ TC-UNIT-FE-PRODDET-002 | N/A | High | ✅ |
| UI-PRODDET-003 | Shows price and description | ✅ TC-UNIT-FE-PRODDET-003 | N/A | High | ✅ |
| UI-PRODDET-004 | Shows error when product not found (null response) | ✅ TC-UNIT-FE-PRODDET-004 | N/A | High | ✅ |
| UI-PRODDET-005 | Shows error when getProductById rejects | ✅ TC-UNIT-FE-PRODDET-005 | N/A | High | ✅ |
| UI-PRODDET-006 | "Add to cart" button present when in stock | ✅ TC-UNIT-FE-PRODDET-006 | N/A | Critical | ✅ |
| UI-PRODDET-007 | "Add to cart" button disabled when out of stock | ✅ TC-UNIT-FE-PRODDET-007 | N/A | Critical | ✅ |

---

## Frontend-specific: AddressItem component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-ADDRITEM-001 | Renders address name, address1, city, postalCode | ✅ TC-UNIT-FE-ADDRITEM-001/002/004 | N/A | High | ✅ |
| UI-ADDRITEM-002 | Shows address2 and reference when provided | ✅ TC-UNIT-FE-ADDRITEM-003/005 | N/A | Medium | ✅ |
| UI-ADDRITEM-003 | Hides optional fields when not provided | ✅ TC-UNIT-FE-ADDRITEM-006 | N/A | Medium | ✅ |
| UI-ADDRITEM-004 | Shows "Default" badge when defaultAddress=true | ✅ TC-UNIT-FE-ADDRITEM-007 | N/A | Medium | ✅ |
| UI-ADDRITEM-005 | Select button disabled when already selected | ✅ TC-UNIT-FE-ADDRITEM-009 | N/A | High | ✅ |
| UI-ADDRITEM-006 | Select/Edit/Delete callbacks fire correctly | ✅ TC-UNIT-FE-ADDRITEM-010/011/012 | N/A | Critical | ✅ |

---

## Frontend-specific: PaymentMethodForm component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-PMFORM-001 | Renders payment type selector | ✅ TC-UNIT-FE-PMFORM-001 | N/A | High | ✅ |
| UI-PMFORM-002 | Shows card fields for credit_card (default) | ✅ TC-UNIT-FE-PMFORM-002 | N/A | High | ✅ |
| UI-PMFORM-003 | Switching to paypal shows paypalEmail field | ✅ TC-UNIT-FE-PMFORM-003 | N/A | High | ✅ |
| UI-PMFORM-004 | Switching to bank_transfer shows bank fields | ✅ TC-UNIT-FE-PMFORM-004 | N/A | High | ✅ |
| UI-PMFORM-005 | cash_on_delivery hides all type-specific fields | ✅ TC-UNIT-FE-PMFORM-005 | N/A | Medium | ✅ |
| UI-PMFORM-006 | Submit calls onSubmit with form data | ✅ TC-UNIT-FE-PMFORM-007 | N/A | Critical | ✅ |
| UI-PMFORM-007 | Cancel button rendered only when onCancel provided | ✅ TC-UNIT-FE-PMFORM-008/009 | N/A | Medium | ✅ |
| UI-PMFORM-008 | initialValues pre-populate the form | ✅ TC-UNIT-FE-PMFORM-010 | N/A | High | ✅ |

---

## Frontend-specific: PaymentMethodItem component

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-PMITEM-001 | Renders type label for all 5 payment types | ✅ TC-UNIT-FE-PMITEM-001/002/003/004/005 | N/A | High | ✅ |
| UI-PMITEM-002 | Shows "Name · ****last4" for credit/debit card | ✅ TC-UNIT-FE-PMITEM-006 | N/A | High | ✅ |
| UI-PMITEM-003 | Shows only name when cardNumber is empty | ✅ TC-UNIT-FE-PMITEM-007 | N/A | Medium | ✅ |
| UI-PMITEM-004 | Shows ****last4 (with separator) when cardHolderName is empty | ✅ TC-UNIT-FE-PMITEM-008 | N/A | Medium | ✅ |
| UI-PMITEM-005 | Shows paypalEmail for paypal type | ✅ TC-UNIT-FE-PMITEM-010 | N/A | High | ✅ |
| UI-PMITEM-006 | Shows bankName for bank_transfer type | ✅ TC-UNIT-FE-PMITEM-011 | N/A | High | ✅ |
| UI-PMITEM-007 | Empty summary for cash_on_delivery | ✅ TC-UNIT-FE-PMITEM-012 | N/A | Medium | ✅ |
| UI-PMITEM-008 | Shows "Default" badge when isDefault=true | ✅ TC-UNIT-FE-PMITEM-013 | N/A | Medium | ✅ |
| UI-PMITEM-009 | Select button disabled + "Selected" when isSelected=true | ✅ TC-UNIT-FE-PMITEM-015/016 | N/A | High | ✅ |
| UI-PMITEM-010 | onSelect / onEdit / onDelete callbacks fire correctly | ✅ TC-UNIT-FE-PMITEM-018/019/020 | N/A | Critical | ✅ |

---

## Frontend-specific: common components (Badge, List, Layout, Footer)

| ID | Scenario | Frontend unit | E2E | Priority | Status |
|---|---|---|---|---|---|
| UI-BADGE-001 | Renders text content with base + variant classes | ✅ TC-UNIT-FE-BADGE-001/002/003 | N/A | Medium | ✅ |
| UI-BADGE-002 | Custom variant class applied | ✅ TC-UNIT-FE-BADGE-004 | N/A | Medium | ✅ |
| UI-BADGE-003 | Additional className appended | ✅ TC-UNIT-FE-BADGE-005 | N/A | Low | ✅ |
| UI-LIST-001 | Renders title and product cards | ✅ TC-UNIT-FE-LIST-001/002/003 | N/A | High | ✅ |
| UI-LIST-002 | Grid layout uses vertical card orientation | ✅ TC-UNIT-FE-LIST-004 | N/A | Medium | ✅ |
| UI-LIST-003 | Non-grid layout uses horizontal orientation | ✅ TC-UNIT-FE-LIST-005 | N/A | Medium | ✅ |
| UI-LAYOUT-001 | Renders children with Header and Footer | ✅ TC-UNIT-FE-LAYOUT-001/002/003 | N/A | High | ✅ |
| UI-FOOTER-001 | Renders About, Support sections and copyright year | ✅ TC-UNIT-FE-FOOTER-001/002/003/004 | N/A | Medium | ✅ |
| UI-FOOTER-002 | Renders Privacy policy and Terms links | ✅ TC-UNIT-FE-FOOTER-005/006 | N/A | Low | ✅ |

---

## Frontend-specific: CartContext

| ID | Scenario | Frontend unit | Priority | Status |
|---|---|---|---|---|
| CTX-001 | Initial state from localStorage | ✅ TC-UNIT-FE-028 | High | ✅ |
| CTX-002 | addToCart increments existing item | ✅ TC-UNIT-FE-030 | Critical | ✅ |
| CTX-003 | removeFromCart removes item | ✅ TC-UNIT-FE-032 | Critical | ✅ |
| CTX-004 | updateQuantity(0) removes item | ✅ TC-UNIT-FE-036 | High | ✅ |
| CTX-005 | total computed correctly | ✅ TC-UNIT-FE-039 | Critical | ✅ |
| CTX-006 | State synced to localStorage | ✅ TC-UNIT-FE-040/041 | High | ✅ |
| CTX-007 | useCart throws outside provider | ✅ TC-UNIT-FE-042 | High | ✅ |

---

## Application infrastructure

| ID | Scenario | Backend integration | Priority | Status |
|---|---|---|---|---|
| APP-001 | GET / returns 200 with greeting text | ✅ TC-INT-APP-001 | Medium | ✅ |
| APP-002 | Unknown /api/* route returns 404 with error envelope | ✅ TC-INT-APP-002/003/004 | High | ✅ |
| APP-003 | Error handler returns err.status and err.message | ✅ TC-INT-APP-005/006 | High | ✅ |

---

## Coverage summary

| Suite | Files | Tests | Passing | Bug-doc / todo | Unverified |
|---|---|---|---|---|---|
| Backend unit | 10 | 55 | 55 | 0 | 0 |
| Backend integration | 10 | 189 | 189 | 15 (assert known behavior) | 0 |
| Frontend unit — service layer | 7 | 60 | 60 | 0 | 0 |
| Frontend unit — components/pages (legacy) | 8 | 80 | 78 | 2 todo (React 19 limitation) | 0 |
| Frontend unit — components/pages (new) | 16 | 102 | 102 | 0 | 0 |
| E2E | 3 | 25 | — | 0 | 25 (need full stack running; FRONTEND-005 resolved) |
| **Total** | **54** | **511** | **484** | **17** | **25** |

**Backend statement coverage: 89.42%** — `app.js` now 100% statements; all 100% functions

**Frontend statement coverage: 75.79%** — was 50% before 2026-07-08 audit (16 new test files added)

| File | Before | After | Δ |
|---|---|---|---|
| All frontend files | 50% | **77.66%** | +27.66pp |
| SummarySection.jsx | 42% | 100% | ✅ |
| PaymentMethodForm.jsx | 15% | 100% | ✅ |
| PaymentMethodItem.jsx | 18.75% | **100%** | ✅ (2026-07-08) |
| CategoryDetails.jsx | 0% | 91.66% | ✅ |
| Header.jsx | 0% | 89.13% | ✅ |
| Navigation.jsx | 0% | 90.62% | ✅ |
| Cart.jsx (page) | 0% | 88.88% | ✅ |
| CartContext.jsx | 69% | 69.04% | (needs API path tests) |
| Checkout.jsx | 47% | 47.31% | (complex flow) |
| App.jsx | 0% | 0% | (router entry; low test value) |

**Resolved since last matrix update:**
- BUG-003 (postalCode field) — ✅
- BUG-012 (JWT name field) — ✅
- FRONTEND-005 (Cypress btoa token) — ✅
- SVC-USR-001/002/003 stale tests — ✅ rewritten
- SVC-PROD-001/002/003/004/005 stale tests — ✅ rewritten
