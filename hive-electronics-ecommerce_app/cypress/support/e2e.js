// Import custom commands
import './commands';

// Clear localStorage before every test to prevent state leakage
beforeEach(() => {
  cy.clearLocalStorage();
});
