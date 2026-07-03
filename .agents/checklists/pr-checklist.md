# PR Review Checklist

**For use by:** code-reviewer, orchestrator
**Timing:** Phase 10 (Pull Request) — after delivery report received, before PR is opened or approved

---

## Pre-Review Gates (must all pass before review begins)

- [ ] `anti-hallucination-reviewer` report: CLEAN (or all findings resolved)
- [ ] Security-reviewer sign-off: APPROVED (required if change touches auth, user data, payment data, or new external inputs — mark N/A otherwise)
- [ ] All quality gates in delivery report: PASS
- [ ] All ACs in delivery report: MET
- [ ] Spec status: IN REVIEW

If any gate above is not cleared: **do not begin the code review. Return to the responsible role.**

---

## Spec Alignment

- [ ] Every AC in the spec is met by the implementation (verified in delivery report)
- [ ] No feature or behavior added beyond what the spec defines
- [ ] Design Decisions section in spec matches what was actually implemented
- [ ] Backlog ID present in PR description

---

## Code Pattern Compliance (CLAUDE.md)

### Backend (if applicable)

- [ ] ESM only — no `require()` anywhere in diff
- [ ] Controller pattern followed exactly
- [ ] Route middleware order: `authMiddleware → isAdmin → validation → validate → controller`
- [ ] `express-validator` on every new route
- [ ] Model follows `{ timestamps: true }` schema convention
- [ ] No hardcoded secrets or connection strings

### Frontend (if applicable)

- [ ] Function component only
- [ ] One-folder-per-component structure
- [ ] `Loading` + `ErrorMessage` pattern in every async component
- [ ] CSS in same-named `.css` file
- [ ] No localStorage usage not authorized by spec

---

## Test Quality

- [ ] Tests assert on observable behavior, not internal state
- [ ] Negative cases present (not just happy paths)
- [ ] No `toBeTruthy()` / `toBeDefined()` where specific value is knowable
- [ ] No test that would pass even if the feature were broken
- [ ] No `it.skip` without justification
- [ ] No `console.log` in test files

---

## Delivery Quality

- [ ] No `console.log` in production code
- [ ] No commented-out code blocks
- [ ] No `// TODO` without a backlog item ID
- [ ] No `// TEMP:` markers — temp code must be removed or converted to a backlog item
- [ ] No debug-only imports
- [ ] Diff contains only changes related to this backlog item (no unrelated files modified)

---

## Documentation Impact

- [ ] CLAUDE.md updated (if routes, models, or patterns changed)
- [ ] GAPS.md updated (if a known gap was resolved or a new one found)
- [ ] `.env.example` updated (if new env variable added)

---

## PR Metadata

- [ ] PR title follows Conventional Commits format: `feat:` / `fix:` / `refactor:` / `security:` / etc.
- [ ] PR targets `develop` (except hotfixes, which target `main`)
- [ ] PR description uses `templates/pr-template.md`
- [ ] Spec link is present and correct
- [ ] Test plan link is present and correct

---

## Final Verdict

- [ ] All checklist items above: PASS
- [ ] Verdict: APPROVED

**If any item is not checked: verdict must be APPROVED WITH REQUIRED CHANGES or BLOCKED.**
**Record the specific unchecked items in the code review report.**
