# SSDLC Workflow — Index

This file is the entry point to the project's Secure Software Development Life Cycle protocol.

**Full protocol:** [`docs/skills/ssdlc.md`](../../docs/skills/ssdlc.md)
**Standing system-prompt variant:** [`docs/skills/ssdlc-system-prompt.md`](../../docs/skills/ssdlc-system-prompt.md)
**Current version:** 2.0.0

---

## Operating Modes (summary)

| Mode | Name | Description | Ends when |
|---|---|---|---|
| Mode 1 | Stage 1 — Documentation and Baseline | Audit, document, clean, consolidate backlog | Baseline tag exists in Git |
| Mode 2 | Stage 2 — Orchestrated Execution | Subagent-driven implementation per backlog item | Backlog exhausted |

---

## Phase Summary

| Phase | Name | Primary role(s) | Key deliverable |
|---|---|---|---|
| 0 | Context Reading | orchestrator | Clean git status + CLAUDE.md read |
| 1 | Classification + STRIDE | orchestrator + security-reviewer | Work type + STRIDE table |
| 2 | SMART Story | spec-writer | Validated story with measurable ACs |
| 3 | Spec-Driven Design | spec-writer + qa-test-designer | Committed spec + test plan |
| 4 | Branch Management | frontend-builder or backend-builder | Branch from clean develop |
| 5 | Skill Audit | frontend-builder or backend-builder | Existing utilities identified |
| 6 | Secure Implementation | frontend-builder and/or backend-builder | Code on working branch |
| 7 | Verification + Quality Gates | builder + anti-hallucination-reviewer + security-reviewer | All gates green |
| 8 | Functional Verification | builder + qa-test-designer | AC verification table |
| 9 | Pull Request | code-reviewer + orchestrator | PR approved and merged |
| 10 | Spec Closure | spec-writer + docs-keeper | Closed spec + updated docs |
| 10.5 | Baseline Establishment | orchestrator (once, end of Stage 1) | Baseline commit + tag |

---

## Companion Workflows

- [Feature flow](feature-flow.md) — step-by-step for new features
- [Bugfix flow](bugfix-flow.md) — step-by-step for bug fixes
- [Security patch flow](security-patch-flow.md) — step-by-step for security fixes

---

## Agent Layer

- [Orchestrator protocol](../orchestrator.md)
- [Role definitions](../roles/)
- [Templates](../templates/)
- [Checklists](../checklists/)
