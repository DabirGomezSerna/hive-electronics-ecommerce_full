# Testing Strategy — hive-electronics-ecommerce_app

React 19 frontend. No real API calls — all data from local JSON files with simulated `setTimeout` delays.

---

## 1. Architecture and key decisions

| Decision | Rationale |
|---|---|
| Vitest + RTL for unit tests | Consistent with the API project (both use Vitest); RTL already installed |
| CRA Jest kept untouched | `react-scripts test` still runs the legacy CRA test runner |
| Cypress for E2E | Industry standard; handles real browser behavior including page reloads |
| No real API in E2E | The frontend uses local JSON; Cypress tests verify UI behavior, not HTTP |

### React 19 known limitation — async Action deferred rendering

React 19 treats `async` event handlers as "Actions" and defers intermediate state commits until the handler resolves. This means loading-state DOM updates (`setLoading(true)`) set inside an `async onSubmit` are NOT visible to RTL's synchronous queries mid-flight.

**Impact**: TC-UNIT-FE-049 and TC-UNIT-FE-050 are marked `it.todo` with an explanation. The same loading behavior is implicitly covered by tests that advance fake timers through the full flow (TC-UNIT-FE-048, -051, -052).

---

## 2. Running tests

```bash
# Unit tests (Vitest, no server needed)
npm run test:unit

# Unit tests in watch mode
npm run test:unit:watch

# E2E tests (requires dev server running on localhost:3000)
npm start                  # terminal 1
npm run test:e2e           # terminal 2 (headless)
npm run test:e2e:open      # terminal 2 (Cypress UI)
```

---

## 3. Unit tests (Vitest 4 + React Testing Library 16)

**Config**: `vite.config.js` → `vitest.setup.js` (extends `expect` with jest-dom matchers, stubs `localStorage` and `window.location.reload`)

**Location**: `src/__tests__/`

### Results: 86 passed | 2 todo (88 total)

| File | Tests | Description |
|---|---|---|
| `services/userServices.test.js` | 16 | login(), logout(), isAuthenticated(), getCurrentUser() |
| `services/productServices.test.js` | 10 | fetchProducts(), searchProducts(), getProductsByCategory(), getProductById() |
| `context/CartContext.test.jsx` | 16 | addToCart, removeFromCart, updateQuantity, clearCart, totals, localStorage sync |
| `components/LoginForm.test.jsx` | 8 + 2 todo | Rendering, failed login, successful login |
| `components/ProductCard.test.jsx` | 11 | Rendering, stock state, addToCart, navigation link |
| `components/CartView.test.jsx` | 10 | Rendering, quantity controls, remove item |
| `pages/ProtectedRoute.test.jsx` | 5 | Unauthenticated redirect, auth pass-through, role-based access |
| `components/AddressForm.test.jsx` | 10 | Rendering, pre-population, submission, cancel, reset |

### Fake timers strategy

Services wrap their responses in `setTimeout` (1.5–2s). Tests use `vi.useFakeTimers()` + `await vi.runAllTimersAsync()` to advance past the delay synchronously.

Component tests that need the full async flow (LoginForm submit → 800ms delay → login mock) use:
```js
await act(async () => { fireEvent.click(submitBtn); });
await act(async () => { vi.advanceTimersByTime(900); });
```

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
| `cy.loginBySession(email?)` | Sets `authToken` + `userData` in localStorage directly (bypasses login form) |
| `cy.addProductToCart(product?)` | Pushes product into `cart` localStorage key |
| `cy.clearCart()` | Empties `cart` localStorage |
| `cy.logoutSession()` | Removes `authToken` and `userData` from localStorage |

`cy.loginBySession` mirrors the exact token format and user object structure that `userServices.login()` produces (btoa-encoded token, loginDate added). This ensures the app's `isAuthenticated()` / `getCurrentUser()` functions behave identically to a real login.

### E2E test matrix

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

The frontend uses static JSON files as its data source. No external dependencies, no cleanup needed after tests.

| Data source | Contents |
|---|---|
| `src/data/users.json` | John Doe (john@email.com), Jane Doe (jane@email.com) |
| `src/data/products.json` | 8+ products with categories |
| `src/data/shippingAddress.json` | 2 addresses; first has `"default": true` |

**E2E isolation**: `beforeEach(() => cy.clearLocalStorage())` in `cypress/support/e2e.js` prevents cart and auth state leaking between tests. Orders persist only in `localStorage['orders']` (also cleared by `clearLocalStorage`).

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

Add to `.github/workflows/test.yml`:

```yaml
name: Frontend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: hive-electronics-ecommerce_app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: hive-electronics-ecommerce_app/package-lock.json
      - run: npm ci --legacy-peer-deps
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: hive-electronics-ecommerce_app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: hive-electronics-ecommerce_app/package-lock.json
      - run: npm ci --legacy-peer-deps
      - name: Start dev server
        run: npm start &
        env:
          CI: false
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-screenshots
          path: hive-electronics-ecommerce_app/cypress/screenshots
```
