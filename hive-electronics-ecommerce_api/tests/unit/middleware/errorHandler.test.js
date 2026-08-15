import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import errorHandler from "../../../src/middleware/errorHandler.js";
import logger from "../../../src/config/logger.js";

vi.mock("../../../src/config/logger.js", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  serializeError: (error) => ({ name: error.name, message: error.message }),
}));

const mockRes = ({ headersSent = false } = {}) => {
  const res = { headersSent, status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

describe("errorHandler — unit", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let req;
  let next;

  beforeEach(() => {
    req = { id: "req-1", method: "GET", originalUrl: "/api/orders" };
    next = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  // TC-UNIT-MW-EH-001
  it("TC-UNIT-MW-EH-001 — delegates to next(err) and never touches res when headers are already sent", () => {
    const res = mockRes({ headersSent: true });
    const err = new Error("double send");

    errorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-EH-002
  it("TC-UNIT-MW-EH-002 — masks the message with 'Internal server error' for a 5xx in production", () => {
    process.env.NODE_ENV = "production";
    const res = mockRes();
    const err = new Error("CastError: Cast to ObjectId failed for value \"x\"");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error", requestId: "req-1" });
  });

  // TC-UNIT-MW-EH-003
  it("TC-UNIT-MW-EH-003 — still exposes the real message for a 4xx in production", () => {
    process.env.NODE_ENV = "production";
    const res = mockRes();
    const err = new Error("Validation failed");
    err.status = 400;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Validation failed", requestId: "req-1" });
  });

  // TC-UNIT-MW-EH-004
  it("TC-UNIT-MW-EH-004 — exposes the real 5xx message outside production", () => {
    process.env.NODE_ENV = "test";
    const res = mockRes();
    const err = new Error("boom");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "boom", requestId: "req-1" });
  });

  // TC-UNIT-MW-EH-005
  it("TC-UNIT-MW-EH-005 — defaults to 500 and logs at error when the error carries no status", () => {
    const res = mockRes();
    const err = new Error("unknown");

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-EH-006
  it("TC-UNIT-MW-EH-006 — logs at warn (not error) for a 4xx status", () => {
    const res = mockRes();
    const err = new Error("not found");
    err.status = 404;

    errorHandler(err, req, res, next);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-EH-007
  it("TC-UNIT-MW-EH-007 — falls back to statusCode when status is absent", () => {
    const res = mockRes();
    const err = new Error("teapot");
    err.statusCode = 418;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(418);
  });
});
