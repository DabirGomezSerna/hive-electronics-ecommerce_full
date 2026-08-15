/**
 * Unit tests — CartContext, authenticated-user error paths
 *
 * CartContext.auth.test.jsx covers the happy paths for the authenticated
 * addToCart/clearCart/removeFromCart/updateQuantity API calls. This file
 * covers what happens when those apiClient calls reject: the promise the
 * click handler awaits must not reject (previously it did — an unguarded
 * `cart._id` read after a rejected await), prior cart state must be
 * preserved, cartError must be exposed through useCart(), and the failure
 * must be logged.
 *
 * Mocks:
 *   - userServices.getCurrentUser — always returns an authenticated user
 *   - apiClient                   — intercepts all HTTP calls
 *   - logger                      — asserts the failure was logged
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../../context/CartContext';

vi.mock('../../services/userServices', () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, { status = 0 } = {}) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
}));
vi.mock('../../services/logger', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { getCurrentUser } from '../../services/userServices';
import apiClient, { ApiError } from '../../services/apiClient';
import logger from '../../services/logger';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const AUTH_USER = { userId: 'user1', displayName: 'Test User', email: 'test@example.com', role: 'customer' };
const CART_ID = 'cart123';

const PRODUCTS = [
  { _id: 'p1', name: 'Widget A', price: 10, image: ['img-a.jpg'], stock: 5 },
  { _id: 'p2', name: 'Widget B', price: 25, image: ['img-b.jpg'], stock: 3 },
];

const makeCartResponse = (items) => ({
  _id: CART_ID,
  products: items.map(({ product, quantity }) => ({ product, quantity })),
});

// ── Test consumer ─────────────────────────────────────────────────────────────

function ErrorTestConsumer() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartError } = useCart();
  return (
    <div>
      <span data-testid="item-count">{cartItems.length}</span>
      {cartItems.map((item) => (
        <span key={item._id} data-testid={`qty-${item._id}`}>
          {item.quantity}
        </span>
      ))}
      {cartError && <span data-testid="cart-error">{cartError}</span>}
      <button onClick={() => addToCart(PRODUCTS[1], 1)}>add-p2</button>
      <button onClick={() => removeFromCart('p1')}>remove-p1</button>
      <button onClick={() => updateQuantity('p1', 5)}>update-p1-qty</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

const renderConsumer = () =>
  render(
    <CartProvider>
      <ErrorTestConsumer />
    </CartProvider>,
  );

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  getCurrentUser.mockReturnValue(AUTH_USER);
  apiClient.mockResolvedValue(null);
  logger.error.mockClear();
});

const mountWithP1 = async () => {
  apiClient.mockResolvedValueOnce(makeCartResponse([{ product: PRODUCTS[0], quantity: 1 }]));
  renderConsumer();
  await waitFor(() => expect(screen.getByTestId('item-count')).toHaveTextContent('1'));
};

// ── addToCart failure ─────────────────────────────────────────────────────────

describe('CartContext — addToCart() failure', () => {
  it('TC-CTX-ERR-001 — a rejected POST does not throw, preserves prior state, exposes cartError, and logs', async () => {
    await mountWithP1();

    apiClient.mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByText('add-p2'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-error')).toHaveTextContent(
        "We couldn't add that product to your cart. Please try again."
      );
    });

    // Prior item is still there — the failed add did not wipe cart state.
    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    expect(screen.getByTestId('qty-p1')).toHaveTextContent('1');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to add product to cart',
      expect.objectContaining({ productId: 'p2', error: expect.any(Error) })
    );
  });
});

// ── clearCart failure ─────────────────────────────────────────────────────────

describe('CartContext — clearCart() failure', () => {
  it('TC-CTX-ERR-002 — a rejected DELETE does not throw, preserves prior state, and exposes cartError', async () => {
    await mountWithP1();

    apiClient.mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByText('clear'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-error')).toHaveTextContent(
        "We couldn't empty your cart. Please try again."
      );
    });

    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to clear cart',
      expect.objectContaining({ cartId: CART_ID, error: expect.any(Error) })
    );
  });
});

// ── removeFromCart failure ────────────────────────────────────────────────────

describe('CartContext — removeFromCart() failure', () => {
  it('TC-CTX-ERR-003 — a rejected PUT does not throw, preserves prior state, and exposes cartError', async () => {
    // Mount with two items so removal goes through the PUT branch, not clearCart.
    apiClient.mockResolvedValueOnce(
      makeCartResponse([
        { product: PRODUCTS[0], quantity: 1 },
        { product: PRODUCTS[1], quantity: 2 },
      ]),
    );
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('item-count')).toHaveTextContent('2'));

    apiClient.mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByText('remove-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-error')).toHaveTextContent(
        "We couldn't remove that product. Please try again."
      );
    });

    expect(screen.getByTestId('item-count')).toHaveTextContent('2');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to remove product from cart',
      expect.objectContaining({ productId: 'p1', error: expect.any(Error) })
    );
  });
});

// ── updateQuantity failure ────────────────────────────────────────────────────

describe('CartContext — updateQuantity() failure', () => {
  it('TC-CTX-ERR-004 — a rejected PUT does not throw, preserves prior quantity, and exposes cartError', async () => {
    await mountWithP1();

    apiClient.mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByText('update-p1-qty'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-error')).toHaveTextContent(
        "We couldn't update the quantity. Please try again."
      );
    });

    expect(screen.getByTestId('qty-p1')).toHaveTextContent('1');
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to update product quantity',
      expect.objectContaining({ productId: 'p1', newQuantity: 5, error: expect.any(Error) })
    );
  });
});

// ── 401 path (formerly `return;` → undefined) ─────────────────────────────────

describe('CartContext — 401 ApiError from apiClient', () => {
  it('TC-CTX-ERR-005 — a 401 ApiError is caught the same as any other rejection, not an unguarded TypeError', async () => {
    await mountWithP1();

    apiClient.mockRejectedValueOnce(new ApiError('Your session expired. Please log in again.', { status: 401 }));
    fireEvent.click(screen.getByText('add-p2'));

    await waitFor(() => {
      expect(screen.getByTestId('cart-error')).toBeInTheDocument();
    });

    // No crash, no TypeError from a stale `cart._id` read — prior state intact.
    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
  });
});
