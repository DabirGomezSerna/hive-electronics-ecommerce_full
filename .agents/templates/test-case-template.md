# Test Plan: [Feature or Fix Name]

**Spec:** [`docs/specs/YYYY-MM-DD-type-short-name.md`](../../docs/specs/)
**Backlog ID:** [e.g., US-001]
**Author:** qa-test-designer
**Date:** YYYY-MM-DD
**Status:** DRAFT | APPROVED | IMPLEMENTED

---

## Testing Scope

| Layer | Tool | Notes |
|---|---|---|
| Backend routes | supertest + mongodb-memory-server | |
| Backend models/validation | jest + mongodb-memory-server | |
| Frontend components | @testing-library/react + msw | |
| Frontend integration | @testing-library/react + msw | |

**Tools not yet installed (must be set up before implementation begins):**
[List any tool from the table above that is not in package.json, or "none"]

---

## Test Cases

### Backend

---

**TC-BE-001: [Short description]**

- **Type:** positive | negative | edge
- **AC covered:** AC-[N]
- **Tool:** jest | supertest
- **Priority:** High | Medium | Low

```
Arrange:
  - [Database state / auth token / request headers setup]

Act:
  - [HTTP method] [endpoint]
  - Body: { ... }

Assert:
  - HTTP status: [expected code]
  - Response body: { ... }
  - Database state after: [expected state, if applicable]
```

---

**TC-BE-002-NEG-AUTH: No token — [endpoint name]**

- **Type:** negative
- **AC covered:** Security (auth boundary)
- **Tool:** supertest
- **Priority:** High

```
Arrange:
  - No Authorization header

Act:
  - [HTTP method] [endpoint]

Assert:
  - HTTP status: 401
```

---

**TC-BE-003-NEG-TOKEN: Invalid token — [endpoint name]**

- **Type:** negative
- **AC covered:** Security (auth boundary)
- **Tool:** supertest
- **Priority:** High

```
Arrange:
  - Authorization: Bearer invalid-garbage-string

Act:
  - [HTTP method] [endpoint]

Assert:
  - HTTP status: 401
```

---

**TC-BE-004-NEG-ROLE: Wrong role — [endpoint name] (isAdmin routes only)**

- **Type:** negative
- **AC covered:** Security (admin boundary)
- **Tool:** supertest
- **Priority:** High

```
Arrange:
  - Valid JWT with role: "customer"

Act:
  - [HTTP method] [endpoint]

Assert:
  - HTTP status: 403
```

---

**TC-BE-005-VAL: Validation failure — [field name]**

- **Type:** negative
- **AC covered:** Validation rule: [describe the rule]
- **Tool:** supertest
- **Priority:** High

```
Arrange:
  - Valid auth token

Act:
  - [HTTP method] [endpoint]
  - Body: { [field]: [invalid value] }

Assert:
  - HTTP status: 422
  - Response body: { errors: [{ msg: "[expected error message]", path: "[field]" }] }
```

---

### Frontend

---

**TC-FE-001: [Short description]**

- **Type:** positive
- **AC covered:** AC-[N]
- **Tool:** @testing-library/react
- **Priority:** High

```
Arrange:
  - MSW handler: [GET/POST endpoint] → returns [mock data shape]
  - Render: <[ComponentName] />

Act:
  - [userEvent.click / userEvent.type / etc.]

Assert:
  - [getByRole / getByText / getByLabelText] matches "[expected visible text]"
  - [toBeInTheDocument / toBeDisabled / toHaveTextContent / etc.]
```

---

**TC-FE-002-LOAD: Loading state — [component name]**

- **Type:** positive (loading state)
- **AC covered:** Loading state AC
- **Tool:** @testing-library/react + msw
- **Priority:** Medium

```
Arrange:
  - MSW handler: [endpoint] → delayed response

Act:
  - Render immediately after request fires

Assert:
  - Loading component visible (getByRole or getByText matching loading indicator)
```

---

**TC-FE-003-ERR: Error state — [component name]**

- **Type:** negative
- **AC covered:** Error state AC
- **Tool:** @testing-library/react + msw
- **Priority:** Medium

```
Arrange:
  - MSW handler: [endpoint] → HTTP 500 or network error

Act:
  - Render after failed request

Assert:
  - Error message component visible
  - Loading component not visible
```

---

## AC Coverage Matrix

| AC | Test Case(s) | Coverage |
|---|---|---|
| AC-1 | TC-BE-001, TC-FE-001 | Full |
| AC-2 | TC-BE-005-VAL | Full |
| Auth boundary | TC-BE-002-NEG-AUTH, TC-BE-003-NEG-TOKEN | Full |
| Admin boundary | TC-BE-004-NEG-ROLE | Full |

**All ACs must appear in this matrix with at least one test case each.**

---

## Notes for Builders

[Any constraint that affects test implementation — e.g., "MSW is not yet installed, set up before writing frontend tests", or "mongodb-memory-server version constraint: use X.Y.Z"]
