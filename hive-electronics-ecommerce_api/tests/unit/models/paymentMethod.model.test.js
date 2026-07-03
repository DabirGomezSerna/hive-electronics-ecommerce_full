import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import PaymentMethod from "../../../src/models/PaymentMethod.js";

// All tests use validateSync() — no DB connection required.
// Note: cardNumber has `max: 16` in the schema, but Mongoose applies `max`
// only to Number fields. On String fields it is a no-op — length enforcement
// is handled by express-validator at the route level.

const fakeObjectId = () => new mongoose.Types.ObjectId();

const validPaymentData = () => ({
  user: fakeObjectId(),
  type: "cash_on_delivery",
});

describe("PaymentMethod model — schema validation", () => {
  it("TC-UNIT-PAY-SCHEMA-001 — valid document passes validateSync()", () => {
    const doc = new PaymentMethod(validPaymentData());
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("TC-UNIT-PAY-SCHEMA-002 — missing user fails validation", () => {
    const { user, ...data } = validPaymentData();
    const doc = new PaymentMethod(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it("TC-UNIT-PAY-SCHEMA-003 — missing type fails validation", () => {
    const { type, ...data } = validPaymentData();
    const doc = new PaymentMethod(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  it("TC-UNIT-PAY-SCHEMA-004 — invalid type value fails enum validation", () => {
    const doc = new PaymentMethod({ ...validPaymentData(), type: "bitcoin" });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  it("TC-UNIT-PAY-SCHEMA-005 — isDefault defaults to false when not provided", () => {
    const doc = new PaymentMethod(validPaymentData());
    expect(doc.isDefault).toBe(false);
  });

  it("TC-UNIT-PAY-SCHEMA-006 — isActive defaults to true when not provided", () => {
    const doc = new PaymentMethod(validPaymentData());
    expect(doc.isActive).toBe(true);
  });
});
