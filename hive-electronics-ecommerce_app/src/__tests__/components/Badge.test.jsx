/**
 * Unit tests — Badge component
 *
 * Badge renders a <span> with base class "badge", a variant class
 * "badge-{variant}" (default "info"), and an optional custom className.
 * It displays the `text` prop as its content.
 *
 * Mocks: none (no services, no router, no context dependencies)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../components/common/Badge/Badge';

describe('Badge — content rendering', () => {
  it('TC-UNIT-FE-BADGE-001: renders the text content', () => {
    // Arrange
    // Act
    render(<Badge text="In Stock" />);

    // Assert
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });
});

describe('Badge — base class', () => {
  it('TC-UNIT-FE-BADGE-002: applies "badge" base class to the span element', () => {
    // Arrange
    // Act
    render(<Badge text="Label" />);
    const span = screen.getByText('Label');

    // Assert
    expect(span).toHaveClass('badge');
  });
});

describe('Badge — default variant', () => {
  it('TC-UNIT-FE-BADGE-003: applies "badge-info" class when no variant prop is given', () => {
    // Arrange
    // Act
    render(<Badge text="Default" />);
    const span = screen.getByText('Default');

    // Assert
    expect(span).toHaveClass('badge-info');
  });
});

describe('Badge — success variant', () => {
  it('TC-UNIT-FE-BADGE-004: applies "badge-success" class when variant="success"', () => {
    // Arrange
    // Act
    render(<Badge text="Success" variant="success" />);
    const span = screen.getByText('Success');

    // Assert
    expect(span).toHaveClass('badge-success');
  });
});

describe('Badge — custom className', () => {
  it('TC-UNIT-FE-BADGE-005: applies custom className prop alongside base classes', () => {
    // Arrange
    // Act
    render(<Badge text="Custom" className="my-custom-class" />);
    const span = screen.getByText('Custom');

    // Assert
    expect(span).toHaveClass('badge');
    expect(span).toHaveClass('badge-info');
    expect(span).toHaveClass('my-custom-class');
  });
});

describe('Badge — danger variant', () => {
  it('TC-UNIT-FE-BADGE-006: applies "badge-danger" class when variant="danger"', () => {
    // Arrange
    // Act
    render(<Badge text="Error" variant="danger" />);
    const span = screen.getByText('Error');

    // Assert
    expect(span).toHaveClass('badge-danger');
  });
});
