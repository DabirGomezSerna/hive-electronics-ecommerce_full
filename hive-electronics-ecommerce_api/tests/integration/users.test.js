import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import {
  customerSession,
  adminSession,
  validObjectId,
} from "../helpers/fixtures.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// ---------------------------------------------------------------------------
// GET /api/users
// ---------------------------------------------------------------------------

describe("GET /api/users", () => {
  // TC-INT-USR-001
  it("TC-INT-USR-001 — admin receives user list with no password fields", async () => {
    const { token } = await adminSession();
    await customerSession();

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    res.body.forEach((u) => expect(u.password).toBeUndefined());
  });

  // TC-INT-USR-002
  it("TC-INT-USR-002 — returns 401 without Authorization header", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  // TC-INT-USR-003
  it("TC-INT-USR-003 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/search
// ---------------------------------------------------------------------------

describe("GET /api/users/search", () => {
  // TC-INT-USR-004
  it("TC-INT-USR-004 — admin can search users and receives pagination", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .get("/api/users/search")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination).toMatchObject({
      currentPage: 1,
      totalPages: expect.any(Number),
      totalResults: expect.any(Number),
    });
  });

  // TC-INT-USR-005
  it("TC-INT-USR-005 — returns 401 without token", async () => {
    const res = await request(app).get("/api/users/search");
    expect(res.status).toBe(401);
  });

  // TC-INT-USR-006
  it("TC-INT-USR-006 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/users/search")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/:id
// ---------------------------------------------------------------------------

describe("GET /api/users/:id", () => {
  // TC-INT-USR-007
  it("TC-INT-USR-007 — admin retrieves user by id (no password)", async () => {
    const { user, token } = await adminSession();
    const { user: target } = await customerSession();

    const res = await request(app)
      .get(`/api/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(target._id.toString());
    expect(res.body.password).toBeUndefined();
  });

  // TC-INT-USR-008
  it("TC-INT-USR-008 — returns 404 for valid but non-existent ObjectId", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .get(`/api/users/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-USR-009
  it("TC-INT-USR-009 — returns 422 for non-MongoId id param", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .get("/api/users/not-a-valid-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  // TC-INT-USR-010
  it("TC-INT-USR-010 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const res = await request(app).get(`/api/users/${user._id}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-USR-011
  it("TC-INT-USR-011 — returns 403 with customer token", async () => {
    const { user, token } = await customerSession();
    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/users — SECURITY NOTE: no auth required on this route
// ---------------------------------------------------------------------------

describe("POST /api/users", () => {
  const validPayload = {
    displayName: "Created User",
    email: "created@example.com",
    password: "Password123!",
    role: "customer",
    avatar: "https://example.com/avatar.jpg",
    isActive: true,
  };

  // TC-INT-USR-012
  it("TC-INT-USR-012 — creates user without auth (public route — known security gap)", async () => {
    const res = await request(app).post("/api/users").send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("created@example.com");
    expect(res.body.password).toBeUndefined();
  });

  // TC-INT-USR-013
  it("TC-INT-USR-013 — creates admin user without auth (no role restriction — critical security gap)", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe("admin");
  });

  // TC-INT-USR-014
  it("TC-INT-USR-014 — returns 422 when displayName is missing", async () => {
    const { displayName: _, ...noName } = validPayload;
    const res = await request(app).post("/api/users").send(noName);
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "displayName")).toBe(true);
  });

  // TC-INT-USR-015
  it("TC-INT-USR-015 — returns 422 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, email: "not-an-email" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "email")).toBe(true);
  });

  // TC-INT-USR-016
  it("TC-INT-USR-016 — returns 422 when password is shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, password: "abc" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "password")).toBe(true);
  });

  // TC-INT-USR-017
  it("TC-INT-USR-017 — returns 422 for invalid role value", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, role: "superuser" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "role")).toBe(true);
  });

  // TC-INT-USR-018
  it("TC-INT-USR-018 — returns 422 when avatar is not a valid URL", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({ ...validPayload, avatar: "not-a-url" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "avatar")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id
// ---------------------------------------------------------------------------

describe("PUT /api/users/:id", () => {
  // TC-INT-USR-019
  it("TC-INT-USR-019 — authenticated user can update their profile", async () => {
    const { user, token } = await customerSession();
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe("Updated Name");
  });

  // TC-INT-USR-020
  it("TC-INT-USR-020 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const res = await request(app)
      .put(`/api/users/${user._id}`)
      .send({ displayName: "Updated" });
    expect(res.status).toBe(401);
  });

  // TC-INT-USR-021
  it("TC-INT-USR-021 — returns 422 for non-MongoId id param", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .put("/api/users/bad-id")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Updated" });
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/users/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/users/:id", () => {
  // TC-INT-USR-022
  it("TC-INT-USR-022 — admin deletes user and returns 204", async () => {
    const { token } = await adminSession();
    const { user } = await customerSession();

    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  // TC-INT-USR-023
  it("TC-INT-USR-023 — returns 404 when deleting non-existent user", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .delete(`/api/users/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-USR-024
  it("TC-INT-USR-024 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const res = await request(app).delete(`/api/users/${user._id}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-USR-025
  it("TC-INT-USR-025 — returns 403 with customer token", async () => {
    const { user, token } = await customerSession();
    const res = await request(app)
      .delete(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
