import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import {
  adminSession,
  customerSession,
  createCategory,
  createProduct,
  validObjectId,
} from "../helpers/fixtures.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// ---------------------------------------------------------------------------
// GET /api/carts
// ---------------------------------------------------------------------------

describe("GET /api/carts", () => {
  // TC-INT-CART-001
  it("TC-INT-CART-001 — admin retrieves all carts", async () => {
    const { token } = await adminSession();
    const { user } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    await request(app)
      .post("/api/carts")
      .set("Authorization", `Bearer ${token}`)
      .send({ user: user._id.toString(), products: [{ product: prod._id.toString(), quantity: 1 }] });

    const res = await request(app)
      .get("/api/carts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // TC-INT-CART-002
  it("TC-INT-CART-002 — returns 401 without token", async () => {
    const res = await request(app).get("/api/carts");
    expect(res.status).toBe(401);
  });

  // TC-INT-CART-003
  it("TC-INT-CART-003 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/carts")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/carts/user/:id
// ---------------------------------------------------------------------------

describe("GET /api/carts/user/:id", () => {
  // TC-INT-CART-004
  it("TC-INT-CART-004 — authenticated user retrieves their cart", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    // Create cart first
    await request(app)
      .post("/api/carts/addToCart")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user._id.toString(), productId: prod._id.toString() });

    const res = await request(app)
      .get(`/api/carts/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
  });

  // TC-INT-CART-005
  it("TC-INT-CART-005 — returns 404 when user has no cart", async () => {
    const { user, token } = await customerSession();
    const res = await request(app)
      .get(`/api/carts/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-CART-006
  it("TC-INT-CART-006 — returns 401 without token", async () => {
    const res = await request(app).get(`/api/carts/user/${validObjectId()}`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/carts/addToCart
// ---------------------------------------------------------------------------

describe("POST /api/carts/addToCart", () => {
  // TC-INT-CART-007
  it("TC-INT-CART-007 — creates a new cart when user has none", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .post("/api/carts/addToCart")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: user._id.toString(),
        productId: prod._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].quantity).toBe(1);
  });

  // TC-INT-CART-008
  it("TC-INT-CART-008 — adds product to existing cart", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod1 = await createProduct(cat._id, { name: "P1" });
    const prod2 = await createProduct(cat._id, { name: "P2" });

    await request(app)
      .post("/api/carts/addToCart")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user._id.toString(), productId: prod1._id.toString() });

    const res = await request(app)
      .post("/api/carts/addToCart")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user._id.toString(), productId: prod2._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(2);
  });

  // TC-INT-CART-009
  it("TC-INT-CART-009 — increments quantity when same product added again", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const body = { userId: user._id.toString(), productId: prod._id.toString() };

    await request(app).post("/api/carts/addToCart").set("Authorization", `Bearer ${token}`).send(body);
    const res = await request(app).post("/api/carts/addToCart").set("Authorization", `Bearer ${token}`).send(body);

    expect(res.status).toBe(200);
    expect(res.body.products[0].quantity).toBe(2);
  });

  // TC-INT-CART-010
  it("TC-INT-CART-010 — returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/carts/addToCart")
      .send({ userId: validObjectId(), productId: validObjectId() });
    expect(res.status).toBe(401);
  });

  // TC-INT-CART-011
  it("TC-INT-CART-011 — returns 422 when userId is not a MongoId", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .post("/api/carts/addToCart")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "not-an-id", productId: validObjectId() });
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// POST /api/carts/removeFromCart
// ---------------------------------------------------------------------------

describe("POST /api/carts/removeFromCart", () => {
  // TC-INT-CART-012
  it("TC-INT-CART-012 — removes product from cart when quantity is 1", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    await request(app)
      .post("/api/carts/addToCart")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user._id.toString(), productId: prod._id.toString() });

    const res = await request(app)
      .post("/api/carts/removeFromCart")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user._id.toString(), productId: prod._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(0);
  });

  // TC-INT-CART-013
  it("TC-INT-CART-013 — decrements quantity when product quantity > 1 [BUG-006: always decrements by 1, ignores body quantity]", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const body = { userId: user._id.toString(), productId: prod._id.toString() };

    // Add 3 times → quantity = 3
    await request(app).post("/api/carts/addToCart").set("Authorization", `Bearer ${token}`).send(body);
    await request(app).post("/api/carts/addToCart").set("Authorization", `Bearer ${token}`).send(body);
    await request(app).post("/api/carts/addToCart").set("Authorization", `Bearer ${token}`).send(body);

    // Remove once
    const res = await request(app)
      .post("/api/carts/removeFromCart")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(200);
    // BUG-006: controller uses `quantity -= 1` not `quantity -= requestedQty`
    expect(res.body.products[0].quantity).toBe(2);
  });

  // TC-INT-CART-014
  it("TC-INT-CART-014 — returns 404 when cart does not exist for user", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .post("/api/carts/removeFromCart")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: user._id.toString(), productId: prod._id.toString() });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No cart found for user");
  });

  // TC-INT-CART-015
  it("TC-INT-CART-015 — returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/carts/removeFromCart")
      .send({ userId: validObjectId(), productId: validObjectId() });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/carts
// ---------------------------------------------------------------------------

describe("POST /api/carts", () => {
  // TC-INT-CART-016
  it("TC-INT-CART-016 — creates cart with initial products", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .post("/api/carts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: user._id.toString(),
        products: [{ product: prod._id.toString(), quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.products[0].quantity).toBe(2);
  });

  // TC-INT-CART-017
  it("TC-INT-CART-017 — returns 422 when user is missing", async () => {
    const { token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .post("/api/carts")
      .set("Authorization", `Bearer ${token}`)
      .send({ products: [{ product: prod._id.toString(), quantity: 1 }] });
    expect(res.status).toBe(422);
  });

  // TC-INT-CART-018
  it("TC-INT-CART-018 — returns 401 without token", async () => {
    const res = await request(app)
      .post("/api/carts")
      .send({ user: validObjectId(), products: [] });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/carts/:id
// ---------------------------------------------------------------------------

describe("PUT /api/carts/:id", () => {
  // TC-INT-CART-019
  it("TC-INT-CART-019 — replaces cart products with updated list", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod1 = await createProduct(cat._id, { name: "P1" });
    const prod2 = await createProduct(cat._id, { name: "P2" });

    const createRes = await request(app)
      .post("/api/carts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: user._id.toString(),
        products: [{ product: prod1._id.toString(), quantity: 1 }],
      });

    const cartId = createRes.body._id;

    const res = await request(app)
      .put(`/api/carts/${cartId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: user._id.toString(),
        products: [{ product: prod2._id.toString(), quantity: 3 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].quantity).toBe(3);
  });

  // TC-INT-CART-020
  it("TC-INT-CART-020 — returns 401 without token", async () => {
    const res = await request(app)
      .put(`/api/carts/${validObjectId()}`)
      .send({ user: validObjectId(), products: [] });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/carts/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/carts/:id", () => {
  // TC-INT-CART-021
  it("TC-INT-CART-021 — deletes cart and returns 204", async () => {
    const { user, token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const createRes = await request(app)
      .post("/api/carts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: user._id.toString(),
        products: [{ product: prod._id.toString(), quantity: 1 }],
      });

    const res = await request(app)
      .delete(`/api/carts/${createRes.body._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  // TC-INT-CART-022
  it("TC-INT-CART-022 — returns 401 without token", async () => {
    const res = await request(app).delete(`/api/carts/${validObjectId()}`);
    expect(res.status).toBe(401);
  });
});
