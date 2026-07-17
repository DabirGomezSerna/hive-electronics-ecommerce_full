/**
 * Unit tests — CartContext
 *
 * Tests are written against a lightweight TestConsumer component that
 * exposes the full CartContext API via data-testid hooks.
 * CartProvider reads / writes localStorage on every state change.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CartProvider, useCart, useCartActions } from '../../context/CartContext';

// ── test consumer ─────────────────────────────────────────────────────────────
const PRODUCTS = [
  { _id: 'p1', name: 'Widget A', price: 10, image: ['img-a.jpg'], stock: 5 },
  { _id: 'p2', name: 'Widget B', price: 25, image: ['img-b.jpg'], stock: 3 },
];

function TestConsumer() {
  const {
    cartItems,
    getTotalItems,
    getTotalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  return (
    <div>
      <span data-testid="item-count">{cartItems.length}</span>
      <span data-testid="total-items">{getTotalItems()}</span>
      <span data-testid="total-price">{getTotalPrice().toFixed(2)}</span>
      {cartItems.map((item) => (
        <div key={item._id} data-testid={`item-${item._id}`}>
          <span data-testid={`qty-${item._id}`}>{item.quantity}</span>
        </div>
      ))}
      <button onClick={() => addToCart(PRODUCTS[0], 1)}>add-p1</button>
      <button onClick={() => addToCart(PRODUCTS[1], 2)}>add-p2</button>
      <button onClick={() => addToCart(PRODUCTS[0], 1)}>add-p1-again</button>
      <button onClick={() => removeFromCart('p1')}>remove-p1</button>
      <button onClick={() => updateQuantity('p1', 5)}>update-p1-qty</button>
      <button onClick={() => updateQuantity('p1', 0)}>zero-p1-qty</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

const renderCart = (initialCart = null) => {
  if (initialCart !== null) {
    localStorage.setItem('cart', JSON.stringify(initialCart));
  }
  return render(
    <CartProvider>
      <TestConsumer />
    </CartProvider>
  );
};

// ── initialization ────────────────────────────────────────────────────────────
describe('CartContext — initialization', () => {
  it('TC-UNIT-FE-027 — starts empty when localStorage is empty', () => {
    renderCart();
    expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    expect(screen.getByTestId('total-price')).toHaveTextContent('0.00');
  });

  it('TC-UNIT-FE-028 — restores cart from localStorage on mount', () => {
    const saved = [{ ...PRODUCTS[0], quantity: 3 }];
    renderCart(saved);

    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    expect(screen.getByTestId('total-items')).toHaveTextContent('3');
  });
});

// ── addToCart() ───────────────────────────────────────────────────────────────
describe('CartContext — addToCart()', () => {
  it('TC-UNIT-FE-029 — adds a new product to the cart', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));

    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    expect(screen.getByTestId('item-p1')).toBeInTheDocument();
    expect(screen.getByTestId('qty-p1')).toHaveTextContent('1');
  });

  it('TC-UNIT-FE-030 — increments quantity when adding an existing product', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('add-p1-again'));

    // Still one unique product in cart
    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    // But quantity is now 2
    expect(screen.getByTestId('qty-p1')).toHaveTextContent('2');
  });

  it('TC-UNIT-FE-031 — adding different products keeps both in cart', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('add-p2'));

    expect(screen.getByTestId('item-count')).toHaveTextContent('2');
    expect(screen.getByTestId('item-p1')).toBeInTheDocument();
    expect(screen.getByTestId('item-p2')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-032 — addToCart with quantity 2 adds 2 units at once', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p2'));

    expect(screen.getByTestId('qty-p2')).toHaveTextContent('2');
  });
});

// ── removeFromCart() ──────────────────────────────────────────────────────────
describe('CartContext — removeFromCart()', () => {
  it('TC-UNIT-FE-033 — removes the product from the cart', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('remove-p1'));

    expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    expect(screen.queryByTestId('item-p1')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-034 — removing one product does not affect others', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('add-p2'));
    fireEvent.click(screen.getByText('remove-p1'));

    expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    expect(screen.getByTestId('item-p2')).toBeInTheDocument();
  });
});

// ── updateQuantity() ──────────────────────────────────────────────────────────
describe('CartContext — updateQuantity()', () => {
  it('TC-UNIT-FE-035 — updates quantity to new value', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('update-p1-qty'));

    expect(screen.getByTestId('qty-p1')).toHaveTextContent('5');
  });

  it('TC-UNIT-FE-036 — updateQuantity(0) removes the product', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('zero-p1-qty'));

    expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    expect(screen.queryByTestId('item-p1')).not.toBeInTheDocument();
  });
});

// ── clearCart() ───────────────────────────────────────────────────────────────
describe('CartContext — clearCart()', () => {
  it('TC-UNIT-FE-037 — empties the cart', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('add-p2'));
    fireEvent.click(screen.getByText('clear'));

    expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
  });
});

// ── getTotalItems() / getTotalPrice() ─────────────────────────────────────────
describe('CartContext — totals', () => {
  it('TC-UNIT-FE-038 — getTotalItems sums all quantities', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1')); // qty 1
    fireEvent.click(screen.getByText('add-p2')); // qty 2
    fireEvent.click(screen.getByText('add-p1-again')); // p1 qty → 2

    // p1=2, p2=2 → total items = 4
    expect(screen.getByTestId('total-items')).toHaveTextContent('4');
  });

  it('TC-UNIT-FE-039 — getTotalPrice multiplies price × quantity and sums', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1')); // 1 × $10
    fireEvent.click(screen.getByText('add-p2')); // 2 × $25

    // 10 + 50 = 60
    expect(screen.getByTestId('total-price')).toHaveTextContent('60.00');
  });
});

// ── localStorage sync ─────────────────────────────────────────────────────────
describe('CartContext — localStorage sync', () => {
  it('TC-UNIT-FE-040 — cart is persisted to localStorage after addToCart', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));

    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored).not.toBeNull();
    expect(stored.length).toBe(1);
    expect(stored[0]._id).toBe('p1');
  });

  it('TC-UNIT-FE-041 — localStorage is updated after clearCart', () => {
    renderCart();
    fireEvent.click(screen.getByText('add-p1'));
    fireEvent.click(screen.getByText('clear'));

    const stored = JSON.parse(localStorage.getItem('cart'));
    expect(stored).toEqual([]);
  });
});

// ── useCart() outside provider ────────────────────────────────────────────────
describe('useCart() — guard', () => {
  it('TC-UNIT-FE-042 — throws when used outside CartProvider', () => {
    function Bare() {
      useCart();
      return null;
    }

    // Suppress React's error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow('useCart must be used within CartProvider');
    spy.mockRestore();
  });
});

// ── useCartActions() ──────────────────────────────────────────────────────────
// Regression coverage for the ProductCard re-render issue found via React
// Profiler: components that only need addToCart must not re-render when
// cartItems/total change elsewhere (see docs/testing/test-matrix.md CTX-ACTIONS).
describe('CartContext — useCartActions()', () => {
  it('TC-CTX-ACTIONS-001 — components using only useCartActions() do not re-render when cart items change', () => {
    let renderCount = 0;
    function ActionsOnlyConsumer() {
      useCartActions();
      renderCount += 1;
      return null;
    }
    function Trigger() {
      const { addToCart } = useCart();
      return <button onClick={() => addToCart(PRODUCTS[0], 1)}>trigger-add</button>;
    }

    render(
      <CartProvider>
        <ActionsOnlyConsumer />
        <Trigger />
      </CartProvider>
    );
    expect(renderCount).toBe(1);

    fireEvent.click(screen.getByText('trigger-add'));
    expect(renderCount).toBe(1);
  });

  it('TC-CTX-ACTIONS-002 — addToCart reference is stable across cart-changing re-renders', () => {
    const seenReferences = new Set();
    function ActionsConsumer() {
      const { addToCart } = useCartActions();
      seenReferences.add(addToCart);
      return null;
    }
    function Trigger() {
      const { addToCart } = useCart();
      return <button onClick={() => addToCart(PRODUCTS[0], 1)}>trigger-add</button>;
    }

    render(
      <CartProvider>
        <ActionsConsumer />
        <Trigger />
      </CartProvider>
    );
    fireEvent.click(screen.getByText('trigger-add'));

    expect(seenReferences.size).toBe(1);
  });

  it('TC-CTX-ACTIONS-003 — throws when used outside CartProvider', () => {
    function Bare() {
      useCartActions();
      return null;
    }

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow('useCartActions must be used within CartProvider');
    spy.mockRestore();
  });
});
