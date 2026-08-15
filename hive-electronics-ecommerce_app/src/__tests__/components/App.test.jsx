/**
 * Unit tests — App component
 *
 * App.jsx is a pure wiring component: CartProvider → BrowserRouter →
 * Layout → Routes. There is no conditional logic; executing the render
 * once gives 100% statement coverage.
 *
 * Strategy:
 *   - Mock BrowserRouter with MemoryRouter so each test can control the
 *     initial route via the module-level `testRoute` variable, which the
 *     BrowserRouter stub captures by reference.
 *   - Mock all page components as labelled stubs — no transitive deps.
 *   - Mock CartProvider, Layout, and ProtectedRoute as pass-throughs.
 *
 * Note: `testRoute` must be declared before the vi.mock factory is
 * executed. Vitest hoists vi.mock calls but the factory closure only
 * READS `testRoute` at render time (not at hoist time), so the variable
 * is always initialized by then.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../components/App/App';

// ── Route control variable ────────────────────────────────────────────────────

// Set before each render; the BrowserRouter stub reads it by reference.
let testRoute = '/';

// ── react-router-dom: replace BrowserRouter with MemoryRouter ─────────────────

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }) => (
      <actual.MemoryRouter initialEntries={[testRoute]}>
        {children}
      </actual.MemoryRouter>
    ),
  };
});

// ── Page stubs ────────────────────────────────────────────────────────────────

// Wrapped in vi.fn() (rather than a plain arrow function) so the
// error-boundary test below can swap in a throwing implementation.
vi.mock('../../pages/Home/Home', () => ({ default: vi.fn(() => <div data-testid="page-home" />) }));
vi.mock('../../pages/Cart/Cart', () => ({ default: () => <div data-testid="page-cart" /> }));
vi.mock('../../pages/Login/Login', () => ({ default: () => <div data-testid="page-login" /> }));
vi.mock('../../pages/Product', () => ({ default: () => <div data-testid="page-product" /> }));
vi.mock('../../pages/CategoryPage', () => ({ default: () => <div data-testid="page-category" /> }));
vi.mock('../../pages/Checkout/Checkout', () => ({ default: () => <div data-testid="page-checkout" /> }));
vi.mock('../../pages/Order/Order', () => ({ default: () => <div data-testid="page-order" /> }));

// ProtectedRoute as pass-through — removes auth dependency from route tests
vi.mock('../../pages/ProtectedRoute', () => ({
  default: ({ children }) => children,
}));

// ── Provider / layout stubs ───────────────────────────────────────────────────

vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: vi.fn(() => ({ cartItems: [], total: 0, clearCart: vi.fn() })),
}));

vi.mock('../../layout/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

// Imported after the mocks above so this is the mocked (vi.fn()) module.
import Home from '../../pages/Home/Home';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  testRoute = '/';
});

afterEach(() => {
  // Restore Home's default (non-throwing) implementation after the
  // error-boundary test below overrides it.
  Home.mockImplementation(() => <div data-testid="page-home" />);
});

// ── Route tests ───────────────────────────────────────────────────────────────

describe('App — route wiring', () => {
  it('TC-UNIT-FE-APP-001 — "/" renders Home inside Layout', () => {
    render(<App />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('page-home')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-APP-002 — "/cart" renders Cart', async () => {
    testRoute = '/cart';
    render(<App />);
    expect(await screen.findByTestId('page-cart')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-APP-003 — "/login" renders Login', async () => {
    testRoute = '/login';
    render(<App />);
    expect(await screen.findByTestId('page-login')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-APP-004 — "/checkout" renders Checkout (via ProtectedRoute stub)', async () => {
    testRoute = '/checkout';
    render(<App />);
    expect(await screen.findByTestId('page-checkout')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-APP-005 — "/order-confirmation" renders Order (via ProtectedRoute stub)', async () => {
    testRoute = '/order-confirmation';
    render(<App />);
    expect(await screen.findByTestId('page-order')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-APP-006 — unknown path renders wildcard "Page not available"', () => {
    testRoute = '/this-route-does-not-exist';
    render(<App />);
    expect(screen.getByText('Page not available')).toBeInTheDocument();
  });
});

describe('App — route error boundary', () => {
  it('TC-UNIT-FE-APP-007 — a throwing page renders the route fallback, and Layout stays mounted', () => {
    // React's default onCaughtError still logs to console.error for a caught
    // error; keep the test output clean.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    Home.mockImplementation(() => {
      throw new Error('boom');
    });

    render(<App />);

    // The fallback replaced the crashed page...
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByTestId('page-home')).not.toBeInTheDocument();
    // ...but Layout (Header/Footer/Navigation) is still rendered around it.
    expect(screen.getByTestId('layout')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
