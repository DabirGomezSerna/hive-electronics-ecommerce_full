/**
 * Integration tests — the error-handling middleware and request correlation ids.
 *
 * app.test.js documents that routes registered after createApp() land after
 * the 404 catch-all and so cannot reach the error handler without modifying
 * production source. This file closes that gap without touching production
 * code: a malformed JSON body makes express.json() throw synchronously,
 * which skips the 3-arity 404 handler and lands on the 4-arity error
 * middleware (src/middleware/errorHandler.js) exactly as a controller error
 * would.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close, clear } from "../helpers/db.js";

const app = createApp();

beforeAll(() => connect());
afterAll(() => close());
beforeEach(() => clear());

describe("Request correlation id", () => {
  it("TC-INT-EH-001 — every response carries an X-Request-Id header", async () => {
    const res = await request(app).get("/api/products");

    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("TC-INT-EH-002 — an inbound x-request-id is echoed back on the response", async () => {
    const res = await request(app)
      .get("/api/products")
      .set("x-request-id", "client-generated-id-123");

    expect(res.headers["x-request-id"]).toBe("client-generated-id-123");
  });
});

describe("Error-handling middleware", () => {
  it("TC-INT-EH-003 — a malformed JSON body reaches the error handler and returns 400 with a requestId", async () => {
    const res = await request(app)
      .post("/api/login")
      .set("Content-Type", "application/json")
      .send("{ not valid json");

    expect(res.status).toBe(400);
    expect(res.body.requestId).toBeDefined();
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });

  it("TC-INT-EH-004 — the requestId in an error body matches the inbound x-request-id when supplied", async () => {
    const res = await request(app)
      .post("/api/login")
      .set("Content-Type", "application/json")
      .set("x-request-id", "malformed-body-request")
      .send("{ still not valid json");

    expect(res.status).toBe(400);
    expect(res.body.requestId).toBe("malformed-body-request");
  });
});
