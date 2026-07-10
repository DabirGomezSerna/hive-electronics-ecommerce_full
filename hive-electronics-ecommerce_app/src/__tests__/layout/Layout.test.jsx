/**
 * Unit tests — Layout component
 *
 * Layout wraps its children inside a div.layout, preceded by Header and
 * followed by Footer. It accepts a `children` prop and passes it through
 * between the two layout chrome components.
 *
 * Mocks:
 *   - Header: replaced with a lightweight stub to avoid CartContext, router
 *     hooks, userServices, and pricing config dependencies.
 *   - Footer: replaced with a lightweight stub to avoid Icon and CSS dependencies.
 *
 * MemoryRouter is included because the real Header and Footer use react-router-dom
 * Links; the stubs do not, but wrapping ensures the module graph stays stable
 * if the mocks are ever relaxed.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../layout/Layout';

vi.mock('../../layout/Header/Header', () => ({
  default: () => <header data-testid="header" />,
}));

vi.mock('../../layout/Footer/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

const renderLayout = (children) =>
  render(
    <MemoryRouter>
      <Layout>{children}</Layout>
    </MemoryRouter>
  );

describe('Layout — children', () => {
  it('TC-UNIT-FE-LAYOUT-001: renders children inside the layout', () => {
    // Arrange
    // Act
    renderLayout(<p>Page content</p>);

    // Assert
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-LAYOUT-004: renders multiple children', () => {
    // Arrange
    // Act
    renderLayout(
      <>
        <p>First child</p>
        <p>Second child</p>
      </>
    );

    // Assert
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });
});

describe('Layout — Header', () => {
  it('TC-UNIT-FE-LAYOUT-002: renders the Header component', () => {
    // Arrange
    // Act
    renderLayout(<span>content</span>);

    // Assert
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});

describe('Layout — Footer', () => {
  it('TC-UNIT-FE-LAYOUT-003: renders the Footer component', () => {
    // Arrange
    // Act
    renderLayout(<span>content</span>);

    // Assert
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
