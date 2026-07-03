# Workflow: Feature Implementation

**Applies to:** `feature/*` branches
**Minimum stage:** MVP roles active (orchestrator, spec-writer, builder, qa-test-designer)
**Full protocol:** [`docs/skills/ssdlc.md`](../../docs/skills/ssdlc.md)

---

## Preconditions (before starting)

- [ ] Baseline tag exists in Git
- [ ] Feature appears in the approved backlog
- [ ] `develop` is clean and up to date
- [ ] No open delivery report from a previous session awaiting integration

---

## Step-by-Step Flow

### Step 1 — Orchestrator assigns the item

**Role:** orchestrator
**Action:** Reads the backlog, selects the feature, produces an Execution Brief using the template in `orchestrator.md`.
**Gate:** Execution Brief must be complete before any other role begins.

---

### Step 2 — Classification and STRIDE

**Role:** orchestrator + security-reviewer (if auth/data involved)
**Action:** Classify the work type (`feature`). If the feature involves authentication, user data, payment data, or external inputs, trigger `security-reviewer` for an initial STRIDE pass.
**Deliverable:** Work type label. STRIDE threats documented (or "not applicable" with justification).

---

### Step 3 — Spec creation

**Role:** spec-writer
**Action:** Writes the full spec using `templates/spec-template.md`. SMART story, measurable ACs, STRIDE table, dependencies, design decisions.
**Gate:** Spec committed to `develop` before any branch is created.
**Command:**
```bash
git add docs/specs/
git commit -m "docs: spec [short-name]"
git push origin develop
```

---

### Step 4 — Test plan design

**Role:** qa-test-designer
**Action:** Writes the test plan for all ACs. Assigns each test case a tool. Marks auth-gated routes with mandatory negative cases.
**Gate:** Test plan committed to `develop` before working branch is created.
**Command:**
```bash
git add docs/test-plans/
git commit -m "docs: test plan [short-name]"
git push origin develop
```

---

### Step 5 — Architecture review (conditional)

**Role:** architecture-reviewer
**Condition:** Only required if the feature introduces a new model, new route group, new dependency, or changes an API contract. Skip if purely additive UI work.
**Gate:** Architecture review approved before branch is created.

---

### Step 6 — Branch creation

**Role:** frontend-builder and/or backend-builder
**Action:** Create branch from `develop`.
```bash
git checkout develop
git pull origin develop
git checkout -b feature/[short-name]
```
**Gate:** Branch must start from the current `develop` tip.

---

### Step 7 — Skill audit

**Role:** builder(s)
**Action:** Check `packages/shared/` and `docs/skills/` for existing utilities before implementing anything new. Document what was reused.

---

### Step 8 — Implementation

**Role:** frontend-builder (React/CSS) and/or backend-builder (Express/Mongoose)
**Action:** Implement the feature following CLAUDE.md patterns and all security rules. Commit incrementally.
**Constraints:** No library not in `package.json`. No endpoint not in the spec. No hardcoded secrets. All builders provide a "Reasoning" section in their delivery report.

---

### Step 9 — Quality gates

**Role:** builder(s), then anti-hallucination-reviewer

**Builder runs:**
```bash
# Backend
cd hive-electronics-ecommerce_api && npm test
git diff develop..HEAD | grep -E "(password|secret|token|key)\s*=\s*['\"][^'\"]{8,}"

# Frontend
cd hive-electronics-ecommerce_app && npm test -- --watchAll=false && npm run build
```

**Then anti-hallucination-reviewer runs** its full checklist (imports, routes, models, reasoning).
**Gate:** All quality gates green. Hallucination report: CLEAN.

---

### Step 10 — Security quality gate (conditional)

**Role:** security-reviewer
**Condition:** Required if feature touches auth, user data, payment data, or any new external input.
**Gate:** Security review: APPROVED before proceeding to PR.

---

### Step 11 — AC verification

**Role:** builder(s) + qa-test-designer (validates against test plan)
**Action:** For each AC in the spec, mark: met / not met / partial.
**Gate:** All ACs met. Any "not met" or "partial" → return to implementation.

---

### Step 12 — Pull Request

**Role:** code-reviewer, then orchestrator
**Action:** `code-reviewer` reviews the full diff. Orchestrator creates/validates the PR using `templates/pr-template.md`.

```bash
# PR targets develop
# Title: feat: [short description]
```

**Gate:** Code review: APPROVED. PR opened to `develop`.

---

### Step 13 — Spec closure

**Role:** spec-writer + docs-keeper
**Action:** Close the spec (Results, Open Items, Closure Matrix). Update CLAUDE.md if patterns/routes/models changed. Update GAPS.md.
**Gate:** All spec sections complete. Docs updated.

```bash
git add docs/specs/ docs/
git commit -m "docs: close spec [short-name] — DONE"
git push origin develop
```

---

### Step 14 — Backlog update

**Role:** orchestrator
**Action:** Mark the backlog item as complete. Register any new items found during implementation. Sequence next item.

---

## Failure Paths

| Situation | Action |
|---|---|
| STRIDE reveals Critical threat in spec | Security-reviewer and spec-writer revise spec before branch is created |
| Hallucination found in implementation | Return to builder; re-run anti-hallucination-reviewer after fix |
| PR blocked by code-reviewer | Return to builder; new code-reviewer cycle after fixes |
| AC not met after implementation | Return to builder; orchestrator may extend sprint or defer to next item |
| Architecture conflict identified | Architecture-reviewer escalates; spec-writer revises design |
