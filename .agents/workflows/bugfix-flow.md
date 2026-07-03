# Workflow: Bug Fix

**Applies to:** `bugfix/*` branches
**Key differences from feature flow:** Faster spec (focused on current vs. expected behavior). No architecture review unless the fix changes a pattern. Security review mandatory if the bug is security-related.
**Full protocol:** [`docs/skills/ssdlc.md`](../../docs/skills/ssdlc.md)

---

## Preconditions

- [ ] Bug appears in the approved backlog (not verbal, not informal)
- [ ] Bug is reproducible — the behavior that should change is documented
- [ ] `develop` is clean and up to date

---

## Step-by-Step Flow

### Step 1 — Orchestrator assigns the item

**Role:** orchestrator
**Action:** Produces an Execution Brief. For bugfixes, the brief must include:
- Steps to reproduce the bug
- Current (wrong) behavior
- Expected (correct) behavior
- Which file, route, or component is the likely source

---

### Step 2 — Classification

**Role:** orchestrator
**Action:** Classify as `bugfix`. Perform quick STRIDE check: is this bug a security vulnerability? If yes, reclassify as `security-patch` and switch to the security-patch-flow.

---

### Step 3 — Spec creation

**Role:** spec-writer
**Focus for bugfixes:** The spec's Story must clearly describe the discrepancy between current and expected behavior. The ACs must be verifiable and specific to the broken behavior. No vague ACs like "it should work correctly."

Example AC format for a bug:
```
AC-1: POST /api/addresses/user/:id with a valid non-admin JWT returns HTTP 200 and an array of addresses belonging to the authenticated user.
AC-2: POST /api/addresses/user/:id with a valid non-admin JWT and a userId that does not match the authenticated user returns HTTP 403.
```

**Gate:** Spec committed to `develop`.

---

### Step 4 — Test plan design

**Role:** qa-test-designer
**Focus for bugfixes:** The failing test case must be written first — the test that currently fails because the bug exists. This becomes the regression test.

Test case structure for bugs:
```
TC-REG-001: [description of the broken behavior as a test]
- Type: negative (currently passing incorrectly)
- Confirms the bug exists before fix
- After fix: this test must pass
```

**Gate:** Test plan committed to `develop` with the regression test clearly identified.

---

### Step 5 — Branch creation

**Role:** builder (the one responsible for the affected layer)
```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/[short-name]
```

---

### Step 6 — Implementation

**Role:** frontend-builder (if UI/service bug) and/or backend-builder (if API/model/middleware bug)

**Bugfix-specific rules:**
1. Fix only what the spec describes. Do not refactor adjacent code.
2. Do not introduce new patterns while fixing the bug.
3. The fix must be the minimum change that makes the regression test pass.
4. If fixing the bug reveals another bug, register it in the delivery report as a new backlog item. Do not fix it inline.

---

### Step 7 — Quality gates

**Same as feature flow.** All gates must pass, including the regression test.

Anti-hallucination-reviewer runs. This is especially important for bugs where AI may generate a "fix" that patches the symptom rather than the cause.

---

### Step 8 — Security review (conditional)

Required if:
- The bug involved incorrect auth behavior
- The fix changes middleware order
- The bug was a missing validation rule

---

### Step 9 — AC verification

Regression test must pass. All other ACs must be met. The bug must no longer be reproducible via the steps in the spec.

---

### Step 10 — Pull Request

PR title: `fix: [short description of what was broken]`

---

### Step 11 — Spec closure + docs update

**docs-keeper** updates any documentation that was incorrect due to the bug (e.g., if CLAUDE.md documented the wrong behavior as the correct behavior).

---

## Common Pitfalls for Bugfix Sessions

| Pitfall | Prevention |
|---|---|
| Fixing more than the spec describes | Strict scope: one bug, one spec, one branch |
| AI generating a workaround instead of a root cause fix | Anti-hallucination-reviewer validates reasoning; learning-coach explains root cause |
| Regression test written after the fix | qa-test-designer writes the failing test before the branch is created |
| Bug was actually a security vulnerability (discovered mid-fix) | Stop. Reclassify. Switch to security-patch-flow. |
| Fix introduces a new bug | Caught by quality gates; registered as new backlog item |
