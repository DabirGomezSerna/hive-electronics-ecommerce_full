/**
 * Unit tests — logger
 *
 * The level is resolved per call (not at module load), so these tests flip
 * process.env.REACT_APP_LOG_LEVEL between cases without needing to reset
 * modules.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import logger, { setLogSink } from "../../services/logger";

describe("logger — unit", () => {
  const originalLogLevel = process.env.REACT_APP_LOG_LEVEL;
  const originalNodeEnv = process.env.NODE_ENV;
  let logSpy;
  let infoSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setLogSink(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.REACT_APP_LOG_LEVEL = originalLogLevel;
    process.env.NODE_ENV = originalNodeEnv;
    setLogSink(null);
  });

  // TC-UNIT-FE-LOG-001
  it("TC-UNIT-FE-LOG-001 — REACT_APP_LOG_LEVEL=error suppresses info but emits error", () => {
    process.env.REACT_APP_LOG_LEVEL = "error";

    logger.info("suppressed");
    logger.error("emitted");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  // TC-UNIT-FE-LOG-002
  it("TC-UNIT-FE-LOG-002 — REACT_APP_LOG_LEVEL=silent suppresses every level", () => {
    process.env.REACT_APP_LOG_LEVEL = "silent";

    logger.error("nope");
    logger.warn("nope");
    logger.info("nope");
    logger.debug("nope");

    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  // TC-UNIT-FE-LOG-003
  it("TC-UNIT-FE-LOG-003 — debug routes through console.log, not console.debug", () => {
    process.env.REACT_APP_LOG_LEVEL = "debug";

    logger.debug("verbose");

    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  // TC-UNIT-FE-LOG-004
  it("TC-UNIT-FE-LOG-004 — an Error passed as context.error is serialized, not passed through raw", () => {
    process.env.REACT_APP_LOG_LEVEL = "debug";
    const err = new Error("boom");
    err.status = 404;

    logger.error("failed", { error: err });

    const [, entry] = errorSpy.mock.calls[0];
    expect(entry.error).toMatchObject({ name: "Error", message: "boom", status: 404 });
    expect(entry.error).not.toBeInstanceOf(Error);
  });

  // TC-UNIT-FE-LOG-005
  it("TC-UNIT-FE-LOG-005 — setLogSink receives the emitted entry", () => {
    process.env.REACT_APP_LOG_LEVEL = "debug";
    const sink = vi.fn();
    setLogSink(sink);

    logger.warn("something", { foo: "bar" });

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0]).toMatchObject({
      level: "warn",
      message: "something",
      foo: "bar",
    });
  });

  // TC-UNIT-FE-LOG-006
  it("TC-UNIT-FE-LOG-006 — a sink that throws does not propagate or block logging", () => {
    process.env.REACT_APP_LOG_LEVEL = "debug";
    setLogSink(() => {
      throw new Error("sink exploded");
    });

    expect(() => logger.debug("still works")).not.toThrow();
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  // TC-UNIT-FE-LOG-007
  it("TC-UNIT-FE-LOG-007 — an unrecognized level value falls back to the NODE_ENV default", () => {
    process.env.REACT_APP_LOG_LEVEL = "not-a-real-level";
    process.env.NODE_ENV = "test";

    logger.error("still silent under test default");

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
