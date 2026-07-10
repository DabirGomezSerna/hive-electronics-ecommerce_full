/**
 * Unit tests — AddressItem component
 *
 * Covers:
 *   - Rendering of all address fields (name, address1, address2, city, postalCode, reference)
 *   - Conditional rendering (address2, reference, default badge)
 *   - Select button disabled state when isSelected is true
 *   - Callback invocations: onSelect, onEdit, onDelete
 *
 * Note: AddressItem renders a plain <span className="default-badge"> for the
 * "Default" indicator (based on address.default, not address.defaultAddress).
 * It does not use the Badge component internally.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressItem from '../../components/Checkout/Address/AddressItem';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockAddress = {
  _id: 'addr1',
  name: 'Home',
  address1: '123 Main St',
  address2: 'Apt 4B',
  city: 'CDMX',
  postalCode: '06600',
  country: 'MX',
  reference: 'Blue door',
  default: false,
};

const defaultCallbacks = () => ({
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderAddressItem = (props = {}) => {
  const cbs = defaultCallbacks();
  render(
    <AddressItem
      address={mockAddress}
      isSelected={false}
      onSelect={cbs.onSelect}
      onEdit={cbs.onEdit}
      onDelete={cbs.onDelete}
      {...props}
    />
  );
  return cbs;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AddressItem — rendering', () => {
  it('TC-UNIT-FE-ADDRITEM-001 — renders address name', () => {
    // Arrange + Act
    renderAddressItem();

    // Assert
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRITEM-002 — renders address1', () => {
    // Arrange + Act
    renderAddressItem();

    // Assert
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRITEM-003 — renders address2 when provided', () => {
    // Arrange + Act
    renderAddressItem();

    // Assert
    expect(screen.getByText('Apt 4B')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRITEM-004 — renders city and postalCode', () => {
    // Arrange + Act
    renderAddressItem();

    // Assert
    expect(screen.getByText('CDMX, 06600')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRITEM-005 — renders reference when provided', () => {
    // Arrange + Act
    renderAddressItem();

    // Assert
    expect(screen.getByText('Blue door')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRITEM-006 — does NOT render address2 when not provided', () => {
    // Arrange
    const addressWithoutAddress2 = { ...mockAddress, address2: undefined };

    // Act
    renderAddressItem({ address: addressWithoutAddress2 });

    // Assert
    expect(screen.queryByText('Apt 4B')).not.toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRITEM-007 — shows "Default" badge when address.default is true', () => {
    // Arrange
    const defaultAddress = { ...mockAddress, default: true };

    // Act
    renderAddressItem({ address: defaultAddress });

    // Assert
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-ADDRITEM-008 — does NOT show "Default" badge when address.default is false', () => {
    // Arrange + Act
    renderAddressItem({ address: { ...mockAddress, default: false } });

    // Assert
    expect(screen.queryByText('Default')).not.toBeInTheDocument();
  });
});

describe('AddressItem — interactions', () => {
  it('TC-UNIT-FE-ADDRITEM-009 — Select button is disabled when isSelected is true', () => {
    // Arrange + Act
    renderAddressItem({ isSelected: true });

    // Assert
    expect(screen.getByRole('button', { name: /selected/i })).toBeDisabled();
  });

  it('TC-UNIT-FE-ADDRITEM-010 — clicking Select button calls onSelect with the address', () => {
    // Arrange
    const cbs = defaultCallbacks();
    render(
      <AddressItem
        address={mockAddress}
        isSelected={false}
        onSelect={cbs.onSelect}
        onEdit={cbs.onEdit}
        onDelete={cbs.onDelete}
      />
    );

    // Act
    userEvent.click(screen.getByRole('button', { name: /^select$/i }));

    // Assert
    expect(cbs.onSelect).toHaveBeenCalledWith(mockAddress);
  });

  it('TC-UNIT-FE-ADDRITEM-011 — clicking Edit button calls onEdit with the address', () => {
    // Arrange
    const cbs = defaultCallbacks();
    render(
      <AddressItem
        address={mockAddress}
        isSelected={false}
        onSelect={cbs.onSelect}
        onEdit={cbs.onEdit}
        onDelete={cbs.onDelete}
      />
    );

    // Act
    userEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Assert
    expect(cbs.onEdit).toHaveBeenCalledWith(mockAddress);
  });

  it('TC-UNIT-FE-ADDRITEM-012 — clicking Delete button calls onDelete with the address', () => {
    // Arrange
    const cbs = defaultCallbacks();
    render(
      <AddressItem
        address={mockAddress}
        isSelected={false}
        onSelect={cbs.onSelect}
        onEdit={cbs.onEdit}
        onDelete={cbs.onDelete}
      />
    );

    // Act
    userEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Assert
    expect(cbs.onDelete).toHaveBeenCalledWith(mockAddress);
  });
});
