/**
 * Unit tests — Header layout component
 *
 * Covers:
 *   - Navigation component rendered
 *   - Logo link rendered
 *   - Unauthenticated dropdown: Login and Create account buttons visible
 *   - Authenticated dropdown: user name/email visible
 *   - Search form: input updates on change
 *   - Search form: submitting navigates to "/?q={term}"
 *   - Logout button calls logout() service
 *   - Cart item count displayed
 *
 * Mocks:
 *   - userServices      → isAuthenticated, getCurrentUser, logout
 *   - CartContext       → useCart returns controlled state
 *   - Navigation        → stub
 *   - Icon              → stub
 *   - react-router-dom  → useNavigate spy, real MemoryRouter for Links
 *   - config/pricing    → FREE_SHIPPING_THRESHOLD
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../services/userServices', () => ({
  isAuthenticated: vi.fn(() => false),
  getCurrentUser: vi.fn(() => null),
  logout: vi.fn(),
}));

vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: vi.fn(() => ({ getTotalItems: vi.fn(() => 0), cartItems: [] })),
}));

vi.mock('../../layout/Navigation/Navigation', () => ({
  default: () => <nav data-testid="navigation" />,
}));

vi.mock('../../components/common/Icon/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock('../../components/common/Badge/Badge', () => ({
  default: ({ text }) => <span data-testid="badge">{text}</span>,
}));

vi.mock('../../config/pricing', () => ({
  FREE_SHIPPING_THRESHOLD: 500,
  SHIPPING_RATE: 99,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Imports after mocks ───────────────────────────────────────────────────────

import { isAuthenticated, getCurrentUser, logout } from '../../services/userServices';
import { useCart } from '../../context/CartContext';
import Header from '../../layout/Header/Header';

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Header — structure', () => {
  beforeEach(() => {
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);
    useCart.mockReturnValue({ getTotalItems: vi.fn(() => 0), cartItems: [] });
    mockNavigate.mockReset();
  });

  it('TC-UNIT-FE-HEADER-001 — renders the Navigation component', async () => {
    // Arrange + Act
    renderHeader();

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-HEADER-002 — renders logo link', async () => {
    // Arrange + Act
    renderHeader();

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /hiveelectronics/i })).toBeInTheDocument();
    });
  });
});

describe('Header — unauthenticated state', () => {
  beforeEach(() => {
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);
    useCart.mockReturnValue({ getTotalItems: vi.fn(() => 0), cartItems: [] });
    mockNavigate.mockReset();
  });

  it('TC-UNIT-FE-HEADER-003 — shows Login and Create account buttons when user is not authenticated', async () => {
    // Arrange
    renderHeader();

    // Act — open user menu
    const menuToggle = await screen.findByRole('button', { name: /menú de usuario/i });
    userEvent.click(menuToggle);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });
});

describe('Header — authenticated state', () => {
  beforeEach(() => {
    isAuthenticated.mockReturnValue(true);
    getCurrentUser.mockReturnValue({
      userId: 'u1',
      displayName: 'Jane Doe',
      email: 'jane@test.com',
      role: 'customer',
    });
    useCart.mockReturnValue({ getTotalItems: vi.fn(() => 0), cartItems: [] });
    mockNavigate.mockReset();
  });

  it('TC-UNIT-FE-HEADER-004 — shows user profile info when authenticated', async () => {
    // Arrange
    renderHeader();

    // Act — open user menu
    const menuToggle = await screen.findByRole('button', { name: /menú de usuario/i });
    userEvent.click(menuToggle);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-HEADER-007 — Logout button calls logout() service', async () => {
    // Arrange
    renderHeader();

    // Act — open user menu then click logout
    const menuToggle = await screen.findByRole('button', { name: /menú de usuario/i });
    userEvent.click(menuToggle);

    const logoutBtn = await screen.findByRole('button', { name: /close session/i });
    userEvent.click(logoutBtn);

    // Assert
    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Header — search form', () => {
  beforeEach(() => {
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);
    useCart.mockReturnValue({ getTotalItems: vi.fn(() => 0), cartItems: [] });
    mockNavigate.mockReset();
  });

  it('TC-UNIT-FE-HEADER-005 — search form input updates on change', () => {
    // Arrange
    renderHeader();

    // Act
    const input = screen.getByPlaceholderText(/search products/i);
    userEvent.type(input, 'laptop');

    // Assert
    expect(input).toHaveValue('laptop');
  });

  it('TC-UNIT-FE-HEADER-006 — submitting search navigates to "/?q={term}"', () => {
    // Arrange
    renderHeader();

    // Act
    const input = screen.getByPlaceholderText(/search products/i);
    userEvent.type(input, 'laptop');
    userEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/?q=laptop');
  });
});

describe('Header — cart badge', () => {
  beforeEach(() => {
    isAuthenticated.mockReturnValue(false);
    getCurrentUser.mockReturnValue(null);
    mockNavigate.mockReset();
  });

  it('TC-UNIT-FE-HEADER-008 — cart item count shows number from getTotalItems()', async () => {
    // Arrange
    useCart.mockReturnValue({ getTotalItems: vi.fn(() => 3), cartItems: [] });

    // Act
    renderHeader();

    // Assert
    await waitFor(() => {
      // Header renders cart count as a plain <span className="cart-badge">
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
