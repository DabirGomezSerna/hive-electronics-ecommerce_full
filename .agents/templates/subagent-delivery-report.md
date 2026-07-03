# Subagent Delivery Report

**Instructions:** Complete every field. "N/A" is only valid if the category genuinely does not apply — explain why. Submit to the orchestrator. Do not open a PR before the orchestrator confirms integration approval.

---

## Assignment

- **Backlog ID:** [e.g., US-001]
- **Role:** frontend-builder | backend-builder
- **Branch:** [e.g., feature/real-user-login]
- **Spec:** [`docs/specs/YYYY-MM-DD-type-short-name.md`](../../docs/specs/)
- **Test Plan:** [`docs/test-plans/YYYY-MM-DD-short-name-test-plan.md`](../../docs/test-plans/)

---

## Summary of Changes

[2–4 sentences: what was built or fixed, in which files, and how. Do not just list file names — explain what changed and why.]

---

## Acceptance Criteria Status

| AC | Description | Status | Notes |
|---|---|---|---|
| AC-1 | [from spec] | Met / Not met / Partial | [explain if not fully met] |
| AC-2 | [from spec] | Met / Not met / Partial | |

**If any AC is "Not met" or "Partial": do not submit this report. Return to implementation.**

---

## Quality Gates

| Gate | Status | Command run | Output summary |
|---|---|---|---|
| Tests | Pass / Fail | `npm test` | [N passed, M failed] |
| Build | Pass / Fail | `npm run build` | [success / error summary] |
| Secrets check | Pass / Fail | `git diff develop..HEAD \| grep ...` | [clean / findings] |
| Lint | Pass / Fail / N/A | [command] | |

---

## Reasoning

[For each non-trivial implementation decision made during this session, provide a one-sentence explanation. Format: "I chose X over Y because Z." This section is required — missing reasoning is flagged by the anti-hallucination-reviewer.]

| Decision | Reasoning |
|---|---|
| [e.g., Using useEffect with dependency array] | [e.g., Chosen over useCallback because the data only needs to reload when productId changes, not on every render] |

---

## Detected Risks

[Risks identified during implementation that were not in the spec's Risk section. If none: write "none identified" — do not leave blank.]

---

## Technical Debt Generated

[Shortcuts or deferred decisions made to complete the item within its defined scope. For each: describe what was deferred and why. If none: "none."]

---

## New Pending Items Detected

[Gaps, bugs, or missing features found during implementation that are not in the approved backlog. For each: provide enough detail for the orchestrator to create a backlog entry. The builder does NOT fix these inline.]

| # | Description | Type | Estimated severity |
|---|---|---|---|
| 1 | [description] | Bug / Gap / Missing feature | Critical / High / Medium / Low |

---

## Files Modified

| File | Change type | Description |
|---|---|---|
| [path] | Created / Modified / Deleted | [what changed] |

---

## Impact on Documentation

[Which docs require updating after this merge. The orchestrator will trigger docs-keeper for these.]

- CLAUDE.md: [section(s) affected, or "no update required"]
- ARCHITECTURE.md: [affected or "no update required"]
- GAPS.md: [items resolved or added, or "no update required"]

---

## Integration Recommendation

- **Ready to merge:** yes / no (explain if no)
- **Depends on:** [branch name that must be merged first, or "none"]
- **Known conflicts:** [branch names with conflicts, or "none detected"]
- **Merge order note:** [any special sequencing requirement]
