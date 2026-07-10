/**
 * Unit tests — ProductCard component
 *
 * ProductCard:
 * - Renders product name, price, image, and "Add to cart" button
 * - Button is disabled when stock === 0
 * - Clicking "Add to cart" calls addToCart() from CartContext
 * - Renders fallback message when no product prop is given
 * - Links navigate to /product/:id
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard/ProductCard';

const IN_STOCK_PRODUCT = {
  _id: 'prod-1',
  name: 'RGB Keyboard',
  price: 29.99,
  stock: 10,
  image: ['/img/keyboard.webp'],
  description: 'A mechanical keyboard with RGB lighting',
};

const OUT_OF_STOCK_PRODUCT = {
  ...IN_STOCK_PRODUCT,
  _id: 'prod-2',
  name: 'Sold Out Mouse',
  stock: 0,
};

const renderCard = (product, cartCtx = null) => {
  if (cartCtx) {
    localStorage.setItem('cart', JSON.stringify(cartCtx));
  }
  return render(
    <MemoryRouter>
      <CartProvider>
        <ProductCard product={product} />
      </CartProvider>
    </MemoryRouter>
  );
};

// ── rendering ─────────────────────────────────────────────────────────────────
describe('ProductCard — rendering', () => {
  it('TC-UNIT-FE-053 — renders the product name', () => {
    renderCard(IN_STOCK_PRODUCT);
    expect(screen.getByText('RGB Keyboard')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-054 — renders the product price', () => {
    renderCard(IN_STOCK_PRODUCT);
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-055 — renders the product image with correct alt text', () => {
    renderCard(IN_STOCK_PRODUCT);
    const img = screen.getByAltText('RGB Keyboard');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/img/keyboard.webp');
  });

  it('TC-UNIT-FE-056 — renders "Add to cart" button', () => {
    renderCard(IN_STOCK_PRODUCT);
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-057 — renders fallback when product prop is null', () => {
    renderCard(null);
    expect(screen.getByText('Product not available')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-058 — description is truncated to 60 chars if longer', () => {
    const longDesc = 'A'.repeat(80);
    renderCard({ ...IN_STOCK_PRODUCT, description: longDesc });
    // Truncated to 60 + "..." = 63 chars
    expect(screen.getByText(`${'A'.repeat(60)}...`)).toBeInTheDocument();
  });
});

// ── stock state ───────────────────────────────────────────────────────────────
describe('ProductCard — stock state', () => {
  it('TC-UNIT-FE-059 — "Add to cart" button is enabled when stock > 0', () => {
    renderCard(IN_STOCK_PRODUCT);
    expect(screen.getByRole('button', { name: 'Add to cart' })).not.toBeDisabled();
  });

  it('TC-UNIT-FE-060 — "Add to cart" button is disabled when stock === 0', () => {
    renderCard(OUT_OF_STOCK_PRODUCT);
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
  });
});

// ── addToCart interaction ─────────────────────────────────────────────────────
describe('ProductCard — addToCart', () => {
  it('TC-UNIT-FE-061 — clicking "Add to cart" adds the product to cart', () => {
    renderCard(IN_STOCK_PRODUCT);
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));

    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0]._id).toBe('prod-1');
  });

  it('TC-UNIT-FE-062 — clicking twice increments quantity, not duplicates', () => {
    renderCard(IN_STOCK_PRODUCT);
    const btn = screen.getByRole('button', { name: 'Add to cart' });
    fireEvent.click(btn);
    fireEvent.click(btn);

    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].quantity).toBe(2);
  });
});

// ── product link ──────────────────────────────────────────────────────────────
describe('ProductCard — navigation link', () => {
  it('TC-UNIT-FE-063 — product name links to /product/:id', () => {
    renderCard(IN_STOCK_PRODUCT);
    const links = screen.getAllByRole('link');
    const productLinks = links.filter((l) =>
      l.getAttribute('href') === '/product/prod-1'
    );
    expect(productLinks.length).toBeGreaterThan(0);
  });
});
