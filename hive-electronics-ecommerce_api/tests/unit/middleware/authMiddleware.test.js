import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import authMiddleware from "../../../src/middleware/authMiddleware.js";

// JWT_SECRET is set by tests/helpers/setup.js via setupFiles
const SECRET = process.env.JWT_SECRET;

const mockRes = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

describe("authMiddleware — unit", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = mockRes();
    next = vi.fn();
    vi.clearAllMocks();
  });

  // TC-UNIT-MW-001
  it("TC-UNIT-MW-001 — returns 401 when Authorization header is absent", () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-002
  it("TC-UNIT-MW-002 — returns 401 when Bearer token is missing (header has no space)", () => {
    req.headers["authorization"] = "Bearer";
    authMiddleware(req, res, next);

    // split(' ')[1] is undefined — jwt.verify(undefined, secret) will error
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-003
  it("TC-UNIT-MW-003 — returns 401 with 'Invalid or expired token' when token is tampered", () => {
    req.headers["authorization"] = "Bearer this.is.not.a.valid.jwt";
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-004
  it("TC-UNIT-MW-004 — calls next() and attaches decoded payload to req.user on valid token", () => {
    const payload = { userId: "abc123", name: "Alice", role: "customer" };
    const token = jwt.sign(payload, SECRET, { expiresIn: "1h" });
    req.headers["authorization"] = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({
      userId: "abc123",
      name: "Alice",
      role: "customer",
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-005
  it("TC-UNIT-MW-005 — returns 401 with 'Invalid or expired token' when token is expired", () => {
    const token = jwt.sign({ userId: "abc123" }, SECRET, { expiresIn: -1 });
    req.headers["authorization"] = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  // TC-UNIT-MW-006
  it("TC-UNIT-MW-006 — returns 401 when token was signed with a different secret", () => {
    const token = jwt.sign({ userId: "abc123" }, "wrong_secret");
    req.headers["authorization"] = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
