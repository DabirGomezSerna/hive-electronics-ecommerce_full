import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// logger.js resolves LOG_LEVEL/NODE_ENV per call, so no need to reset modules
// between cases — just save/restore the env vars each test touches.
import logger, { serializeError } from "../../../src/config/logger.js";

describe("logger — unit", () => {
  const originalLogLevel = process.env.LOG_LEVEL;
  const originalNodeEnv = process.env.NODE_ENV;
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.LOG_LEVEL = originalLogLevel;
    process.env.NODE_ENV = originalNodeEnv;
  });

  // TC-UNIT-LOG-001
  it("TC-UNIT-LOG-001 — LOG_LEVEL=warn suppresses info but emits warn and error", () => {
    process.env.LOG_LEVEL = "warn";

    logger.info("should be suppressed");
    logger.warn("should be emitted");
    logger.error("should be emitted");

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  // TC-UNIT-LOG-002
  it("TC-UNIT-LOG-002 — LOG_LEVEL=silent suppresses every level", () => {
    process.env.LOG_LEVEL = "silent";

    logger.error("nope");
    logger.warn("nope");
    logger.info("nope");
    logger.debug("nope");

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  // TC-UNIT-LOG-003
  it("TC-UNIT-LOG-003 — NODE_ENV=production emits a single JSON line with the expected shape", () => {
    process.env.LOG_LEVEL = "debug";
    process.env.NODE_ENV = "production";

    logger.info("hello", { foo: "bar" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0][0];
    const entry = JSON.parse(line);
    expect(entry).toMatchObject({ level: "info", message: "hello", foo: "bar" });
    expect(typeof entry.time).toBe("string");
  });

  // TC-UNIT-LOG-004
  it("TC-UNIT-LOG-004 — non-production emits a human-readable line, not JSON", () => {
    process.env.LOG_LEVEL = "debug";
    process.env.NODE_ENV = "development";

    logger.info("hello", { foo: "bar" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = logSpy.mock.calls[0][0];
    expect(() => JSON.parse(line)).toThrow();
    expect(line).toContain("INFO");
    expect(line).toContain("hello");
  });

  // TC-UNIT-LOG-005
  it("TC-UNIT-LOG-005 — logger.error routes to console.error, others route to console.log", () => {
    process.env.LOG_LEVEL = "debug";

    logger.error("e");
    logger.warn("w");
    logger.info("i");
    logger.debug("d");

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  // TC-UNIT-LOG-006
  it("TC-UNIT-LOG-006 — serializeError extracts name/message/stack/code from an Error", () => {
    const err = new Error("boom");
    err.code = "ECONNREFUSED";

    expect(serializeError(err)).toMatchObject({
      name: "Error",
      message: "boom",
      code: "ECONNREFUSED",
    });
    expect(serializeError(err).stack).toContain("boom");
  });

  // TC-UNIT-LOG-007
  it("TC-UNIT-LOG-007 — serializeError wraps a non-Error value as { message }", () => {
    expect(serializeError("just a string")).toEqual({ message: "just a string" });
  });

  // TC-UNIT-LOG-008
  it("TC-UNIT-LOG-008 — an unrecognized LOG_LEVEL value falls back to the NODE_ENV default", () => {
    process.env.LOG_LEVEL = "not-a-real-level";
    process.env.NODE_ENV = "test";

    logger.error("still silent under test default");

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
