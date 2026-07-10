# Running Tests — Hive Electronics Ecommerce

**Last updated:** 2026-07-08

All commands listed below are copy-paste ready. Run them from the directory indicated.

---

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Node.js | ≥ 18 | `node --version` |
| npm | ≥ 9 | `npm --version` |
| Dependencies installed | — | `npm install` in each project folder |

No running MongoDB instance is required for any test suite. Backend tests use `mongodb-memory-server`.

---

## Backend (`hive-electronics-ecommerce_api/`)

```bash
cd hive-electronics-ecommerce_api
```

### Install dependencies

```bash
npm install
```

### Run all tests (CI mode — runs once and exits)

```bash
npm test
```

### Run only unit tests

```bash
npm run test:unit
```

Runs: `tests/unit/middleware/*.test.js` + `tests/unit/models/*.test.js`  
Expected: **55 tests, all passing**

### Run only integration tests

```bash
npm run test:integration
```

Runs: `tests/integration/*.test.js`  
Expected: **177 tests, all passing** (15 tests assert known broken behavior — they pass by documenting current bugs)

### Run in watch mode (development)

```bash
npm run test:watch
```

### Generate coverage report

```bash
npm run test:coverage
```

Output: `coverage/` directory  
Open `coverage/index.html` in a browser for the full HTML report.

Coverage thresholds (configured in `vitest.config.js`):
- Lines: 70%
- Functions: 70%
- Branches: 60%
- Statements: 70%

### Frontend coverage thresholds

```bash
npm run test:unit:coverage
```

Output: `coverage/` directory.

Coverage thresholds (configured in `vite.config.js`):
- Lines: 30%
- Functions: 30%
- Branches: 20%
- Statements: 30%

> These thresholds reflect current actual coverage (~30%). Pages and layout components have no unit tests yet. Aspirational targets (75%+) are documented in [`strategy.md`](strategy.md).

### Environment variables for tests

Tests set their own environment variables via `tests/helpers/setup.js` (loaded automatically via `vitest.config.js setupFiles`). You do NOT need a `.env` file to run tests.

```
JWT_SECRET        = test_jwt_secret_vitest_hive_electronics_not_for_production
JWT_REFRESH_TOKEN = test_refresh_secret_vitest_hive_electronics_not_for_production
PORT              = 3001
```

---

## Frontend (`hive-electronics-ecommerce_app/`)

```bash
cd hive-electronics-ecommerce_app
```

### Install dependencies

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because Create React App pins `@babel/core@7` and some devDependencies have newer peer dep requirements.

### Run unit tests (Vitest)

```bash
npm run test:unit
```

Expected: all passing, 2 todo (count grows as new service/page tests are added)

> **Note:** Service tests (`userServices.test.js`, `productServices.test.js`) mock the `apiClient` module via `vi.mock()`. They do NOT require a running backend. No `REACT_APP_API_URL` environment variable is needed for unit tests.

### Run unit tests in watch mode

```bash
npm run test:unit:watch
```

### Generate unit test coverage

```bash
npm run test:unit:coverage
```

Output: `coverage/` directory with HTML, LCOV, and text reports.

### Run Cypress E2E tests (headless)

**Requires all three services to be running first.**

```bash
# Terminal 1 — API server (from hive-electronics-ecommerce_api/)
node server.js

# Terminal 2 — CRA dev server (from hive-electronics-ecommerce_app/)
npm start

# Terminal 3 (wait for both to be available)
npm run test:e2e
```

> **Note:** Cypress tests are currently blocked by FRONTEND-005 (`cy.loginBySession` seeds an invalid token format). Auth-gated specs will fail until that command is updated. See [`known-issues.md`](known-issues.md).

### Open Cypress interactive runner

```bash
# Terminal 1
node ../hive-electronics-ecommerce_api/server.js

# Terminal 2
npm start

# Terminal 3
npm run test:e2e:open
```

This opens the Cypress desktop app. Select "E2E Testing", then choose a spec file to run.

### Run CRA's built-in Jest test runner (not Vitest)

```bash
npm test
```

This runs CRA's default Jest configuration. It will NOT pick up the Vitest test files in `src/__tests__/`. Use `npm run test:unit` for Vitest tests.

---

## Running both suites together

There is no root-level `package.json` linking the two projects. To run all tests sequentially from the root:

```bash
# From hive-electronics-ecommerce_full/

cd hive-electronics-ecommerce_api && npm test
cd ../hive-electronics-ecommerce_app && npm run test:unit
```

For E2E in CI (headless), see the CI/CD workflow in `.github/workflows/ci.yml`.

---

## Interpreting test output

### Backend test result symbols

| Symbol | Meaning |
|---|---|
| `✓` | Test passed |
| `×` | Test failed |
| `→` | Test skipped |

Tests marked with `[BUG-NNN]` in their description assert **current broken behavior** — they pass by confirming the bug exists. When the bug is fixed, these tests must be updated to assert the corrected behavior. See [`known-issues.md`](known-issues.md).

### Frontend test result symbols

| Symbol | Meaning |
|---|---|
| `✓` | Test passed |
| `×` | Test failed |
| `todo` | Placeholder test (`it.todo`) — not run, not counted as failing |

### Cypress result conventions

Cypress spec files in `cypress/e2e/` are organized as:
- `auth/login.cy.js` — TC-E2E-AUTH-001 through -008
- `cart/cart.cy.js` — TC-E2E-CART-001 through -009
- `checkout/checkout.cy.js` — TC-E2E-CHECKOUT-001 through -008

Screenshots on failure: saved to `cypress/screenshots/`  
Videos: disabled by default (`video: false` in `cypress.config.js`)

---

## Troubleshooting

### `npm install` fails with peer dependency errors (frontend)

```bash
npm install --legacy-peer-deps
```

This is expected due to Create React App's pinned `@babel/core@7`.

### Vitest picks up node_modules test files

Vitest is configured with `include: ['src/__tests__/**/*.{test,spec}.{js,jsx}']` in `vite.config.js`. If node_modules tests appear, verify the `include` pattern is set correctly.

### Cypress cannot connect to localhost:3000

The CRA dev server must be running before launching Cypress. Start it with `npm start` and wait for the "Compiled successfully" message before running E2E tests.

### Cypress auth-gated tests fail immediately

`cy.loginBySession()` seeds an incompatible token format — see FRONTEND-005 in [`known-issues.md`](known-issues.md). Update `cypress/support/commands.js` to seed a valid JWT shape or call the real login API.

### Backend tests timeout

The default `testTimeout` is 30 seconds (set in `vitest.config.js`). If MongoMemoryServer is slow to start on first run (downloading binaries), increase `hookTimeout` or pre-download with `MONGOMS_VERSION=7.0.14 npx mongodb-memory-server`.

### Coverage drops below threshold

The backend coverage thresholds will fail `npm run test:coverage` if coverage drops below configured minimums. Files excluded: `src/config/**`. If a new utility file is added without tests, coverage will drop. Add tests before merging.
