import { describe, it, expect, vi, beforeEach } from "vitest";
import isAdmin from "../../../src/middleware/isAdminMiddleware.js";

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

describe("isAdminMiddleware — unit", () => {
  let res;
  let next;

  beforeEach(() => {
    res = mockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  // TC-UNIT-ADM-001
  it("TC-UNIT-ADM-001 — returns 401 when req.user is undefined (no auth middleware ran)", () => {
    const req = {};

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication is required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // TC-UNIT-ADM-002
  it("TC-UNIT-ADM-002 — returns 403 when user role is customer", () => {
    const req = { user: { userId: "abc", role: "customer" } };

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Admin access required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // TC-UNIT-ADM-003
  it("TC-UNIT-ADM-003 — calls next() when user role is admin", () => {
    const req = { user: { userId: "abc", role: "admin" } };

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  // TC-UNIT-ADM-004
  it("TC-UNIT-ADM-004 — returns 403 for any role that is not exactly 'admin'", () => {
    const roles = ["ADMIN", "Admin", "superadmin", "moderator", ""];
    for (const role of roles) {
      const req = { user: { role } };
      isAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      vi.clearAllMocks();
    }
  });
});
