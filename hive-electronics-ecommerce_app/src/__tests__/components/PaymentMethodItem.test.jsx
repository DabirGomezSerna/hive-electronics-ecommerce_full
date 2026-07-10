/**
 * Unit tests — PaymentMethodItem component
 *
 * Mocks:
 *   - Button (common/Button barrel) — renders a plain <button> so click
 *     handlers and disabled state are exercisable without importing the real
 *     component's CSS dependencies.
 *
 * Coverage targets:
 *   - TYPE_LABELS lookup for all 5 payment types
 *   - getMethodSummary helper: credit_card / debit_card (full, name-only,
 *     number-only), paypal, bank_transfer, cash_on_delivery
 *   - isDefault → "Default" badge present / absent
 *   - isSelected → button disabled + "Selected" label
 *   - onSelect / onEdit / onDelete callbacks fired with the method object
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentMethodItem from '../../components/Checkout/PaymentMethod/PaymentMethodItem';

vi.mock('../../components/common/Button', () => ({
  default: ({ children, onClick, disabled, variant }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseMethod = {
  _id: 'pm1',
  type: 'credit_card',
  cardNumber: '4111111111111234',
  cardHolderName: 'John Doe',
  paypalEmail: '',
  bankName: '',
  isDefault: false,
};

const defaultCallbacks = {
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

const renderItem = (method = baseMethod, props = {}) =>
  render(
    <PaymentMethodItem
      method={method}
      isSelected={false}
      onSelect={defaultCallbacks.onSelect}
      onEdit={defaultCallbacks.onEdit}
      onDelete={defaultCallbacks.onDelete}
      {...props}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

// ── TYPE_LABELS ───────────────────────────────────────────────────────────────

describe('PaymentMethodItem — type labels', () => {
  it('TC-UNIT-FE-PMITEM-001 — renders "Credit card" for credit_card', () => {
    renderItem({ ...baseMethod, type: 'credit_card' });
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Credit card');
  });

  it('TC-UNIT-FE-PMITEM-002 — renders "Debit card" for debit_card', () => {
    renderItem({ ...baseMethod, type: 'debit_card' });
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Debit card');
  });

  it('TC-UNIT-FE-PMITEM-003 — renders "PayPal" for paypal', () => {
    renderItem({ ...baseMethod, type: 'paypal', paypalEmail: 'user@paypal.com' });
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('PayPal');
  });

  it('TC-UNIT-FE-PMITEM-004 — renders "Bank transfer" for bank_transfer', () => {
    renderItem({ ...baseMethod, type: 'bank_transfer', bankName: 'BBVA' });
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Bank transfer');
  });

  it('TC-UNIT-FE-PMITEM-005 — renders "Cash on delivery" for cash_on_delivery', () => {
    renderItem({ ...baseMethod, type: 'cash_on_delivery' });
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Cash on delivery');
  });
});

// ── getMethodSummary ──────────────────────────────────────────────────────────

describe('PaymentMethodItem — method summary', () => {
  it('TC-UNIT-FE-PMITEM-006 — credit_card: shows "Name · ****last4"', () => {
    renderItem({ ...baseMethod, type: 'credit_card', cardNumber: '4111111111111234', cardHolderName: 'John Doe' });
    expect(screen.getByText('John Doe · ****1234')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-007 — credit_card: shows only holder name when cardNumber is empty', () => {
    renderItem({ ...baseMethod, type: 'credit_card', cardNumber: '', cardHolderName: 'Jane Doe' });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-008 — credit_card: shows ****last4 (with separator) when cardHolderName is empty', () => {
    renderItem({ ...baseMethod, type: 'credit_card', cardNumber: '4111111111115678', cardHolderName: '' });
    // getMethodSummary returns "" + " · ****5678" — separator always present when last4 exists
    expect(screen.getByText(/\*\*\*\*5678/)).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-009 — debit_card: shows same format as credit_card', () => {
    renderItem({ ...baseMethod, type: 'debit_card', cardNumber: '5500005555555559', cardHolderName: 'Alice' });
    expect(screen.getByText('Alice · ****5559')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-010 — paypal: shows paypalEmail', () => {
    renderItem({ ...baseMethod, type: 'paypal', paypalEmail: 'alice@paypal.com' });
    expect(screen.getByText('alice@paypal.com')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-011 — bank_transfer: shows bankName', () => {
    renderItem({ ...baseMethod, type: 'bank_transfer', bankName: 'Santander' });
    expect(screen.getByText('Santander')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-012 — cash_on_delivery: summary is empty', () => {
    renderItem({ ...baseMethod, type: 'cash_on_delivery' });
    // getMethodSummary returns "" → <p></p> — no text content from summary
    expect(screen.queryByText(/\*\*\*\*/)).not.toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});

// ── Default badge ─────────────────────────────────────────────────────────────

describe('PaymentMethodItem — default badge', () => {
  it('TC-UNIT-FE-PMITEM-013 — shows "Default" badge when method.isDefault is true', () => {
    renderItem({ ...baseMethod, isDefault: true });
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-014 — does NOT show "Default" badge when method.isDefault is false', () => {
    renderItem({ ...baseMethod, isDefault: false });
    expect(screen.queryByText('Default')).not.toBeInTheDocument();
  });
});

// ── Select button state ───────────────────────────────────────────────────────

describe('PaymentMethodItem — Select button', () => {
  it('TC-UNIT-FE-PMITEM-015 — Select button is disabled when isSelected=true', () => {
    renderItem(baseMethod, { isSelected: true });
    const selectBtn = screen.getByRole('button', { name: 'Selected' });
    expect(selectBtn).toBeDisabled();
  });

  it('TC-UNIT-FE-PMITEM-016 — Select button shows "Selected" text when isSelected=true', () => {
    renderItem(baseMethod, { isSelected: true });
    expect(screen.getByRole('button', { name: 'Selected' })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMITEM-017 — Select button shows "Select" text when isSelected=false', () => {
    renderItem(baseMethod, { isSelected: false });
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
  });
});

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe('PaymentMethodItem — action callbacks', () => {
  it('TC-UNIT-FE-PMITEM-018 — clicking Select button calls onSelect with the method', () => {
    renderItem(baseMethod, { isSelected: false });
    userEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(defaultCallbacks.onSelect).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onSelect).toHaveBeenCalledWith(baseMethod);
  });

  it('TC-UNIT-FE-PMITEM-019 — clicking Edit button calls onEdit with the method', () => {
    renderItem();
    userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(defaultCallbacks.onEdit).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onEdit).toHaveBeenCalledWith(baseMethod);
  });

  it('TC-UNIT-FE-PMITEM-020 — clicking Delete button calls onDelete with the method', () => {
    renderItem();
    userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(defaultCallbacks.onDelete).toHaveBeenCalledTimes(1);
    expect(defaultCallbacks.onDelete).toHaveBeenCalledWith(baseMethod);
  });
});
