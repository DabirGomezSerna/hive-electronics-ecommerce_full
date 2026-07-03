# Frontend Definition of Done

**Applies to:** All `frontend-builder` deliveries from `hive-electronics-ecommerce_app/`
**Must be fully checked before submitting the delivery report.**

---

## Spec Compliance

- [ ] Every AC from the spec is addressed in the implementation
- [ ] No feature or behavior was added that is not in the spec
- [ ] No existing feature was changed as a side effect (or the change is documented)

---

## Code Patterns (CLAUDE.md §5)

- [ ] Function component only (no class components)
- [ ] One folder per component: `ComponentName/ComponentName.jsx` + `ComponentName/ComponentName.css`
- [ ] CSS imported as `import './ComponentName.css'`
- [ ] Barrel export `index.js` present if component is under `components/common/`
- [ ] All async data fetching uses the `loading / error / data` pattern with both `Loading` and `ErrorMessage` rendered
- [ ] `useEffect` wraps service calls in `async function load() { ... } load()` pattern (not async useEffect directly)
- [ ] `try/catch` in every `useEffect` that calls a service
- [ ] Route params read via `useParams()` at page level, passed as prop to presentational component

---

## Dependency and Import Safety (Anti-Hallucination)

- [ ] Every `import` from `node_modules` exists in `package.json` (verified, not assumed)
- [ ] Every relative import path actually exists in the file system
- [ ] Every backend endpoint called exists in the CLAUDE.md route map
- [ ] No invented props — every prop used is either from the spec or from reading the actual parent component

---

## Test Coverage

- [ ] Test file exists at `ComponentName/ComponentName.test.jsx`
- [ ] Every AC has at least one positive test case implemented
- [ ] Every AC has at least one negative test case implemented (error state, empty state, or unauthorized state)
- [ ] Loading state is tested
- [ ] Error state is tested
- [ ] API calls are intercepted via MSW, not mocked via `jest.fn()` on the service module
- [ ] Assertions use `getByRole`, `getByText`, or `getByLabelText` (not `getByTestId` unless no accessible alternative exists)
- [ ] No `toBeTruthy()` where a specific text or element is knowable
- [ ] No `it.skip` without a justification comment linking to a backlog item

---

## Quality Gates

- [ ] `npm test -- --watchAll=false` passes with 0 failures
- [ ] `npm run build` succeeds with 0 errors
- [ ] No `console.log` in any `.jsx` or `.js` file committed
- [ ] No commented-out code blocks
- [ ] No `// TODO` without a corresponding backlog item ID

---

## Delivery Report

- [ ] Delivery report completed using `templates/subagent-delivery-report.md`
- [ ] "Reasoning" section filled for every non-trivial decision
- [ ] "New pending items detected" section completed (or marked "none")
- [ ] "Files modified" table completed
- [ ] "Impact on documentation" section completed
