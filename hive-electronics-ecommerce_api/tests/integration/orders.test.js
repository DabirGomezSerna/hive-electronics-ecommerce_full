import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import {
  adminSession,
  customerSession,
  createCategory,
  createProduct,
  createAddress,
  createPaymentMethod,
  validObjectId,
} from "../helpers/fixtures.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// Helper that creates a complete order fixture (user + address + payment + products)
const buildOrderFixture = async () => {
  const { user, token } = await customerSession();
  const cat = await createCategory();
  const prod = await createProduct(cat._id, { price: 99.99 });
  const addr = await createAddress(user._id);
  const pm = await createPaymentMethod(user._id);
  return { user, token, prod, addr, pm };
};

const orderBody = ({ user, prod, addr, pm }) => ({
  user: user._id.toString(),
  products: [
    {
      product: prod._id.toString(),
      quantity: 2,
      price: 99.99,
    },
  ],
  address: addr._id.toString(),
  paymentMethod: pm._id.toString(),
  shippingCost: 5.0,
});

// ---------------------------------------------------------------------------
// GET /api/orders  [ADMIN ONLY — BUG-001: array.populate not a function]
// ---------------------------------------------------------------------------

describe("GET /api/orders", () => {
  // TC-INT-ORD-001
  it("TC-INT-ORD-001 — returns 500 [BUG-001: Order.find() returns array, array.populate() is not a function]", async () => {
    const { token } = await adminSession();

    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`);

    // BUG-001: orderController.getOrders chains .populate() on the result of
    // Order.find() which is an array, not a Mongoose query. This throws
    // "TypeError: orders.populate is not a function" and results in a 500.
    // Expected correct behavior: 200 with array of orders.
    // Fix: chain .populate() directly on Order.find() query before awaiting.
    expect(res.status).toBe(500); // documents the bug — fix to 200
  });

  // TC-INT-ORD-002
  it("TC-INT-ORD-002 — returns 401 without token", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  // TC-INT-ORD-003
  it("TC-INT-ORD-003 — returns 403 with customer token", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------

describe("POST /api/orders", () => {
  // TC-INT-ORD-004
  it("TC-INT-ORD-004 — creates order and calculates totalPrice = (price * qty) + shippingCost", async () => {
    const fixture = await buildOrderFixture();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(orderBody(fixture));

    // (99.99 * 2) + 5.00 = 204.98
    expect(res.status).toBe(201);
    expect(res.body.totalPrice).toBe(204.98);
    expect(res.body.status).toBe("pending");
    expect(res.body.paymentStatus).toBe("pending");
  });

  // TC-INT-ORD-005
  it("TC-INT-ORD-005 — totalPrice is rounded to 2 decimal places", async () => {
    const fixture = await buildOrderFixture();
    const body = {
      ...orderBody(fixture),
      products: [{ product: fixture.prod._id.toString(), quantity: 1, price: 10.005 }],
      shippingCost: 0,
    };
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(Number.isInteger((res.body.totalPrice * 100))).toBe(true); // max 2 decimal places
  });

  // TC-INT-ORD-006
  it("TC-INT-ORD-006 — returns 401 without token", async () => {
    const fixture = await buildOrderFixture();
    const res = await request(app).post("/api/orders").send(orderBody(fixture));
    expect(res.status).toBe(401);
  });

  // TC-INT-ORD-007
  it("TC-INT-ORD-007 — returns 422 when products array is missing", async () => {
    const fixture = await buildOrderFixture();
    const body = orderBody(fixture);
    delete body.products;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(body);
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "products")).toBe(true);
  });

  // TC-INT-ORD-008
  it("TC-INT-ORD-008 — returns 422 when address is missing", async () => {
    const fixture = await buildOrderFixture();
    const body = orderBody(fixture);
    delete body.address;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(body);
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "address")).toBe(true);
  });

  // TC-INT-ORD-009
  it("TC-INT-ORD-009 — returns 422 when paymentMethod is missing", async () => {
    const fixture = await buildOrderFixture();
    const body = orderBody(fixture);
    delete body.paymentMethod;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(body);
    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.path === "paymentMethod")).toBe(true);
  });

  // TC-INT-ORD-010
  it("TC-INT-ORD-010 — returns 422 when product price is negative", async () => {
    const fixture = await buildOrderFixture();
    const body = {
      ...orderBody(fixture),
      products: [{ product: fixture.prod._id.toString(), quantity: 1, price: -5 }],
    };
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(body);
    expect(res.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id
// ---------------------------------------------------------------------------

describe("GET /api/orders/:id", () => {
  // TC-INT-ORD-011
  it("TC-INT-ORD-011 — authenticated user retrieves order by id", async () => {
    const fixture = await buildOrderFixture();
    const createRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(orderBody(fixture));

    const orderId = createRes.body._id;
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${fixture.token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(orderId);
  });

  // TC-INT-ORD-012
  it("TC-INT-ORD-012 — returns 404 for valid but non-existent ObjectId", async () => {
    const { token } = await customerSession();
    const res = await request(app)
      .get(`/api/orders/${validObjectId()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  // TC-INT-ORD-013
  it("TC-INT-ORD-013 — returns 401 without token", async () => {
    const res = await request(app).get(`/api/orders/${validObjectId()}`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/orders/user/:id
// ---------------------------------------------------------------------------

describe("GET /api/orders/user/:id", () => {
  // TC-INT-ORD-014
  it("TC-INT-ORD-014 — authenticated user retrieves their order list", async () => {
    const fixture = await buildOrderFixture();
    await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(orderBody(fixture));

    const res = await request(app)
      .get(`/api/orders/user/${fixture.user._id}`)
      .set("Authorization", `Bearer ${fixture.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  // TC-INT-ORD-015
  it("TC-INT-ORD-015 — returns empty array when user has no orders", async () => {
    const { user, token } = await customerSession();
    const res = await request(app)
      .get(`/api/orders/user/${user._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // TC-INT-ORD-016
  it("TC-INT-ORD-016 — returns 401 without token", async () => {
    const res = await request(app).get(`/api/orders/user/${validObjectId()}`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/orders/:id
// ---------------------------------------------------------------------------

describe("PUT /api/orders/:id", () => {
  // TC-INT-ORD-017
  it("TC-INT-ORD-017 — updates order status to processing", async () => {
    const fixture = await buildOrderFixture();
    const createRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(orderBody(fixture));

    const orderId = createRes.body._id;
    const res = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({ status: "processing" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processing");
  });

  // TC-INT-ORD-018
  it("TC-INT-ORD-018 — updates paymentStatus to paid", async () => {
    const fixture = await buildOrderFixture();
    const createRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(orderBody(fixture));

    const res = await request(app)
      .put(`/api/orders/${createRes.body._id}`)
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({ paymentStatus: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe("paid");
  });

  // TC-INT-ORD-019
  it("TC-INT-ORD-019 — returns 422 for invalid status value", async () => {
    const fixture = await buildOrderFixture();
    const createRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${fixture.token}`)
      .send(orderBody(fixture));

    const res = await request(app)
      .put(`/api/orders/${createRes.body._id}`)
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({ status: "approved" }); // not in enum
    expect(res.status).toBe(422);
  });

  // TC-INT-ORD-020
  it("TC-INT-ORD-020 — returns 401 without token", async () => {
    const res = await request(app)
      .put(`/api/orders/${validObjectId()}`)
      .send({ status: "processing" });
    expect(res.status).toBe(401);
  });
});
