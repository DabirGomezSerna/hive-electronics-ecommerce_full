# hive-electronics-ecommerce_full

This workspace contains two independent projects:

- `hive-electronics-ecommerce_api/` — Express + Mongoose backend (ESM, `"type": "module"`)
- `hive-electronics-ecommerce_app/` — React 19 frontend (Create React App, `react-scripts`)

There is no shared package, monorepo tooling, or git repository linking the two folders.

---

## 1. Directory structure (`src/` only)

### `hive-electronics-ecommerce_api/src/`

```
src/
├── config/
│   └── db.conf.js
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
│   ├── isAdminMiddleware.js
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
│   └── common/
│       ├── Badge/
│       │   ├── Badge.css
│       │   ├── Badge.jsx
│       │   └── index.js
│       ├── Button/
│       │   ├── Button.css
│       │   ├── Button.jsx
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
│   └── ProtectedRoute.jsx
├── reportWebVitals.js
├── services/
│   ├── categoryServices.js
│   ├── productServices.js
│   ├── shippingServices.js
│   └── userServices.js
└── setupTests.js
```

---

## 2. API route map

Base mount: `server.js` registers `app.use("/api", routes)`, and `src/routes/index.js` mounts every route file with no extra prefix. Full paths below include the `/api` prefix.

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

A catch-all 404 handler is registered in `server.js` after `/api` routes, returning `{ error, method, url }`.

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
- `totalPrice: Number, required`
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

Services import local JSON from `data/` and wrap synchronous lookups in a `Promise` + `setTimeout` to simulate network latency:

```js
import products from '../data/products.json';

export const fetchProducts = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(products);
    }, 2000);
  });
};
```

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

Single `CartContext` (`context/CartContext.jsx`) created with `createContext()`, exposed through a `CartProvider` and a `useCart()` hook that throws if used outside the provider. Cart state is initialized from and synced to `localStorage` via `useEffect`.

### Frontend — auth pattern

`services/userServices.js` checks credentials against a hardcoded `validUsers` object, stores a `btoa(...)`-encoded fake token plus user JSON in `localStorage` (`authToken`, `userData`), and exposes `login`, `logout`, `getCurrentUser`, `isAuthenticated`. `pages/ProtectedRoute.jsx` wraps routes and redirects to `/login` via `<Navigate>` when `isAuthenticated()` is false.

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

## 7. Restrictions for the agent

- Do **not** propose suggestions, improvements, refactors, or alternative architectures unless the user explicitly asks for them.
- Do **not** list pending work, TODOs, missing features, or next steps.
- Do **not** call out technical debt, bugs, inconsistencies, or code smells as commentary — only act on them if the user explicitly requests a fix.
- Do **not** invent endpoints, fields, files, or behavior that are not present in the code that was actually read.
- When asked to describe or document this codebase, report only what the code does, exactly as written.
