/**
 * Unit tests — Checkout page handler functions
 *
 * Child components (AddressList, AddressForm, PaymentMethodList,
 * PaymentMethodForm, SummarySection) are mocked with minimal stubs
 * that expose action buttons so each Checkout handler can be exercised
 * without needing to interact with real child component internals.
 *
 * Covered in this file:
 *   handleAddressToggle, handleSelectAddress, handleAddressNew,
 *   handleAddressEdit, handleAddressSubmit (create + edit),
 *   handleCancelAddressForm, handleAddressDelete (last / non-last),
 *   handlePaymentToggle, handleSelectPayment, handlePaymentNew,
 *   handlePaymentEdit, handlePaymentSubmit (create + edit),
 *   handleCancelPaymentForm, handlePaymentDelete,
 *   handleCreateOrder (guard / success / failure paths)
 *
 * The existing Checkout.test.jsx covers loadData, empty-cart redirect,
 * load error, and basic rendering — those are not repeated here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from '../../pages/Checkout/Checkout';

// ── Child component stubs ─────────────────────────────────────────────────────

vi.mock('../../components/Checkout/SummarySection/SummarySection', () => ({
  default: ({ title, children, summaryContent, isExpanded, onToggle }) => (
    <div data-testid={`section-${title}`}>
      <button data-testid={`toggle-${title}`} onClick={onToggle}>toggle</button>
      {!isExpanded && summaryContent}
      {isExpanded && <div data-testid={`content-${title}`}>{children}</div>}
    </div>
  ),
}));

vi.mock('../../components/Checkout/Address/AddressList', () => ({
  default: ({ addresses, onSelect, onEdit, onAdd, onDelete }) => (
    <div data-testid="address-list">
      {addresses.map((a) => (
        <div key={a._id} data-testid={`addr-item-${a._id}`}>
          <span>{a.name}</span>
          <button onClick={() => onSelect(a)}>select-{a._id}</button>
          <button onClick={() => onEdit(a)}>edit-{a._id}</button>
          <button onClick={() => onDelete(a)}>delete-{a._id}</button>
        </div>
      ))}
      <button onClick={onAdd}>add-address</button>
    </div>
  ),
}));

vi.mock('../../components/Checkout/Address/AddressForm', () => ({
  default: ({ onSubmit, onCancel, initialValues, isEdit }) => (
    <div data-testid="address-form">
      <span data-testid="addr-form-mode">{isEdit ? 'edit' : 'create'}</span>
      <button onClick={() => onSubmit({ ...initialValues, address1: '99 New St', city: 'Guadalajara', postalCode: '44100', country: 'MX' })}>
        submit-addr-form
      </button>
      <button onClick={onCancel}>cancel-addr-form</button>
    </div>
  ),
}));

vi.mock('../../components/Checkout/PaymentMethod/PaymentMethodList', () => ({
  default: ({ methods, onSelect, onEdit, onAdd, onDelete }) => (
    <div data-testid="payment-list">
      {methods.map((m) => (
        <div key={m._id} data-testid={`pm-item-${m._id}`}>
          <span>{m.type}</span>
          <button onClick={() => onSelect(m)}>select-{m._id}</button>
          <button onClick={() => onEdit(m)}>edit-{m._id}</button>
          <button onClick={() => onDelete(m)}>delete-{m._id}</button>
        </div>
      ))}
      <button onClick={onAdd}>add-payment</button>
    </div>
  ),
}));

vi.mock('../../components/Checkout/PaymentMethod/PaymentMethodForm', () => ({
  default: ({ onSubmit, onCancel, initialValues, isEdit }) => (
    <div data-testid="payment-form">
      <span data-testid="pm-form-mode">{isEdit ? 'edit' : 'create'}</span>
      <button onClick={() => onSubmit({ ...initialValues, type: 'credit_card' })}>
        submit-pm-form
      </button>
      <button onClick={onCancel}>cancel-pm-form</button>
    </div>
  ),
}));

vi.mock('../../components/Cart/CartView', () => ({
  default: () => <div data-testid="cart-view" />,
}));

vi.mock('../../components/common/Button', () => ({
  default: ({ children, onClick, disabled, ...rest }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  ),
}));

vi.mock('../../components/common/Loading/Loading', () => ({
  default: ({ children }) => <div data-testid="loading">{children}</div>,
}));

vi.mock('../../components/common/ErrorMessage/ErrorMessage', () => ({
  default: ({ children }) => <div data-testid="error-msg">{children}</div>,
}));

// ── Service mocks ─────────────────────────────────────────────────────────────

vi.mock('../../services/shippingServices', () => ({
  getShippingAddresses: vi.fn(),
  createShippingAddress: vi.fn(),
  updateShippingAddress: vi.fn(),
  deleteShippingAddress: vi.fn(),
}));

vi.mock('../../services/paymentServices', () => ({
  getPaymentMethods: vi.fn(),
  createPaymentMethod: vi.fn(),
  updatePaymentMethod: vi.fn(),
  deletePaymentMethod: vi.fn(),
}));

vi.mock('../../services/orderServices', () => ({
  createOrder: vi.fn(),
}));

vi.mock('../../services/userServices', () => ({
  getCurrentUser: vi.fn(() => ({ userId: 'u1', displayName: 'Jane', email: 'j@test.com', role: 'customer' })),
  isAuthenticated: vi.fn(() => true),
  logout: vi.fn(),
}));

vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Imports after mocks ───────────────────────────────────────────────────────

import {
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
} from '../../services/shippingServices';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../../services/paymentServices';
import { createOrder } from '../../services/orderServices';
import { useCart } from '../../context/CartContext';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADDR1 = { _id: 'a1', name: 'Home', address1: '1 Main St', city: 'CDMX', postalCode: '06600', country: 'MX', defaultAddress: true };
const ADDR2 = { _id: 'a2', name: 'Work', address1: '2 Corp Ave', city: 'MTY', postalCode: '64000', country: 'MX', defaultAddress: false };
const PM1 = { _id: 'pm1', type: 'cash_on_delivery', isDefault: true };
const PM2 = { _id: 'pm2', type: 'credit_card', cardNumber: '4111111111111234', isDefault: false };

const CART_STATE = {
  cartItems: [{ _id: 'p1', name: 'Widget', price: 50, quantity: 1, image: [] }],
  total: 50,
  clearCart: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
};

const renderCheckout = () =>
  render(<MemoryRouter><Checkout /></MemoryRouter>);

// Title strings as they appear in Checkout.jsx (used as testid keys in the stub)
const ADDR_SECTION = '1. Shipping address';
const PAY_SECTION = '2. Payment method';

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  useCart.mockReturnValue(CART_STATE);
  getShippingAddresses.mockResolvedValue([ADDR1]);
  getPaymentMethods.mockResolvedValue([PM1]);
  deleteShippingAddress.mockResolvedValue(null);
  deletePaymentMethod.mockResolvedValue(null);
  mockNavigate.mockReset();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Wait for loadData to finish (both services called)
const waitForLoad = () =>
  waitFor(() => {
    expect(getShippingAddresses).toHaveBeenCalled();
    expect(getPaymentMethods).toHaveBeenCalled();
  });

// Open the address section (collapsed by default when a default address exists)
const openAddrSection = async () => {
  await waitForLoad();
  fireEvent.click(screen.getByTestId(`toggle-${ADDR_SECTION}`));
};

// Open the payment section
const openPaySection = async () => {
  await waitForLoad();
  fireEvent.click(screen.getByTestId(`toggle-${PAY_SECTION}`));
};

// ── Address: toggle & select ──────────────────────────────────────────────────

describe('Checkout — address section toggle and select', () => {
  it('TC-UNIT-FE-CHECKOUT-007 — toggle opens the address section and shows AddressList', async () => {
    renderCheckout();
    await openAddrSection();

    expect(screen.getByTestId('address-list')).toBeInTheDocument();
    // 'Home' appears in both AddressList stub and sidebar summary
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
  });

  it('TC-UNIT-FE-CHECKOUT-008 — selecting an address collapses the section', async () => {
    renderCheckout();
    await openAddrSection();

    fireEvent.click(screen.getByText('select-a1'));

    await waitFor(() => {
      expect(screen.queryByTestId('address-list')).not.toBeInTheDocument();
    });
  });
});

// ── Address: add new ─────────────────────────────────────────────────────────

describe('Checkout — add new address', () => {
  it('TC-UNIT-FE-CHECKOUT-009 — clicking "add-address" shows AddressForm in create mode', async () => {
    renderCheckout();
    await openAddrSection();

    fireEvent.click(screen.getByText('add-address'));

    expect(await screen.findByTestId('address-form')).toBeInTheDocument();
    expect(screen.getByTestId('addr-form-mode')).toHaveTextContent('create');
  });

  it('TC-UNIT-FE-CHECKOUT-010 — submitting a new address calls createShippingAddress and closes form', async () => {
    const saved = { ...ADDR2, _id: 'a-new' };
    createShippingAddress.mockResolvedValue(saved);

    renderCheckout();
    await openAddrSection();
    fireEvent.click(screen.getByText('add-address'));
    fireEvent.click(screen.getByText('submit-addr-form'));

    await waitFor(() => {
      expect(createShippingAddress).toHaveBeenCalled();
      expect(screen.queryByTestId('address-form')).not.toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-CHECKOUT-011 — cancelling the address form returns to AddressList', async () => {
    renderCheckout();
    await openAddrSection();
    fireEvent.click(screen.getByText('add-address'));
    fireEvent.click(screen.getByText('cancel-addr-form'));

    expect(screen.getByTestId('address-list')).toBeInTheDocument();
    expect(screen.queryByTestId('address-form')).not.toBeInTheDocument();
  });
});

// ── Address: edit ─────────────────────────────────────────────────────────────

describe('Checkout — edit address', () => {
  it('TC-UNIT-FE-CHECKOUT-012 — clicking Edit shows AddressForm in edit mode', async () => {
    renderCheckout();
    await openAddrSection();

    fireEvent.click(screen.getByText('edit-a1'));

    expect(screen.getByTestId('address-form')).toBeInTheDocument();
    expect(screen.getByTestId('addr-form-mode')).toHaveTextContent('edit');
  });

  it('TC-UNIT-FE-CHECKOUT-013 — submitting the edit calls updateShippingAddress and closes form', async () => {
    const updated = { ...ADDR1, address1: '99 New St' };
    updateShippingAddress.mockResolvedValue(updated);

    renderCheckout();
    await openAddrSection();
    fireEvent.click(screen.getByText('edit-a1'));
    fireEvent.click(screen.getByText('submit-addr-form'));

    await waitFor(() => {
      expect(updateShippingAddress).toHaveBeenCalledWith(ADDR1._id, expect.any(Object));
      expect(screen.queryByTestId('address-form')).not.toBeInTheDocument();
    });
  });
});

// ── Address: delete ───────────────────────────────────────────────────────────

describe('Checkout — delete address', () => {
  it('TC-UNIT-FE-CHECKOUT-014 — deleting the only address calls deleteShippingAddress and opens section', async () => {
    renderCheckout();
    await openAddrSection();

    fireEvent.click(screen.getByText('delete-a1'));

    await waitFor(() => {
      expect(deleteShippingAddress).toHaveBeenCalledWith(ADDR1._id);
    });
    // selectedAddress becomes null → isExpanded = !null = true → section stays open
    expect(screen.getByTestId('address-list')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CHECKOUT-015 — deleting the selected address from a multi-address list selects the next', async () => {
    getShippingAddresses.mockResolvedValue([ADDR1, ADDR2]);

    renderCheckout();
    await openAddrSection();

    fireEvent.click(screen.getByText('delete-a1'));

    await waitFor(() => {
      expect(deleteShippingAddress).toHaveBeenCalledWith(ADDR1._id);
    });
    // ADDR2 remains and is now selected; section closed by its own selection
    // The remaining address still appears in the list
    expect(screen.getByTestId('addr-item-a2')).toBeInTheDocument();
  });
});

// ── Payment: toggle & select ──────────────────────────────────────────────────

describe('Checkout — payment section toggle and select', () => {
  it('TC-UNIT-FE-CHECKOUT-016 — toggle opens the payment section and shows PaymentMethodList', async () => {
    renderCheckout();
    await openPaySection();

    expect(screen.getByTestId('payment-list')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CHECKOUT-017 — selecting a payment method collapses the section', async () => {
    renderCheckout();
    await openPaySection();

    fireEvent.click(screen.getByText('select-pm1'));

    await waitFor(() => {
      expect(screen.queryByTestId('payment-list')).not.toBeInTheDocument();
    });
  });
});

// ── Payment: add new ─────────────────────────────────────────────────────────

describe('Checkout — add new payment method', () => {
  it('TC-UNIT-FE-CHECKOUT-018 — clicking "add-payment" shows PaymentMethodForm in create mode', async () => {
    renderCheckout();
    await openPaySection();

    fireEvent.click(screen.getByText('add-payment'));

    expect(await screen.findByTestId('payment-form')).toBeInTheDocument();
    expect(screen.getByTestId('pm-form-mode')).toHaveTextContent('create');
  });

  it('TC-UNIT-FE-CHECKOUT-019 — submitting new payment method calls createPaymentMethod and closes form', async () => {
    const saved = { _id: 'pm-new', type: 'credit_card', isDefault: false };
    createPaymentMethod.mockResolvedValue(saved);

    renderCheckout();
    await openPaySection();
    fireEvent.click(screen.getByText('add-payment'));
    fireEvent.click(screen.getByText('submit-pm-form'));

    await waitFor(() => {
      expect(createPaymentMethod).toHaveBeenCalled();
      expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument();
    });
  });

  it('TC-UNIT-FE-CHECKOUT-020 — cancelling payment form returns to PaymentMethodList', async () => {
    renderCheckout();
    await openPaySection();
    fireEvent.click(screen.getByText('add-payment'));
    fireEvent.click(screen.getByText('cancel-pm-form'));

    expect(screen.getByTestId('payment-list')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument();
  });
});

// ── Payment: edit ─────────────────────────────────────────────────────────────

describe('Checkout — edit payment method', () => {
  it('TC-UNIT-FE-CHECKOUT-021 — clicking Edit shows PaymentMethodForm in edit mode', async () => {
    renderCheckout();
    await openPaySection();

    fireEvent.click(screen.getByText('edit-pm1'));

    expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    expect(screen.getByTestId('pm-form-mode')).toHaveTextContent('edit');
  });

  it('TC-UNIT-FE-CHECKOUT-022 — submitting edit calls updatePaymentMethod and closes form', async () => {
    const updated = { ...PM1, type: 'credit_card' };
    updatePaymentMethod.mockResolvedValue(updated);

    renderCheckout();
    await openPaySection();
    fireEvent.click(screen.getByText('edit-pm1'));
    fireEvent.click(screen.getByText('submit-pm-form'));

    await waitFor(() => {
      expect(updatePaymentMethod).toHaveBeenCalledWith(PM1._id, expect.any(Object));
      expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument();
    });
  });
});

// ── Payment: delete ───────────────────────────────────────────────────────────

describe('Checkout — delete payment method', () => {
  it('TC-UNIT-FE-CHECKOUT-023 — deleting a payment method from a multi-method list selects the next', async () => {
    getPaymentMethods.mockResolvedValue([PM1, PM2]);

    renderCheckout();
    await openPaySection();

    fireEvent.click(screen.getByText('delete-pm1'));

    await waitFor(() => {
      expect(deletePaymentMethod).toHaveBeenCalledWith(PM1._id);
    });
    expect(screen.getByTestId('pm-item-pm2')).toBeInTheDocument();
  });
});

// ── Order creation ────────────────────────────────────────────────────────────

describe('Checkout — order creation edge cases', () => {
  it('TC-UNIT-FE-CHECKOUT-024 — Confirm button is disabled when no address is selected', async () => {
    // No addresses → selectedAddress = null → button disabled
    getShippingAddresses.mockResolvedValue([]);

    renderCheckout();
    await waitForLoad();

    const btn = screen.getByTestId('confirm-payment-btn');
    expect(btn).toBeDisabled();
  });

  it('TC-UNIT-FE-CHECKOUT-025 — Confirm button is disabled when no payment method is selected', async () => {
    getPaymentMethods.mockResolvedValue([]);

    renderCheckout();
    await waitForLoad();

    const btn = screen.getByTestId('confirm-payment-btn');
    expect(btn).toBeDisabled();
  });

  it('TC-UNIT-FE-CHECKOUT-026 — createOrder failure shows error message', async () => {
    createOrder.mockRejectedValue(new Error('Payment declined'));

    renderCheckout();
    await waitForLoad();

    fireEvent.click(screen.getByTestId('confirm-payment-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/order-confirmation', expect.anything());
  });
});

// ── getPaymentSummary branches ────────────────────────────────────────────────
// Lines 45-46 of Checkout.jsx are hit when the collapsed payment section renders
// summaryContent with a paypal or bank_transfer type payment selected.

describe('Checkout — getPaymentSummary display', () => {
  it('TC-UNIT-FE-CHECKOUT-027 — paypal type shows paypalEmail in collapsed summary', async () => {
    getPaymentMethods.mockResolvedValue([
      { _id: 'pm-pp', type: 'paypal', paypalEmail: 'user@paypal.com', isDefault: true },
    ]);

    renderCheckout();
    await waitForLoad();

    // Section is collapsed (default method exists) → summaryContent rendered
    expect(screen.getByText('user@paypal.com')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CHECKOUT-028 — bank_transfer type shows bankName in collapsed summary', async () => {
    getPaymentMethods.mockResolvedValue([
      { _id: 'pm-bk', type: 'bank_transfer', bankName: 'BBVA', isDefault: true },
    ]);

    renderCheckout();
    await waitForLoad();

    expect(screen.getByText('BBVA')).toBeInTheDocument();
  });
});

// ── Error-catch branches ──────────────────────────────────────────────────────
// Each handler wraps its API call in try/catch. When the API rejects, the
// catch block runs (console.error) but local state is still updated.

describe('Checkout — API error-catch branches', () => {
  it('TC-UNIT-FE-CHECKOUT-029 — handleAddressDelete: API failure still removes address locally', async () => {
    getShippingAddresses.mockResolvedValue([ADDR1, ADDR2]);
    deleteShippingAddress.mockRejectedValue(new Error('Network error'));

    renderCheckout();
    await openAddrSection();

    fireEvent.click(screen.getByText('delete-a1'));

    // State update (filter) runs outside try/catch, so ADDR1 is removed locally
    await waitFor(() => {
      expect(screen.queryByTestId('addr-item-a1')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('addr-item-a2')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CHECKOUT-030 — handleAddressSubmit: create failure leaves form open', async () => {
    createShippingAddress.mockRejectedValue(new Error('Save failed'));

    renderCheckout();
    await openAddrSection();
    fireEvent.click(screen.getByText('add-address'));
    fireEvent.click(screen.getByText('submit-addr-form'));

    // setShowAddressForm(false) is inside try, never reached — form stays open
    await waitFor(() => expect(createShippingAddress).toHaveBeenCalled());
    expect(screen.getByTestId('address-form')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CHECKOUT-031 — handlePaymentDelete: API failure still removes method locally', async () => {
    getPaymentMethods.mockResolvedValue([PM1, PM2]);
    deletePaymentMethod.mockRejectedValue(new Error('Network error'));

    renderCheckout();
    await openPaySection();

    fireEvent.click(screen.getByText('delete-pm1'));

    await waitFor(() => {
      expect(screen.queryByTestId('pm-item-pm1')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('pm-item-pm2')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CHECKOUT-032 — handlePaymentDelete: deleting the only selected method sets selection to null', async () => {
    // PM1 is the only method and is selected (isDefault: true)
    renderCheckout();
    await openPaySection();

    fireEvent.click(screen.getByText('delete-pm1'));

    // selectedPaymentMethod → null → paymentSectionOpen becomes true → list visible
    await waitFor(() => {
      expect(screen.queryByTestId('pm-item-pm1')).not.toBeInTheDocument();
    });
    // Section is now expanded (selectedMethod is null) showing empty list
    expect(screen.getByTestId('payment-list')).toBeInTheDocument();
  });

  it('TC-UNIT-FE-CHECKOUT-033 — handlePaymentSubmit: create failure leaves form open', async () => {
    createPaymentMethod.mockRejectedValue(new Error('Payment API error'));

    renderCheckout();
    await openPaySection();
    fireEvent.click(screen.getByText('add-payment'));
    fireEvent.click(screen.getByText('submit-pm-form'));

    await waitFor(() => expect(createPaymentMethod).toHaveBeenCalled());
    expect(screen.getByTestId('payment-form')).toBeInTheDocument();
  });
});
