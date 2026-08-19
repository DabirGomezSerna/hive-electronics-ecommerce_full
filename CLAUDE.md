# hive-electronics-ecommerce_full

This repository contains two separately-installed projects:

- `hive-electronics-ecommerce_api/` — Express + Mongoose backend (ESM, `"type": "module"`)
- `hive-electronics-ecommerce_app/` — React 19 frontend (Create React App, `react-scripts`)

Both are tracked in this single git repository (since commit `e4e2933`) and share one CI pipeline at `.github/workflows/ci.yml`. There is no shared package or monorepo tooling — each folder has its own `package.json` and its own `node_modules`, and dependencies are installed per folder.

The frontend consumes the backend over HTTP. It reads its base URL from `REACT_APP_API_URL` and every call goes through `src/services/apiClient.js`.

---

## 1. Directory structure (`src/` only)

### `hive-electronics-ecommerce_api/src/`

```
src/
├── app.js
├── config/
│   ├── db.conf.js
│   ├── logger.js
│   ├── swagger.js
│   └── swaggerComponents.js
├── controllers/
│   ├── authController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── orderController.js
│   ├── paymentMethodController.js
│   ├── productController.js
│   ├── shippingAddressController.js
│   └── userController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── isAdminMiddleware.js
│   ├── requestLogger.js
│   └── validation.js
├── models/
│   ├── Cart.js
│   ├── Category.js
│   ├── Order.js
│   ├── PaymentMethod.js
│   ├── Product.js
│   ├── ShippingAddress.js
│   └── User.js
└── routes/
    ├── authRoutes.js
    ├── cartRoutes.js
    ├── categoryRoutes.js
    ├── index.js
    ├── orderRoutes.js
    ├── paymentMethodRoutes.js
    ├── productRoutes.js
    ├── shippingAddressRoutes.js
    └── userRoutes.js
```

`server.js` at the project root is the entry point: it loads dotenv, builds the app via `createApp()` from `src/app.js`, connects to MongoDB, listens on `process.env.PORT || 3000`, and registers SIGTERM/SIGINT/`unhandledRejection`/`uncaughtException` handlers for graceful shutdown. `src/app.js` exports the `createApp()` factory, which is what the integration tests import — they never start a listener.

### `hive-electronics-ecommerce_app/src/`

```
src/
├── components/
│   ├── App/
│   │   ├── App.css
│   │   └── App.jsx
│   ├── Cart/
│   │   └── CartView.jsx
│   ├── CategoryDetails/
│   │   ├── CategoryDetails.css
│   │   └── CategoryDetails.jsx
│   ├── Checkout/
│   │   ├── Address/
│   │   │   ├── AddressForm.css
│   │   │   ├── AddressForm.jsx
│   │   │   ├── AddressItem.css
│   │   │   ├── AddressItem.jsx
│   │   │   ├── AddressList.css
│   │   │   └── AddressList.jsx
│   │   ├── PaymentMethod/
│   │   │   ├── PaymentMethodForm.css
│   │   │   ├── PaymentMethodForm.jsx
│   │   │   ├── PaymentMethodItem.css
│   │   │   ├── PaymentMethodItem.jsx
│   │   │   ├── PaymentMethodList.css
│   │   │   └── PaymentMethodList.jsx
│   │   └── SummarySection/
│   │       ├── SummarySection.css
│   │       └── SummarySection.jsx
│   ├── List/
│   │   ├── List.css
│   │   └── List.jsx
│   ├── LoginForm/
│   │   ├── LoginForm.css
│   │   └── LoginForm.jsx
│   ├── ProductCard/
│   │   ├── ProductCard.css
│   │   └── ProductCard.jsx
│   ├── ProductDetails/
│   │   ├── ProductDetails.css
│   │   └── ProductDetails.jsx
│   ├── SignupForm/
│   │   ├── SignupForm.css
│   │   └── SignupForm.jsx
│   └── common/
│       ├── Badge/
│       │   ├── Badge.css
│       │   ├── Badge.jsx
│       │   └── index.js
│       ├── Button/
│       │   ├── Button.css
│       │   ├── Button.jsx
│       │   └── index.js
│       ├── ErrorFallback/
│       │   ├── ErrorFallback.css
│       │   ├── ErrorFallback.jsx
│       │   ├── RouteErrorBoundary.jsx
│       │   └── index.js
│       ├── ErrorMessage/
│       │   ├── ErrorMessage.css
│       │   └── ErrorMessage.jsx
│       ├── Icon/
│       │   ├── Icon.css
│       │   ├── Icon.jsx
│       │   └── index.js
│       ├── Input/
│       │   ├── Input.css
│       │   ├── Input.jsx
│       │   └── index.js
│       └── Loading/
│           ├── Loading.css
│           └── Loading.jsx
├── config/
│   └── pricing.js
├── context/
│   └── CartContext.jsx
├── data/
│   ├── categories.json
│   ├── products.json
│   ├── shippingAddress.json
│   └── users.json
├── index.css
├── index.js
├── layout/
│   ├── Footer/
│   │   ├── Footer.css
│   │   └── Footer.jsx
│   ├── Header/
│   │   ├── Header.css
│   │   └── Header.jsx
│   ├── Layout.css
│   ├── Layout.jsx
│   └── Navigation/
│       ├── Navigation.css
│       └── Navigation.jsx
├── logo.svg
├── pages/
│   ├── Cart/
│   │   ├── Cart.css
│   │   └── Cart.jsx
│   ├── CategoryPage.jsx
│   ├── Checkout/
│   │   ├── Checkout.css
│   │   └── Checkout.jsx
│   ├── Home/
│   │   ├── Home.css
│   │   └── Home.jsx
│   ├── Login/
│   │   └── Login.jsx
│   ├── Order/
│   │   ├── Order.css
│   │   └── Order.jsx
│   ├── Product.jsx
│   ├── ProtectedRoute.jsx
│   └── Signup/
│       └── Signup.jsx
├── reportWebVitals.js
├── services/
│   ├── apiClient.js
│   ├── categoryServices.js
│   ├── logger.js
│   ├── orderServices.js
│   ├── paymentServices.js
│   ├── productServices.js
│   ├── shippingServices.js
│   └── userServices.js
└── setupTests.js
```

Unit and integration specs live outside this tree in `src/__tests__/` (41 files, mirroring `components/`, `pages/`, `services/`, `layout/`, `context/`). Cypress specs live in `cypress/e2e/`.

The four files in `src/data/` are leftovers from the pre-API version of the app. Only `categories.json` is still imported by application code (`components/ProductDetails/ProductDetails.jsx`, as a category-name lookup fallback); `products.json`, `users.json`, and `shippingAddress.json` are unreferenced.

---

## 2. API route map

Base mount: `src/app.js` registers `app.use("/api", routes)`, and `src/routes/index.js` mounts every route file with no extra prefix. Full paths below include the `/api` prefix.

`authMiddleware` = valid JWT required. `isAdmin` = `authMiddleware` **and** `req.user.role === "admin"`.

| Method | Path | Auth | Admin | Controller |
|---|---|---|---|---|
| POST | `/api/register` | No | No | `authController.register` |
| POST | `/api/login` | No | No | `authController.login` |
| GET | `/api/products/search` | No | No | `productController.searchProducts` |
| GET | `/api/products` | No | No | `productController.getProduct` |
| GET | `/api/products/:id` | No | No | `productController.getProductById` |
| POST | `/api/products` | Yes | Yes | `productController.createProduct` |
| PUT | `/api/products/:id` | Yes | Yes | `productController.updateProduct` |
| DELETE | `/api/products/:id` | Yes | Yes | `productController.deleteProduct` |
| GET | `/api/users/search` | Yes | Yes | `userController.searchUsers` |
| GET | `/api/users` | Yes | Yes | `userController.getUsers` |
| GET | `/api/users/:id` | Yes | Yes | `userController.getUserById` |
| POST | `/api/users` | No | No | `userController.createUser` |
| PUT | `/api/users/:id` | Yes | No | `userController.updateUser` |
| DELETE | `/api/users/:id` | Yes | Yes | `userController.deleteUser` |
| GET | `/api/categories` | No | No | `categoryController.getCategories` |
| GET | `/api/categories/:id` | No | No | `categoryController.getCategoryById` |
| POST | `/api/categories` | Yes | Yes | `categoryController.createCategory` |
| PUT | `/api/categories/:id` | Yes | Yes | `categoryController.updateCategory` |
| DELETE | `/api/categories/:id` | Yes | Yes | `categoryController.deleteCategory` |
| GET | `/api/addresses` | Yes | Yes | `shippingAddressController.getShippingAddresses` |
| GET | `/api/addresses/user/:id` | Yes | No | `shippingAddressController.getShippingAddressesByUser` |
| GET | `/api/addresses/:id` | Yes | Yes | `shippingAddressController.getShippingAddressById` |
| POST | `/api/addresses` | Yes | No | `shippingAddressController.createShippingAddress` |
| PUT | `/api/addresses/:id` | Yes | No | `shippingAddressController.updateShippingAddress` |
| DELETE | `/api/addresses/:id` | Yes | No | `shippingAddressController.deleteShippingAddress` |
| GET | `/api/carts` | Yes | Yes | `cartController.getCarts` |
| GET | `/api/carts/:id` | Yes | Yes | `cartController.getCartById` |
| GET | `/api/carts/user/:id` | Yes | No | `cartController.getCartByUser` |
| POST | `/api/carts` | Yes | No | `cartController.createCart` |
| POST | `/api/carts/addToCart` | Yes | No | `cartController.addProductToCart` |
| POST | `/api/carts/removeFromCart` | Yes | No | `cartController.removeProductFromCart` |
| PUT | `/api/carts/:id` | Yes | No | `cartController.updateCart` |
| DELETE | `/api/carts/:id` | Yes | No | `cartController.deleteCart` |
| GET | `/api/payment-methods` | Yes | Yes | `paymentMethodController.getPaymentMethods` |
| GET | `/api/payment-methods/user/:id` | Yes | No | `paymentMethodController.getPaymentMethodsByUser` |
| GET | `/api/payment-methods/:id` | Yes | Yes | `paymentMethodController.getPaymentMethodById` |
| POST | `/api/payment-methods` | Yes | No | `paymentMethodController.createPaymentMethod` |
| PUT | `/api/payment-methods/:id` | Yes | No | `paymentMethodController.updatePaymentMethod` |
| DELETE | `/api/payment-methods/:id` | Yes | No | `paymentMethodController.deletePaymentMethod` |
| GET | `/api/orders` | Yes | Yes | `orderController.getOrders` |
| GET | `/api/orders/:id` | Yes | No | `orderController.getOrderById` |
| GET | `/api/orders/user/:id` | Yes | No | `orderController.getOrderByUser` |
| POST | `/api/orders` | Yes | No | `orderController.createOrder` |
| PUT | `/api/orders/:id` | Yes | No | `orderController.updateOrderStatus` |

Mount order in `src/routes/index.js`: `authRoutes`, `productRoutes`, `userRoutes`, `categoryRoutes`, `shippingAddressRoutes` (imported as `shippingRoutes`), `cartRoutes`, `paymentMethodRoutes`, `orderRoutes`.

Both handlers are registered in `src/app.js` (not `server.js`) after the `/api` routes:

- A catch-all 404 handler returning `{ error, method, url }`.
- `middleware/errorHandler.js` as the final 4-argument error handler. It logs the failure with the request ID, delegates to Express's default handler when `res.headersSent` is already true, and otherwise responds `{ message, requestId }`. In production, 5xx messages are replaced with `"Internal server error"` so internal detail (Mongoose `CastError` paths, driver errors) is never exposed; 4xx messages pass through unchanged.

Swagger UI is mounted at `/api-docs` (raw spec at `/api-docs.json`) when `process.env.NODE_ENV !== "production" || process.env.ENABLE_DOCS === "true"`.

`middleware/requestLogger.js` runs before `express.json()`. It assigns `req.id` from an inbound `X-Request-Id` header or a fresh `randomUUID()`, echoes it on the response, and logs method, URL, status, duration, and `req.user?.userId` when the response finishes.

---

## 3. Mongoose models

### `User` (`models/User.js`) — model name `"User"`
- `displayName: String, required, trim`
- `email: String, required, unique, trim, lowercase`
- `password: String, required`
- `role: String, enum ["customer", "admin"], default "customer"`
- `avatar: String, default <jsdelivr faker avatar URL>`
- `isActive: Boolean, default true`
- `{ timestamps: true }`

### `Product` (`models/Product.js`) — model name `"Product"`
- `name: String, required, trim`
- `description: String, trim`
- `price: Number, required, default 0, min 0`
- `stock: Number, required, default 0, min 0`
- `image: Array, default "https://placeholder.com/800x600"`
- `category: ObjectId, ref "Category", required`
- `{ timestamps: true }`

### `Category` (`models/Category.js`) — model name `"Category"`
- `name: String, required, trim`
- `description: String, trim`
- `imageUrl: String, default "https://placeholder.com/800x600"`
- `parentCategory: ObjectId, ref "Category", default null`
- `{ timestamps: true }`

### `Cart` (`models/Cart.js`) — model name `"Cart"`
- `user: ObjectId, ref "User", required`
- `products: [{ product: ObjectId ref "Product" required, quantity: Number required min 1 }]`
- `{ timestamps: true }`

### `Order` (`models/Order.js`) — model name `"Order"`
- `user: ObjectId, ref "User", required`
- `products: [{ product: ObjectId ref "Product" required, quantity: Number required min 1, price: Number required }]`
- `address: ObjectId, ref "shippingAddress"`
- `paymentMethod: ObjectId, ref "paymentMethod"`
- `shippingCost: Number, required, default 0, min 0`
- `taxAmount: Number, required, default 0, min 0` — 16% IVA on product subtotal only (not on shipping); computed server-side in `createOrder`
- `totalPrice: Number, required` — subtotal + taxAmount + shippingCost; computed server-side
- `status: String, enum ["pending","processing","shipped","delivered","cancelled"], default "pending"`
- `paymentStatus: String, enum ["pending","paid","failed","refunded"], default "pending"`
- `{ timestamps: true }`

### `PaymentMethod` (`models/PaymentMethod.js`) — model name `"paymentMethod"` (lowercase first letter)
- `user: ObjectId, ref "User", required`
- `type: String, required, enum ["credit_card","debit_card","paypal","bank_transfer","cash_on_delivery"]`
- `cardNumber: String, max 16`
- `cardHolderName: String, trim`
- `expiryDate: String`
- `paypalEmail: String`
- `bankName: String`
- `accountNumber: String`
- `isDefault: Boolean, default false`
- `isActive: Boolean, default true`
- `cvv: String`
- `{ timestamps: true }`

### `ShippingAddress` (`models/ShippingAddress.js`) — model name `"shippingAddress"` (lowercase first letter)
- `user: ObjectId, ref "User", required`
- `name: String, trim`
- `address1: String, required, trim`
- `address2: String, trim`
- `postalCode: String, required, trim`
- `city: String, required, trim`
- `country: String, required, trim`
- `reference: String, trim`
- `defaultAddress: Boolean, default false`
- `{ timestamps: true }`

---

## 4. Validators (express-validator), listed by file

`middleware/validation.js` exports a single `validate` middleware used after every validation array — it calls `validationResult(req)` and returns `422` with `{ errors: errors.array() }` if invalid.

- **`routes/cartRoutes.js`**: `cartIdValidation`, `userIdValidation`, `modCartValidation`, `createCartValidation`, `putCartValidation`
- **`routes/categoryRoutes.js`**: `categoryIdValidation`, `createCategoryValidation`, `updateCategoryValidation`
- **`routes/orderRoutes.js`**: `orderIdValidation`, `userIdValidation`, `createOrderValidation`, `updateOrderStatusValidation`
- **`routes/paymentMethodRoutes.js`**: `paymentIdValidation`, `createPaymentValidation`, `updatePaymentValidation`
- **`routes/productRoutes.js`**: `productIdValidation`, `createProductValidation`, `updateProductValidation`
- **`routes/shippingAddressRoutes.js`**: `addressIdValidation`, `createAddressValidation`, `updateAddressValidation`
- **`routes/userRoutes.js`**: `userIdValidation`, `createUserValidation`, `updateUserValidation`
- **`routes/authRoutes.js`**: none

---

## 5. Exact code patterns used

### Backend — controller pattern (`controllers/*.js`)

Every handler is an exported `async (req, res, next)` function with a single `try { ... } catch (error) { next(error); }` block. Named exports are listed in an `export { a, b, c }` block at the end of the file.

```js
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate({ ... });
    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      res.status(200).json(product);
    }
  } catch (error) {
    next(error);
  }
};

export { getProduct, getProductById, ... };
```

### Backend — route pattern (`routes/*.js`)

Each route file: imports `express`, `{ body, param }` from `express-validator`, the controller functions, `validate` from `../middleware/validation.js`, `authMiddleware`, and `isAdmin`. Validation arrays are declared as `const xxxValidation = [ body(...)..., param(...)... ]` constants, then routes are registered with middleware chained in this fixed order:

```js
router.get("/products/:id", productIdValidation, validate, getProductById);

router.post(
  "/products",
  authMiddleware,
  isAdmin,
  createProductValidation,
  validate,
  createProduct,
);
```

Order is always: `authMiddleware` → `isAdmin` (if required) → validation array(s) → `validate` → controller.

### Backend — model pattern (`models/*.js`)

```js
import mongoose from "mongoose";

const xSchema = new mongoose.Schema(
  { /* fields */ },
  { timestamps: true },
);

const X = mongoose.model("X", xSchema);

export default X;
```

### Backend — module system

ESM throughout (`"type": "module"` in `package.json`), `import`/`export` syntax, no `require`.

### Frontend — page/component pattern

Function components using hooks (`useState`, `useEffect`), default export, one folder per component containing a `.jsx` and a same-named `.css` file imported as `import "./ComponentName.css"`. Pages that take a route param read it with `useParams()` and delegate to a presentational component, e.g.:

```jsx
import { useParams } from "react-router-dom";
import ProductDetails from "../components/ProductDetails/ProductDetails";

export default function Product() {
  const { productId } = useParams();
  return <ProductDetails productId={productId} />;
}
```

### Frontend — `common/` barrel pattern

Each component under `components/common/` has an `index.js` re-export:

```js
export { default } from './Button';
```

### Frontend — service pattern (`services/*.js`)

Every service calls the real API through the shared `apiClient` module. No service reads from `data/`, and none simulates latency with `setTimeout`.

```js
import apiClient from './apiClient';

export const fetchProducts = async () => {
  return apiClient('/products');
};
```

`services/apiClient.js` is the single network chokepoint. It:

- reads the base URL from `process.env.REACT_APP_API_URL`,
- caches GET responses in an in-memory `Map` for 60 seconds (`GET_CACHE_TTL_MS`), cleared by the exported `clearApiCache()`,
- sends `Content-Type: application/json` and, when `localStorage.authToken` exists, `Authorization: Bearer <token>`,
- returns `null` for `204`,
- on `401`, clears `authToken` / `refreshToken` / `userData` and redirects to `/login`,
- throws an `ApiError` (exported class, carrying `status`, `path`, `method`, `body`) on network failure or a non-OK response.

### Frontend — data-fetch-in-component pattern

Components that load data hold `loading`/`error`/data state and call the service inside `useEffect`, rendering `Loading` / `ErrorMessage` / content based on that state:

```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      setError("Products didn't load. Try again later.");
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
```

### Frontend — global state pattern

`context/CartContext.jsx` creates **two** contexts and one provider:

- `useCart()` — `{ cartItems, total, addToCart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice }`
- `useCartActions()` — `{ addToCart }` only, so components that merely add to the cart do not re-render when its contents change

Both hooks throw if used outside `CartProvider`.

Persistence depends on auth state, decided by `getCurrentUser()`:

- **Guest** — cart hydrates from and syncs to `localStorage` under the key `cart`.
- **Authenticated** — cart loads from `GET /carts/user/:userId` and mutates through `POST /carts/addToCart`, `PUT /carts/:cartId`, and `DELETE /carts/:cartId`. Nothing is written to `localStorage` in this mode.

`updateQuantity(id, n)` with `n <= 0` delegates to `removeFromCart`, and a `removeFromCart` that empties the list delegates to `clearCart`.

### Frontend — auth pattern

`services/userServices.js` posts credentials to the real `/login` endpoint. It decodes the returned JWT's payload with `JSON.parse(atob(token.split(".")[1]))` — no signature verification happens client-side — and writes three `localStorage` keys: `authToken` (the raw JWT), `refreshToken`, and `userData` (JSON of `{ userId, displayName, role, email, loginDate }`).

It exposes `login`, `register`, `logout`, `getCurrentUser`, `isAuthenticated`. `login` and `register` never throw — they return `{ success: true, user }` or `{ success: false, error }`. `isAuthenticated()` is a presence check on `authToken` only; it does not check expiry.

`pages/ProtectedRoute.jsx` wraps routes and redirects to `redirectTo` (default `/login`) via `<Navigate>` when `isAuthenticated()` is false. It also accepts an optional `allowedRoles` array and renders an inline "Access denied" message when the current user's role is not in it — neither usage in `App.jsx` passes that prop.

### Frontend — error handling pattern

Three layers, all logging through `services/logger.js`:

- `index.js` wraps `<App />` in a `react-error-boundary` `<ErrorBoundary>` with `ErrorFallback`, passes `onCaughtError` / `onUncaughtError` / `onRecoverableError` to `createRoot`, and registers `window` listeners for `error` and `unhandledrejection`.
- `App.jsx` wraps the route tree in `<RouteErrorBoundary>` (from `components/common/ErrorFallback`), inside `<Layout>` so the header and footer survive a route-level failure.
- Components that fetch data hold `loading` / `error` state and render `Loading` / `ErrorMessage` / content, as in the data-fetch pattern above.

`services/logger.js` is level-gated (`silent | error | warn | info | debug`) via `REACT_APP_LOG_LEVEL`, defaulting to `error` in production, `silent` under test, and `debug` otherwise. It exposes `setLogSink()` as a hook for a future remote sink; nothing is registered by default.

---

## 6. Project skills

Reusable best-practice skill documents live under `docs/skills/`. Each file carries a `Scope`, `Trigger`, `Tools`, and `Version` header used to classify it and decide when it applies. They are reference material — they document external best practices and conventions, not the actual implementation of this codebase (see sections 1-5 for that).

### Backend skills

| File | Trigger |
|---|---|
| `docs/skills/api-best-practices.md` | REST API design, status codes, versioning, pagination, OpenAPI |
| `docs/skills/express-mongodb.md` | Express + MongoDB/Mongoose project setup, auth, CRUD controllers |
| `docs/skills/mongodb-patterns.md` | MongoDB/Mongoose schema design, relationships, indexing, aggregation, transactions |
| `docs/skills/nodejs-best-practices.md` | Node.js production practices: logging, error handling, security, performance |

### Frontend skills

| File | Trigger |
|---|---|
| `docs/skills/frontend-design.md` | UI/UX design, atomic design, Tailwind CSS, Material UI, accessibility |
| `docs/skills/react.md` | React components, hooks, React Router, performance optimization |

### Workflow skills

| File | Trigger |
|---|---|
| `docs/skills/git-workflow.md` | Git usage, branching strategy, Conventional Commits, Pull Requests |
| `docs/skills/ssdlc.md` | Secure Software Development Life Cycle protocol, triggered contextually before development tasks |
| `docs/skills/ssdlc-system-prompt.md` | Same SSDLC protocol, expanded variant intended for use as a standing system prompt rather than a contextual trigger |
| `docs/skills/testing-strategies.md` | Testing pyramid/trophy, TDD, BDD, test doubles, coverage, CI/CD test pipelines |

---

## 7. Known limitations

- **Client-sent `shippingCost` is trusted by the backend** — `POST /api/orders` accepts `shippingCost` from the request body and stores it without server-side validation or recomputation. The tax rate (`TAX_RATE = 0.16`) is server-authoritative, but shipping is not. A future improvement is to move shipping rate logic to the backend so the server computes the correct cost and ignores the client-sent value. Frontend constants live in `hive-electronics-ecommerce_app/src/config/pricing.js` (`SHIPPING_RATE`, `FREE_SHIPPING_THRESHOLD`).

---

## 8. Git branching rules

### Branch taxonomy

| Prefix | Use for | Commit type | Example |
|---|---|---|---|
| `feature/` | New user-facing functionality or endpoints | `feat` | `feature/create-account-signup` |
| `fix/` | Bug fix in existing behavior, non-urgent | `fix` | `fix/payment-method-update-crash` |
| `hotfix/` | Urgent break on `main` needing a fast-tracked merge | `fix` | `hotfix/checkout-500-on-order` |
| `ui/` | Visual, styling, layout, copy — no logic change | `style` | `ui/product-card-spacing` |
| `refactor/` | Restructuring with no behavior change | `refactor` | `refactor/extract-pricing-config` |
| `test/` | Adding or repairing tests only | `test` | `test/cart-controller-coverage` |
| `docs/` | README, CLAUDE.md, `docs/skills/*`, OpenAPI comments | `docs` | `docs/branching-strategy` |
| `chore/` | Dependencies, config, tooling, `.gitignore`, CI | `chore` / `ci` | `chore/bump-mongoose-8` |

**Slug rules:** lowercase kebab-case after the prefix; 2–5 words; describe the outcome, not the file touched (`fix/payment-method-update-crash`, not `fix/paymentcontroller`). No issue numbers unless the user supplies one.

**Overlapping prefixes:** the prefix describes the *primary intent* of the change. A visual change that also needs a small handler tweak is still `ui/`. A bug fix that ships with a regression test is still `fix/`. Use `refactor/` only when behavior is provably unchanged.

### Standing rule

Before making any file change in this repo, create a new branch — do **not** wait to be asked. Pick the prefix from the table by primary intent, cut it fresh from an up-to-date `origin/main`, and state the branch name in the first response of the task.

```bash
git fetch origin
git switch -c <prefix>/<slug> origin/main
```

Exemptions — do **not** branch when:

- The work is read-only (answering questions, reading code, analysis, reviews, running tests without changing them).
- The request is a direct follow-up to work already committed on the current branch — keep committing there. If it is unclear whether a request is a follow-up or a new task, ask.

Do **not** commit or push unless the user asks. Never commit directly to `main`.

---

## 9. Restrictions for the agent

- Do **not** propose suggestions, improvements, refactors, or alternative architectures unless the user explicitly asks for them.
- Do **not** list pending work, TODOs, missing features, or next steps.
- Do **not** call out technical debt, bugs, inconsistencies, or code smells as commentary — only act on them if the user explicitly requests a fix.
- Do **not** invent endpoints, fields, files, or behavior that are not present in the code that was actually read.
- When asked to describe or document this codebase, report only what the code does, exactly as written.
