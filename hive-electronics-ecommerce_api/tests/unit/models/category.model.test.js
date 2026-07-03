import { describe, it, expect } from "vitest";
import Category from "../../../src/models/Category.js";

// All tests use validateSync() — no DB connection required.

describe("Category model — schema validation", () => {
  it("TC-UNIT-CAT-SCHEMA-001 — valid document with name passes validateSync()", () => {
    const doc = new Category({ name: "Electronics" });
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("TC-UNIT-CAT-SCHEMA-002 — missing name fails validation", () => {
    const doc = new Category({});
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.name).toBeDefined();
  });

  it("TC-UNIT-CAT-SCHEMA-003 — parentCategory defaults to null when not provided", () => {
    const doc = new Category({ name: "Laptops" });
    expect(doc.parentCategory).toBeNull();
  });

  it("TC-UNIT-CAT-SCHEMA-004 — imageUrl has a non-empty default value", () => {
    const doc = new Category({ name: "Phones" });
    expect(typeof doc.imageUrl).toBe("string");
    expect(doc.imageUrl.length).toBeGreaterThan(0);
  });
});
