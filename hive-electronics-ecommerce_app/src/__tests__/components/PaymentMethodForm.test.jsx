/**
 * Unit tests — PaymentMethodForm component
 *
 * Covers:
 *   - Payment type select rendering
 *   - Conditional field display per type (credit_card, debit_card, paypal,
 *     bank_transfer, cash_on_delivery)
 *   - isDefault checkbox presence
 *   - onSubmit callback called with form data
 *   - Cancel button conditional rendering and callback
 *   - initialValues pre-population
 *
 * No mocks needed: PaymentMethodForm is a pure controlled form component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentMethodForm from '../../components/Checkout/PaymentMethod/PaymentMethodForm';

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderForm = (props = {}) => {
  const onSubmit = props.onSubmit ?? vi.fn();
  render(
    <PaymentMethodForm
      onSubmit={onSubmit}
      {...props}
    />
  );
  return { onSubmit };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PaymentMethodForm — type select', () => {
  it('TC-UNIT-FE-PMFORM-001 — renders payment type select', () => {
    // Arrange + Act
    renderForm({ onSubmit: vi.fn() });

    // Assert
    expect(screen.getByRole('combobox', { name: /payment type/i })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMFORM-002 — shows card fields by default (credit_card)', () => {
    // Arrange + Act
    renderForm({ onSubmit: vi.fn() });

    // Assert
    expect(screen.getByLabelText(/card holder name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMFORM-003 — switching to paypal shows paypalEmail field and hides card fields', () => {
    // Arrange
    renderForm({ onSubmit: vi.fn() });
    const select = screen.getByRole('combobox', { name: /payment type/i });

    // Act
    userEvent.selectOptions(select, 'paypal');

    // Assert
    expect(screen.getByLabelText(/paypal email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/card holder name/i)).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMFORM-004 — switching to bank_transfer shows bankName and accountNumber fields', () => {
    // Arrange
    renderForm({ onSubmit: vi.fn() });
    const select = screen.getByRole('combobox', { name: /payment type/i });

    // Act
    userEvent.selectOptions(select, 'bank_transfer');

    // Assert
    expect(screen.getByLabelText(/bank name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account number/i)).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMFORM-005 — switching to cash_on_delivery hides all type-specific fields', () => {
    // Arrange
    renderForm({ onSubmit: vi.fn() });
    const select = screen.getByRole('combobox', { name: /payment type/i });

    // Act
    userEvent.selectOptions(select, 'cash_on_delivery');

    // Assert
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/card holder name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/paypal email/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/bank name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/account number/i)).not.toBeInTheDocument();
  });
});

describe('PaymentMethodForm — isDefault checkbox', () => {
  it('TC-UNIT-FE-PMFORM-006 — isDefault checkbox is present', () => {
    // Arrange + Act
    renderForm({ onSubmit: vi.fn() });

    // Assert
    expect(screen.getByRole('checkbox', { name: /set as default payment method/i })).toBeInTheDocument();
  });
});

describe('PaymentMethodForm — submission', () => {
  it('TC-UNIT-FE-PMFORM-007 — submitting the form calls onSubmit with form data', () => {
    // Arrange
    const onSubmit = vi.fn();
    render(<PaymentMethodForm onSubmit={onSubmit} />);

    // Act — fireEvent.submit bypasses browser HTML5 validation (required fields)
    // and directly fires the React onSubmit handler
    const form = document.querySelector('form.payment-method-form');
    fireEvent.submit(form);

    // Assert
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'credit_card' })
    );
  });
});

describe('PaymentMethodForm — cancel button', () => {
  it('TC-UNIT-FE-PMFORM-008 — Cancel button is not rendered when onCancel is not provided', () => {
    // Arrange + Act
    renderForm({ onSubmit: vi.fn() });

    // Assert
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMFORM-009 — Cancel button is rendered and calls onCancel when provided', () => {
    // Arrange
    const onCancel = vi.fn();
    render(<PaymentMethodForm onSubmit={vi.fn()} onCancel={onCancel} />);

    // Act
    userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('PaymentMethodForm — initialValues', () => {
  it('TC-UNIT-FE-PMFORM-010 — initialValues are pre-populated in the form', () => {
    // Arrange
    const initialValues = {
      type: 'paypal',
      paypalEmail: 'user@paypal.com',
      isDefault: true,
    };

    // Act
    renderForm({ onSubmit: vi.fn(), initialValues });

    // Assert
    const select = screen.getByRole('combobox', { name: /payment type/i });
    expect(select).toHaveValue('paypal');
    expect(screen.getByLabelText(/paypal email/i)).toHaveValue('user@paypal.com');
    expect(screen.getByRole('checkbox', { name: /set as default payment method/i })).toBeChecked();
  });
});
