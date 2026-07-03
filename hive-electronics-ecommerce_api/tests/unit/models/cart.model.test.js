import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Cart from "../../../src/models/Cart.js";

// All tests use validateSync() — no DB connection required.

const fakeObjectId = () => new mongoose.Types.ObjectId();

describe("Cart model — schema validation", () => {
  it("TC-UNIT-CART-SCHEMA-001 — valid cart with user and products passes validateSync()", () => {
    const doc = new Cart({
      user: fakeObjectId(),
      products: [{ product: fakeObjectId(), quantity: 2 }],
    });
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("TC-UNIT-CART-SCHEMA-002 — missing user fails validation", () => {
    const doc = new Cart({
      products: [{ product: fakeObjectId(), quantity: 1 }],
    });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.user).toBeDefined();
  });

  it("TC-UNIT-CART-SCHEMA-003 — product quantity below 1 fails min validation", () => {
    const doc = new Cart({
      user: fakeObjectId(),
      products: [{ product: fakeObjectId(), quantity: 0 }],
    });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors["products.0.quantity"]).toBeDefined();
  });
});
