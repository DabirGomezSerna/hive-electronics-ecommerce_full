/**
 * Custom Cypress commands for hive-electronics-ecommerce_app.
 *
 * Now that the frontend calls the real API (userServices.js uses apiClient),
 * auth tokens must be valid JWT-shaped strings. loginBySession constructs a
 * three-segment token (header.payload.signature) that can be decoded by
 * atob(token.split(".")[1]) in userServices.getCurrentUser().
 *
 * userData is stored with key "userId" (not "_id") to match the shape that
 * userServices.login() writes after a real API login.
 *
 * Users must exist in the real MongoDB database. These IDs correspond to the
 * seeded test users — update them if the database is re-seeded.
 *
 * See: FRONTEND-005 in docs/testing/known-issues.md
 */

const TEST_USERS = {
  'john@email.com': {
    userId: '67fc9bda370302bf46079352',
    displayName: 'John Doe',
    email: 'john@email.com',
    role: 'customer',
  },
  'jane@email.com': {
    userId: '67fc9bda370302bf46079350',
    displayName: 'Jane Doe',
    email: 'jane@email.com',
    role: 'customer',
  },
};

/**
 * cy.loginBySession(email?)
 * Seeds localStorage with a JWT-shaped authToken and the userData object that
 * getCurrentUser() reads. Bypasses the login form entirely.
 *
 * The token is NOT cryptographically signed — it is only structurally valid
 * (header.payload.signature) so that atob(token.split(".")[1]) decodes
 * correctly. isAuthenticated() checks for token presence only; no signature
 * verification happens in the frontend.
 *
 * Call BEFORE cy.visit() so the app reads auth state on initial mount.
 *
 * @param {string} email — test user email (default: 'john@email.com')
 */
Cypress.Commands.add('loginBySession', (email = 'john@email.com') => {
  const user = TEST_USERS[email];
  if (!user) throw new Error(`loginBySession: unknown test user "${email}"`);

  cy.window().then((win) => {
    const headerB64 = win.btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadB64 = win.btoa(JSON.stringify({
      userId: user.userId,
      name: user.displayName,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    const token = `${headerB64}.${payloadB64}.cypress-test-signature`;

    win.localStorage.setItem('authToken', token);
    win.localStorage.setItem('userData', JSON.stringify({
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    }));
  });
});

/**
 * cy.addProductToCart(product?)
 * Pushes a product into the cart localStorage key.
 * Increments quantity if product already exists.
 *
 * @param {object} product — partial product (defaults to first JSON product)
 */
Cypress.Commands.add('addProductToCart', (product = null) => {
  const DEFAULT_PRODUCT = {
    _id: 'Yt4klRMQS0kyYUlQhTyrv2',
    name: 'RGB keyboard',
    price: 29.99,
    stock: 30,
    image: ['/img/RGB-keyboard.webp'],
    quantity: 1,
  };
  const cartItem = product || DEFAULT_PRODUCT;

  cy.window().then((win) => {
    const current = JSON.parse(win.localStorage.getItem('cart') || '[]');
    const existing = current.find((i) => i._id === cartItem._id);
    const updated = existing
      ? current.map((i) =>
          i._id === cartItem._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [...current, cartItem];
    win.localStorage.setItem('cart', JSON.stringify(updated));
  });
});

/**
 * cy.clearCart()
 * Empties the cart in localStorage.
 */
Cypress.Commands.add('clearCart', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('cart', JSON.stringify([]));
  });
});

/**
 * cy.logoutSession()
 * Removes auth keys from localStorage.
 */
Cypress.Commands.add('logoutSession', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('authToken');
    win.localStorage.removeItem('userData');
  });
});
