/**
 * Unit tests — CategoryPage page
 *
 * CategoryPage reads `categoryId` from the URL via useParams() and delegates
 * entirely to <CategoryDetails categoryId={categoryId} />. It holds no state
 * and performs no data fetching of its own.
 *
 * Mocks:
 *   - react-router-dom: useParams is overridden to return a controlled
 *     categoryId so tests are decoupled from any real router history.
 *     All other exports from react-router-dom are preserved via importActual.
 *   - CategoryDetails: replaced with a lightweight stub that exposes the
 *     received categoryId prop via data-category-id so assertions can verify
 *     correct prop forwarding without triggering real API calls.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CategoryPage from '../../pages/CategoryPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ categoryId: 'cat123' }) };
});

vi.mock('../../components/CategoryDetails/CategoryDetails', () => ({
  default: ({ categoryId }) => (
    <div data-testid="category-details" data-category-id={categoryId} />
  ),
}));

describe('CategoryPage — rendering', () => {
  it('TC-UNIT-FE-CATPAGE-001: renders CategoryDetails component', () => {
    // Arrange
    // Act
    render(
      <MemoryRouter>
        <CategoryPage />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByTestId('category-details')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CATPAGE-002: passes the categoryId from URL params to CategoryDetails', () => {
    // Arrange
    // Act
    render(
      <MemoryRouter>
        <CategoryPage />
      </MemoryRouter>
    );
    const details = screen.getByTestId('category-details');

    // Assert
    expect(details).toHaveAttribute('data-category-id', 'cat123');
  });
});
