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
// GET /api/products
// ---------------------------------------------------------------------------

describe("GET /api/products", () => {
  // TC-INT-PROD-001
  it("TC-INT-PROD-001 — returns all products (public, no auth)", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "Product A" });
    await createProduct(cat._id, { name: "Product B" });

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  // TC-INT-PROD-002
  it("TC-INT-PROD-002 — each product has category populated (not just ObjectId)", async () => {
    const cat = await createCategory({ name: "Electronics" });
    await createProduct(cat._id);

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(typeof res.body[0].category).toBe("object");
    expect(res.body[0].category.name).toBe("Electronics");
  });

  // TC-INT-PROD-003
  it("TC-INT-PROD-003 — returns empty array when no products exist", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /api/products/search
// ---------------------------------------------------------------------------

describe("GET /api/products/search", () => {
  // TC-INT-PROD-004
  it("TC-INT-PROD-004 — filters by q param (case-insensitive name/description match)", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "Sony Headphones", description: "Noise canceling" });
    await createProduct(cat._id, { name: "Apple iPhone", description: "Smartphone" });

    const res = await request(app).get("/api/products/search?q=sony");

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe("Sony Headphones");
  });

  // TC-INT-PROD-005
  it("TC-INT-PROD-005 — filters by category id", async () => {
    const cat1 = await createCategory({ name: "Audio" });
    const cat2 = await createCategory({ name: "Phones" });
    await createProduct(cat1._id, { name: "Speaker" });
    await createProduct(cat2._id, { name: "iPhone" });

    const res = await request(app).get(
      `/api/products/search?category=${cat1._id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe("Speaker");
  });

  // TC-INT-PROD-006
  it("TC-INT-PROD-006 — returns pagination metadata", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "P1" });
    await createProduct(cat._id, { name: "P2" });

    const res = await request(app).get("/api/products/search?page=1&limit=1");

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      totalResults: 2,
      hasNext: true,
      hasPrev: false,
    });
    expect(res.body.products.length).toBe(1);
  });

  // TC-INT-PROD-007
  it("TC-INT-PROD-007 — filters by inStock=true returns only products with stock > 0", async () => {
    const cat = await createCategory();
    await createProduct(cat._id, { name: "In Stock", stock: 5 });
    await createProduct(cat._id, { name: "Out of Stock", stock: 0 });

    const res = await request(app).get("/api/products/search?inStock=true");

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.products[0].name).toBe("In Stock");
  });
});

// ---------------------------------------------------------------------------
// GET /api/products/:id
// ---------------------------------------------------------------------------

describe("GET /api/products/:id", () => {
  // TC-INT-PROD-008
  it("TC-INT-PROD-008 — returns product with populated category", async () => {
    const cat = await createCategory({ name: "Laptops" });
    const prod = await createProduct(cat._id, { name: "Dell XPS" });

    const res = await request(app).get(`/api/products/${prod._id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Dell XPS");
    expect(res.body.category.name).toBe("Laptops");
  });

  // TC-INT-PROD-009
  it("TC-INT-PROD-009 — returns 404 for valid but non-existent ObjectId", async () => {
    const res = await request(app).get(`/api/products/${validObjectId()}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-PROD-010
  it("TC-INT-PROD-010 — returns 422 for non-MongoId param", async () => {
    const res = await request(app).get("/api/products/not-a-valid-id");
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// POST /api/products
// ---------------------------------------------------------------------------

describe("POST /api/products", () => {
  // TC-INT-PROD-011
  it("TC-INT-PROD-011 — admin creates product and returns 201 with populated category", async () => {
    const { token } = await adminSession();
    const cat = await createCategory({ name: "Audio" });

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Sony WH-1000XM5",
        description: "Noise canceling headphones",
        price: 349.99,
        stock: 30,
        category: cat._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Sony WH-1000XM5");
    expect(res.body.category.name).toBe("Audio");
  });

  // TC-INT-PROD-012
  it("TC-INT-PROD-012 — returns 401 without token", async () => {
    const cat = await createCategory();
    const res = await request(app)
      .post("/api/products")
      .send({ name: "X", price: 10, stock: 1, category: cat._id.toString() });
    expect(res.status).toBe(401);
  });

  // TC-INT-PROD-013
  it("TC-INT-PROD-013 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const cat = await createCategory();
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X", price: 10, stock: 1, category: cat._id.toString() });
    expect(res.status).toBe(403);
  });

  // TC-INT-PROD-014
  it("TC-INT-PROD-014 — returns 422 when name is missing", async () => {
    const { token } = await adminSession();
    const cat = await createCategory();
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 10, stock: 1, category: cat._id.toString() });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "name")).toBe(true);
  });

  // TC-INT-PROD-015
  it("TC-INT-PROD-015 — returns 422 when price is 0 (must be >= 1)", async () => {
    const { token } = await adminSession();
    const cat = await createCategory();
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X", price: 0, stock: 1, category: cat._id.toString() });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "price")).toBe(true);
  });

  // TC-INT-PROD-016
  it("TC-INT-PROD-016 — returns 422 when category is not a valid MongoId", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X", price: 10, stock: 1, category: "bad-id" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "category")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/products/:id
// ---------------------------------------------------------------------------

describe("PUT /api/products/:id", () => {
  // TC-INT-PROD-017
  it("TC-INT-PROD-017 — admin updates product price and stock", async () => {
    const { token } = await adminSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id, { name: "Old Product", price: 50 });

    const res = await request(app)
      .put(`/api/products/${prod._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 75.99, stock: 20 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(75.99);
    expect(res.body.stock).toBe(20);
  });

  // TC-INT-PROD-018
  it("TC-INT-PROD-018 — returns 401 without token", async () => {
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const res = await request(app)
      .put(`/api/products/${prod._id}`)
      .send({ price: 100 });
    expect(res.status).toBe(401);
  });

  // TC-INT-PROD-019
  it("TC-INT-PROD-019 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const res = await request(app)
      .put(`/api/products/${prod._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 100 });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/products/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/products/:id", () => {
  // TC-INT-PROD-020
  it("TC-INT-PROD-020 — admin deletes product and returns 204", async () => {
    const { token } = await adminSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);

    const res = await request(app)
      .delete(`/api/products/${prod._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  // TC-INT-PROD-021
  it("TC-INT-PROD-021 — returns 404 for non-existent product", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .delete(`/api/products/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-PROD-022
  it("TC-INT-PROD-022 — returns 401 without token", async () => {
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const res = await request(app).delete(`/api/products/${prod._id}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-PROD-023
  it("TC-INT-PROD-023 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const cat = await createCategory();
    const prod = await createProduct(cat._id);
    const res = await request(app)
      .delete(`/api/products/${prod._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
