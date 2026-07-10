/**
 * Unit tests — Navigation layout component
 *
 * Covers static link rendering, category loading, error resilience,
 * mobile layout, and the "All categories" dropdown toggle.
 *
 * Mocks:
 *   - categoryServices → fetchCategories returns controlled data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ── Service mock ──────────────────────────────────────────────────────────────
vi.mock('../../services/categoryServices', () => ({
  fetchCategories: vi.fn(),
}));

import { fetchCategories } from '../../services/categoryServices';
import Navigation from '../../layout/Navigation/Navigation';

// ── Fixtures ──────────────────────────────────────────────────────────────────
// parentCategory must be an object with _id for the Navigation filter to work
const mockCategories = [
  { _id: 'cat1', name: 'Electronics', parentCategory: null },
  { _id: 'cat2', name: 'Laptops', parentCategory: { _id: 'cat1', name: 'Electronics' } },
  { _id: 'cat3', name: 'Phones', parentCategory: null },
];

const renderNav = (props = {}) =>
  render(
    <MemoryRouter>
      <Navigation {...props} />
    </MemoryRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Navigation — static links', () => {
  beforeEach(() => {
    fetchCategories.mockResolvedValue([]);
  });

  it('TC-UNIT-FE-NAV-001 — renders static nav links in desktop mode', async () => {
    // Arrange / Act
    renderNav();

    // Assert — static links are always present regardless of categories
    expect(screen.getByText('Daily offers')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Bestsellers')).toBeInTheDocument();
    expect(screen.getByText('Nvidia special offers')).toBeInTheDocument();
  });
});

describe('Navigation — category loading', () => {
  beforeEach(() => {
    fetchCategories.mockResolvedValue(mockCategories);
  });

  it('TC-UNIT-FE-NAV-002 — renders categories loaded from fetchCategories in desktop dropdown', async () => {
    // Arrange / Act
    renderNav();

    // Click the "All categories" button to open the dropdown
    const toggleBtn = screen.getByRole('button', { name: /all categories/i });
    await userEvent.click(toggleBtn);

    // Assert — parent categories appear in the dropdown
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Phones')).toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-NAV-003 — renders gracefully when fetchCategories rejects (no crash, static links visible)', async () => {
    // Arrange
    fetchCategories.mockRejectedValue(new Error('Network error'));

    // Act
    renderNav();

    // Assert — static links are still visible despite fetch failure
    await waitFor(() => {
      expect(screen.getByText('Daily offers')).toBeInTheDocument();
    });
    // No error boundary / crash
    expect(screen.getByText('Nvidia special offers')).toBeInTheDocument();
  });
});

describe('Navigation — mobile layout', () => {
  beforeEach(() => {
    fetchCategories.mockResolvedValue(mockCategories);
  });

  it('TC-UNIT-FE-NAV-004 — isMobile=true renders mobile layout with category links and no desktop dropdown button', async () => {
    // Arrange / Act
    renderNav({ isMobile: true });

    // Assert — mobile nav renders static links
    await waitFor(() => {
      expect(screen.getByText('Daily offers')).toBeInTheDocument();
    });

    // The "All categories" dropdown button is absent in mobile mode
    expect(
      screen.queryByRole('button', { name: /all categories/i })
    ).not.toBeInTheDocument();

    // Category links appear directly in mobile nav
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Phones')).toBeInTheDocument();
    });
  });
});

describe('Navigation — dropdown toggle', () => {
  beforeEach(() => {
    fetchCategories.mockResolvedValue(mockCategories);
  });

  it('TC-UNIT-FE-NAV-005 — clicking "All categories" button shows dropdown with category links', async () => {
    // Arrange
    renderNav();
    const toggleBtn = screen.getByRole('button', { name: /all categories/i });

    // Assert — dropdown is hidden before click
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();

    // Act
    await userEvent.click(toggleBtn);

    // Assert — dropdown is visible after click
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
  });
});
