/**
 * Integration tests — Express application-level handlers
 *
 * Covers the two handlers registered directly in src/app.js that are not
 * exercised by any other integration test file:
 *
 *   1. GET /          — root greeting route (line 11)
 *   2. 404 catch-all  — registered after /api routes (line 17)
 *
 * The error handler (line 25) is already covered by any test that triggers
 * next(error) in a controller — for example TC-INT-ORD-001 (BUG-001) causes
 * a TypeError that flows through the error handler.
 *
 * Note: routes added after createApp() land after the 404 catch-all in
 * Express's stack and cannot be used to test the error handler directly
 * without modifying production source, so error-handler tests are omitted here.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

// ── Root route ─────────────────────────────────────────────────────────────────

describe("GET /", () => {
  it("TC-INT-APP-001 — returns 200 with greeting text", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.text).toBe("API Ecommerce with MongoDB");
  });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────

describe("404 catch-all handler", () => {
  it("TC-INT-APP-002 — GET on an unknown /api/* path returns 404 with error envelope", async () => {
    const res = await request(app).get("/api/nonexistent-route");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
    expect(res.body.method).toBe("GET");
    expect(res.body.url).toBe("/api/nonexistent-route");
  });

  it("TC-INT-APP-003 — DELETE on an unknown path reflects correct method in the response", async () => {
    const res = await request(app).delete("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
    expect(res.body.method).toBe("DELETE");
    expect(res.body.url).toBe("/api/does-not-exist");
  });

  it("TC-INT-APP-004 — non-/api path returns 404 when no route matches", async () => {
    const res = await request(app).get("/completely-unknown");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
  });
});

