import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import ShippingAddress from "../../../src/models/ShippingAddress.js";

// All tests use validateSync() — no DB connection required.

const fakeObjectId = () => new mongoose.Types.ObjectId();

const validAddressData = () => ({
  user: fakeObjectId(),
  address1: "123 Test Street",
  postalCode: "10001",
  city: "New York",
  country: "US",
});

describe("ShippingAddress model — schema validation", () => {
  it("TC-UNIT-ADDR-SCHEMA-001 — valid document passes validateSync()", () => {
    const doc = new ShippingAddress(validAddressData());
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("TC-UNIT-ADDR-SCHEMA-002 — missing user fails validation", () => {
    const { user, ...data } = validAddressData();
    const doc = new ShippingAddress(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it("TC-UNIT-ADDR-SCHEMA-003 — missing address1 fails validation", () => {
    const { address1, ...data } = validAddressData();
    const doc = new ShippingAddress(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.address1).toBeDefined();
  });

  it("TC-UNIT-ADDR-SCHEMA-004 — missing postalCode fails validation", () => {
    const { postalCode, ...data } = validAddressData();
    const doc = new ShippingAddress(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.postalCode).toBeDefined();
  });

  it("TC-UNIT-ADDR-SCHEMA-005 — missing city fails validation", () => {
    const { city, ...data } = validAddressData();
    const doc = new ShippingAddress(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.city).toBeDefined();
  });

  it("TC-UNIT-ADDR-SCHEMA-006 — missing country fails validation", () => {
    const { country, ...data } = validAddressData();
    const doc = new ShippingAddress(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.country).toBeDefined();
  });

  it("TC-UNIT-ADDR-SCHEMA-007 — defaultAddress defaults to false when not provided", () => {
    const doc = new ShippingAddress(validAddressData());
    expect(doc.defaultAddress).toBe(false);
  });
});
