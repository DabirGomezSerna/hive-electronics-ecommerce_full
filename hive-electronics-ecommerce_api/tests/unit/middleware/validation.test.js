import { describe, it, expect, vi, beforeEach } from "vitest";
import { validationResult } from "express-validator";
import validate from "../../../src/middleware/validation.js";

vi.mock("express-validator", () => ({
  validationResult: vi.fn(),
}));

const makeRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

describe("validate middleware — unit", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = makeRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  it("TC-UNIT-VAL-001 — calls next() once when there are no validation errors", () => {
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    validate(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("TC-UNIT-VAL-002 — returns 422 status when validation errors are present", () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ type: "field", path: "email", msg: "Invalid email" }],
    });
    validate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("TC-UNIT-VAL-003 — response body contains errors array when errors are present", () => {
    const errorList = [{ type: "field", path: "email", msg: "Invalid email" }];
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errorList,
    });
    validate(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ errors: errorList });
  });

  it("TC-UNIT-VAL-004 — does NOT call next() when validation errors are present", () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: "Required" }],
    });
    validate(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("TC-UNIT-VAL-005 — does NOT call res.status or res.json when there are no errors", () => {
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    validate(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
