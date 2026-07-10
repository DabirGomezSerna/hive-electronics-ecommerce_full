# Test Data Strategy — Hive Electronics Ecommerce

**Last updated:** 2026-07-08

---

## 1. Architecture overview

The two projects use fundamentally different data approaches because they have no shared runtime:

| Layer | Data source | Persistence | Cleanup |
|---|---|---|---|
| Backend integration tests | MongoMemoryServer (in-memory MongoDB) | Per-test-file | `clear()` in `beforeEach` drops all collections |
| Frontend unit tests | `vi.mock('../../services/apiClient')` — inline mock data | Per-test | `apiClient.mockReset()` in `beforeEach` |
| Cypress E2E tests | Real API at `localhost:4000` + localStorage seeding | Per-test | `cy.clearLocalStorage()` in `cypress/support/e2e.js` `beforeEach` |

There is no shared seed script, no shared database, and no cross-layer dependency.

---

## 2. Backend data — factories (`tests/helpers/fixtures.js`)

All backend test data is created programmatically via factory functions before each test and destroyed by `beforeEach(() => clear())`. No fixed seed data is used in tests.

### User factories

| Factory | Creates | Default values |
|---|---|---|
| `createCustomer(overrides?)` | `User` with `role: "customer"` | email: `customer-{timestamp}-{random}@test.com`, password hashed with bcrypt |
| `createAdmin(overrides?)` | `User` with `role: "admin"` | email: `admin-{timestamp}-{random}@test.com` |
| `customerSession(overrides?)` | `{ user, token }` | Creates customer + JWT token (1h expiry) |
| `adminSession(overrides?)` | `{ user, token }` | Creates admin + JWT token (1h expiry) |

Unique emails use `Date.now()` + random suffix — no collision possible between parallel tests.

### Entity factories

| Factory | Creates | Minimum required |
|---|---|---|
| `createCategory(overrides?)` | `Category` | `name: "Category-{timestamp}"` |
| `createChildCategory(parentId, overrides?)` | `Category` with `parentCategory` | parent Category `_id` |
| `createProduct(categoryId, overrides?)` | `Product` | `price: 99.99`, `stock: 10` |
| `createAddress(userId, overrides?)` | `ShippingAddress` | `address1`, `postalCode`, `city`, `country` |
| `createPaymentMethod(userId, overrides?)` | `PaymentMethod` | `type: "cash_on_delivery"` |

### Test users by scenario

| Scenario | How to create |
|---|---|
| Valid customer | `const { user, token } = await customerSession()` |
| Valid admin | `const { user, token } = await adminSession()` |
| User with no cart | `await customerSession()` (no addToCart call) |
| User with existing cart | `customerSession()` → `POST /api/carts/addToCart` |
| Admin-only access | Any route needing `isAdmin` + `adminSession()` |

### Cleanup strategy

```js
// Each integration test file:
beforeAll(() => connect());    // MongoMemoryServer.create() — fresh instance per file
afterAll(() => close());       // Drops DB, closes connection, stops server
beforeEach(() => clear());     // Deletes all documents in all collections
```

Each test file gets an isolated in-memory MongoDB instance. `clear()` between tests ensures no bleed between scenarios in the same file.

---

## 3. Frontend data — `apiClient` module mock

All frontend services now call `apiClient.js` which makes real `fetch()` calls to the backend. Unit tests mock the `apiClient` module so no real network calls are made.

### Mock setup pattern

```js
vi.mock('../../services/apiClient', () => ({ default: vi.fn() }));
import apiClient from '../../services/apiClient';

beforeEach(() => {
  apiClient.mockReset();
  localStorage.clear();
});
```

`apiClient` is a default export — the mock replaces it with a `vi.fn()` that can be configured per test.

### Mock return shapes

| Service call | Mock return value |
|---|---|
| `login(email, pwd)` | `{ token: 'header.payload.sig', refreshToken: '...' }` — `apiClient` resolved value |
| `register(displayName, email, pwd)` | `{ _id: '...', displayName, email, role: 'customer' }` |
| `fetchProducts()` | `[{ _id: '1', name: 'Widget', price: 9.99, stock: 5, category: { _id: 'cat1' } }]` |
| `fetchCategories()` | `[{ _id: 'cat1', name: 'Electronics', parentCategory: null }]` |
| `getShippingAddresses(userId)` | `[{ _id: 'addr1', address1: '123 Main', city: 'CDMX', postalCode: '06600', country: 'MX', defaultAddress: true }]` |
| `getPaymentMethods(userId)` | `[{ _id: 'pm1', type: 'cash_on_delivery', isDefault: true }]` |
| `createOrder(payload)` | `{ _id: 'ord1', status: 'pending', totalPrice: 236.98 }` |

For token decode tests, construct a minimal JWT payload: `btoa(JSON.stringify({ userId: 'u1', name: 'John', role: 'customer' }))` and concatenate as `header.${payload}.sig`.

### localStorage in unit tests

`vitest.setup.js` provides an isolated localStorage mock:
- `localStorage.clear()` called in global `beforeEach`
- `vi.clearAllMocks()` called in global `beforeEach`
- `window.location.reload` is stubbed with `vi.fn()` to prevent JSDOM navigation errors

No unit test reads from the real `localStorage` browser API.

### Static JSON files (`src/data/`)

`src/data/*.json` files still exist and are served by the CRA dev server during manual development. They are **no longer used by services** and are **not referenced in unit tests**. They serve as reference data only.

---

## 4. Cypress data — real API + localStorage seeding

Cypress tests now run against the real API. The frontend calls `localhost:4000/api` — all three services (CRA dev server, API server, MongoDB) must be running.

### Custom commands (`cypress/support/commands.js`)

| Command | Current behavior | Required behavior |
|---|---|---|
| `cy.loginBySession(email?)` | Seeds `authToken = btoa("email:timestamp")` + `userData` (JSON) | **Must be updated** — see FRONTEND-005. Seed a valid JWT string + `userData: { userId, displayName, role, email }` |
| `cy.addProductToCart(product?)` | Writes `cart` (JSON array) to localStorage | Compatible — CartContext reads from localStorage |
| `cy.clearCart()` | Removes `cart` key | Compatible |
| `cy.logoutSession()` | Removes `authToken` + `userData` | Compatible |

**Current `cy.loginBySession` is broken** for any Cypress test that reads `getCurrentUser()` (Checkout flow). The `isAuthenticated()` check passes (token is non-null), but `getCurrentUser()` returns `userData` from localStorage which currently has the old shape. The Checkout page calls `getCurrentUser().userId` to fetch addresses — this will fail or use `undefined` as the user ID.

**Fix options for `cy.loginBySession`:**

Option A — call real API:
```js
cy.request('POST', 'http://localhost:4000/api/login', { email, password })
  .then(({ body }) => {
    localStorage.setItem('authToken', body.token);
    localStorage.setItem('refreshToken', body.refreshToken);
    // decode body.token to get userData
  });
```

Option B — seed complete localStorage state without real API call:
```js
const fakeJwt = `header.${btoa(JSON.stringify({ userId: 'u1', name: 'Test User', role: 'customer' }))}.sig`;
localStorage.setItem('authToken', fakeJwt);
localStorage.setItem('userData', JSON.stringify({ userId: 'u1', displayName: 'Test User', role: 'customer', email }));
```

### Global cleanup

```js
// cypress/support/e2e.js
beforeEach(() => { cy.clearLocalStorage(); });
```

All test state is wiped before each spec. No test depends on state from a previous test.

---

## 5. Data entity reference table

| Entity | Backend method | Frontend unit method | Cypress method | Cleanup |
|---|---|---|---|---|
| Customer user | `customerSession()` | `apiClient.mockResolvedValue({ token, refreshToken })` | `cy.loginBySession()` (needs update — FRONTEND-005) | `clear()` / `mockReset()` / `clearLocalStorage` |
| Admin user | `adminSession()` | N/A | N/A | Same |
| Category | `createCategory()` | `apiClient.mockResolvedValue([...])` | Real API response | `clear()` / `mockReset()` |
| Product | `createProduct(catId)` | `apiClient.mockResolvedValue([...])` | Real API response | `clear()` / `mockReset()` |
| Shopping cart | POST /api/carts | `CartContext` + localStorage mock | `cy.addProductToCart()` | `clear()` / vitest setup / `clearLocalStorage` |
| Shipping address | `createAddress(userId)` | `apiClient.mockResolvedValue([...])` | Real API response | `clear()` / `mockReset()` |
| Payment method | `createPaymentMethod(userId)` | `apiClient.mockResolvedValue([...])` | Real API response | `clear()` |
| Order | POST /api/orders in test | `apiClient.mockResolvedValue({ _id, status, totalPrice })` | Real API response | `clear()` / `mockReset()` |

---

## 6. Remaining data inconsistencies

Most backend/frontend contract mismatches were resolved during the connection work. The following remain:

| Field | Backend | Frontend | Impact |
|---|---|---|---|
| JWT `name` field | `name: undefined` in payload (BUG-012 — schema is `displayName`) | `userServices` reads `payload.name` → `userData.displayName` is `undefined` | Header/user display shows blank until BUG-012 fixed |
| Order shape passed to Order.jsx | MongoDB document with populated refs | `Checkout.jsx` constructs a custom object before navigating to `/order-confirmation` | No API shape mismatch — data constructed client-side |
| Cart | MongoDB document with `products[]` subdocs | localStorage JSON array via `CartContext` | No immediate issue — frontend manages its own cart state; API cart endpoints used separately |
