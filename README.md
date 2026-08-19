# Hive Electronics

A full-stack ecommerce store for PC components. Customers register an account, browse products by category, add items to a cart, and place an order that is persisted to the store's database. Registered users also manage their own set of shipping addresses and payment methods.

The project is two independent applications in one repository: a REST API built with Express and Mongoose, and a React storefront that consumes it.

---

## Live deployment

| | URL |
|---|---|
| Storefront | https://hive-electronics-ecommerce-storefront.onrender.com |
| API | https://hive-electronics-ecommerce-full.onrender.com |

Both services are hosted on Render; the database is MongoDB Atlas. The API root path returns the plain text `API Ecommerce with MongoDB`.

Interactive API documentation is served at `/api-docs` whenever `NODE_ENV` is not `production`, or when `ENABLE_DOCS=true`. The deployed API runs with docs disabled, so `/api-docs` is only available when running locally.

---

## Table of contents

- [What it does](#what-it-does)
- [Why this stack](#why-this-stack)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Seed data](#seed-data)
- [API reference](#api-reference)
- [Frontend routes](#frontend-routes)
- [Testing](#testing)
- [Continuous integration](#continuous-integration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## What it does

**Accounts.** `POST /api/register` creates a customer account — the password is hashed with bcrypt at 10 salt rounds, and the role is forced to `customer` regardless of what the request body contains. `POST /api/login` verifies the password and returns an access token (1 hour) and a refresh token (7 days). The access token payload carries `userId`, `name`, and `role`.

**Catalog.** Products belong to a category, and categories nest through a self-referencing `parentCategory` field, so `Electronics` can be the parent of `Laptops`, `Audio`, and so on. Products can be listed, fetched by ID, or searched.

**Cart.** Guests get a cart held in `localStorage` under the key `cart`. Once a user is logged in, the cart is persisted server-side through `/api/carts/*` and keyed to their user ID. Both paths run through the same `CartContext`, so the UI does not change between them.

**Checkout.** A protected route. The customer picks one of their saved shipping addresses and a payment method, then places the order.

**Orders.** `POST /api/orders` computes the money server-side: it sums `price × quantity` across the line items, applies a 16% IVA to that subtotal, and stores `taxAmount`, `shippingCost`, and the resulting `totalPrice`. Every order carries a `status` (`pending` → `processing` → `shipped` → `delivered`, or `cancelled`) and a separate `paymentStatus` (`pending`, `paid`, `failed`, `refunded`).

**Saved addresses and payment methods.** Full create/read/update/delete per user, including a `defaultAddress` and `isDefault` flag so one of each can be marked as the default.

**Admin role.** Users have a role of either `customer` or `admin`. Admin-only routes are gated by middleware that runs after authentication and rejects anything without `role === "admin"`.

**Observability.** Every request is assigned a request ID (reusing an inbound `X-Request-Id` header if present), echoed back on the response, and logged on completion with method, URL, status, duration, and user ID. Errors are logged with the same request ID and returned to the client alongside it, so a user-visible error can be traced to a specific log line. In production, 5xx messages are replaced with a generic string so internal detail is never exposed.

---

## Why this stack

### React — frontend

**The main reason React was chosen was the reusability of components.** Components can be reused across different parts of the application, which speeds up development and reduces code duplication.

Beyond that:

- **Component-based architecture.** React allows developers to build encapsulated components that manage their own state, which can then be composed to create complex user interfaces. This modular approach enhances code reusability and maintainability.
- **Efficiency.** React's virtual DOM and one-way data binding ensure that updates are efficient and predictable, which makes it easier to debug and manage application state.

In this codebase, that reuse lives in [`src/components/common/`](hive-electronics-ecommerce_app/src/components/common/) — `Button`, `Input`, `Badge`, `Icon`, `Loading`, `ErrorMessage`, and `ErrorFallback`, each exported through a barrel `index.js` and composed into the pages.

### JavaScript — backend

**The main reason JavaScript was chosen was its large ecosystem.** JavaScript is a well-documented programming language with access to a large suite of libraries.

It also **integrates much more easily with the React components of the frontend** — one language spans both halves of the project, so there is no context switch between writing the API and writing the UI that consumes it.

### MongoDB — database

**The main reason MongoDB was chosen was the way it stores data.** All entries are stored as JSON objects, which integrate very well with the rest of the program, since it is running on JavaScript.

MongoDB is also **widely used** — a large developer base means it is well documented.

### Render — hosting

**The main reason Render was chosen to host all the components online was its popularity.** It is a service used by many developers and offers a lot of conveniences for hosting projects online.

Both the API and the storefront are deployed there.

---

## Technologies

### Backend — `hive-electronics-ecommerce_api`

ES modules throughout (`"type": "module"`).

| Package | Version | Role |
|---|---|---|
| express | ^5.2.1 | HTTP server and routing |
| mongoose | ^9.4.1 | MongoDB object modeling |
| bcrypt | ^6.0.0 | Password hashing |
| jsonwebtoken | ^9.0.3 | Access and refresh token signing/verification |
| express-validator | ^7.3.2 | Request body and param validation |
| cors | ^2.8.6 | Cross-origin request handling |
| dotenv | ^17.4.2 | Environment variable loading |
| swagger-jsdoc | ^6.3.0 | OpenAPI spec generated from JSDoc comments |
| swagger-ui-express | ^5.0.1 | Serves the interactive docs at `/api-docs` |

Dev: vitest ^4.1.9, @vitest/coverage-v8 ^4.1.9, supertest ^7.2.2, mongodb-memory-server ^11.2.0, nodemon ^3.1.14.

### Frontend — `hive-electronics-ecommerce_app`

| Package | Version | Role |
|---|---|---|
| react / react-dom | ^19.2.0 | UI library |
| react-router-dom | ^7.9.6 | Client-side routing |
| react-error-boundary | ^6.1.3 | Error boundaries at the root and around routes |
| react-scripts | 5.0.1 | Create React App build tooling |
| web-vitals | ^2.1.4 | Performance metric reporting |

Dev: vite ^8.1.3, @vitejs/plugin-react ^6.0.0, vitest ^4.1.9, @vitest/coverage-v8 ^4.1.9, cypress ^15.18.0, jsdom ^29.1.1, source-map-explorer ^2.5.3, plus Testing Library (`@testing-library/react` ^16.3.0, `@testing-library/user-event` ^13.5.0, `@testing-library/jest-dom` ^6.9.1).

### Infrastructure

MongoDB Atlas (production) or a local MongoDB instance (development) · Render · GitHub Actions.

---

## Architecture

The storefront is a single-page app. Every network call goes through one module, `src/services/apiClient.js`, which reads the API base URL from `REACT_APP_API_URL`, attaches `Authorization: Bearer <token>` from `localStorage`, caches GET responses in memory for 60 seconds, and redirects to `/login` if the API ever answers `401`. The API mounts every route under `/api`, validates input before it reaches a controller, and persists through Mongoose models.

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  React 19 SPA (CRA)         │         │  Express 5 API               │
│                             │         │                              │
│  pages/ ── components/      │  HTTPS  │  requestLogger → cors → json │
│      │                      │ ──────► │      │                       │
│  context/CartContext        │  Bearer │  /api routes                 │
│      │                      │  token  │      │                       │
│  services/apiClient ────────┼─────────┼─►  validation → controller   │
│      (fetch, 60s GET cache) │         │      │                       │
└─────────────────────────────┘         │  Mongoose models             │
                                        └──────────┬───────────────────┘
                                                   │
                                            ┌──────▼───────┐
                                            │   MongoDB    │
                                            └──────────────┘
```

Repository layout:

```
hive-electronics-ecommerce_full/
├── hive-electronics-ecommerce_api/   Express + Mongoose REST API
├── hive-electronics-ecommerce_app/   React 19 storefront
├── docs/
│   ├── skills/                       reference material on practices
│   └── testing/                      strategy, matrix, known issues
├── .github/workflows/ci.yml          5-job CI pipeline
└── CLAUDE.md                         full internal code reference
```

---

## Getting started

### Prerequisites

- **Node.js 20** (the version CI runs on) and npm
- **MongoDB** — either a local instance or a MongoDB Atlas connection string

### 1. Clone

```bash
git clone https://github.com/DabirGomezSerna/hive-electronics-ecommerce_full.git
cd hive-electronics-ecommerce_full
```

### 2. Start the API

```bash
cd hive-electronics-ecommerce_api
npm install
cp .env.example .env      # then fill in JWT_SECRET and JWT_REFRESH_TOKEN
npm run seed              # optional: populate categories, products, and 3 users
npm run dev               # nodemon; use `npm start` for a plain node process
```

### 3. Start the storefront

In a second terminal:

```bash
cd hive-electronics-ecommerce_app
npm install --legacy-peer-deps
cp .env.example .env
npm start
```

The storefront runs at `http://localhost:3000` and the API at `http://localhost:4000`.

> **Set `PORT` in the API's `.env`.** `.env.example` sets `PORT=4000`, which is what the storefront's `REACT_APP_API_URL` points at. If `PORT` is left unset the API falls back to `3000` — the same port Create React App serves the frontend on, so the two will collide.

---

## Environment variables

### API (`hive-electronics-ecommerce_api/.env`)

| Variable | Required | Default | Read in |
|---|---|---|---|
| `PORT` | no | `3000` | `server.js` |
| `MONGODB_URI` | no | `mongodb://localhost:27017/hiveElectronicsDB` | `src/config/db.conf.js` |
| `JWT_SECRET` | **yes** | — | `src/controllers/authController.js`, `src/middleware/authMiddleware.js` |
| `JWT_REFRESH_TOKEN` | **yes** | — | `src/controllers/authController.js` |
| `CORS_ORIGIN` | no | `http://localhost:3000` | `src/app.js` — comma-separated list of allowed origins |
| `NODE_ENV` | no | — | docs gating, log level, 5xx message masking |
| `ENABLE_DOCS` | no | — | `src/app.js` — set to `true` to expose `/api-docs` in production |
| `LOG_LEVEL` | no | `info` in production, `debug` otherwise, `silent` under test | `src/config/logger.js` — one of `silent`, `error`, `warn`, `info`, `debug` |
| `SEED_ALLOW_RESET` | no | — | `scripts/seed.js` — set to `true` to allow a destructive reset |

`.env.example` also lists `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN`. No code reads them — the `1h` and `7d` lifetimes are set directly in `authController.js`.

### Storefront (`hive-electronics-ecommerce_app/.env`)

| Variable | Required | Default | Read in |
|---|---|---|---|
| `REACT_APP_API_URL` | **yes** | — | `src/services/apiClient.js` — include the `/api` suffix, e.g. `http://localhost:4000/api` |
| `REACT_APP_LOG_LEVEL` | no | `error` in production, `silent` under test, `debug` otherwise | `src/services/logger.js` — one of `silent`, `error`, `warn`, `info`, `debug` |

---

## Seed data

```bash
cd hive-electronics-ecommerce_api
npm run seed
```

The script is idempotent — it checks for each record before inserting, so running it twice does not duplicate anything. A destructive reset is opt-in and requires `SEED_ALLOW_RESET=true`; even then it only clears products, categories, and users, leaving carts, orders, addresses, and payment methods alone.

It creates one parent category (`Electronics`) with four children (`Laptops`, `Smartphones`, `Audio`, `Accessories`), eight products, and three accounts:

| Email | Password | Role |
|---|---|---|
| `admin@hiveelectronics.com` | `Admin1234!` | admin |
| `john.doe@example.com` | `Customer1234!` | customer |
| `jane.smith@example.com` | `Customer1234!` | customer |

These are development credentials for a locally seeded database.

---

## API reference

All routes are mounted under `/api`. **Auth** means a valid JWT is required; **Admin** additionally requires `role === "admin"`.

Send the token as `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| POST | `/api/register` | — | — |
| POST | `/api/login` | — | — |

### Products

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| GET | `/api/products/search` | — | — |
| GET | `/api/products` | — | — |
| GET | `/api/products/:id` | — | — |
| POST | `/api/products` | ✓ | ✓ |
| PUT | `/api/products/:id` | ✓ | ✓ |
| DELETE | `/api/products/:id` | ✓ | ✓ |

### Categories

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| GET | `/api/categories` | — | — |
| GET | `/api/categories/:id` | — | — |
| POST | `/api/categories` | ✓ | ✓ |
| PUT | `/api/categories/:id` | ✓ | ✓ |
| DELETE | `/api/categories/:id` | ✓ | ✓ |

### Users

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| GET | `/api/users/search` | ✓ | ✓ |
| GET | `/api/users` | ✓ | ✓ |
| GET | `/api/users/:id` | ✓ | ✓ |
| POST | `/api/users` | — | — |
| PUT | `/api/users/:id` | ✓ | — |
| DELETE | `/api/users/:id` | ✓ | ✓ |

### Shipping addresses

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| GET | `/api/addresses` | ✓ | ✓ |
| GET | `/api/addresses/user/:id` | ✓ | — |
| GET | `/api/addresses/:id` | ✓ | ✓ |
| POST | `/api/addresses` | ✓ | — |
| PUT | `/api/addresses/:id` | ✓ | — |
| DELETE | `/api/addresses/:id` | ✓ | — |

### Carts

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| GET | `/api/carts` | ✓ | ✓ |
| GET | `/api/carts/:id` | ✓ | ✓ |
| GET | `/api/carts/user/:id` | ✓ | — |
| POST | `/api/carts` | ✓ | — |
| POST | `/api/carts/addToCart` | ✓ | — |
| POST | `/api/carts/removeFromCart` | ✓ | — |
| PUT | `/api/carts/:id` | ✓ | — |
| DELETE | `/api/carts/:id` | ✓ | — |

### Payment methods

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| GET | `/api/payment-methods` | ✓ | ✓ |
| GET | `/api/payment-methods/user/:id` | ✓ | — |
| GET | `/api/payment-methods/:id` | ✓ | ✓ |
| POST | `/api/payment-methods` | ✓ | — |
| PUT | `/api/payment-methods/:id` | ✓ | — |
| DELETE | `/api/payment-methods/:id` | ✓ | — |

### Orders

| Method | Path | Auth | Admin |
|---|---|:--:|:--:|
| GET | `/api/orders` | ✓ | ✓ |
| GET | `/api/orders/:id` | ✓ | — |
| GET | `/api/orders/user/:id` | ✓ | — |
| POST | `/api/orders` | ✓ | — |
| PUT | `/api/orders/:id` | ✓ | — |

### Shared response shapes

| Status | Body | When |
|---|---|---|
| `401` | `{ "message": "Unauthorized" }` | No token supplied |
| `401` | `{ "message": "Invalid or expired token" }` | Token failed verification |
| `403` | `{ "message": "Admin access required" }` | Valid token, non-admin role |
| `404` | `{ "error": "Route not found", "method": "...", "url": "..." }` | Unmatched path |
| `422` | `{ "errors": [ ... ] }` | express-validator rejected the request |
| `4xx` / `5xx` | `{ "message": "...", "requestId": "..." }` | Error handler; 5xx messages are masked in production |

The full interactive specification, including request and response schemas, is generated from JSDoc annotations on the route files and served at `/api-docs` on a local run (`/api-docs.json` for the raw OpenAPI document).

---

## Frontend routes

| Path | Page | Protected |
|---|---|:--:|
| `/` | Home | — |
| `/cart` | Cart | — |
| `/login` | Login | — |
| `/register` | Signup | — |
| `/product/:productId` | Product details | — |
| `/category/:categoryId` | Category listing | — |
| `/checkout` | Checkout | ✓ |
| `/order-confirmation` | Order confirmation | ✓ |
| `*` | "Page not available" | — |

Every route except `/` is code-split with `React.lazy` behind a `<Suspense>` fallback, and the whole route tree sits inside an error boundary so a render failure in one page does not blank the app. Protected routes redirect to `/login` when no auth token is present.

---

## Testing

| Suite | Command | Directory |
|---|---|---|
| Backend unit | `npm run test:unit` | `hive-electronics-ecommerce_api` |
| Backend integration | `npm run test:integration` | `hive-electronics-ecommerce_api` |
| Backend coverage | `npm run test:coverage` | `hive-electronics-ecommerce_api` |
| Backend watch | `npm run test:watch` | `hive-electronics-ecommerce_api` |
| Frontend unit | `npm run test:unit` | `hive-electronics-ecommerce_app` |
| Frontend watch | `npm run test:unit:watch` | `hive-electronics-ecommerce_app` |
| Frontend coverage | `npm run test:unit:coverage` | `hive-electronics-ecommerce_app` |
| End-to-end | `npm run test:e2e` / `npm run test:e2e:open` | `hive-electronics-ecommerce_app` |

**Backend** — 25 Vitest files: 12 integration suites that drive the real Express app through Supertest, and 13 unit suites covering middleware and model schemas. Integration tests run against `mongodb-memory-server`, so no MongoDB instance needs to be running. Coverage thresholds are 70% lines, 70% functions, 60% branches, 70% statements.

**Frontend** — 41 Vitest + Testing Library specs under `src/__tests__/`, covering components, pages, layout, context, and services. Coverage thresholds are 30% lines, 30% functions, 20% branches, 30% statements.

**End-to-end** — 4 Cypress specs covering login, signup, cart, and checkout. These drive the real UI, so both the storefront and the API need to be running.

Detailed testing documentation lives in [`docs/testing/`](docs/testing/) — strategy, per-module test matrix, test data approach, and the known-issues register.

---

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on Node 20, on every push to `main` or `develop` and every pull request into `main`. In-progress runs are cancelled when a branch is pushed again.

```
backend-unit ─────► backend-integration ─┐
                         (+ coverage)     ├─► e2e
frontend-unit ────► frontend-build ──────┘
   (+ coverage)
```

Coverage reports from both integration and frontend jobs are uploaded as artifacts with 7-day retention; Cypress screenshots are uploaded when the E2E job fails.

---

## Deployment

Both services run on Render, with the database on MongoDB Atlas. **No deployment configuration is committed to the repository** — there is no `render.yaml`, `Dockerfile`, or `Procfile`, so both services are configured through the Render dashboard.

**API service**

| Setting | Value |
|---|---|
| Root directory | `hive-electronics-ecommerce_api` |
| Build command | `npm install` |
| Start command | `npm start` |
| Required env | `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_TOKEN`, `CORS_ORIGIN` |

`CORS_ORIGIN` must include the deployed storefront's origin, or the browser will block every request from it.

**Storefront (static site)**

| Setting | Value |
|---|---|
| Root directory | `hive-electronics-ecommerce_app` |
| Build command | `npm install --legacy-peer-deps && npm run build` |
| Publish directory | `build` |
| Required env | `REACT_APP_API_URL` |

`REACT_APP_API_URL` has to be set **at build time** — Create React App inlines `REACT_APP_*` values into the bundle, so changing it afterwards requires a rebuild, not a restart.

---

## Contributing

Every change starts on its own branch, cut fresh from an up-to-date `origin/main`. Nothing is committed directly to `main`.

```bash
git fetch origin
git switch -c <prefix>/<slug> origin/main
```

| Prefix | Use for | Commit type |
|---|---|---|
| `feature/` | New user-facing functionality or endpoints | `feat` |
| `fix/` | Bug fix in existing behavior | `fix` |
| `hotfix/` | Urgent break on `main` | `fix` |
| `ui/` | Visual, styling, layout, copy | `style` |
| `refactor/` | Restructuring with no behavior change | `refactor` |
| `test/` | Adding or repairing tests only | `test` |
| `docs/` | README, docs, OpenAPI comments | `docs` |
| `chore/` | Dependencies, config, tooling, CI | `chore` / `ci` |

Slugs are lowercase kebab-case, two to five words, describing the outcome rather than the file touched — `fix/payment-method-update-crash`, not `fix/paymentcontroller`. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). Work merges into `main` through a pull request.

The full internal reference — directory structure, model definitions, validator inventory, and the code patterns each layer follows — is in [CLAUDE.md](CLAUDE.md).

---

## License

MIT — see [LICENSE](hive-electronics-ecommerce_app/LICENSE).
