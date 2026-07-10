/**
 * E2E tests — Shopping cart
 *
 * Covers:
 *   TC-E2E-CART-001: Empty cart shows empty state message
 *   TC-E2E-CART-002: Products list appears on home page after loading
 *   TC-E2E-CART-003: Clicking "Add to cart" on a product card adds it to cart
 *   TC-E2E-CART-004: Cart badge in header reflects item count
 *   TC-E2E-CART-005: Cart page shows added items
 *   TC-E2E-CART-006: Quantity increment button increases count
 *   TC-E2E-CART-007: Remove button removes item from cart
 *   TC-E2E-CART-008: "Empty cart" button clears all items
 *   TC-E2E-CART-009: "Proceed to payment" navigates to checkout (authenticated)
 */

describe('Shopping cart', () => {
  // ── TC-E2E-CART-001 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-001 — empty cart shows "No items in shopping cart" message', () => {
    cy.visit('/cart');
    cy.contains('No items in shopping cart').should('be.visible');
  });

  // ── TC-E2E-CART-002 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-002 — home page shows product cards after 2-second service delay', () => {
    cy.visit('/');
    // Products load after 2s; defaultCommandTimeout = 8s
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="product-card"]').first().should('be.visible');
  });

  // ── TC-E2E-CART-003 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-003 — clicking "Add to cart" adds the product to the cart', () => {
    cy.visit('/');
    cy.get('[data-testid="add-to-cart-btn"]').first().click();

    // Navigate to cart and verify item is present
    cy.visit('/cart');
    cy.get('.cart-item').should('have.length.greaterThan', 0);
  });

  // ── TC-E2E-CART-004 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-004 — cart badge in header updates when item is added', () => {
    cy.visit('/');
    // Initially badge shows 0
    cy.get('.cart-badge').should('contain', '0');

    cy.get('[data-testid="add-to-cart-btn"]').first().click();
    cy.get('.cart-badge').should('contain', '1');
  });

  // ── TC-E2E-CART-005 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-005 — cart page shows item name and price', () => {
    // Set up cart via localStorage command before visiting
    cy.visit('/');
    cy.addProductToCart();
    cy.visit('/cart');

    cy.contains('RGB keyboard').should('be.visible');
    cy.contains('$29.99').should('be.visible');
  });

  // ── TC-E2E-CART-006 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-006 — quantity "+" button increases item count', () => {
    cy.visit('/');
    cy.addProductToCart();
    cy.visit('/cart');

    // Initial quantity is 1; click "+" (second button in the quantity controls)
    cy.get('.cart-item-quantity').first().within(() => {
      cy.get('button').eq(1).click(); // "+" button
    });

    cy.get('.cart-item-quantity').first().should('contain', '2');
  });

  // ── TC-E2E-CART-007 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-007 — remove button removes the item from the cart', () => {
    cy.visit('/');
    cy.addProductToCart();
    cy.visit('/cart');

    cy.get('.cart-item').should('have.length', 1);
    // Last button in each cart-item is the remove button (trash icon)
    cy.get('.cart-item').first().find('button.danger').click();

    cy.contains('No items in shopping cart').should('be.visible');
  });

  // ── TC-E2E-CART-008 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-008 — "Empty cart" button clears all items', () => {
    cy.visit('/');
    cy.addProductToCart();
    // Add a second product with different ID
    cy.addProductToCart({
      _id: 'ckFLvJ0riTu3yZpr7E1Sad',
      name: 'RGB mouse',
      price: 19.99,
      stock: 22,
      image: ['/img/RGB-mouse.webp'],
      quantity: 1,
    });
    cy.visit('/cart');

    cy.get('.cart-item').should('have.length', 2);
    cy.contains('Empty cart').click();
    cy.contains('No items in shopping cart').should('be.visible');
  });

  // ── TC-E2E-CART-009 ─────────────────────────────────────────────────────────
  it('TC-E2E-CART-009 — authenticated user clicking "Proceed to payment" goes to /checkout', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        const token = win.btoa('john@email.com:' + Date.now());
        win.localStorage.setItem('authToken', token);
        win.localStorage.setItem(
          'userData',
          JSON.stringify({ displayName: 'John Doe', email: 'john@email.com', role: 'customer' })
        );
        win.localStorage.setItem(
          'cart',
          JSON.stringify([
            { _id: 'Yt4klRMQS0kyYUlQhTyrv2', name: 'RGB keyboard', price: 29.99, stock: 30, image: ['/img/RGB-keyboard.webp'], quantity: 1 },
          ])
        );
      },
    });

    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').should('not.be.disabled').click();
    cy.url().should('include', '/checkout');
  });
});
