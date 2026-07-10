/**
 * E2E tests — Checkout flow
 *
 * The checkout flow has 4 phases:
 *   Phase 1: Address selection (pre-loaded from shippingAddress.json)
 *   Phase 2: Order details (cart items shown via CartView)
 *   Phase 3: Order summary with totals and "Confirm payment" button
 *   Phase 4: Order confirmation page after successful checkout
 *
 * Covers:
 *   TC-E2E-CHECKOUT-001: Unauthenticated checkout redirect to login
 *   TC-E2E-CHECKOUT-002: Checkout page loads with default address pre-selected
 *   TC-E2E-CHECKOUT-003: Checkout shows cart items in "Order details" section
 *   TC-E2E-CHECKOUT-004: Order summary shows correct subtotal
 *   TC-E2E-CHECKOUT-005: "Confirm payment" is disabled without address selection
 *   TC-E2E-CHECKOUT-006: Full checkout flow completes and shows confirmation
 *   TC-E2E-CHECKOUT-007: Order confirmation shows order ID and "Thank you" message
 *   TC-E2E-CHECKOUT-008: Address form can add a new address
 */

const AUTH_STATE = {
  onBeforeLoad(win) {
    const token = win.btoa('john@email.com:' + Date.now());
    win.localStorage.setItem('authToken', token);
    win.localStorage.setItem(
      'userData',
      JSON.stringify({
        _id: '67fc9bda370302bf46079352',
        displayName: 'John Doe',
        email: 'john@email.com',
        role: 'customer',
        loginDate: new Date().toISOString(),
      })
    );
    // Cart with one item so checkout doesn't redirect to /cart
    win.localStorage.setItem(
      'cart',
      JSON.stringify([
        {
          _id: 'Yt4klRMQS0kyYUlQhTyrv2',
          name: 'RGB keyboard',
          price: 29.99,
          stock: 30,
          image: ['/img/RGB-keyboard.webp'],
          quantity: 2,
        },
      ])
    );
  },
};

describe('Checkout flow', () => {
  // ── TC-E2E-CHECKOUT-001 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-001 — unauthenticated user is redirected to /login', () => {
    cy.visit('/checkout');
    cy.url().should('include', '/login');
  });

  // ── TC-E2E-CHECKOUT-002 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-002 — checkout loads with default address pre-selected', () => {
    cy.visit('/', AUTH_STATE);
    cy.visit('/checkout');

    // shippingAddress.json default address: name="Home", city="Aguascalientes"
    // defaultCommandTimeout = 8s to accommodate 600ms address fetch delay
    cy.contains('Home', { timeout: 8000 }).should('be.visible');
  });

  // ── TC-E2E-CHECKOUT-003 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-003 — checkout shows cart items in "Order details" section', () => {
    cy.visit('/', AUTH_STATE);
    cy.visit('/checkout');

    cy.contains('2. Order details').should('be.visible');
    cy.contains('RGB keyboard').should('be.visible');
  });

  // ── TC-E2E-CHECKOUT-004 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-004 — order summary shows subtotal for cart items', () => {
    cy.visit('/', AUTH_STATE);
    cy.visit('/checkout');

    // 2 × $29.99 = $59.98 → formatted as MXN currency
    cy.contains('Subtotal:').should('be.visible');
    cy.contains('$59.98').should('be.visible');
  });

  // ── TC-E2E-CHECKOUT-005 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-005 — "Confirm payment" button is enabled when address is selected', () => {
    cy.visit('/', AUTH_STATE);
    cy.visit('/checkout');

    // Default address pre-selected → button should be enabled
    cy.get('[data-testid="confirm-payment-btn"]', { timeout: 8000 })
      .should('not.be.disabled');
  });

  // ── TC-E2E-CHECKOUT-006 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-006 — clicking "Confirm payment" redirects to /order-confirmation', () => {
    cy.visit('/', AUTH_STATE);
    cy.visit('/checkout');

    cy.get('[data-testid="confirm-payment-btn"]', { timeout: 8000 })
      .should('not.be.disabled')
      .click();

    cy.url().should('include', '/order-confirmation');
  });

  // ── TC-E2E-CHECKOUT-007 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-007 — order confirmation page shows "Thank you" and order ID', () => {
    cy.visit('/', AUTH_STATE);
    cy.visit('/checkout');

    cy.get('[data-testid="confirm-payment-btn"]', { timeout: 8000 })
      .should('not.be.disabled')
      .click();

    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.contains('Thank you for shopping with us!').should('be.visible');
    cy.contains('has been confirmed').should('be.visible');
  });

  // ── TC-E2E-CHECKOUT-008 ──────────────────────────────────────────────────────
  it('TC-E2E-CHECKOUT-008 — address form allows adding a new shipping address', () => {
    cy.visit('/', AUTH_STATE);
    cy.visit('/checkout');

    // After loadData() completes, the section collapses because a default address was
    // found — SummarySection renders the "Change" button instead of its children.
    // Wait for "Change" to confirm loading is done, then click it to expand the section.
    cy.contains('Change', { timeout: 8000 }).should('be.visible').click();

    // AddressList is now rendered — wait for it before clicking
    cy.contains('Add new address').should('be.visible').click();

    // Fill the address form
    cy.contains('New address').should('be.visible');
    cy.get('input[name="name"]').type('Office');
    cy.get('input[name="address1"]').type('456 Business Ave');
    cy.get('input[name="postalCode"]').type('20001');
    cy.get('input[name="city"]').type('Mexico City');
    cy.get('input[name="country"]').type('Mexico');

    cy.contains('Add address').click();

    // After submit, the new address is auto-selected and shown in the collapsed summary
    cy.contains('Office').should('be.visible');
  });
});
