/**
 * Unit tests — CartContext, authenticated user paths
 *
 * The existing CartContext.test.jsx covers all guest (no-user) flows.
 * This file covers the authenticated API paths that only execute when
 * getCurrentUser() returns a non-null user object.
 *
 * Uncovered paths targeted (src/context/CartContext.jsx):
 *   Lines 23–30  — initial cart fetch via GET /carts/user/:id
 *   Lines 55–60  — addToCart via POST /carts/addToCart
 *   Lines 70–72  — clearCart via DELETE /carts/:cartId
 *   Lines 82–96  — removeFromCart via PUT (remaining) or DELETE (empty)
 *   Lines 115–125 — updateQuantity via PUT /carts/:cartId
 *   Lines 34–38  — localStorage sync skipped for authenticated users
 *
 * Mocks:
 *   - userServices.getCurrentUser — controls the auth state
 *   - apiClient                   — intercepts all HTTP calls; no real network
 *
 * Pattern:
 *   Each test sets getCurrentUser to return an auth user, queues
 *   apiClient responses with mockResolvedValueOnce, renders CartProvider,
 *   waits for the initial mount fetch to settle, then exercises the method
 *   under test and asserts both the UI state and the apiClient call shape.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../../context/CartContext';

vi.mock('../../services/userServices', () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock('../../services/apiClient', () => ({
  default: vi.fn(),
}));

import { getCurrentUser } from '../../services/userServices';
import apiClient from '../../services/apiClient';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const AUTH_USER = { userId: 'user1', displayName: 'Test User', email: 'test@example.com', role: 'customer' };
const CART_ID = 'cart123';

const PRODUCTS = [
  { _id: 'p1', name: 'Widget A', price: 10, image: ['img-a.jpg'], stock: 5 },
  { _id: 'p2', name: 'Widget B', price: 25, image: ['img-b.jpg'], stock: 3 },
];

// Cart API response shape: { _id, products: [{ product: {...}, quantity }] }
const makeCartResponse = (items) => ({
  _id: CART_ID,
  products: items.map(({ product, quantity }) => ({ product, quantity })),
});

// ── Test consumer ─────────────────────────────────────────────────────────────

function AuthTestConsumer() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  return (
    <div>
      <span data-testid="item-count">{cartItems.length}</span>
      {cartItems.map((item) => (
        <span key={item._id} data-testid={`qty-${item._id}`}>
          {item.quantity}
        </span>
      ))}
      <button onClick={() => addToCart(PRODUCTS[0], 1)}>add-p1</button>
      <button onClick={() => removeFromCart('p1')}>remove-p1</button>
      <button onClick={() => updateQuantity('p1', 5)}>update-p1-qty</button>
      <button onClick={() => updateQuantity('p1', 0)}>zero-p1-qty</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

const renderAuth = () =>
  render(
    <CartProvider>
      <AuthTestConsumer />
    </CartProvider>,
  );

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // vi.clearAllMocks() is called by vitest.setup.js — reset to safe defaults here.
  getCurrentUser.mockReturnValue(null);
  apiClient.mockResolvedValue(null);
});

// ── Initial load — authenticated ──────────────────────────────────────────────

describe('CartContext — authenticated initial load', () => {
  it('TC-CTX-AUTH-001 — fetches cart from GET /carts/user/:id on mount', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[0], quantity: 2 }]),
    );

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });

    expect(apiClient).toHaveBeenCalledWith(`/carts/user/${AUTH_USER.userId}`);
    expect(screen.getByTestId('qty-p1')).toHaveTextContent('2');
  });

  it('TC-CTX-AUTH-002 — falls back to empty cart when API fetch fails on mount', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);
    apiClient.mockRejectedValueOnce(new Error('Network error'));

    renderAuth();

    await waitFor(() => {
      // After the rejection the catch block calls setCartItems([])
      expect(apiClient).toHaveBeenCalledWith(`/carts/user/${AUTH_USER.userId}`);
    });

    expect(screen.getByTestId('item-count')).toHaveTextContent('0');
  });
});

// ── addToCart — authenticated ─────────────────────────────────────────────────

describe('CartContext — authenticated addToCart()', () => {
  it('TC-CTX-AUTH-003 — calls POST /carts/addToCart and updates cart state from API response', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);

    // Mount: empty cart
    apiClient.mockResolvedValueOnce(makeCartResponse([]));
    renderAuth();
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith(`/carts/user/${AUTH_USER.userId}`));

    // addToCart: API returns cart with p1
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[0], quantity: 1 }]),
    );
    fireEvent.click(screen.getByText('add-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });

    expect(apiClient).toHaveBeenCalledWith('/carts/addToCart', {
      method: 'POST',
      body: JSON.stringify({ userId: AUTH_USER.userId, productId: PRODUCTS[0]._id, quantity: 1 }),
    });
    expect(screen.getByTestId('qty-p1')).toHaveTextContent('1');
  });
});

// ── clearCart — authenticated ─────────────────────────────────────────────────

describe('CartContext — authenticated clearCart()', () => {
  it('TC-CTX-AUTH-004 — calls DELETE /carts/:cartId and clears state', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);

    // Mount: existing cart with p1
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[0], quantity: 1 }]),
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('item-count')).toHaveTextContent('1'));

    // clearCart DELETE
    apiClient.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByText('clear'));

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(`/carts/${CART_ID}`, { method: 'DELETE' });
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });

  it('TC-CTX-AUTH-005 — clears local state immediately when user has no cartId yet', async () => {
    // User is authenticated but API fetch fails, so cartId is never set.
    // clearCart should fall through to the !cartId branch and just clear items.
    getCurrentUser.mockReturnValue(AUTH_USER);
    apiClient.mockRejectedValueOnce(new Error('no cart'));

    renderAuth();
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith(`/carts/user/${AUTH_USER.userId}`));

    // No DELETE call — only local state cleared
    fireEvent.click(screen.getByText('clear'));

    // apiClient was called once (the failed mount fetch); no second call for DELETE
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
    expect(apiClient).toHaveBeenCalledTimes(1);
  });
});

// ── removeFromCart — authenticated ────────────────────────────────────────────

describe('CartContext — authenticated removeFromCart()', () => {
  it('TC-CTX-AUTH-006 — calls PUT /carts/:cartId with remaining products after removal', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);

    // Mount: cart with p1 and p2
    apiClient.mockResolvedValueOnce(
      makeCartResponse([
        { product: PRODUCTS[0], quantity: 1 },
        { product: PRODUCTS[1], quantity: 2 },
      ]),
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('item-count')).toHaveTextContent('2'));

    // removeFromCart p1: API returns cart with only p2
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[1], quantity: 2 }]),
    );
    fireEvent.click(screen.getByText('remove-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });

    expect(apiClient).toHaveBeenCalledWith(`/carts/${CART_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        user: AUTH_USER.userId,
        products: [{ product: PRODUCTS[1]._id, quantity: 2 }],
      }),
    });
  });

  it('TC-CTX-AUTH-007 — calls DELETE /carts/:cartId (via clearCart) when removing the last item', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);

    // Mount: cart with only p1
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[0], quantity: 1 }]),
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('item-count')).toHaveTextContent('1'));

    // removeFromCart sees updatedProducts.length === 0 → calls clearCart → DELETE
    apiClient.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByText('remove-p1'));

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(`/carts/${CART_ID}`, { method: 'DELETE' });
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });
});

// ── updateQuantity — authenticated ────────────────────────────────────────────

describe('CartContext — authenticated updateQuantity()', () => {
  it('TC-CTX-AUTH-008 — calls PUT /carts/:cartId with the new quantity', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);

    // Mount: cart with p1 qty=1
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[0], quantity: 1 }]),
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('qty-p1')).toHaveTextContent('1'));

    // updateQuantity p1 → 5
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[0], quantity: 5 }]),
    );
    fireEvent.click(screen.getByText('update-p1-qty'));

    await waitFor(() => {
      expect(screen.getByTestId('qty-p1')).toHaveTextContent('5');
    });

    expect(apiClient).toHaveBeenCalledWith(`/carts/${CART_ID}`, {
      method: 'PUT',
      body: JSON.stringify({
        user: AUTH_USER.userId,
        products: [{ product: PRODUCTS[0]._id, quantity: 5 }],
      }),
    });
  });

  it('TC-CTX-AUTH-009 — updateQuantity(0) delegates to removeFromCart which calls DELETE for last item', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);

    // Mount: cart with only p1
    apiClient.mockResolvedValueOnce(
      makeCartResponse([{ product: PRODUCTS[0], quantity: 3 }]),
    );
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('item-count')).toHaveTextContent('1'));

    // zero-p1-qty → updateQuantity(p1, 0) → removeFromCart(p1) → clearCart (DELETE)
    apiClient.mockResolvedValueOnce(null);
    fireEvent.click(screen.getByText('zero-p1-qty'));

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(`/carts/${CART_ID}`, { method: 'DELETE' });
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });
});

// ── localStorage isolation ────────────────────────────────────────────────────

describe('CartContext — authenticated localStorage isolation', () => {
  it('TC-CTX-AUTH-010 — localStorage.cart is NOT written when user is authenticated', async () => {
    getCurrentUser.mockReturnValue(AUTH_USER);

    // Mount: empty cart from API
    apiClient.mockResolvedValueOnce(makeCartResponse([]));
    renderAuth();

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(`/carts/user/${AUTH_USER.userId}`);
    });

    // The localStorage sync effect checks getCurrentUser() before writing.
    // Since we're authenticated, it should NOT call localStorage.setItem("cart").
    expect(localStorage.getItem('cart')).toBeNull();
  });
});
