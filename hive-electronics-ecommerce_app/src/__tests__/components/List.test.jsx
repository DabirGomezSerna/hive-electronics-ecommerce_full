/**
 * Unit tests — List component
 *
 * List renders a title heading and a grid or vertical layout of ProductCard
 * components. It maps over the `products` array using `product._id` as the
 * React key and passes the `orientation` prop based on the `layout` prop value.
 *
 * Mocks:
 *   - ProductCard: replaced with a lightweight stub that renders product.name
 *     and exposes orientation via data-orientation so assertions can inspect it.
 *     This avoids pulling in real ProductCard's service and router dependencies.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import List from '../../components/List/List';

vi.mock('../../components/ProductCard/ProductCard', () => ({
  default: ({ product, orientation }) => (
    <div data-testid="product-card" data-orientation={orientation}>
      {product.name}
    </div>
  ),
}));

const products = [
  { _id: 'p1', name: 'Widget A', price: 10, stock: 5 },
  { _id: 'p2', name: 'Widget B', price: 20, stock: 3 },
];

describe('List — title rendering', () => {
  it('TC-UNIT-FE-LIST-001: renders the default title "Our products"', () => {
    // Arrange
    // Act
    render(<List />);

    // Assert
    expect(screen.getByText('Our products')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-LIST-002: renders a custom title prop', () => {
    // Arrange
    // Act
    render(<List title="Featured Items" products={[]} />);

    // Assert
    expect(screen.getByText('Featured Items')).toBeInTheDocument();
  });
});

describe('List — product card count', () => {
  it('TC-UNIT-FE-LIST-003: renders one ProductCard per product in the array', () => {
    // Arrange
    // Act
    render(<List products={products} />);
    const cards = screen.getAllByTestId('product-card');

    // Assert
    expect(cards).toHaveLength(2);
  });
});

describe('List — grid layout orientation', () => {
  it('TC-UNIT-FE-LIST-004: layout="grid" renders cards with orientation="vertical"', () => {
    // Arrange
    // Act
    render(<List products={products} layout="grid" />);
    const cards = screen.getAllByTestId('product-card');

    // Assert
    cards.forEach((card) => {
      expect(card).toHaveAttribute('data-orientation', 'vertical');
    });
  });
});

describe('List — list layout orientation', () => {
  it('TC-UNIT-FE-LIST-005: layout="list" (non-grid) renders cards with orientation="horizontal"', () => {
    // Arrange
    // Act
    render(<List products={products} layout="list" />);
    const cards = screen.getAllByTestId('product-card');

    // Assert
    cards.forEach((card) => {
      expect(card).toHaveAttribute('data-orientation', 'horizontal');
    });
  });
});

describe('List — empty products', () => {
  it('TC-UNIT-FE-LIST-006: renders no ProductCards when products array is empty', () => {
    // Arrange
    // Act
    render(<List products={[]} />);

    // Assert
    expect(screen.queryAllByTestId('product-card')).toHaveLength(0);
  });
});
