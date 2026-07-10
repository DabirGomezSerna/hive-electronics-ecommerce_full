/**
 * Unit tests — Home page
 *
 * Covers the product-list rendering, error state, empty state, and
 * search-query behaviour driven by useSearchParams.
 *
 * Mocks:
 *   - productServices → fetchProducts / searchProducts return controlled data
 *   - react-router-dom → useSearchParams returns a controllable URLSearchParams
 *   - List component   → lightweight stub so we can inspect title / products
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Service mock ──────────────────────────────────────────────────────────────
vi.mock('../../services/productServices', () => ({
  fetchProducts: vi.fn(),
  searchProducts: vi.fn(),
}));

// ── List stub ─────────────────────────────────────────────────────────────────
vi.mock('../../components/List/List', () => ({
  default: ({ products, title }) => (
    <div data-testid="product-list" data-title={title}>
      {products.map((p) => (
        <span key={p._id}>{p.name}</span>
      ))}
    </div>
  ),
}));

// ── useSearchParams mock ───────────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]) };
});

import { fetchProducts, searchProducts } from '../../services/productServices';
import { useSearchParams } from 'react-router-dom';
import Home from '../../pages/Home/Home';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const sampleProducts = [
  { _id: 'p1', name: 'Widget A', price: 10, stock: 5 },
  { _id: 'p2', name: 'Widget B', price: 20, stock: 3 },
];

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Home — no search query', () => {
  beforeEach(() => {
    useSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
  });

  it('TC-UNIT-FE-HOME-001 — shows product list when fetchProducts resolves with data', async () => {
    // Arrange
    fetchProducts.mockResolvedValue(sampleProducts);

    // Act
    renderHome();

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('product-list')).toBeInTheDocument();
    });
    expect(screen.getByText('Widget A')).toBeInTheDocument();
    expect(screen.getByText('Widget B')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-HOME-002 — shows error alert when fetchProducts rejects', async () => {
    // Arrange
    fetchProducts.mockRejectedValue(new Error('Network failure'));

    // Act
    renderHome();

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText("Products didn't load. Try again later.")
      ).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-HOME-003 — shows empty-state message when products array is empty', async () => {
    // Arrange
    fetchProducts.mockResolvedValue([]);

    // Act
    renderHome();

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText("No products in store! We're sorry about that.")
      ).toBeInTheDocument();
    });
  });
});

describe('Home — with search query', () => {
  beforeEach(() => {
    useSearchParams.mockReturnValue([new URLSearchParams('q=laptop'), vi.fn()]);
  });

  it('TC-UNIT-FE-HOME-004 — calls searchProducts instead of fetchProducts when query param exists', async () => {
    // Arrange
    searchProducts.mockResolvedValue(sampleProducts);

    // Act
    renderHome();

    // Assert
    await waitFor(() => {
      expect(searchProducts).toHaveBeenCalledWith('laptop');
    });
    expect(fetchProducts).not.toHaveBeenCalled();
  });

  it('TC-UNIT-FE-HOME-005 — renders list with "Search results for" title when query param is present', async () => {
    // Arrange
    searchProducts.mockResolvedValue(sampleProducts);

    // Act
    renderHome();

    // Assert
    await waitFor(() => {
      const list = screen.getByTestId('product-list');
      expect(list).toBeInTheDocument();
      expect(list.dataset.title).toBe('Search results for "laptop"');
    });
  });
});
