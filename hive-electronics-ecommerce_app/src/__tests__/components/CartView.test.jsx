/**
 * Unit tests — CartView component
 *
 * CartView reads cartItems from CartContext and renders:
 * - Each item: image, name, price, quantity, ± buttons, remove button
 * - Buttons call updateQuantity / removeFromCart from context
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import CartView from '../../components/Cart/CartView';

const CART_ITEMS = [
  { _id: 'p1', name: 'Keyboard', price: 29.99, image: ['/img/kbd.webp'], quantity: 2, stock: 5 },
  { _id: 'p2', name: 'Mouse', price: 19.99, image: ['/img/mouse.webp'], quantity: 1, stock: 3 },
];

const renderCartView = (items = []) => {
  localStorage.setItem('cart', JSON.stringify(items));
  return render(
    <MemoryRouter>
      <CartProvider>
        <CartView />
      </CartProvider>
    </MemoryRouter>
  );
};

// ── rendering ─────────────────────────────────────────────────────────────────
describe('CartView — rendering', () => {
  it('TC-UNIT-FE-064 — renders each cart item by name', () => {
    renderCartView(CART_ITEMS);
    expect(screen.getByText('Keyboard')).toBeInTheDocument();
    expect(screen.getByText('Mouse')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-065 — renders the price of each item', () => {
    renderCartView(CART_ITEMS);
    // $29.99 appears once (price only; Keyboard qty=2 → total is $59.98)
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    // $19.99 appears twice: once as Mouse price and once as Mouse total (qty=1)
    expect(screen.getAllByText('$19.99').length).toBeGreaterThan(0);
  });

  it('TC-UNIT-FE-066 — renders the quantity of each item', () => {
    renderCartView(CART_ITEMS);
    // Quantities are rendered as <span> inside the cart-item-quantity div
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-067 — shows item count in header', () => {
    renderCartView(CART_ITEMS);
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-068 — shows "1 item" when cart has one product', () => {
    renderCartView([CART_ITEMS[0]]);
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-069 — shows "0 items" header when cart is empty', () => {
    renderCartView([]);
    expect(screen.getByText('0 items')).toBeInTheDocument();
  });
});

// ── quantity controls ─────────────────────────────────────────────────────────
describe('CartView — quantity controls', () => {
  it('TC-UNIT-FE-070 — "+" button increments quantity', () => {
    renderCartView([CART_ITEMS[0]]); // Keyboard qty=2

    // CartView renders + and - buttons — we rely on order: first pair belongs to first item
    const plusButtons = screen.getAllByRole('button').filter((btn) =>
      btn.querySelector('svg') !== null || btn.textContent.trim() !== ''
    );
    // The structure is: [minus, plus, remove] for each item
    // Use the aria-label or title would be cleaner, but CartView doesn't have them
    // Instead we check that the second button ("+") increases quantity shown
    const allButtons = screen.getAllByRole('button');
    // For first item: buttons[0]=minus, buttons[1]=plus, buttons[2]=remove
    fireEvent.click(allButtons[1]);

    // Quantity displayed should now be 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-071 — "-" button decrements quantity', () => {
    renderCartView([CART_ITEMS[0]]); // Keyboard qty=2

    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[0]); // minus button

    // qty was 2, now should be 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-072 — "-" button at quantity 1 removes the item', () => {
    const singleItem = [{ ...CART_ITEMS[1], quantity: 1 }]; // Mouse qty=1
    renderCartView(singleItem);

    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[0]); // minus → qty 0 → removed

    expect(screen.queryByText('Mouse')).not.toBeInTheDocument();
  });
});

// ── remove item ───────────────────────────────────────────────────────────────
describe('CartView — remove item', () => {
  it('TC-UNIT-FE-073 — remove button removes the item from the cart', () => {
    renderCartView([CART_ITEMS[0]]);

    const allButtons = screen.getAllByRole('button');
    // Remove button is the 3rd button (index 2)
    fireEvent.click(allButtons[2]);

    expect(screen.queryByText('Keyboard')).not.toBeInTheDocument();
  });
});
