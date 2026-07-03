# Spec: [Descriptive Name]

> **Quick reference template for spec-writer.**
> Full spec protocol: [`docs/skills/ssdlc.md`](../../docs/skills/ssdlc.md) — Phase 3.
> Every field marked [REQUIRED] must be filled before committing to develop.

---

## Metadata

- **Type:** feature | bugfix | refactor | hotfix | security-patch | docs | infra
- **Complexity:** XS | S | M | L | XL
- **Date:** YYYY-MM-DD [REQUIRED]
- **Status:** DRAFT → IN PROGRESS → IN REVIEW → DONE | REJECTED
- **Assigned to:** main-agent | subagent:[role-name] [REQUIRED]
- **Backlog ID:** [e.g., US-001] [REQUIRED — no spec without a backlog ID]

---

## Story

[REQUIRED. SMART format: Specific, Measurable, Achievable, Relevant, Time-boxed.

"As a [user type], I want [action], so that [business value]."

Complexity estimate: XS (<2h) | S (half-day) | M (1 day) | L (2-3 days) | XL (needs breakdown)]

---

## Context

[REQUIRED. Why does this task exist? What problem does it solve? What breaks if it is not done?

Do not copy the story here. Add the background: the bug report, the user need, the architectural gap, the compliance requirement.]

---

## Acceptance Criteria

[REQUIRED. Every criterion must be objectively verifiable by someone who did not write it.

Bad: "It should work correctly."
Good: "GET /api/addresses/user/:id with a valid non-admin JWT returns HTTP 200 and an array containing only the authenticated user's addresses."]

- [ ] AC-1:
- [ ] AC-2:
- [ ] AC-3: (add as needed)

---

## Security Considerations

[REQUIRED for any change touching auth, user data, payment data, or external inputs. Write "none applicable" only if security-reviewer has confirmed it.]

- **STRIDE threats identified:**
  - Spoofing: [threat or "not applicable"]
  - Tampering: [threat or "not applicable"]
  - Repudiation: [threat or "not applicable"]
  - Information Disclosure: [threat or "not applicable"]
  - Denial of Service: [threat or "not applicable"]
  - Elevation of Privilege: [threat or "not applicable"]

- **Mitigation controls:**
  - [control 1]
  - [control 2]

- **Inputs requiring validation:**
  - [field name] — [validation rule]

- **Secrets involved:** none | [how they are handled]

- **Affected attack surface:** [brief description]

---

## Dependencies

- **Internal:** [project modules, services, or other specs this item depends on]
- **External:** [third-party packages — verify they are in package.json before referencing]
- **Blocked by:** [Backlog IDs that must be completed first, or "none"]

---

## Design Decisions

[REQUIRED. Document the approach chosen AND the alternatives considered. A spec with only "we will do X" is incomplete — future reviewers need to know what was rejected and why.

Format:
- **Decision:** [what was chosen]
- **Alternatives considered:** [what else was considered]
- **Reason for rejection:** [why the alternatives were not chosen]
- **Tradeoff accepted:** [what this decision costs us]]

---

## Risks and Technical Debt

[What could go wrong during implementation. What is knowingly left pending or deferred. If none: "none identified at spec time."]

---

## Open Items and Detected Gaps

[Completed AT CLOSING TIME — Phase 11 of SSDLC. Do not leave blank at closure. If nothing to report in a category, write "none identified." Omission is not acceptable.]

- Missing functionality: [list or "none identified"]
- Inconsistent behavior detected: [list or "none identified"]
- Frontend/backend gaps: [list or "none identified"]
- Persistence pending migration: [list or "none identified"]
- Deferred decisions: [list or "none identified"]
- Work explicitly out of scope for this iteration: [list or "none identified"]
- Risks requiring follow-up: [list or "none identified"]
- Items to be converted into backlog: [list or "none identified"]

---

## Results

[Filled in at closing — Phase 11 of SSDLC.]

- Closing date:
- ACs met:
- ACs not met:
- Technical debt generated:
- Lessons learned:
- Confirmed open items:
- Unresolved gaps:
- Confirmed out-of-scope work:
- Derived backlog created: yes | no
- References to backlog stories/tasks created:
