import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import {
  adminSession,
  customerSession,
  createCategory,
  createChildCategory,
  validObjectId,
} from "../helpers/fixtures.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// ---------------------------------------------------------------------------
// GET /api/categories
// ---------------------------------------------------------------------------

describe("GET /api/categories", () => {
  // TC-INT-CAT-001
  it("TC-INT-CAT-001 — returns array of categories (public, no auth)", async () => {
    await createCategory({ name: "Electronics" });
    const res = await request(app).get("/api/categories");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  // TC-INT-CAT-002
  it("TC-INT-CAT-002 — returns empty array when no categories exist", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // TC-INT-CAT-003
  it("TC-INT-CAT-003 — child category has parentCategory populated", async () => {
    const parent = await createCategory({ name: "Parent" });
    await createChildCategory(parent._id, { name: "Child" });

    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    const child = res.body.find((c) => c.name === "Child");
    expect(child.parentCategory).toMatchObject({ name: "Parent" });
  });
});

// ---------------------------------------------------------------------------
// GET /api/categories/:id
// ---------------------------------------------------------------------------

describe("GET /api/categories/:id", () => {
  // TC-INT-CAT-004
  it("TC-INT-CAT-004 — returns category by id (public)", async () => {
    const cat = await createCategory({ name: "Laptops" });
    const res = await request(app).get(`/api/categories/${cat._id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Laptops");
  });

  // TC-INT-CAT-005
  it("TC-INT-CAT-005 — returns 404 for valid but non-existent ObjectId", async () => {
    const res = await request(app).get(`/api/categories/${validObjectId()}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-CAT-006
  it("TC-INT-CAT-006 — returns 422 for non-MongoId param", async () => {
    const res = await request(app).get("/api/categories/not-a-mongo-id");
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// POST /api/categories
// ---------------------------------------------------------------------------

describe("POST /api/categories", () => {
  const validPayload = {
    name: "New Category",
    description: "Category description",
  };

  // TC-INT-CAT-007
  it("TC-INT-CAT-007 — admin creates category and returns 201", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("New Category");
    expect(res.body._id).toBeDefined();
  });

  // TC-INT-CAT-008
  it("TC-INT-CAT-008 — admin creates child category with parentCategory reference", async () => {
    const { token } = await adminSession();
    const parent = await createCategory({ name: "Parent" });

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validPayload, parentCategory: parent._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.parentCategory).toBeDefined();
  });

  // TC-INT-CAT-009
  it("TC-INT-CAT-009 — returns 401 without token", async () => {
    const res = await request(app).post("/api/categories").send(validPayload);
    expect(res.status).toBe(401);
  });

  // TC-INT-CAT-010
  it("TC-INT-CAT-010 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  // TC-INT-CAT-011
  it("TC-INT-CAT-011 — returns 422 when name is missing", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "only description" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "name")).toBe(true);
  });

  // TC-INT-CAT-012
  it("TC-INT-CAT-012 — returns 422 when description is missing", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Only name" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "description")).toBe(true);
  });

  // TC-INT-CAT-013
  it("TC-INT-CAT-013 — returns 422 when parentCategory is not a valid MongoId", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validPayload, parentCategory: "not-an-id" });
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/categories/:id
// ---------------------------------------------------------------------------

describe("PUT /api/categories/:id", () => {
  // TC-INT-CAT-014
  it("TC-INT-CAT-014 — admin updates category name", async () => {
    const { token } = await adminSession();
    const cat = await createCategory({ name: "Old Name" });

    const res = await request(app)
      .put(`/api/categories/${cat._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name", description: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
  });

  // TC-INT-CAT-015
  it("TC-INT-CAT-015 — returns 401 without token", async () => {
    const cat = await createCategory();
    const res = await request(app)
      .put(`/api/categories/${cat._id}`)
      .send({ name: "Updated" });
    expect(res.status).toBe(401);
  });

  // TC-INT-CAT-016
  it("TC-INT-CAT-016 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const cat = await createCategory();
    const res = await request(app)
      .put(`/api/categories/${cat._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated" });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/categories/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/categories/:id", () => {
  // TC-INT-CAT-017
  it("TC-INT-CAT-017 — admin deletes category and returns 204", async () => {
    const { token } = await adminSession();
    const cat = await createCategory();

    const res = await request(app)
      .delete(`/api/categories/${cat._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  // TC-INT-CAT-018
  it("TC-INT-CAT-018 — returns 404 for non-existent category", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .delete(`/api/categories/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-CAT-019
  it("TC-INT-CAT-019 — returns 401 without token", async () => {
    const cat = await createCategory();
    const res = await request(app).delete(`/api/categories/${cat._id}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-CAT-020
  it("TC-INT-CAT-020 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const cat = await createCategory();
    const res = await request(app)
      .delete(`/api/categories/${cat._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
