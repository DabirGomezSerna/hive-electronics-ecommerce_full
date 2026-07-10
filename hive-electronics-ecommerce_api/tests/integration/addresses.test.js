import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import {
  adminSession,
  customerSession,
  createAddress,
  validObjectId,
} from "../helpers/fixtures.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

const validAddressBody = (userId) => ({
  user: userId,
  name: "Home",
  address1: "123 Test Street",
  address2: "Apt 4B",
  postalCode: "10001",
  city: "New York",
  country: "US",
  reference: "Blue door",
});

// ---------------------------------------------------------------------------
// GET /api/addresses  [ADMIN ONLY — confirmed bug: customers cannot list own addresses]
// ---------------------------------------------------------------------------

describe("GET /api/addresses", () => {
  // TC-INT-ADDR-001
  it("TC-INT-ADDR-001 — admin retrieves all shipping addresses", async () => {
    const { user: admin, token } = await adminSession();
    const { user: customer } = await customerSession();
    await createAddress(customer._id);

    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  // TC-INT-ADDR-002
  it("TC-INT-ADDR-002 — returns 401 without token", async () => {
    const res = await request(app).get("/api/addresses");
    expect(res.status).toBe(401);
  });

  // TC-INT-ADDR-003
  it("TC-INT-ADDR-003 — returns 403 with customer token [KNOWN GAP: customers cannot list their own addresses]", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/addresses/:id  [ADMIN ONLY]
// ---------------------------------------------------------------------------

describe("GET /api/addresses/:id", () => {
  // TC-INT-ADDR-004
  it("TC-INT-ADDR-004 — admin retrieves address by id", async () => {
    const { token } = await adminSession();
    const { user } = await customerSession();
    const addr = await createAddress(user._id);

    const res = await request(app)
      .get(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.city).toBe("Test City");
  });

  // TC-INT-ADDR-005
  it("TC-INT-ADDR-005 — returns 404 for valid but non-existent ObjectId", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .get(`/api/addresses/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-ADDR-006
  it("TC-INT-ADDR-006 — returns 422 for non-MongoId param", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .get("/api/addresses/bad-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
  });

  // TC-INT-ADDR-007
  it("TC-INT-ADDR-007 — returns 401 without token", async () => {
    const res = await request(app).get(`/api/addresses/${validObjectId()}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-ADDR-008
  it("TC-INT-ADDR-008 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get(`/api/addresses/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/addresses
// ---------------------------------------------------------------------------

describe("POST /api/addresses", () => {
  // TC-INT-ADDR-009
  it("TC-INT-ADDR-009 — authenticated customer creates shipping address", async () => {
    const { user, token } = await customerSession();

    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send(validAddressBody(user._id.toString()));

    expect(res.status).toBe(201);
    expect(res.body.city).toBe("New York");
    expect(res.body.country).toBe("US");
    expect(res.body.user._id).toBe(user._id.toString());
  });

  // TC-INT-ADDR-010
  it("TC-INT-ADDR-010 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const res = await request(app)
      .post("/api/addresses")
      .send(validAddressBody(user._id.toString()));
    expect(res.status).toBe(401);
  });

  // TC-INT-ADDR-011
  it("TC-INT-ADDR-011 — returns 422 when address1 is missing", async () => {
    const { user, token } = await customerSession();
    const body = validAddressBody(user._id.toString());
    delete body.address1;
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "address1")).toBe(true);
  });

  // TC-INT-ADDR-012
  it("TC-INT-ADDR-012 — returns 422 when postalCode is missing", async () => {
    const { user, token } = await customerSession();
    const body = validAddressBody(user._id.toString());
    delete body.postalCode;
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(422);
  });

  // TC-INT-ADDR-013
  it("TC-INT-ADDR-013 — returns 422 when city is missing", async () => {
    const { user, token } = await customerSession();
    const body = validAddressBody(user._id.toString());
    delete body.city;
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(422);
  });

  // TC-INT-ADDR-014
  it("TC-INT-ADDR-014 — returns 422 when country is missing", async () => {
    const { user, token } = await customerSession();
    const body = validAddressBody(user._id.toString());
    delete body.country;
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/addresses/:id
// ---------------------------------------------------------------------------

describe("PUT /api/addresses/:id", () => {
  // TC-INT-ADDR-015
  it("TC-INT-ADDR-015 — authenticated user updates city and country", async () => {
    const { user, token } = await customerSession();
    const addr = await createAddress(user._id);

    const res = await request(app)
      .put(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "Los Angeles", country: "US" });

    expect(res.status).toBe(200);
    expect(res.body.city).toBe("Los Angeles");
  });

  // TC-INT-ADDR-016
  it("TC-INT-ADDR-016 — postalCode update is applied correctly [BUG-003 RESOLVED]", async () => {
    const { user, token } = await customerSession();
    const addr = await createAddress(user._id, { postalCode: "10001" });

    const res = await request(app)
      .put(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ postalCode: "90210" });

    // BUG-003 RESOLVED: shippingAddressController now correctly destructures
    // `postalCode` (uppercase C) from req.body. The update is applied.
    expect(res.status).toBe(200);
    expect(res.body.postalCode).toBe("90210"); // value updated correctly
  });

  // TC-INT-ADDR-017
  it("TC-INT-ADDR-017 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const addr = await createAddress(user._id);
    const res = await request(app)
      .put(`/api/addresses/${addr._id}`)
      .send({ city: "Chicago" });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/addresses/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/addresses/:id", () => {
  // TC-INT-ADDR-018
  it("TC-INT-ADDR-018 — authenticated user deletes their address", async () => {
    const { user, token } = await customerSession();
    const addr = await createAddress(user._id);

    const res = await request(app)
      .delete(`/api/addresses/${addr._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  // TC-INT-ADDR-019
  it("TC-INT-ADDR-019 — returns 404 for non-existent address", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .delete(`/api/addresses/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-ADDR-020
  it("TC-INT-ADDR-020 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const addr = await createAddress(user._id);
    const res = await request(app).delete(`/api/addresses/${addr._id}`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/addresses/user/:id  [AUTH ONLY — added during frontend connection]
// ---------------------------------------------------------------------------

describe("GET /api/addresses/user/:id", () => {
  // TC-INT-ADDR-021
  it("TC-INT-ADDR-021 — authenticated user retrieves addresses by user id", async () => {
    const { user, token } = await customerSession();
    await createAddress(user._id, { city: "CDMX" });
    await createAddress(user._id, { city: "Guadalajara" });

    const res = await request(app)
      .get(`/api/addresses/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].user._id).toBe(user._id.toString());
  });

  // TC-INT-ADDR-022
  it("TC-INT-ADDR-022 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const res = await request(app).get(`/api/addresses/user/${user._id}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-ADDR-023
  it("TC-INT-ADDR-023 — returns empty array for user with no addresses", async () => {
    const { user, token } = await customerSession();

    const res = await request(app)
      .get(`/api/addresses/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // TC-INT-ADDR-024
  it("TC-INT-ADDR-024 — returns 422 for non-MongoId param", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/addresses/user/not-a-valid-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
  });
});
