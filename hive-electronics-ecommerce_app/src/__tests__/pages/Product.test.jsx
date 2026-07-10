/**
 * Unit tests — Product page
 *
 * Product reads `productId` from the URL via useParams() and delegates
 * entirely to <ProductDetails productId={productId} />. It holds no state
 * and performs no data fetching of its own.
 *
 * Mocks:
 *   - react-router-dom: useParams is overridden to return a controlled
 *     productId so tests are decoupled from any real router history.
 *     All other exports from react-router-dom are preserved via importActual.
 *   - ProductDetails: replaced with a lightweight stub that exposes the
 *     received productId prop via data-product-id so assertions can verify
 *     correct prop forwarding without triggering real API calls.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Product from '../../pages/Product';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ productId: 'prod456' }) };
});

vi.mock('../../components/ProductDetails/ProductDetails', () => ({
  default: ({ productId }) => (
    <div data-testid="product-details" data-product-id={productId} />
  ),
}));

describe('Product page — rendering', () => {
  it('TC-UNIT-FE-PRODPAGE-001: renders ProductDetails component', () => {
    // Arrange
    // Act
    render(
      <MemoryRouter>
        <Product />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId('product-details')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PRODPAGE-002: passes the productId from URL params to ProductDetails', () => {
    // Arrange
    // Act
    render(
      <MemoryRouter>
        <Product />
      </MemoryRouter>
    );
    const details = screen.getByTestId('product-details');

    // Assert
    expect(details).toHaveAttribute('data-product-id', 'prod456');
  });
});
