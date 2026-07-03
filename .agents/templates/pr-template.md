# Pull Request Template

**Instructions:** Delete these instructions before opening the PR. Fill every field. Do not leave placeholders.

---

## Description

[What was done and why, in 2–3 sentences. Focus on the *why*, not the *what* — the diff shows what changed.]

---

## Backlog ID

[e.g., US-001 | E-02/F-02.1]

## Spec

[`docs/specs/YYYY-MM-DD-type-short-name.md`](../../docs/specs/)

## Test Plan

[`docs/test-plans/YYYY-MM-DD-short-name-test-plan.md`](../../docs/test-plans/)

---

## Type of Change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Security patch
- [ ] Infrastructure
- [ ] Documentation

---

## Acceptance Criteria Status

| AC | Description | Status |
|---|---|---|
| AC-1 | [description from spec] | Met / Not met / Partial |
| AC-2 | [description from spec] | Met / Not met / Partial |

**All ACs must be Met before this PR may be approved.**

---

## Quality Gates

| Gate | Status | Notes |
|---|---|---|
| Type check | Pass / Fail / N/A | |
| Lint | Pass / Fail / N/A | |
| Tests | Pass / Fail | [N passed, M failed] |
| Build | Pass / Fail / N/A | |
| Secrets check | Pass / Fail | |
| Diff reviewed (no debug artifacts) | Pass / Fail | |

---

## Review Checklist

- [ ] `anti-hallucination-reviewer` report: CLEAN
- [ ] `security-reviewer` sign-off: APPROVED (required for auth/data changes — mark N/A if not applicable)
- [ ] `code-reviewer` verdict: APPROVED

---

## Security Considerations

[What STRIDE threats were identified and how they are mitigated. "None identified" is a valid answer only if the security-reviewer confirmed it.]

---

## Breaking Changes

[None | Description of what breaks and what callers need to update]

---

## Impact on Documentation

[Which docs were updated by `docs-keeper`. "None required" if no routes/models/patterns changed.]

---

## New Pending Items Detected

[Any new gaps or bugs found during implementation that were registered as new backlog items. "None" if clean.]

---

## Reasoning (for Vibe Coding sessions)

[Brief explanation of the key implementation decision: what approach was chosen and why it was chosen over the obvious alternative. Required for AI-generated code.]
