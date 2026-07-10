/**
 * E2E tests — Login flow
 *
 * Covers:
 *   TC-E2E-AUTH-001: Login page renders form fields
 *   TC-E2E-AUTH-002: Invalid credentials show error message
 *   TC-E2E-AUTH-003: Valid credentials redirect to home
 *   TC-E2E-AUTH-004: Auth token is stored in localStorage after login
 *   TC-E2E-AUTH-005: Authenticated user sees their name in header
 *   TC-E2E-AUTH-006: Protected route /checkout redirects unauthenticated users to /login
 *   TC-E2E-AUTH-007: Protected route /checkout is accessible after login
 *   TC-E2E-AUTH-008: Logout removes auth token and updates header
 */

describe('Login flow', () => {
  // ── TC-E2E-AUTH-001 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-001 — login page renders email, password inputs and submit button', () => {
    cy.visit('/login');

    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible').and('contain', 'Log in');
  });

  // ── TC-E2E-AUTH-002 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-002 — invalid credentials show error message', () => {
    cy.visit('/login');

    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-submit"]').click();

    // The form has an 800ms built-in delay + 1.5s user fetch → allow 4s
    cy.get('[role="alert"]', { timeout: 4000 }).should(
      'contain',
      'Incorrect email or password'
    );
  });

  // ── TC-E2E-AUTH-003 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-003 — valid credentials redirect to home page', () => {
    cy.visit('/login');

    cy.get('[data-testid="email-input"]').type('john@email.com');
    cy.get('[data-testid="password-input"]').type('john123');
    cy.get('[data-testid="login-submit"]').click();

    // Login flow: 800ms delay + 1.5s user fetch + navigate('/') + reload
    // Total: ~2.5s. Allow 8s via defaultCommandTimeout in cypress.config.js.
    cy.url({ timeout: 8000 }).should('eq', Cypress.config('baseUrl') + '/');
  });

  // ── TC-E2E-AUTH-004 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-004 — authToken is stored in localStorage after login', () => {
    cy.visit('/login');

    cy.get('[data-testid="email-input"]').type('john@email.com');
    cy.get('[data-testid="password-input"]').type('john123');
    cy.get('[data-testid="login-submit"]').click();

    cy.url({ timeout: 8000 }).should('eq', Cypress.config('baseUrl') + '/');
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('not.be.null');
  });

  // ── TC-E2E-AUTH-005 ─────────────────────────────────────────────────────────
  it("TC-E2E-AUTH-005 — header shows user's display name after login via session command", () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        const token = win.btoa('john@email.com:' + Date.now());
        const user = {
          _id: '67fc9bda370302bf46079352',
          displayName: 'John Doe',
          email: 'john@email.com',
          role: 'customer',
          isActive: true,
          loginDate: new Date().toISOString(),
        };
        win.localStorage.setItem('authToken', token);
        win.localStorage.setItem('userData', JSON.stringify(user));
      },
    });

    cy.contains('Hello, John Doe').should('be.visible');
  });

  // ── TC-E2E-AUTH-006 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-006 — unauthenticated user visiting /checkout is redirected to /login', () => {
    cy.visit('/checkout');
    cy.url().should('include', '/login');
  });

  // ── TC-E2E-AUTH-007 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-007 — authenticated user with cart can access /checkout', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Set up auth
        const token = win.btoa('john@email.com:' + Date.now());
        win.localStorage.setItem('authToken', token);
        win.localStorage.setItem(
          'userData',
          JSON.stringify({ displayName: 'John Doe', email: 'john@email.com', role: 'customer' })
        );
        // Set up cart so checkout doesn't redirect back to /cart
        win.localStorage.setItem(
          'cart',
          JSON.stringify([
            { _id: 'Yt4klRMQS0kyYUlQhTyrv2', name: 'RGB keyboard', price: 29.99, stock: 30, image: ['/img/RGB-keyboard.webp'], quantity: 1 },
          ])
        );
      },
    });

    cy.visit('/checkout');
    cy.url().should('not.include', '/login');
  });

  // ── TC-E2E-AUTH-008 ─────────────────────────────────────────────────────────
  it('TC-E2E-AUTH-008 — logout removes auth token and shows "please log in" in header', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        const token = win.btoa('john@email.com:' + Date.now());
        win.localStorage.setItem('authToken', token);
        win.localStorage.setItem(
          'userData',
          JSON.stringify({ displayName: 'John Doe', email: 'john@email.com', role: 'customer' })
        );
      },
    });

    // Open user menu and click logout
    cy.get('.user-info').click();
    cy.contains('Close session').click();

    // After reload triggered by logout
    cy.contains('Hello, please log in', { timeout: 5000 }).should('be.visible');
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.null');
  });
});
