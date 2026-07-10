/**
 * Unit tests — PaymentMethodList component
 *
 * PaymentMethodList is a thin wrapper: it renders a heading, an
 * "Add new payment method" Button, and maps the `methods` prop into
 * PaymentMethodItem children.
 * The only logic it owns is the `isSelected` computation:
 *   selectedMethod?._id === method._id
 *
 * Mocks:
 *   - PaymentMethodItem — stub that exposes data-selected and action buttons
 *   - Button            — plain <button> forwarding onClick
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentMethodList from '../../components/Checkout/PaymentMethod/PaymentMethodList';

vi.mock('../../components/Checkout/PaymentMethod/PaymentMethodItem', () => ({
  default: ({ method, isSelected, onSelect, onEdit, onDelete }) => (
    <div
      data-testid={`pm-item-${method._id}`}
      data-selected={String(isSelected)}
    >
      <span>{method.type}</span>
      <button onClick={() => onSelect(method)}>select-{method._id}</button>
      <button onClick={() => onEdit(method)}>edit-{method._id}</button>
      <button onClick={() => onDelete(method)}>delete-{method._id}</button>
    </div>
  ),
}));

vi.mock('../../components/common/Button', () => ({
  default: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PM1 = { _id: 'pm1', type: 'cash_on_delivery', isDefault: true };
const PM2 = { _id: 'pm2', type: 'credit_card', cardNumber: '4111111111111234', isDefault: false };

const defaultProps = {
  methods: [PM1, PM2],
  selectedMethod: PM1,
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAdd: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Header & add button ───────────────────────────────────────────────────────

describe('PaymentMethodList — header', () => {
  it('TC-UNIT-FE-PMLIST-001 — renders "Payment methods" heading', () => {
    render(<PaymentMethodList {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /payment methods/i })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMLIST-002 — renders "Add new payment method" button', () => {
    render(<PaymentMethodList {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add new payment method/i })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMLIST-003 — clicking "Add new payment method" calls onAdd', () => {
    render(<PaymentMethodList {...defaultProps} />);
    userEvent.click(screen.getByRole('button', { name: /add new payment method/i }));
    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });
});

// ── Payment item rendering ────────────────────────────────────────────────────

describe('PaymentMethodList — payment item rendering', () => {
  it('TC-UNIT-FE-PMLIST-004 — renders PaymentMethodItem for each method in the array', () => {
    render(<PaymentMethodList {...defaultProps} />);
    expect(screen.getByTestId('pm-item-pm1')).toBeInTheDocument();
    expect(screen.getByTestId('pm-item-pm2')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMLIST-005 — renders no items when methods array is empty', () => {
    render(<PaymentMethodList {...defaultProps} methods={[]} />);
    expect(screen.queryByTestId(/^pm-item-/)).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-PMLIST-006 — passes isSelected=true to the matching method', () => {
    render(<PaymentMethodList {...defaultProps} selectedMethod={PM1} />);
    expect(screen.getByTestId('pm-item-pm1')).toHaveAttribute('data-selected', 'true');
  });

  it('TC-UNIT-FE-PMLIST-007 — passes isSelected=false to non-matching methods', () => {
    render(<PaymentMethodList {...defaultProps} selectedMethod={PM1} />);
    expect(screen.getByTestId('pm-item-pm2')).toHaveAttribute('data-selected', 'false');
  });

  it('TC-UNIT-FE-PMLIST-008 — passes isSelected=false to all items when selectedMethod is null', () => {
    render(<PaymentMethodList {...defaultProps} selectedMethod={null} />);
    expect(screen.getByTestId('pm-item-pm1')).toHaveAttribute('data-selected', 'false');
    expect(screen.getByTestId('pm-item-pm2')).toHaveAttribute('data-selected', 'false');
  });
});

// ── Callback pass-through ─────────────────────────────────────────────────────

describe('PaymentMethodList — callback pass-through', () => {
  it('TC-UNIT-FE-PMLIST-009 — onSelect is forwarded to PaymentMethodItem and called with the method', () => {
    render(<PaymentMethodList {...defaultProps} />);
    userEvent.click(screen.getByText('select-pm1'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(PM1);
  });

  it('TC-UNIT-FE-PMLIST-010 — onEdit is forwarded to PaymentMethodItem and called with the method', () => {
    render(<PaymentMethodList {...defaultProps} />);
    userEvent.click(screen.getByText('edit-pm1'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(PM1);
  });

  it('TC-UNIT-FE-PMLIST-011 — onDelete is forwarded to PaymentMethodItem and called with the method', () => {
    render(<PaymentMethodList {...defaultProps} />);
    userEvent.click(screen.getByText('delete-pm1'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith(PM1);
  });
});
