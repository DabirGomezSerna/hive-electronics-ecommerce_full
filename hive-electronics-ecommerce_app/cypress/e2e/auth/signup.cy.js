/**
 * E2E tests — Signup (Create account) flow
 *
 * Covers:
 *   TC-E2E-AUTH-009: "Create account" header dropdown link navigates to /register
 *   TC-E2E-AUTH-010: Signup form renders displayName, email, password, confirmPassword inputs
 *   TC-E2E-AUTH-011: Submitting a too-short password shows a validation error
 *   TC-E2E-AUTH-012: Mismatched passwords show "Passwords do not match"
 *   TC-E2E-AUTH-013: Valid signup redirects to /login (no auto-login)
 *   TC-E2E-AUTH-014: Signing in with the newly created account succeeds
 *   TC-E2E-AUTH-015: Signing up with a duplicate email shows a server error
 */

describe('Signup flow', () => {
  // ── TC-E2E-AUTH-009 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-009 — "Create account" header dropdown link navigates to /register', () => {
    cy.visit('/');

    cy.get('.user-info').click();
    cy.contains('Create account').click();

    cy.url().should('include', '/register');
  });

  // ── TC-E2E-AUTH-010 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-010 — signup page renders displayName, email, password, confirmPassword inputs', () => {
    cy.visit('/register');

    cy.get('[data-testid="displayName-input"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="confirmPassword-input"]').should('be.visible');
    cy.get('[data-testid="signup-submit"]').should('be.visible').and('contain', 'Create account');
  });

  // ── TC-E2E-AUTH-011 ─────────────────────────────────────────────────────────
  // Note: a fully empty form is blocked by the inputs' native `required`
  // attribute before the submit event ever reaches React, so the component's
  // own "All fields are required" branch is unreachable through normal
  // interaction (verified manually). Password length has no native HTML
  // constraint behind it, so it's a reliable way to exercise the
  // component-level validation branch instead.
  it('TC-E2E-AUTH-011 — submitting a too-short password shows a validation error', () => {
    cy.visit('/register');

    cy.get('[data-testid="displayName-input"]').type('Test User');
    cy.get('[data-testid="email-input"]').type('short-password@example.com');
    cy.get('[data-testid="password-input"]').type('abc');
    cy.get('[data-testid="confirmPassword-input"]').type('abc');
    cy.get('[data-testid="signup-submit"]').click();

    cy.get('[role="alert"]').should('contain', 'Password must be at least 6 characters');
  });

  // ── TC-E2E-AUTH-012 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-012 — mismatched passwords show "Passwords do not match"', () => {
    cy.visit('/register');

    cy.get('[data-testid="displayName-input"]').type('Test User');
    cy.get('[data-testid="email-input"]').type('mismatch@example.com');
    cy.get('[data-testid="password-input"]').type('password1');
    cy.get('[data-testid="confirmPassword-input"]').type('password2');
    cy.get('[data-testid="signup-submit"]').click();

    cy.get('[role="alert"]').should('contain', 'Passwords do not match');
  });

  // ── TC-E2E-AUTH-013 / 014 ───────────────────────────────────────────────────
  it('TC-E2E-AUTH-013 — valid signup redirects to /login without auto-login, and TC-E2E-AUTH-014 the new account can then log in', () => {
    const email = `cypress-signup-${Date.now()}@example.com`;
    const password = 'password123';

    cy.visit('/register');

    cy.get('[data-testid="displayName-input"]').type('Cypress Test User');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="confirmPassword-input"]').type(password);
    cy.get('[data-testid="signup-submit"]').click();

    cy.url({ timeout: 8000 }).should('include', '/login');
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');

    // The route change is client-side (Login is React.lazy-loaded), so the
    // previous Signup page's DOM can still be mounted for a moment after the
    // URL updates. Wait for the login form itself (unique to the new page)
    // before interacting, rather than the shared "email-input" testid which
    // also matches the signup form's now-stale input.
    cy.get('[data-testid="login-form"]', { timeout: 8000 }).should('be.visible');

    // TC-E2E-AUTH-014 — log in with the freshly created credentials
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-submit"]').click();

    cy.url({ timeout: 8000 }).should('eq', Cypress.config('baseUrl') + '/');
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('not.be.null');
    cy.contains('Hello, Cypress Test User').should('be.visible');
  });

  // ── TC-E2E-AUTH-015 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-015 — signing up with an existing email shows a server error', () => {
    cy.visit('/register');

    cy.get('[data-testid="displayName-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@email.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="confirmPassword-input"]').type('password123');
    cy.get('[data-testid="signup-submit"]').click();

    cy.get('[role="alert"]', { timeout: 4000 }).should('contain', 'User already exist');
  });
});
