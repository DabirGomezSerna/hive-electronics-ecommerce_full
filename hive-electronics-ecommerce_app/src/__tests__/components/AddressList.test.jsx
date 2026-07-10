/**
 * Unit tests — AddressList component
 *
 * AddressList is a thin wrapper: it renders a heading, an "Add new address"
 * Button, and maps the `addresses` prop into AddressItem children.
 * The only logic it owns is the `isSelected` computation:
 *   selectedAddress?._id === address._id
 * and the key fallback: address._id || address.name
 *
 * Mocks:
 *   - AddressItem  — stub that exposes data-selected and action buttons
 *   - Button       — plain <button> forwarding onClick
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressList from '../../components/Checkout/Address/AddressList';

vi.mock('../../components/Checkout/Address/AddressItem', () => ({
  default: ({ address, isSelected, onSelect, onEdit, onDelete }) => (
    <div
      data-testid={`addr-item-${address._id ?? address.name}`}
      data-selected={String(isSelected)}
    >
      <span>{address.name}</span>
      <button onClick={() => onSelect(address)}>select-{address._id}</button>
      <button onClick={() => onEdit(address)}>edit-{address._id}</button>
      <button onClick={() => onDelete(address)}>delete-{address._id}</button>
    </div>
  ),
}));

vi.mock('../../components/common/Button', () => ({
  default: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADDR1 = { _id: 'a1', name: 'Home', address1: '1 Main St', city: 'CDMX', postalCode: '06600', country: 'MX' };
const ADDR2 = { _id: 'a2', name: 'Work', address1: '2 Corp Ave', city: 'MTY', postalCode: '64000', country: 'MX' };

const defaultProps = {
  addresses: [ADDR1, ADDR2],
  selectedAddress: ADDR1,
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAdd: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Header & add button ───────────────────────────────────────────────────────

describe('AddressList — header', () => {
  it('TC-UNIT-FE-ADDRLIST-001 — renders "Shipping addresses" heading', () => {
    render(<AddressList {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /shipping addresses/i })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRLIST-002 — renders "Add new address" button', () => {
    render(<AddressList {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add new address/i })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRLIST-003 — clicking "Add new address" calls onAdd', () => {
    render(<AddressList {...defaultProps} />);
    userEvent.click(screen.getByRole('button', { name: /add new address/i }));
    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });
});

// ── Address item rendering ────────────────────────────────────────────────────

describe('AddressList — address item rendering', () => {
  it('TC-UNIT-FE-ADDRLIST-004 — renders AddressItem for each address in the array', () => {
    render(<AddressList {...defaultProps} />);
    expect(screen.getByTestId('addr-item-a1')).toBeInTheDocument();
    expect(screen.getByTestId('addr-item-a2')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRLIST-005 — renders no items when addresses array is empty', () => {
    render(<AddressList {...defaultProps} addresses={[]} />);
    expect(screen.queryByTestId(/^addr-item-/)).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRLIST-006 — passes isSelected=true to the matching address', () => {
    render(<AddressList {...defaultProps} selectedAddress={ADDR1} />);
    expect(screen.getByTestId('addr-item-a1')).toHaveAttribute('data-selected', 'true');
  });

  it('TC-UNIT-FE-ADDRLIST-007 — passes isSelected=false to non-matching addresses', () => {
    render(<AddressList {...defaultProps} selectedAddress={ADDR1} />);
    expect(screen.getByTestId('addr-item-a2')).toHaveAttribute('data-selected', 'false');
  });

  it('TC-UNIT-FE-ADDRLIST-008 — passes isSelected=false to all items when selectedAddress is null', () => {
    render(<AddressList {...defaultProps} selectedAddress={null} />);
    expect(screen.getByTestId('addr-item-a1')).toHaveAttribute('data-selected', 'false');
    expect(screen.getByTestId('addr-item-a2')).toHaveAttribute('data-selected', 'false');
  });

  it('TC-UNIT-FE-ADDRLIST-009 — uses address.name as key/testid fallback when _id is absent', () => {
    const noId = { name: 'Office', address1: '3 Biz Rd', city: 'GDL', postalCode: '44100', country: 'MX' };
    render(<AddressList {...defaultProps} addresses={[noId]} selectedAddress={null} />);
    expect(screen.getByTestId('addr-item-Office')).toBeInTheDocument();
  });
});

// ── Callback pass-through ─────────────────────────────────────────────────────

describe('AddressList — callback pass-through', () => {
  it('TC-UNIT-FE-ADDRLIST-010 — onSelect is forwarded to AddressItem and called with the address', () => {
    render(<AddressList {...defaultProps} />);
    userEvent.click(screen.getByText('select-a1'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(ADDR1);
  });

  it('TC-UNIT-FE-ADDRLIST-011 — onEdit is forwarded to AddressItem and called with the address', () => {
    render(<AddressList {...defaultProps} />);
    userEvent.click(screen.getByText('edit-a1'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(ADDR1);
  });

  it('TC-UNIT-FE-ADDRLIST-012 — onDelete is forwarded to AddressItem and called with the address', () => {
    render(<AddressList {...defaultProps} />);
    userEvent.click(screen.getByText('delete-a1'));
    expect(defaultProps.onDelete).toHaveBeenCalledWith(ADDR1);
  });
});
