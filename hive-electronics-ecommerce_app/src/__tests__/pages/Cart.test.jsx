/**
 * Unit tests — Cart page
 *
 * Covers:
 *   - Empty cart state (no items): correct messaging and navigation
 *   - Filled cart state: CartView rendered, total price shown, actions functional
 *
 * Mocks:
 *   - CartContext  → useCart() returns controlled state
 *   - CartView     → stub
 *   - Icon         → stub
 *   - react-router-dom → useNavigate returns a spy
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks (must be declared before imports that use them) ─────────────────────

vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: vi.fn(),
}));

vi.mock('../../components/Cart/CartView', () => ({
  default: () => <div data-testid="cart-view" />,
}));

vi.mock('../../components/common/Icon/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useCart } from '../../context/CartContext';
import Cart from '../../pages/Cart/Cart';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const cartItems = [{ _id: 'p1', name: 'Widget', price: 99.99, quantity: 2 }];

const emptyCartState = {
  cartItems: [],
  clearCart: vi.fn(),
  getTotalItems: vi.fn(() => 0),
  getTotalPrice: vi.fn(() => 0),
};

const filledCartState = {
  cartItems,
  clearCart: vi.fn(),
  getTotalItems: vi.fn(() => 2),
  getTotalPrice: vi.fn(() => 199.98),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderCart = () =>
  render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Cart page — empty state', () => {
  beforeEach(() => {
    useCart.mockReturnValue(emptyCartState);
    mockNavigate.mockReset();
  });

  it('TC-UNIT-FE-CART-001 — shows "No items in shopping cart" when cart is empty', () => {
    // Arrange + Act
    renderCart();

    // Assert
    expect(screen.getByText('No items in shopping cart')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CART-002 — shows "Back to products" button when cart is empty', () => {
    // Arrange + Act
    renderCart();

    // Assert
    expect(screen.getByRole('button', { name: /back to products/i })).toBeInTheDocument();
  });
});

describe('Cart page — filled state', () => {
  beforeEach(() => {
    useCart.mockReturnValue(filledCartState);
    mockNavigate.mockReset();
  });

  it('TC-UNIT-FE-CART-003 — shows CartView component when cart has items', () => {
    // Arrange + Act
    renderCart();

    // Assert
    expect(screen.getByTestId('cart-view')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CART-004 — shows total price when cart has items', () => {
    // Arrange + Act
    renderCart();

    // Assert
    expect(screen.getByText('$199.98')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CART-005 — clicking "Empty cart" calls clearCart()', () => {
    // Arrange
    renderCart();
    const clearBtn = screen.getByRole('button', { name: /empty cart/i });

    // Act
    userEvent.click(clearBtn);

    // Assert
    expect(filledCartState.clearCart).toHaveBeenCalledTimes(1);
  });

  it('TC-UNIT-FE-CART-006 — clicking "Back to products" navigates to "/"', () => {
    // Arrange
    renderCart();
    const backBtn = screen.getByRole('button', { name: /back to products/i });

    // Act
    userEvent.click(backBtn);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('TC-UNIT-FE-CART-007 — "Proceed to payment" button navigates to "/checkout"', () => {
    // Arrange
    renderCart();
    const checkoutBtn = screen.getByRole('button', { name: /proceed to payment/i });

    // Act
    userEvent.click(checkoutBtn);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });
});
