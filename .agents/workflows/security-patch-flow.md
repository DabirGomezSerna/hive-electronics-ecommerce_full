# Security Patch Workflow

**Applies to:** Any fix addressing a security vulnerability (auth bypass, injection, data exposure, broken access control, insecure dependency)
**SSDLC mode:** Stage 2 — Orchestrated Execution
**Differs from feature-flow.md in:** threat classification happens before spec is written; patch may target `main` directly if vulnerability is actively exploitable; security-reviewer is mandatory in every phase, not optional

---

## When to use this workflow

Use `security-patch-flow.md` instead of `feature-flow.md` when one or more of the following are true:

- A route returns data that should require a higher privilege level
- An input validation gap allows NoSQL injection, XSS, or command injection
- Authentication can be bypassed
- Sensitive data (password, CVV, token) is exposed in a response or log
- `npm audit` reports a Critical or High CVE in a dependency currently in use
- A known gap documented in the codebase (e.g., address access bug US-006) is being remediated

---

## Flow

### Step 1 — Threat Classification (orchestrator + security-reviewer)

Before any spec is written:

1. Describe the vulnerability: what can an attacker do, with what level of access, and what is the impact?
2. Rate severity:
   - **Critical** — active exploit possible with no authentication; data breach risk
   - **High** — exploit possible with valid user account; significant data or privilege risk
   - **Medium** — exploit requires unusual conditions or has limited impact
   - **Low** — defense-in-depth improvement, no direct exploit path
3. Determine target branch:
   - Critical → patch targets `main`, hotfix-style; deploy immediately after merge
   - High → patch targets `develop`; expedited PR review
   - Medium/Low → normal sprint flow via `feature-flow.md` with security label

---

### Step 2 — Spec (spec-writer + security-reviewer)

Same as feature-flow.md Phase 1, with two additional requirements:

1. **STRIDE analysis is mandatory** — every threat category must be assessed, not left blank
2. **Security Considerations section** must document: the exact exploit path, all affected routes/models, and the proposed control

Security-reviewer must approve the spec before the working branch is created.

---

### Step 3 — Regression Test First (qa-test-designer)

Before any fix code is written:

1. Write a test that reproduces the vulnerability as currently observed (it must fail against the current code)
2. Commit the failing test to the spec branch (or `develop` if targeting `main`)
3. This test becomes the primary AC verification for the fix

The failing test is evidence that the vulnerability exists and proof that the fix addresses it.

---

### Step 4 — Working Branch

```
git checkout -b security/[short-name]
```

Branch naming: `security/` prefix for all security patches.

---

### Step 5 — Implementation (backend-builder or frontend-builder)

Implement the fix. For every change:

1. Reference only code that currently exists — no invented helpers or middleware
2. Do not add functionality beyond what the spec requires
3. If the fix requires a new dependency, verify no known CVE before adding it

---

### Step 6 — Anti-Hallucination Review (anti-hallucination-reviewer)

Mandatory gate. All 6 check categories must pass.

If any finding: return to Step 5 before proceeding.

---

### Step 7 — Security Review (security-reviewer)

Review the diff against:

1. The original exploit path — is it now closed?
2. The security checklist (`checklists/security-checklist.md`)
3. Any new attack surface introduced by the fix itself

Required output: updated STRIDE table in the spec's Security Considerations section.

Security-reviewer verdict of BLOCKED = no PR can be opened.

---

### Step 8 — Code Review (code-reviewer)

Standard code review against `checklists/pr-checklist.md`.

For security patches: failing regression test (now passing) must be visible in the diff.

---

### Step 9 — PR and Merge

PR description must include:

- Vulnerability description (what was the exploit path)
- Severity rating
- Which ACs the fix covers
- Link to failing-then-passing regression test
- Security-reviewer approval status

For Critical patches targeting `main`: merge to `main` first, then merge `main` back to `develop`.

---

### Step 10 — Spec Closure (spec-writer + orchestrator)

Same as feature-flow.md steps 13–14:

- Mark all ACs MET or NOT MET
- Fill Results section
- Fill Open Items section
- Convert any deferred items to backlog

---

## Failure Paths

| Situation | Action |
|---|---|
| Regression test cannot be written (vulnerability is non-deterministic) | Document why in spec; security-reviewer decides if patch can proceed without it |
| Fix introduces a new vulnerability | BLOCKED — return to Step 5; new threat must be documented in STRIDE |
| CVE dependency — no patch available | Document in security checklist; accept risk with user approval; schedule follow-up when patch is released |
| Security-reviewer BLOCKED at Step 7 | No PR. Escalate to orchestrator, then to user if unresolved in one iteration |
| Exploit confirmed in production | Severity auto-escalates to Critical; Step 1 threat classification is skipped; go directly to Step 3 |

---

## Roles Involved

| Step | Role |
|---|---|
| 1 | orchestrator, security-reviewer |
| 2 | spec-writer, security-reviewer |
| 3 | qa-test-designer |
| 5 | backend-builder or frontend-builder |
| 6 | anti-hallucination-reviewer |
| 7 | security-reviewer |
| 8 | code-reviewer |
| 9 | orchestrator |
| 10 | spec-writer, orchestrator |
