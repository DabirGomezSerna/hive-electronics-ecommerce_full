/**
 * Unit tests — CategoryDetails component
 *
 * Covers loading state, successful render, product cards, empty-products state,
 * error on fetch failure, and re-fetch when categoryId prop changes.
 *
 * Mocks:
 *   - categoryServices → getCategoryById / getProductsByCategoryAndChildren
 *   - ProductCard      → lightweight stub
 *
 * Note on ErrorMessage and Loading:
 *   Both components only render their {children} prop, not the `message` prop.
 *   CategoryDetails passes `message` as a prop but renders children alongside it.
 *   Tests therefore query for the children text that is actually rendered.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Service mocks ─────────────────────────────────────────────────────────────
vi.mock('../../services/categoryServices', () => ({
  getCategoryById: vi.fn(),
  getProductsByCategoryAndChildren: vi.fn(),
}));

// ── ProductCard stub ──────────────────────────────────────────────────────────
vi.mock('../../components/ProductCard/ProductCard', () => ({
  default: ({ product }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

import { getCategoryById, getProductsByCategoryAndChildren } from '../../services/categoryServices';
import CategoryDetails from '../../components/CategoryDetails/CategoryDetails';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockCategory = {
  _id: 'cat1',
  name: 'Electronics',
  description: 'Electronic gadgets',
  parentCategory: null,
};

const mockProducts = [
  {
    _id: 'p1',
    name: 'Laptop',
    price: 999,
    stock: 5,
    image: ['http://placeholder.com/img.jpg'],
  },
];

const renderCategoryDetails = (categoryId = 'cat1') =>
  render(
    <MemoryRouter>
      <CategoryDetails categoryId={categoryId} />
    </MemoryRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('CategoryDetails — loading state', () => {
  it('TC-UNIT-FE-CATDET-001 — shows loading spinner before data resolves', () => {
    // Arrange — never-resolving promise so loading stays true
    getCategoryById.mockReturnValue(new Promise(() => {}));
    getProductsByCategoryAndChildren.mockReturnValue(new Promise(() => {}));

    // Act
    renderCategoryDetails();

    // Assert — Loading component renders a spinner with aria-label="Cargando"
    expect(screen.getByLabelText('Cargando')).toBeInTheDocument();
  });
});

describe('CategoryDetails — successful data load', () => {
  beforeEach(() => {
    getCategoryById.mockResolvedValue(mockCategory);
    getProductsByCategoryAndChildren.mockResolvedValue(mockProducts);
  });

  it('TC-UNIT-FE-CATDET-002 — shows category name after data loads', async () => {
    // Arrange / Act
    renderCategoryDetails();

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Electronics' })).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-CATDET-003 — renders product cards when products exist', async () => {
    // Arrange / Act
    renderCategoryDetails();

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId('product-card')).toHaveLength(1);
    });
    expect(screen.getByTestId('product-card')).toHaveTextContent('Laptop');
  });
});

describe('CategoryDetails — empty products state', () => {
  it('TC-UNIT-FE-CATDET-004 — shows no-products message when category has no products', async () => {
    // Arrange
    getCategoryById.mockResolvedValue(mockCategory);
    getProductsByCategoryAndChildren.mockResolvedValue([]);

    // Act
    renderCategoryDetails();

    // Assert — children of the "no products" ErrorMessage are rendered
    await waitFor(() => {
      expect(
        screen.getByText(/This category has no available products/i)
      ).toBeInTheDocument();
    });
  });
});

describe('CategoryDetails — error states', () => {
  it('TC-UNIT-FE-CATDET-005 — shows error content when getCategoryById rejects', async () => {
    // Arrange
    getCategoryById.mockRejectedValue(new Error('Network error'));
    getProductsByCategoryAndChildren.mockResolvedValue([]);

    // Act
    renderCategoryDetails();

    // Assert — the error ErrorMessage renders its children (link back to main page)
    await waitFor(() => {
      expect(screen.getByText(/Please check our/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /main page/i })).toBeInTheDocument();
  });
});

describe('CategoryDetails — prop change re-fetch', () => {
  it('TC-UNIT-FE-CATDET-006 — re-fetches when categoryId prop changes', async () => {
    // Arrange
    const cat2 = { _id: 'cat2', name: 'Laptops', description: '', parentCategory: null };
    getCategoryById.mockResolvedValue(mockCategory);
    getProductsByCategoryAndChildren.mockResolvedValue(mockProducts);

    const { rerender } = render(
      <MemoryRouter>
        <CategoryDetails categoryId="cat1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Electronics' })).toBeInTheDocument();
    });

    // Act — change the categoryId prop
    getCategoryById.mockResolvedValue(cat2);
    getProductsByCategoryAndChildren.mockResolvedValue([]);

    rerender(
      <MemoryRouter>
        <CategoryDetails categoryId="cat2" />
      </MemoryRouter>
    );

    // Assert — service is called again with the new ID
    await waitFor(() => {
      expect(getCategoryById).toHaveBeenCalledWith('cat2');
    });
    expect(getCategoryById).toHaveBeenCalledTimes(2);
  });
});
