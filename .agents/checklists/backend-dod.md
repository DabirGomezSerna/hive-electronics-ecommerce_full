# Backend Definition of Done

**Applies to:** All `backend-builder` deliveries from `hive-electronics-ecommerce_api/`
**Must be fully checked before submitting the delivery report.**

---

## Spec Compliance

- [ ] Every AC from the spec is addressed in the implementation
- [ ] No endpoint, field, or behavior was added that is not in the spec
- [ ] No existing endpoint, model, or middleware was changed as a side effect (or the change is documented)

---

## Code Patterns (CLAUDE.md §5)

- [ ] ESM only — no `require()`, no `module.exports` anywhere in modified files
- [ ] Every controller follows the exact pattern: `async (req, res, next) => { try { ... } catch (error) { next(error); } }`
- [ ] Named exports at the bottom of each controller file: `export { handler1, handler2 }`
- [ ] Middleware order on every route: `authMiddleware → isAdmin (if required) → validation array → validate → controller`
- [ ] `express-validator` applied to every new route (no route without validation)
- [ ] `validate` middleware from `src/middleware/validation.js` called after every validation array
- [ ] New route file registered in `src/routes/index.js`
- [ ] Model follows `mongoose.Schema` pattern with `{ timestamps: true }` option

---

## Dependency and Import Safety (Anti-Hallucination)

- [ ] Every imported package exists in `package.json` (verified against actual file)
- [ ] Every relative import path exists in the file system
- [ ] No Mongoose model field is referenced that is not defined in the schema
- [ ] Model name strings match exactly as defined in `mongoose.model('ModelName', schema)` (case-sensitive)

---

## Security

- [ ] No hardcoded secrets, API keys, passwords, or connection strings
- [ ] All `process.env` variables are documented in `.env.example`
- [ ] No `req.body` or `req.params` values passed directly to a Mongoose query without validation
- [ ] No stack traces or internal paths in client-facing error responses
- [ ] Admin-only routes verified: `isAdmin` middleware present and in correct position
- [ ] Secrets check clean: `git diff develop..HEAD | grep -E "(password|secret|token|key)\s*=\s*['\"][^'\"]{8,}"`

---

## Test Coverage

- [ ] Test files exist under `tests/` mirroring the `src/` structure
- [ ] Every AC has at least one positive test case
- [ ] Every AC has at least one negative test case
- [ ] Every auth-gated route has: no-token case, invalid-token case
- [ ] Every isAdmin-gated route has: customer-token case (wrong role)
- [ ] Every validator rule has: passing case and failing case (422 with correct error shape)
- [ ] Tests use `mongodb-memory-server` (no hand-mocked Mongoose models)
- [ ] Tests use `supertest` against the actual Express app
- [ ] `beforeAll`/`afterAll` connect/disconnect from in-memory MongoDB
- [ ] Collections cleared between tests (no cross-test pollution)

---

## Quality Gates

- [ ] `npm test` passes with 0 failures
- [ ] No `console.log` in `src/` files (controllers, models, middleware, routes)
- [ ] No commented-out code blocks
- [ ] No `// TODO` without a corresponding backlog item ID
- [ ] No `.skip` on tests without justification linking to a backlog item

---

## Delivery Report

- [ ] Delivery report completed using `templates/subagent-delivery-report.md`
- [ ] "Reasoning" section filled for every non-trivial decision
- [ ] "New pending items detected" section completed (or marked "none")
- [ ] "Files modified" table completed
- [ ] "Impact on documentation" section: routes or models that changed are flagged for docs-keeper
