import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";
import requestLogger from "../../../src/middleware/requestLogger.js";
import logger from "../../../src/config/logger.js";

vi.mock("../../../src/config/logger.js", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// res needs to behave like a real http.ServerResponse for the "finish" event
// and header-setting used by the middleware.
const mockRes = () => {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.setHeader = vi.fn();
  return res;
};

describe("requestLogger — unit", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {}, method: "GET", originalUrl: "/api/products" };
    res = mockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  // TC-UNIT-MW-RL-001
  it("TC-UNIT-MW-RL-001 — generates a request id when no x-request-id header is present", () => {
    requestLogger(req, res, next);

    expect(req.id).toBeTruthy();
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", req.id);
  });

  // TC-UNIT-MW-RL-002
  it("TC-UNIT-MW-RL-002 — reuses an inbound x-request-id header instead of generating one", () => {
    req.headers["x-request-id"] = "client-supplied-id";

    requestLogger(req, res, next);

    expect(req.id).toBe("client-supplied-id");
    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", "client-supplied-id");
  });

  // TC-UNIT-MW-RL-003
  it("TC-UNIT-MW-RL-003 — calls next() synchronously", () => {
    requestLogger(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  // TC-UNIT-MW-RL-004
  it("TC-UNIT-MW-RL-004 — logs at info for a 200 response on finish", () => {
    requestLogger(req, res, next);
    res.statusCode = 200;
    res.emit("finish");

    expect(logger.info).toHaveBeenCalledWith(
      "request",
      expect.objectContaining({
        requestId: req.id,
        method: "GET",
        url: "/api/products",
        status: 200,
      }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-RL-005
  it("TC-UNIT-MW-RL-005 — logs at warn for a 404 response on finish", () => {
    requestLogger(req, res, next);
    res.statusCode = 404;
    res.emit("finish");

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-RL-006
  it("TC-UNIT-MW-RL-006 — logs at error for a 500 response on finish", () => {
    requestLogger(req, res, next);
    res.statusCode = 500;
    res.emit("finish");

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-RL-007
  it("TC-UNIT-MW-RL-007 — logged meta includes durationMs and userId when req.user is set", () => {
    req.user = { userId: "abc123" };

    requestLogger(req, res, next);
    res.statusCode = 200;
    res.emit("finish");

    const [, meta] = logger.info.mock.calls[0];
    expect(typeof meta.durationMs).toBe("number");
    expect(meta.userId).toBe("abc123");
  });
});
