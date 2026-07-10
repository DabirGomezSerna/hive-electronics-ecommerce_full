/**
 * Unit tests — ProductDetails component
 *
 * Covers loading state, successful render (name, price, description),
 * error paths (null product, rejected service), and the Add-to-cart
 * button enabled/disabled behaviour based on stock.
 *
 * Mocks:
 *   - productServices → getProductById returns controlled data
 *   - CartContext     → useCart returns a controlled cart mock
 *
 * Note on ErrorMessage and Loading:
 *   Both components render only their {children} prop, not the `message` prop.
 *   ProductDetails passes text through `message` (spread into DOM attr) and
 *   always renders a <p> as children. Tests check for the children text or the
 *   alert role to confirm error state is visible.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Service mock ──────────────────────────────────────────────────────────────
vi.mock('../../services/productServices', () => ({
  getProductById: vi.fn(),
}));

// ── CartContext mock ──────────────────────────────────────────────────────────
vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: vi.fn(),
}));

import { getProductById } from '../../services/productServices';
import { useCart } from '../../context/CartContext';
import ProductDetails from '../../components/ProductDetails/ProductDetails';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockProduct = {
  _id: 'prod1',
  name: 'Gaming Laptop',
  description: 'High performance laptop',
  price: 1299.99,
  stock: 5,
  image: ['http://placeholder.com/800x600'],
  category: { name: 'Laptops' },
};

const mockUseCart = {
  addToCart: vi.fn(),
  cartItems: [],
  total: 0,
  getTotalItems: vi.fn(() => 0),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  getTotalPrice: vi.fn(() => 0),
};

const renderProductDetails = (productId = 'prod1') =>
  render(
    <MemoryRouter>
      <ProductDetails productId={productId} />
    </MemoryRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('ProductDetails — loading state', () => {
  it('TC-UNIT-FE-PRODDET-001 — shows loading spinner before data resolves', () => {
    // Arrange — never-resolving promise so loading stays true
    useCart.mockReturnValue(mockUseCart);
    getProductById.mockReturnValue(new Promise(() => {}));

    // Act
    renderProductDetails();

    // Assert — Loading spinner is present
    expect(screen.getByLabelText('Cargando')).toBeInTheDocument();
  });
});

describe('ProductDetails — successful product load', () => {
  beforeEach(() => {
    useCart.mockReturnValue(mockUseCart);
    getProductById.mockResolvedValue(mockProduct);
  });

  it('TC-UNIT-FE-PRODDET-002 — shows product name after successful load', async () => {
    // Arrange / Act
    renderProductDetails();

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Gaming Laptop' })).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-PRODDET-003 — shows product price and description', async () => {
    // Arrange / Act
    renderProductDetails();

    // Assert
    await waitFor(() => {
      expect(screen.getByText('$1299.99')).toBeInTheDocument();
      expect(screen.getByText('High performance laptop')).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-PRODDET-006 — "Add to cart" button is present when stock > 0', async () => {
    // Arrange / Act
    renderProductDetails();

    // Assert
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /add to cart/i });
      expect(btn).toBeInTheDocument();
      expect(btn).not.toBeDisabled();
    });
  });

  it('TC-UNIT-FE-PRODDET-007 — "Add to cart" button is disabled when stock === 0', async () => {
    // Arrange
    getProductById.mockResolvedValue({ ...mockProduct, stock: 0 });

    // Act
    renderProductDetails();

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
    });
  });
});

describe('ProductDetails — error states', () => {
  beforeEach(() => {
    useCart.mockReturnValue(mockUseCart);
  });

  it('TC-UNIT-FE-PRODDET-004 — shows error content when product is not found (getProductById returns null)', async () => {
    // Arrange
    getProductById.mockResolvedValue(null);

    // Act
    renderProductDetails();

    // Assert — ErrorMessage renders its children (the "Please check our" link paragraph)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Please check our/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /main page/i })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PRODDET-005 — shows error content when getProductById rejects', async () => {
    // Arrange
    getProductById.mockRejectedValue(new Error('network'));

    // Act
    renderProductDetails();

    // Assert — ErrorMessage with its children is rendered
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Please check our/i)).toBeInTheDocument();
  });
});
