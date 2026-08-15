/**
 * Unit tests — ErrorMessage component
 *
 * ErrorMessage renders a `role="alert"` div. It accepts `children` (always
 * rendered) and an optional `message` prop.
 *
 * Regression coverage: `message` previously had no matching destructure, so
 * it fell into `...rest` and was spread onto the DOM <div> as a raw
 * attribute — the error text was never displayed. ProductDetails.jsx and
 * CategoryDetails.jsx both pass `message`, so this file exists to pin the
 * fix down at the component level.
 *
 * Mocks: none (no services, no router, no context dependencies)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';

describe('ErrorMessage — children', () => {
  it('TC-UNIT-FE-ERRMSG-001: renders children content', () => {
    render(<ErrorMessage>Something broke</ErrorMessage>);

    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ERRMSG-002: has role="alert"', () => {
    render(<ErrorMessage>Something broke</ErrorMessage>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('ErrorMessage — message prop', () => {
  it('TC-UNIT-FE-ERRMSG-003: renders the message prop as visible text (regression: was previously spread onto the DOM and invisible)', () => {
    render(<ErrorMessage message="Category not found" />);

    expect(screen.getByText('Category not found')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ERRMSG-004: does not leak the message prop onto the DOM as a raw attribute', () => {
    render(<ErrorMessage message="Category not found" />);

    expect(screen.getByRole('alert')).not.toHaveAttribute('message');
  });

  it('TC-UNIT-FE-ERRMSG-005: renders both message and children together', () => {
    render(
      <ErrorMessage message="Category not found">
        <p>Please check our main page.</p>
      </ErrorMessage>
    );

    expect(screen.getByText('Category not found')).toBeInTheDocument();
    expect(screen.getByText('Please check our main page.')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ERRMSG-006: omits the message paragraph entirely when message is not passed', () => {
    render(<ErrorMessage>{null}</ErrorMessage>);

    expect(document.querySelector('.error-message-text')).not.toBeInTheDocument();
  });
});

describe('ErrorMessage — remaining props', () => {
  it('TC-UNIT-FE-ERRMSG-007: still spreads unrelated props (e.g. data-testid) onto the div', () => {
    render(<ErrorMessage data-testid="custom-error">Broke</ErrorMessage>);

    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
  });
});
