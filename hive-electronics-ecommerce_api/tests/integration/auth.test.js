import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";
import User from "../../src/models/User.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// ---------------------------------------------------------------------------
// POST /api/register
// ---------------------------------------------------------------------------

describe("POST /api/register", () => {
  const valid = {
    displayName: "New User",
    email: "newuser@example.com",
    password: "Password123!",
  };

  // TC-INT-AUTH-001
  it("TC-INT-AUTH-001 — returns 201 with displayName, email, role (no password in response)", async () => {
    const res = await request(app).post("/api/register").send(valid);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      displayName: "New User",
      email: "newuser@example.com",
      role: "customer",
    });
    expect(res.body.password).toBeUndefined();
  });

  // TC-INT-AUTH-002
  it("TC-INT-AUTH-002 — returns 400 when email is already registered", async () => {
    await request(app).post("/api/register").send(valid);
    const res = await request(app).post("/api/register").send(valid);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already exist");
  });

  // TC-INT-AUTH-003
  it("TC-INT-AUTH-003 — password stored as bcrypt hash, not plaintext", async () => {
    await request(app).post("/api/register").send(valid);
    const user = await User.findOne({ email: valid.email });

    expect(user.password).not.toBe(valid.password);
    expect(user.password).toMatch(/^\$2b\$10\$/);
  });

  // TC-INT-AUTH-004
  it("TC-INT-AUTH-004 — role is always 'customer' regardless of what is sent in body", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ ...valid, role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe("customer");
    const user = await User.findOne({ email: valid.email });
    expect(user.role).toBe("customer");
  });

  // TC-INT-AUTH-005
  it("TC-INT-AUTH-005 — email is stored in lowercase regardless of input case", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ ...valid, email: "NEWUSER@EXAMPLE.COM" });

    expect(res.status).toBe(201);
    const user = await User.findOne({ email: "newuser@example.com" });
    expect(user).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// POST /api/login
// ---------------------------------------------------------------------------

describe("POST /api/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/register").send({
      displayName: "Login User",
      email: "login@example.com",
      password: "Password123!",
    });
  });

  // TC-INT-AUTH-006
  it("TC-INT-AUTH-006 — returns 200 with token and refreshToken on valid credentials", async () => {
    const res = await request(app).post("/api/login").send({
      email: "login@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
  });

  // TC-INT-AUTH-007
  it("TC-INT-AUTH-007 — returns 400 when email does not exist", async () => {
    const res = await request(app).post("/api/login").send({
      email: "nonexistent@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(400);
  });

  // TC-INT-AUTH-008
  it("TC-INT-AUTH-008 — returns 400 with 'Invalid Credentials' for wrong password", async () => {
    const res = await request(app).post("/api/login").send({
      email: "login@example.com",
      password: "WrongPassword!",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid Credentials");
  });

  // TC-INT-AUTH-009
  it("TC-INT-AUTH-009 — returned JWT contains userId and role in payload", async () => {
    const res = await request(app).post("/api/login").send({
      email: "login@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBeDefined();
    expect(decoded.role).toBe("customer");
  });

  // TC-INT-AUTH-010
  it("TC-INT-AUTH-010 — login is case-insensitive on email (schema normalizes to lowercase)", async () => {
    const res = await request(app).post("/api/login").send({
      email: "LOGIN@EXAMPLE.COM",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
