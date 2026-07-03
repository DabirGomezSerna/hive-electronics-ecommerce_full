import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Product from "../../../src/models/Product.js";

// All tests use validateSync() — no DB connection required.

const fakeObjectId = () => new mongoose.Types.ObjectId();

const validProductData = () => ({
  name: "Test Product",
  price: 99.99,
  stock: 10,
  category: fakeObjectId(),
});

describe("Product model — schema validation", () => {
  it("TC-UNIT-PROD-SCHEMA-001 — valid document passes validateSync()", () => {
    const doc = new Product(validProductData());
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("TC-UNIT-PROD-SCHEMA-002 — missing name fails validation", () => {
    const { name, ...data } = validProductData();
    const doc = new Product(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it("TC-UNIT-PROD-SCHEMA-003 — missing category fails validation", () => {
    const { category, ...data } = validProductData();
    const doc = new Product(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.category).toBeDefined();
  });

  it("TC-UNIT-PROD-SCHEMA-004 — price defaults to 0 when not provided", () => {
    const { price, ...data } = validProductData();
    const doc = new Product(data);
    expect(doc.price).toBe(0);
  });

  it("TC-UNIT-PROD-SCHEMA-005 — stock defaults to 0 when not provided", () => {
    const { stock, ...data } = validProductData();
    const doc = new Product(data);
    expect(doc.stock).toBe(0);
  });

  it("TC-UNIT-PROD-SCHEMA-006 — price below 0 fails min validation", () => {
    const doc = new Product({ ...validProductData(), price: -1 });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.price).toBeDefined();
  });

  it("TC-UNIT-PROD-SCHEMA-007 — stock below 0 fails min validation", () => {
    const doc = new Product({ ...validProductData(), stock: -1 });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.stock).toBeDefined();
  });
});
