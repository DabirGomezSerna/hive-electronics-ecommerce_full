# Security Review Checklist

**For use by:** security-reviewer
**Timing:** Phase 3 (spec STRIDE review) and Phase 8 (implementation security gate)

---

## Authentication and Authorization

- [ ] Every protected route has `authMiddleware` as the first middleware
- [ ] Every admin-only route has `isAdmin` immediately after `authMiddleware`
- [ ] No route returns user data belonging to a different user without admin check
- [ ] JWT is validated server-side, not just decoded on the frontend
- [ ] No authentication bypass possible via crafted headers or parameters

---

## Input Validation

- [ ] All `req.body` fields validated with `express-validator` before use
- [ ] All `req.params` validated (especially `:id` fields — ObjectId format check)
- [ ] All `req.query` fields validated if used in queries
- [ ] No raw `req.body` or `req.params` value passed directly to a Mongoose query (NoSQL injection)
- [ ] Input lengths constrained where appropriate (especially strings)
- [ ] Email fields normalized to lowercase

---

## Data Exposure

- [ ] Password field excluded from all query results (`.select('-password')`)
- [ ] CVV and card numbers: stored encrypted, never returned in API responses
- [ ] No internal file paths, stack traces, or query details in error responses
- [ ] No user enumeration possible via login error messages (same error for wrong email and wrong password)

---

## Secrets and Configuration

- [ ] No hardcoded secrets, tokens, or connection strings in code
- [ ] No secrets in comments or commit messages
- [ ] All environment variables documented in `.env.example`
- [ ] `.gitignore` excludes `.env` files

---

## Dependency Security

- [ ] New packages checked for known active CVEs (via `npm audit` or manual check)
- [ ] Package versions pinned (no wildcard ranges for security-sensitive packages)
- [ ] Packages from trusted publishers

---

## Payment Data (ecommerce-specific)

- [ ] CVV never stored in plaintext
- [ ] Full card number masked in API responses (return only last 4 digits)
- [ ] Card numbers encrypted at rest if stored
- [ ] No payment data logged

---

## HTTP Security Headers (when Helmet is installed)

- [ ] `helmet()` registered before route handlers in `server.js`
- [ ] CORS configured to allow only the known frontend origin(s)

---

## Rate Limiting (when installed)

- [ ] Rate limiter applied to all routes
- [ ] Stricter limit applied to `POST /api/login` and `POST /api/register`

---

## STRIDE Coverage

| Threat | Assessed | Mitigation documented |
|---|---|---|
| Spoofing | yes / no | yes / no / not applicable |
| Tampering | yes / no | yes / no / not applicable |
| Repudiation | yes / no | yes / no / not applicable |
| Information Disclosure | yes / no | yes / no / not applicable |
| Denial of Service | yes / no | yes / no / not applicable |
| Elevation of Privilege | yes / no | yes / no / not applicable |

---

## Verdict

- [ ] No Critical findings
- [ ] No unresolved High findings
- [ ] Status: **APPROVED** / **APPROVED WITH CONDITIONS** / **BLOCKED**

[All Critical findings block the PR. All High findings require a documented remediation plan.]
