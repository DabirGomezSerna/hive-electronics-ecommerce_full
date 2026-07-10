# Testing Strategy — Hive Electronics Ecommerce (Full Stack)

**Last updated:** 2026-07-08  
**Projects:** `hive-electronics-ecommerce_api` (Express/Mongoose) · `hive-electronics-ecommerce_app` (React 19)

---

## 1. Objective

Provide a reliable, maintainable, and documented automated test suite that covers the full ecommerce platform across all layers: backend unit, API integration, frontend component, and end-to-end browser flows.

The strategy ensures that:
- Critical business rules (auth, cart, orders, payments) are tested at the lowest effective level
- Bugs are caught before they reach production
- No test suite requires manual configuration of external services (all backend tests run against an in-memory database; all frontend unit tests mock the HTTP layer)
- Every known defect is documented with a test that proves its current behavior, making regressions detectable the moment a fix lands

---

## 2. Project structure

```
hive-electronics-ecommerce_full/
├── hive-electronics-ecommerce_api/         # Express + Mongoose backend
│   ├── src/                                # Application source
│   ├── tests/
│   │   ├── helpers/                        # setup.js · db.js · fixtures.js
│   │   ├── unit/middleware/                # 3 files — 15 tests
│   │   ├── unit/models/                    # 7 files — 40 tests
│   │   └── integration/                    # 9 files — 177 tests
│   ├── vitest.config.js
│   └── tests/TEST-PLAN.md                  # Backend-specific test plan
│
├── hive-electronics-ecommerce_app/         # React 19 frontend
│   ├── src/__tests__/                      # 8 files — 88 unit tests
│   ├── cypress/e2e/                        # 3 files — 25 E2E tests
│   ├── cypress/support/                    # commands.js · e2e.js
│   ├── vite.config.js
│   ├── vitest.setup.js
│   └── docs/testing.md                     # Frontend-specific test docs
│
└── docs/testing/                           # Cross-project integrated docs
    ├── strategy.md                         # ← this file
    ├── test-matrix.md
    ├── test-data.md
    ├── running-tests.md
    └── known-issues.md
```

---

## 3. Test pyramid

```
               ▲
              /E2E\        ~10% — 25 Cypress tests (auth seeding needs update)
             /─────\       Full browser flows; slow; reserved for critical paths
            / Integ \
           /─────────\     ~20% — 177+ API integration tests (Supertest + MongoMemoryServer)
          / Unit      \
         /─────────────\   ~70% — 55 backend unit + ~140 frontend unit tests
        /───────────────\  Fast, isolated, deterministic
```

**Target: ~400+ automated tests** — counts update as new service and component tests are added

---

## 4. Level definitions

### Level 1 — Backend unit tests

**Tools:** Vitest 4.1.9  
**Location:** `hive-electronics-ecommerce_api/tests/unit/`  
**Run command:** `npm run test:unit` (from `hive-electronics-ecommerce_api/`)

Cover:
- Middleware logic: JWT verification (`authMiddleware`), role check (`isAdminMiddleware`), validation result handling (`validate`)
- Model schema validation: required fields, defaults, enum constraints, numeric ranges

Do NOT use:
- Database connections — all assertions via Mongoose `validateSync()`
- HTTP — pure function and class tests

### Level 2 — API integration tests

**Tools:** Vitest 4.1.9 + Supertest 7 + mongodb-memory-server 11  
**Location:** `hive-electronics-ecommerce_api/tests/integration/`  
**Run command:** `npm run test:integration` (from `hive-electronics-ecommerce_api/`)

Cover:
- Full HTTP request/response cycle via Supertest
- Real Mongoose operations against an isolated in-memory MongoDB
- Auth middleware, isAdmin middleware, validation middleware — all in the stack
- Every route: status codes, response shapes, DB side-effects, error paths
- Bug-documenting tests that assert current broken behavior (marked `🐛`)
- Security-gap tests that confirm known vulnerabilities (marked `⚠️`)

Each test file manages its own `beforeAll(connect)` / `afterAll(close)` / `beforeEach(clear)` lifecycle. Tests are isolated and order-independent.

### Level 3 — Frontend unit tests

**Tools:** Vitest 4.1.9 + React Testing Library 16 + jsdom 29  
**Location:** `hive-electronics-ecommerce_app/src/__tests__/`  
**Run command:** `npm run test:unit` (from `hive-electronics-ecommerce_app/`)

Cover:
- Services: `userServices`, `productServices`, `categoryServices`, `shippingServices`, `paymentServices`, `orderServices`, `apiClient` — all mock the `apiClient` module via `vi.mock()`
- Context: `CartContext` — all mutations, localStorage sync, error boundaries
- Components: `LoginForm`, `ProductCard`, `CartView`, `AddressForm`
- Pages: `ProtectedRoute`, `Checkout`, `Order` — auth guards, API-driven rendering

Do NOT use:
- Real network calls — all service-calling tests mock `apiClient` with `vi.mock('../../services/apiClient')`
- Real `fetch` in service tests — `apiClient.test.js` is the sole place that uses `vi.stubGlobal('fetch', vi.fn())`
- Snapshots as primary assertions — behavior-driven only

**Service mock pattern:**

```js
vi.mock('../../services/apiClient', () => ({ default: vi.fn() }));
import apiClient from '../../services/apiClient';

beforeEach(() => { apiClient.mockReset(); });

it('resolves to an array of products', async () => {
  apiClient.mockResolvedValue([{ _id: '1', name: 'Widget', price: 9.99 }]);
  const products = await fetchProducts();
  expect(products).toHaveLength(1);
  expect(apiClient).toHaveBeenCalledWith('/products');
});
```

**React 19 known limitation:** Async event handlers ("Actions") defer intermediate state commits until resolution. Tests for loading-state UI are marked `it.todo()` with explanation. See [`known-issues.md`](known-issues.md).

### Level 4 — Frontend integration tests

**Status:** Covered within Level 3 via `apiClient` module mocking.

The frontend services now call the real API via `apiClient.js`. Component and page tests that render API-driven UI mock the service modules directly (e.g. `vi.mock('../../services/shippingServices')`). This is functionally equivalent to MSW-based integration testing without the additional setup overhead.

Full MSW adoption remains an option if richer HTTP-level assertions are needed (e.g. verifying headers, status code branches) — see TD-002 in [`known-issues.md`](known-issues.md).

### Level 5 — End-to-end tests

**Tools:** Cypress 15.18.0  
**Location:** `hive-electronics-ecommerce_app/cypress/e2e/`  
**Run command:** `npm run test:e2e:open` (requires `npm start` in a separate terminal)

Cover:
- Login flow (8 tests): form rendering, invalid credentials, successful redirect, localStorage token, header state, protected route enforcement, logout
- Shopping cart (9 tests): empty state, product listing, add to cart, badge update, cart page, quantity controls, remove, clear, checkout navigation
- Checkout (8 tests): unauthenticated redirect, address loading, order details, subtotal, confirm button state, order creation, confirmation page, add new address

Cypress tests require **all three services running**: CRA dev server on `:3000`, API server on `:4000`, and a MongoDB instance. The `cy.loginBySession()` command currently seeds localStorage with a `btoa`-encoded token — this is incompatible with the real JWT auth and must be updated to seed a valid JWT + `userData`. See FRONTEND-005 in [`known-issues.md`](known-issues.md).

---

## 5. Tools summary

| Tool | Version | Project | Purpose |
|---|---|---|---|
| Vitest | 4.1.9 | API + App | Test runner |
| Supertest | 7.2.2 | API | HTTP assertions |
| mongodb-memory-server | 11.2.0 | API | Isolated in-memory MongoDB |
| @vitest/coverage-v8 | 4.1.9 | API + App | Code coverage |
| React Testing Library | 16.3.0 | App | Component rendering + queries |
| @testing-library/jest-dom | 6.9.1 | App | DOM matchers |
| jsdom | 29.1.1 | App | Browser environment |
| Cypress | 15.18.0 | App | E2E browser automation |

---

## 6. Coverage targets

Configured in `hive-electronics-ecommerce_api/vitest.config.js`:

| Metric | Backend target | Frontend target |
|---|---|---|
| Statements | 70% | 75% |
| Branches | 60% | 65% |
| Functions | 70% | 75% |
| Lines | 70% | 75% |

Files excluded from coverage:
- `src/config/**` (DB connection config — no logic to test)
- Test helpers, setup files
- `src/index.js`, `src/reportWebVitals.js` (entry points with no testable logic)

Coverage is a secondary metric. Priority order: auth security → order/payment correctness → inventory integrity → user-facing errors.

---

## 7. Acceptance criteria

The strategy is considered complete when:

- [x] All 55 backend unit tests pass
- [x] All 177 backend integration tests pass (including 15 bug-documenting tests that assert known broken behavior)
- [ ] All frontend unit tests pass — service tests rewritten to mock `apiClient` (2 `it.todo` acknowledged as React 19 limitation)
- [ ] All 25 Cypress E2E tests pass with full stack running (dev server + API + MongoDB) — blocked on FRONTEND-005
- [x] Every known bug has a test that fails when the bug is present
- [x] No test shares mutable state with another test
- [x] No test requires the production database
- [x] All test files are in English
- [ ] CI/CD pipeline runs unit + integration tests on every push
- [x] Documentation covers all commands, known issues, and data strategy
