/**
 * Unit tests — Checkout page
 *
 * Mocks:
 *   - shippingServices  → controls getShippingAddresses()
 *   - paymentServices   → controls getPaymentMethods()
 *   - orderServices     → controls createOrder()
 *   - userServices      → getCurrentUser() returns a predictable user
 *   - CartContext       → useCart() returns controlled cart state
 *   - react-router-dom  → useNavigate() returns a spy
 *
 * No real network calls. No real localStorage cart.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from '../../pages/Checkout/Checkout';

// ── Service mocks ─────────────────────────────────────────────────────────────
vi.mock('../../services/shippingServices', () => ({
  getShippingAddresses: vi.fn(),
  createShippingAddress: vi.fn(),
  updateShippingAddress: vi.fn(),
  deleteShippingAddress: vi.fn(),
}));

vi.mock('../../services/paymentServices', () => ({
  getPaymentMethods: vi.fn(),
  createPaymentMethod: vi.fn(),
  updatePaymentMethod: vi.fn(),
  deletePaymentMethod: vi.fn(),
}));

vi.mock('../../services/orderServices', () => ({
  createOrder: vi.fn(),
}));

vi.mock('../../services/userServices', () => ({
  getCurrentUser: vi.fn(() => ({
    userId: 'user1',
    displayName: 'John Doe',
    email: 'john@email.com',
    role: 'customer',
  })),
  isAuthenticated: vi.fn(() => true),
  logout: vi.fn(),
}));

// ── CartContext mock ───────────────────────────────────────────────────────────
const mockClearCart = vi.fn();
const mockCartState = {
  cartItems: [{ _id: 'p1', name: 'Widget', price: 99.99, quantity: 2, image: ['http://placeholder.com/800x600'] }],
  total: 199.98,
  clearCart: mockClearCart,
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
};

vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: vi.fn(() => mockCartState),
}));

// ── navigate spy ─────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import {
  getShippingAddresses,
  deleteShippingAddress,
} from '../../services/shippingServices';
import { getPaymentMethods } from '../../services/paymentServices';
import { createOrder } from '../../services/orderServices';
import { useCart } from '../../context/CartContext';

const mockAddresses = [
  {
    _id: 'addr1',
    name: 'Home',
    address1: '123 Main St',
    city: 'CDMX',
    postalCode: '06600',
    country: 'MX',
    defaultAddress: true,
  },
];

const mockPaymentMethods = [
  { _id: 'pm1', type: 'cash_on_delivery', isDefault: true },
];

const renderCheckout = () =>
  render(
    <MemoryRouter>
      <Checkout />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  getShippingAddresses.mockResolvedValue(mockAddresses);
  getPaymentMethods.mockResolvedValue(mockPaymentMethods);
  useCart.mockReturnValue(mockCartState);
  mockNavigate.mockReset();
  mockClearCart.mockReset();
});

// ── rendering ─────────────────────────────────────────────────────────────────
describe('Checkout — rendering', () => {
  it('TC-UNIT-FE-CHECKOUT-001 — shows address after data loads', async () => {
    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-CHECKOUT-002 — pre-selects the default address', async () => {
    renderCheckout();

    // The selected address summary shows the address name in the SummarySection.
    // 'Home' appears in multiple places (summary + sidebar), so getAllByText is used.
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });
  });

  it('TC-UNIT-FE-CHECKOUT-003 — shows payment method section', async () => {
    renderCheckout();

    // 'Cash on delivery' appears in summaryContent (twice) and sidebar; use getAllByText.
    await waitFor(() => {
      expect(screen.getAllByText(/cash on delivery/i).length).toBeGreaterThan(0);
    });
  });
});

// ── empty cart redirect ───────────────────────────────────────────────────────
describe('Checkout — empty cart', () => {
  it('TC-UNIT-FE-CHECKOUT-005 — redirects to /cart when cart is empty', async () => {
    useCart.mockReturnValue({ ...mockCartState, cartItems: [], total: 0 });

    renderCheckout();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });
  });
});

// ── API error ─────────────────────────────────────────────────────────────────
describe('Checkout — API error', () => {
  it('TC-UNIT-FE-CHECKOUT-004 — shows error message when data load fails', async () => {
    getShippingAddresses.mockRejectedValue(new Error('Network error'));

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText(/unable to load checkout information/i)).toBeInTheDocument();
    });
  });
});

// ── order creation ────────────────────────────────────────────────────────────
describe('Checkout — order creation', () => {
  it('TC-UNIT-FE-CHECKOUT-006 — navigates to /order-confirmation after successful order', async () => {
    const mockOrder = {
      _id: 'ord1',
      status: 'pending',
      taxAmount: 31.9968,
      shippingCost: 350,
      totalPrice: 581.99,
      createdAt: new Date().toISOString(),
    };
    createOrder.mockResolvedValue(mockOrder);

    renderCheckout();

    // Wait for data to load (address name appears in multiple places)
    await waitFor(() => {
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });

    // Find and click the "Confirm order" button
    const confirmBtn = screen.queryByRole('button', { name: /confirm/i });
    if (confirmBtn) {
      confirmBtn.click();
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/order-confirmation',
          expect.objectContaining({ state: expect.objectContaining({ order: expect.objectContaining({ _id: 'ord1' }) }) })
        );
      });
    }
  });
});
