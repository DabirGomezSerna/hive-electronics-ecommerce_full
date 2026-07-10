/**
 * Unit tests — Footer layout component
 *
 * Footer renders a footer element with informational sections:
 *   - "About hiveElectronics" with navigation links (About us, News, Mission, Contact us)
 *   - "Customer support" section with Help center link
 *   - "My account" section
 *   - Social icons section (Follow us)
 *   - Copyright text with the current year
 *   - Privacy policy, Terms and conditions, and Cookies links
 *
 * Footer uses plain <a> tags (not React Router <Link>), so no MemoryRouter is needed.
 *
 * Mocks:
 *   - Icon component: replaced with a lightweight stub to avoid SVG/CSS complexity.
 *     The real Icon path imported by Footer is "../../components/common/Icon/Icon".
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../../layout/Footer/Footer';

vi.mock('../../components/common/Icon/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

describe('Footer — About section', () => {
  it('TC-UNIT-FE-FOOTER-001: renders "About hiveElectronics" section heading', () => {
    // Arrange
    // Act
    render(<Footer />);

    // Assert
    expect(screen.getByText('About hiveElectronics')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-FOOTER-002: renders "About us" link', () => {
    // Arrange
    // Act
    render(<Footer />);

    // Assert
    expect(screen.getByText('About us')).toBeInTheDocument();
  });
});

describe('Footer — Customer support section', () => {
  it('TC-UNIT-FE-FOOTER-003: renders "Customer support" section heading', () => {
    // Arrange
    // Act
    render(<Footer />);

    // Assert
    expect(screen.getByText('Customer support')).toBeInTheDocument();
  });
});

describe('Footer — copyright text', () => {
  it('TC-UNIT-FE-FOOTER-004: renders the current year in the copyright text', () => {
    // Arrange
    const currentYear = new Date().getFullYear();

    // Act
    render(<Footer />);

    // Assert
    expect(
      screen.getByText(new RegExp(String(currentYear)))
    ).toBeInTheDocument();
  });
});

describe('Footer — legal links', () => {
  it('TC-UNIT-FE-FOOTER-005: renders "Privacy policy" link', () => {
    // Arrange
    // Act
    render(<Footer />);

    // Assert
    expect(screen.getByText('Privacy policy')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-FOOTER-006: renders "Terms and conditions" link', () => {
    // Arrange
    // Act
    render(<Footer />);

    // Assert
    expect(screen.getByText('Terms and conditions')).toBeInTheDocument();
  });
});
