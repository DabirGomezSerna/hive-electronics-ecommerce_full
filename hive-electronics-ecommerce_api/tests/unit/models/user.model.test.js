import { describe, it, expect } from "vitest";
import User from "../../../src/models/User.js";

// All tests use validateSync() — no DB connection required.

const validUserData = () => ({
  displayName: "Test User",
  email: "test@example.com",
  password: "Secret123!",
});

describe("User model — schema validation", () => {
  it("TC-UNIT-USR-SCHEMA-001 — valid document passes validateSync()", () => {
    const doc = new User(validUserData());
    const error = doc.validateSync();
    expect(error).toBeUndefined();
  });

  it("TC-UNIT-USR-SCHEMA-002 — missing displayName fails validation", () => {
    const { displayName, ...data } = validUserData();
    const doc = new User(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.displayName).toBeDefined();
  });

  it("TC-UNIT-USR-SCHEMA-003 — missing email fails validation", () => {
    const { email, ...data } = validUserData();
    const doc = new User(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it("TC-UNIT-USR-SCHEMA-004 — missing password fails validation", () => {
    const { password, ...data } = validUserData();
    const doc = new User(data);
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.password).toBeDefined();
  });

  it("TC-UNIT-USR-SCHEMA-005 — role defaults to 'customer' when not provided", () => {
    const doc = new User(validUserData());
    expect(doc.role).toBe("customer");
  });

  it("TC-UNIT-USR-SCHEMA-006 — invalid role value fails enum validation", () => {
    const doc = new User({ ...validUserData(), role: "superadmin" });
    const error = doc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.role).toBeDefined();
  });

  it("TC-UNIT-USR-SCHEMA-007 — isActive defaults to true when not provided", () => {
    const doc = new User(validUserData());
    expect(doc.isActive).toBe(true);
  });

  it("TC-UNIT-USR-SCHEMA-008 — avatar field has a non-empty default value", () => {
    const doc = new User(validUserData());
    expect(typeof doc.avatar).toBe("string");
    expect(doc.avatar.length).toBeGreaterThan(0);
  });
});
