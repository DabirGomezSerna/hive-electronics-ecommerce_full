import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import {
  adminSession,
  customerSession,
  createPaymentMethod,
  validObjectId,
} from "../helpers/fixtures.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// ---------------------------------------------------------------------------
// GET /api/payment-methods  [ADMIN ONLY]
// ---------------------------------------------------------------------------

describe("GET /api/payment-methods", () => {
  // TC-INT-PAY-001
  it("TC-INT-PAY-001 — admin retrieves all payment methods", async () => {
    const { token } = await adminSession();
    const { user } = await customerSession();
    await createPaymentMethod(user._id);

    const res = await request(app)
      .get("/api/payment-methods")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // TC-INT-PAY-002
  it("TC-INT-PAY-002 — returns 401 without token", async () => {
    const res = await request(app).get("/api/payment-methods");
    expect(res.status).toBe(401);
  });

  // TC-INT-PAY-003
  it("TC-INT-PAY-003 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/payment-methods")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/payment-methods/:id  [ADMIN ONLY]
// ---------------------------------------------------------------------------

describe("GET /api/payment-methods/:id", () => {
  // TC-INT-PAY-004
  it("TC-INT-PAY-004 — admin retrieves payment method by id (cvv is excluded)", async () => {
    const { token } = await adminSession();
    const { user } = await customerSession();
    const pm = await createPaymentMethod(user._id, {
      type: "credit_card",
      cardNumber: "4111111111111111",
      cvv: "123",
    });

    const res = await request(app)
      .get(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cardNumber).toBe("4111111111111111");
    expect(res.body.cvv).toBeUndefined();
  });

  // TC-INT-PAY-005
  it("TC-INT-PAY-005 — returns 500 for non-existent id [BUG-004: populate() called on null before null check]", async () => {
    const { token } = await adminSession();
    const res = await request(app)
      .get(`/api/payment-methods/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);

    // BUG-004: getPaymentMethodById calls paymentMethod.populate("user") before
    // checking if paymentMethod is null. When not found, throws
    // "Cannot read properties of null (reading 'populate')".
    // Expected correct behavior: 404. Actual: 500.
    expect(res.status).toBe(500); // documents the bug — fix to 404
  });

  // TC-INT-PAY-006
  it("TC-INT-PAY-006 — returns 401 without token", async () => {
    const res = await request(app).get(`/api/payment-methods/${validObjectId()}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-PAY-007
  it("TC-INT-PAY-007 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get(`/api/payment-methods/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/payment-methods
// ---------------------------------------------------------------------------

describe("POST /api/payment-methods", () => {
  // TC-INT-PAY-008
  it("TC-INT-PAY-008 — authenticated user creates payment method", async () => {
    const { user, token } = await customerSession();

    const res = await request(app)
      .post("/api/payment-methods")
      .set("Authorization", `Bearer ${token}`)
      .send({ user: user._id.toString(), type: "cash_on_delivery" });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe("cash_on_delivery");
    expect(res.body.user._id).toBe(user._id.toString());
  });

  // TC-INT-PAY-009
  it("TC-INT-PAY-009 — creating a new isDefault payment method unsets previous default", async () => {
    const { user, token } = await customerSession();
    const first = await createPaymentMethod(user._id, { type: "paypal", isDefault: true });

    const res = await request(app)
      .post("/api/payment-methods")
      .set("Authorization", `Bearer ${token}`)
      .send({
        user: user._id.toString(),
        type: "cash_on_delivery",
        isDefault: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.isDefault).toBe(true);

    // Previous method should now have isDefault: false
    const PaymentMethod = (await import("../../src/models/PaymentMethod.js")).default;
    const previous = await PaymentMethod.findById(first._id);
    expect(previous.isDefault).toBe(false);
  });

  // TC-INT-PAY-010
  it("TC-INT-PAY-010 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const res = await request(app)
      .post("/api/payment-methods")
      .send({ user: user._id.toString(), type: "paypal" });
    expect(res.status).toBe(401);
  });

  // TC-INT-PAY-011
  it("TC-INT-PAY-011 — returns 422 when type is missing", async () => {
    const { user, token } = await customerSession();
    const res = await request(app)
      .post("/api/payment-methods")
      .set("Authorization", `Bearer ${token}`)
      .send({ user: user._id.toString() });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "type")).toBe(true);
  });

  // TC-INT-PAY-012
  it("TC-INT-PAY-012 — returns 422 for invalid type value", async () => {
    const { user, token } = await customerSession();
    const res = await request(app)
      .post("/api/payment-methods")
      .set("Authorization", `Bearer ${token}`)
      .send({ user: user._id.toString(), type: "bitcoin" });
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "type")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/payment-methods/:id
// ---------------------------------------------------------------------------

describe("PUT /api/payment-methods/:id", () => {
  // TC-INT-PAY-013
  it("TC-INT-PAY-013 — authenticated user updates payment method type", async () => {
    const { user, token } = await customerSession();
    const pm = await createPaymentMethod(user._id, { type: "paypal" });

    const res = await request(app)
      .put(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "cash_on_delivery" });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe("cash_on_delivery");
  });

  // TC-INT-PAY-014
  it("TC-INT-PAY-014 — returns 500 when updating with isDefault:true [BUG-002: existing.user is undefined]", async () => {
    const { user, token } = await customerSession();
    const pm = await createPaymentMethod(user._id, { type: "paypal" });

    const res = await request(app)
      .put(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isDefault: true });

    // BUG-002: updatePaymentMethod references `existing.user` at line 91
    // but `existing` is never defined in scope. ReferenceError → 500.
    // Expected correct behavior: 200 with isDefault: true and previous unset.
    expect(res.status).toBe(500); // documents the bug
  });

  // TC-INT-PAY-015
  it("TC-INT-PAY-015 — returns 422 for invalid card number length > 16", async () => {
    const { user, token } = await customerSession();
    const pm = await createPaymentMethod(user._id);

    const res = await request(app)
      .put(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ cardNumber: "12345678901234567" }); // 17 digits
    expect(res.status).toBe(422);
  });

  // TC-INT-PAY-016
  it("TC-INT-PAY-016 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const pm = await createPaymentMethod(user._id);
    const res = await request(app)
      .put(`/api/payment-methods/${pm._id}`)
      .send({ type: "paypal" });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/payment-methods/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/payment-methods/:id", () => {
  // TC-INT-PAY-017
  it("TC-INT-PAY-017 — authenticated user deletes payment method", async () => {
    const { user, token } = await customerSession();
    const pm = await createPaymentMethod(user._id);

    const res = await request(app)
      .delete(`/api/payment-methods/${pm._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  // TC-INT-PAY-018
  it("TC-INT-PAY-018 — returns 404 for non-existent payment method", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .delete(`/api/payment-methods/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-PAY-019
  it("TC-INT-PAY-019 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const pm = await createPaymentMethod(user._id);
    const res = await request(app).delete(`/api/payment-methods/${pm._id}`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/payment-methods/user/:id  [AUTH ONLY — added during frontend connection]
// ---------------------------------------------------------------------------

describe("GET /api/payment-methods/user/:id", () => {
  // TC-INT-PAY-020
  it("TC-INT-PAY-020 — authenticated user retrieves payment methods by user id (cvv excluded)", async () => {
    const { user, token } = await customerSession();
    await createPaymentMethod(user._id, {
      type: "credit_card",
      cardNumber: "4111111111111111",
      cvv: "123",
    });
    await createPaymentMethod(user._id, { type: "paypal" });

    const res = await request(app)
      .get(`/api/payment-methods/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].user._id).toBe(user._id.toString());
    expect(res.body[0].cvv).toBeUndefined();
  });

  // TC-INT-PAY-021
  it("TC-INT-PAY-021 — returns 401 without token", async () => {
    const { user } = await customerSession();
    const res = await request(app).get(`/api/payment-methods/user/${user._id}`);
    expect(res.status).toBe(401);
  });

  // TC-INT-PAY-022
  it("TC-INT-PAY-022 — returns empty array for user with no payment methods", async () => {
    const { user, token } = await customerSession();

    const res = await request(app)
      .get(`/api/payment-methods/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // TC-INT-PAY-023
  it("TC-INT-PAY-023 — returns 422 for non-MongoId param", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/payment-methods/user/not-a-valid-id")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(422);
  });
});
