/**
 * Integration tests — OpenAPI/Swagger documentation endpoints
 *
 * Covers /api-docs (Swagger UI) and /api-docs.json (raw OpenAPI document),
 * mounted in src/app.js before the 404 catch-all, and their production
 * gating via NODE_ENV / ENABLE_DOCS.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import createApp from "../../src/app.js";
import { connect, close } from "../helpers/db.js";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_ENABLE_DOCS = process.env.ENABLE_DOCS;

beforeAll(() => connect());
afterAll(() => close());

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  process.env.ENABLE_DOCS = ORIGINAL_ENABLE_DOCS;
});

// ── Docs enabled (default, non-production) ──────────────────────────────────

describe("GET /api-docs.json", () => {
  it("TC-INT-DOCS-001 — returns a valid OpenAPI document", async () => {
    const app = createApp();
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("Hive Electronics Ecommerce API");
    expect(res.body.paths).toBeTypeOf("object");
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
    expect(res.body.components.schemas.User).toBeDefined();
    expect(res.body.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });
});

describe("GET /api-docs", () => {
  it("TC-INT-DOCS-002 — serves the Swagger UI page", async () => {
    const app = createApp();
    const res = await request(app).get("/api-docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
  });
});

// ── Production gating ────────────────────────────────────────────────────────

describe("Production gating", () => {
  it("TC-INT-DOCS-003 — NODE_ENV=production without ENABLE_DOCS falls through to the 404 catch-all", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.ENABLE_DOCS;

    const app = createApp();
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
  });

  it("TC-INT-DOCS-004 — NODE_ENV=production with ENABLE_DOCS=true still serves the docs", async () => {
    process.env.NODE_ENV = "production";
    process.env.ENABLE_DOCS = "true";

    const app = createApp();
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
  });
});
