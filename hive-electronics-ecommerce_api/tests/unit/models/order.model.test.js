import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Order from "../../../src/models/Order.js";

// All tests use validateSync() — no DB connection required.

const fakeObjectId = () => new mongoose.Types.ObjectId();

const validOrderData = () => ({
  user: fakeObjectId(),
  products: [{ product: fakeObjectId(), quantity: 1, price: 50 }],
  totalPrice: 55,
  shippingCost: 5,
});

describe("Order model — schema validation", () => {
  it("TC-UNIT-ORD-SCHEMA-001 — valid document passes validateSync()", () => {
    const doc = new Order(validOrderData());
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("TC-UNIT-ORD-SCHEMA-002 — missing user fails validation", () => {
    const { user, ...data } = validOrderData();
    const doc = new Order(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it("TC-UNIT-ORD-SCHEMA-003 — missing totalPrice fails validation", () => {
    const { totalPrice, ...data } = validOrderData();
    const doc = new Order(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.totalPrice).toBeDefined();
  });

  it("TC-UNIT-ORD-SCHEMA-004 — status defaults to 'pending' when not provided", () => {
    const doc = new Order(validOrderData());
    expect(doc.status).toBe("pending");
  });

  it("TC-UNIT-ORD-SCHEMA-005 — paymentStatus defaults to 'pending' when not provided", () => {
    const doc = new Order(validOrderData());
    expect(doc.paymentStatus).toBe("pending");
  });

  it("TC-UNIT-ORD-SCHEMA-006 — invalid status value fails enum validation", () => {
    const doc = new Order({ ...validOrderData(), status: "approved" });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });

  it("TC-UNIT-ORD-SCHEMA-007 — invalid paymentStatus value fails enum validation", () => {
    const doc = new Order({ ...validOrderData(), paymentStatus: "declined" });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.paymentStatus).toBeDefined();
  });
});
