/**
 * Diagnostic test suite — CRITICAL and HIGH gaps found during 2026-07-01 audit.
 *
 * Naming convention:
 *   TC-DIAG-NNN  Bug-documenting tests assert CURRENT broken behavior and include
 *                a comment describing the CORRECT behavior after the bug is fixed.
 *   TC-DIAG-NNN  Gap tests assert CORRECT behavior that was simply never exercised.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import {
  adminSession,
  customerSession,
  validObjectId,
  createCategory,
  createProduct,
  createAddress,
  createPaymentMethod,
} from "../helpers/fixtures.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// ---------------------------------------------------------------------------
// CRITICAL — BUG-007: searchUsers with email/role param but no q
// ---------------------------------------------------------------------------

describe("GET /api/users/search — BUG-007", () => {
  it("TC-DIAG-001 — email param without q returns wrong results (not filtered by email)", async () => {
    const { token } = await adminSession();
    const { user: cust1 } = await customerSession();
    await customerSession(); // second customer with different email

    // Correct behavior: return ONLY the user whose email matches.
    // BUG-007: searchUsers builds `{ $or: [{ name: { $regex: undefined } }] }` when
    // email is provided without q. undefined in BSON is serialized to null, which
    // causes either a MongoDB error (500) or an unfiltered/empty result (200).
    const res = await request(app)
      .get(`/api/users/search?email=${encodeURIComponent(cust1.email)}`)
      .set("Authorization", `Bearer ${token}`);

    // BUG-007 causes one of two wrong outcomes:
    // Option A (crash): status 500 — MongoDB rejects { $regex: null }
    // Option B (wrong data): status 200 but result is NOT filtered by email
    if (res.status === 200) {
      // Demonstrates the bug: should return exactly 1 user; instead returns wrong count
      expect(res.body.users.length).not.toBe(1);
    } else {
      // Alternatively crashes the endpoint
      expect(res.status).toBe(500);
    }
    // Fix: each filter branch should use its own param, e.g.:
    //   if (email) filters.email = { $regex: email, $options: "i" };
    //   if (role)  filters.role = role;
  });
});

// ---------------------------------------------------------------------------
// CRITICAL — BUG-012: Login JWT has name: undefined
// ---------------------------------------------------------------------------

describe("POST /api/login — BUG-012", () => {
  it("TC-DIAG-002 — JWT name field is undefined because login uses userExist.name not userExist.displayName", async () => {
    // Register a user first
    const email = "bugtest@example.com";
    const displayName = "Bug Test User";
    await request(app)
      .post("/api/register")
      .send({ displayName, email, password: "Pass1234!", avatar: "https://example.com/a.jpg" });

    const res = await request(app)
      .post("/api/login")
      .send({ email, password: "Pass1234!" });

    expect(res.status).toBe(200);

    // Decode the JWT payload (base64 middle segment, no signature verification needed)
    const payload = JSON.parse(
      Buffer.from(res.body.token.split(".")[1], "base64url").toString("utf-8"),
    );

    // BUG-012: authController.login passes `userExist.name` to generateToken()
    // but the User schema field is `displayName`, not `name`.
    // Result: JWT contains no `name` field (undefined is omitted from JSON.stringify).
    // Fix: change generateToken(userExist._id, userExist.name, ...) to userExist.displayName
    expect(payload.name).toBeUndefined(); // documents the bug — should be displayName after fix

    // Role and userId ARE present (these fields come from the DB correctly)
    expect(payload.userId).toBeDefined();
    expect(payload.role).toBe("customer");
  });
});

// ---------------------------------------------------------------------------
// CRITICAL — BUG-010: DELETE /users/:id missing `validate` middleware
// ---------------------------------------------------------------------------

describe("DELETE /api/users/:id — BUG-010", () => {
  it("TC-DIAG-003 — invalid MongoId returns 500 instead of 422 (validate not called after userIdValidation)", async () => {
    const { token } = await adminSession();

    const res = await request(app)
      .delete("/api/users/not-a-valid-mongo-id")
      .set("Authorization", `Bearer ${token}`);

    // BUG-010: userRoutes.js DELETE chain is:
    //   authMiddleware → isAdmin → userIdValidation → deleteUser
    // `validate` is missing! Validation errors are collected but never checked.
    // deleteUser calls User.findByIdAndDelete("not-a-valid-mongo-id") → Mongoose CastError → 500.
    // Fix: insert `validate` between userIdValidation and deleteUser.
    expect(res.status).toBe(500); // documents bug — fix to 422
  });
});

// ---------------------------------------------------------------------------
// CRITICAL — BUG-011: DELETE /carts/:id missing `validate` middleware
// ---------------------------------------------------------------------------

describe("DELETE /api/carts/:id — BUG-011", () => {
  it("TC-DIAG-004 — invalid MongoId returns 500 instead of 422 (validate not called after cartIdValidation)", async () => {
    const { token } = await customerSession();

    const res = await request(app)
      .delete("/api/carts/not-a-valid-mongo-id")
      .set("Authorization", `Bearer ${token}`);

    // BUG-011: cartRoutes.js DELETE chain is:
    //   authMiddleware → cartIdValidation → deleteCart
    // `validate` is missing! Validation errors are collected but never checked.
    // deleteCart calls Cart.findByIdAndDelete("not-a-valid-mongo-id") → CastError → 500.
    // Fix: insert `validate` between cartIdValidation and deleteCart.
    expect(res.status).toBe(500); // documents bug — fix to 422
  });
});

// ---------------------------------------------------------------------------
// CRITICAL — BUG-008: removeFromCart double-response when product not in cart
// ---------------------------------------------------------------------------

describe("POST /api/carts/removeFromCart — BUG-008", () => {
  it("TC-DIAG-005 — product not in cart returns 404 (double-response risk after the 404 branch)", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod1 = await createProduct(cat._id);
    const prod2 = await createProduct(cat._id); // will NOT be added to cart

    // Add prod1 to cart
    await request(app)
      .post("/api/carts/addToCart")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: user._id.toString(),
        productId: prod1._id.toString(),
        quantity: 1,
      });

    // Try to remove prod2, which is not in the cart
    const res = await request(app)
      .post("/api/carts/removeFromCart")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: user._id.toString(),
        productId: prod2._id.toString(),
        quantity: 1,
      });

    // BUG-008: Controller enters the else branch and calls res.status(404).json(...)
    // THEN falls through to execute: await cart.save(), await cart.populate(...), res.json(cart).
    // This is a double-response: two calls to res after headers are committed.
    // The client (supertest) receives the first response (404).
    // Fix: add return before res.status(404) in the else-not-found branch.
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Product not found in cart");
  });
});

// ---------------------------------------------------------------------------
// CRITICAL — BUG-009: updateOrderStatus returns 204 (not 404) for non-existent order
// ---------------------------------------------------------------------------

describe("PUT /api/orders/:id — BUG-009", () => {
  it("TC-DIAG-006 — non-existent order returns 204 instead of 404", async () => {
    const { token } = await customerSession();

    const res = await request(app)
      .put(`/api/orders/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "processing" });

    // BUG-009: orderController.updateOrderStatus:99-101
    //   if (!updated) { return res.status(204).json({ message: "Order not found" }); }
    // 204 is "No Content" — wrong status for "resource not found".
    // Fix: change status(204) to status(404).
    expect(res.status).toBe(204); // documents bug — fix to 404
  });
});

// ---------------------------------------------------------------------------
// HIGH — Gap: PUT /users/:id with non-existent ID returns 404
// ---------------------------------------------------------------------------

describe("PUT /api/users/:id — gap: not-found", () => {
  it("TC-DIAG-007 — returns 404 for valid but non-existent user ID", async () => {
    const { token } = await customerSession();

    const res = await request(app)
      .put(`/api/users/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "New Name" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});

// ---------------------------------------------------------------------------
// HIGH — Gap: PUT /products/:id with non-existent ID returns 404
// ---------------------------------------------------------------------------

describe("PUT /api/products/:id — gap: not-found", () => {
  it("TC-DIAG-008 — returns 404 for valid but non-existent product ID", async () => {
    const { token } = await adminSession();

    const res = await request(app)
      .put(`/api/products/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Ghost Product" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Product not found");
  });
});

// ---------------------------------------------------------------------------
// HIGH — Gap: PUT /categories/:id with non-existent ID returns 404
// ---------------------------------------------------------------------------

describe("PUT /api/categories/:id — gap: not-found", () => {
  it("TC-DIAG-009 — returns 404 for valid but non-existent category ID", async () => {
    const { token } = await adminSession();

    const res = await request(app)
      .put(`/api/categories/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Ghost Category" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Category not found");
  });
});

// ---------------------------------------------------------------------------
// HIGH — Gap: PUT /addresses/:id with non-existent ID returns 404
// ---------------------------------------------------------------------------

describe("PUT /api/addresses/:id — gap: not-found", () => {
  it("TC-DIAG-010 — returns 404 for valid but non-existent address ID", async () => {
    const { token } = await customerSession();

    const res = await request(app)
      .put(`/api/addresses/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "Nowhere" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Address not found");
  });
});

// ---------------------------------------------------------------------------
// HIGH — Gap: GET /carts/:id (admin) with non-existent ID returns 404
// ---------------------------------------------------------------------------

describe("GET /api/carts/:id — gap: not-found", () => {
  it("TC-DIAG-011 — admin gets 404 for valid but non-existent cart ID", async () => {
    const { token } = await adminSession();

    const res = await request(app)
      .get(`/api/carts/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cart not found");
  });
});

// ---------------------------------------------------------------------------
// HIGH — Gap: PUT /carts/:id with non-existent ID returns 404
// ---------------------------------------------------------------------------

describe("PUT /api/carts/:id — gap: not-found", () => {
  it("TC-DIAG-012 — returns 404 for valid but non-existent cart ID", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .put(`/api/carts/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: user._id.toString(),
        products: [{ product: prod._id.toString(), quantity: 1 }],
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cart not found");
  });
});

// ---------------------------------------------------------------------------
// HIGH — BUG-013: POST /users duplicate email returns 500 (should be 400)
// ---------------------------------------------------------------------------

describe("POST /api/users — BUG-013", () => {
  it("TC-DIAG-013 — duplicate email returns 500 instead of 400 (no duplicate-email check in createUser)", async () => {
    const email = "duplicate@example.com";
    const userData = {
      displayName: "First User",
      email,
      password: "Pass1234!",
      role: "customer",
      avatar: "https://example.com/avatar.jpg",
    };

    // Create the user once
    await request(app).post("/api/users").send(userData);

    // Try to create again with same email
    const res = await request(app).post("/api/users").send(userData);

    // BUG-013: createUser does not check for duplicate email before calling User.create().
    // When the unique index on email raises a MongoServerError (E11000 duplicate key),
    // the catch block calls next(error) → Express default error handler → 500.
    // Fix: query for existing user first and return 400/409 if found (like authController.register does).
    expect(res.status).toBe(500); // documents bug — fix to 400 or 409
  });
});

// ---------------------------------------------------------------------------
// HIGH — Gap: searchProducts with minPrice / maxPrice / inStock=false
// ---------------------------------------------------------------------------

describe("GET /api/products/search — price range and inStock filters", () => {
  it("TC-DIAG-014 — minPrice filter returns only products at or above the price", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "Cheap", price: 10, stock: 5 });
    await createProduct(cat._id, { name: "Expensive", price: 200, stock: 5 });

    const res = await request(app).get("/api/products/search?minPrice=100");

    expect(res.status).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(res.body.products.every((p) => p.price >= 100)).toBe(true);
    expect(res.body.products.some((p) => p.name === "Expensive")).toBe(true);
    expect(res.body.products.some((p) => p.name === "Cheap")).toBe(false);
  });

  it("TC-DIAG-015 — maxPrice filter returns only products at or below the price", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "Budget", price: 15, stock: 5 });
    await createProduct(cat._id, { name: "Premium", price: 500, stock: 5 });

    const res = await request(app).get("/api/products/search?maxPrice=50");

    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.price <= 50)).toBe(true);
    expect(res.body.products.some((p) => p.name === "Budget")).toBe(true);
    expect(res.body.products.some((p) => p.name === "Premium")).toBe(false);
  });

  it("TC-DIAG-016 — inStock=false returns only products with zero stock", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "In Stock", price: 50, stock: 10 });
    await createProduct(cat._id, { name: "Out of Stock", price: 50, stock: 0 });

    const res = await request(app).get("/api/products/search?inStock=false");

    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.stock <= 0)).toBe(true);
    expect(res.body.products.some((p) => p.name === "Out of Stock")).toBe(true);
    expect(res.body.products.some((p) => p.name === "In Stock")).toBe(false);
  });
});
