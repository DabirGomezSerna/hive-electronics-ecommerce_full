import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartView from "../../components/Cart/CartView";
import AddressList from "../../components/Checkout/Address/AddressList";
import PaymentMethodList from "../../components/Checkout/PaymentMethod/PaymentMethodList";
import SummarySection from "../../components/Checkout/SummarySection/SummarySection";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage/ErrorMessage";
import Loading from "../../components/common/Loading/Loading";
import { useCart } from "../../context/CartContext";
import {
  createOrder,
} from "../../services/orderServices";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../../services/paymentServices";
import {
  getShippingAddresses,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
} from "../../services/shippingServices";
import { getCurrentUser } from "../../services/userServices";
import { SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from "../../config/pricing";
import logger from "../../services/logger";
import "./Checkout.css";

const AddressForm = lazy(() => import("../../components/Checkout/Address/AddressForm"));
const PaymentMethodForm = lazy(() =>
  import("../../components/Checkout/PaymentMethod/PaymentMethodForm")
);

const PAYMENT_TYPE_LABELS = {
  credit_card: "Credit card",
  debit_card: "Debit card",
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  cash_on_delivery: "Cash on delivery",
};

const getPaymentSummary = (method) => {
  if (!method) return "";
  if (method.type === "credit_card" || method.type === "debit_card") {
    return method.cardNumber ? `****${method.cardNumber.slice(-4)}` : "";
  }
  if (method.type === "paypal") return method.paypalEmail || "";
  if (method.type === "bank_transfer") return method.bankName || "";
  if (method.type === "cash_on_delivery") return "Cash on delivery";
  return "";
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, total, clearCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [loading, setLoading] = useState(false);
  // `error` is page-fatal only: the initial load failed and there is nothing to
  // render. Recoverable failures belong to the section that caused them, so
  // they never unmount the rest of checkout.
  const [error, setError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [orderError, setOrderError] = useState(null);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressSectionOpen, setAddressSectionOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);

  const [isOrderFinished, setIsOrderFinished] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const user = getCurrentUser();
      const [addrList, methodList] = await Promise.all([
        getShippingAddresses(user.userId),
        getPaymentMethods(user.userId),
      ]);

      const defaultAddr = addrList.find((a) => a.defaultAddress) || addrList[0] || null;
      setAddresses(addrList);
      setSelectedAddress(defaultAddr);
      setAddressSectionOpen(!defaultAddr);

      const defaultMethod = methodList.find((m) => m.isDefault) || methodList[0] || null;
      setPaymentMethods(methodList);
      setSelectedPaymentMethod(defaultMethod);
      setPaymentSectionOpen(!defaultMethod);
    } catch (err) {
      setError("Unable to load checkout information");
      logger.error("Checkout: failed to load addresses and payment methods", { error: err });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      if (!isOrderFinished) {
        navigate("/cart");
      }
    }
  }, [cartItems, navigate]);

  useEffect(() => {
    if (!selectedAddress) {
      setAddressSectionOpen(true);
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (!selectedPaymentMethod) {
      setPaymentSectionOpen(true);
    }
  }, [selectedPaymentMethod]);

  useEffect(() => {
    let mounted = true;
    if (mounted) loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Address handlers
  const handleAddressToggle = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen((prev) => !prev);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  const handleAddressNew = () => {
    setShowAddressForm(true);
    setEditingAddress(null);
    setAddressSectionOpen(true);
  };

  const handleAddressEdit = (address) => {
    setShowAddressForm(true);
    setEditingAddress(address);
    setAddressSectionOpen(true);
  };

  const handleAddressDelete = async (address) => {
    try {
      await deleteShippingAddress(address._id);
    } catch (err) {
      logger.error("Checkout: failed to delete address", { addressId: address._id, error: err });
    }
    const updatedAddresses = addresses.filter((add) => add._id !== address._id);
    if (selectedAddress?._id === address._id && updatedAddresses.length > 0) {
      setSelectedAddress(updatedAddresses[0]);
    } else if (selectedAddress?._id === address._id) {
      setSelectedAddress(null);
    }
    setAddresses(updatedAddresses);
  };

  const handleAddressSubmit = async (formData) => {
    try {
      let savedAddress;
      let updatedAddresses;
      let newSelectedAddress = selectedAddress;

      if (editingAddress) {
        savedAddress = await updateShippingAddress(editingAddress._id, formData);
        updatedAddresses = addresses.map((addr) =>
          addr._id === editingAddress._id ? savedAddress : addr
        );
        if (selectedAddress?._id === editingAddress._id) {
          newSelectedAddress = savedAddress;
        }
      } else {
        savedAddress = await createShippingAddress(formData);
        updatedAddresses = [...addresses, savedAddress];
        newSelectedAddress = savedAddress;
      }

      setAddresses(updatedAddresses);
      setSelectedAddress(newSelectedAddress);
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressSectionOpen(false);
    } catch (err) {
      logger.error("Checkout: failed to save address", { error: err });
    }
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(true);
  };

  // Payment method handlers
  const handlePaymentToggle = () => {
    setShowPaymentForm(false);
    setEditingPaymentMethod(null);
    setPaymentError(null);
    setPaymentSectionOpen((prev) => !prev);
  };

  const handleSelectPayment = (method) => {
    setSelectedPaymentMethod(method);
    setShowPaymentForm(false);
    setEditingPaymentMethod(null);
    setPaymentError(null);
    setPaymentSectionOpen(false);
  };

  const handlePaymentNew = () => {
    setShowPaymentForm(true);
    setEditingPaymentMethod(null);
    setPaymentError(null);
    setPaymentSectionOpen(true);
  };

  const handlePaymentEdit = (method) => {
    setShowPaymentForm(true);
    setEditingPaymentMethod(method);
    setPaymentError(null);
    setPaymentSectionOpen(true);
  };

  const handlePaymentDelete = async (method) => {
    try {
      await deletePaymentMethod(method._id);
    } catch (err) {
      logger.error("Checkout: failed to delete payment method", {
        paymentMethodId: method._id,
        error: err,
      });
    }
    const updated = paymentMethods.filter((m) => m._id !== method._id);
    if (selectedPaymentMethod?._id === method._id && updated.length > 0) {
      setSelectedPaymentMethod(updated[0]);
    } else if (selectedPaymentMethod?._id === method._id) {
      setSelectedPaymentMethod(null);
    }
    setPaymentMethods(updated);
  };

  const handlePaymentSubmit = async (formData) => {
    try {
      setPaymentError(null);
      let saved;
      let updatedMethods;
      let newSelected = selectedPaymentMethod;

      if (editingPaymentMethod) {
        saved = await updatePaymentMethod(editingPaymentMethod._id, formData);
        updatedMethods = paymentMethods.map((m) =>
          m._id === editingPaymentMethod._id ? saved : m
        );
        if (selectedPaymentMethod?._id === editingPaymentMethod._id) {
          newSelected = saved;
        }
      } else {
        saved = await createPaymentMethod(formData);
        updatedMethods = [...paymentMethods, saved];
        newSelected = saved;
      }

      setPaymentMethods(updatedMethods);
      setSelectedPaymentMethod(newSelected);
      setShowPaymentForm(false);
      setEditingPaymentMethod(null);
      setPaymentSectionOpen(false);
    } catch (err) {
      // Never log formData here — it can carry card number and CVV.
      logger.error("Checkout: failed to save payment method", { error: err });
      // Scoped to the payment section so the form stays mounted with the
      // values the user typed, and the rest of checkout is untouched.
      setPaymentError("Failed to save payment method. Please try again.");
    }
  };

  const handleCancelPaymentForm = () => {
    setShowPaymentForm(false);
    setEditingPaymentMethod(null);
    setPaymentError(null);
    setPaymentSectionOpen(true);
  };

  const formatMoney = (value) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const subtotal = typeof total === "number" ? total : 0;
  const taxRate = 0.16;
  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const grandTotal = parseFloat(
    (subtotal + taxAmount + shippingCost).toFixed(2)
  );

  const handleCreateOrder = async () => {
    if (
      !selectedAddress ||
      !selectedPaymentMethod ||
      !cartItems ||
      cartItems.length === 0
    ) {
      return;
    }

    try {
      setOrderError(null);
      const user = getCurrentUser();
      const apiResponse = await createOrder({
        user: user.userId,
        products: cartItems.map((i) => ({
          product: i._id,
          quantity: i.quantity,
          price: i.price,
        })),
        address: selectedAddress._id,
        paymentMethod: selectedPaymentMethod._id,
        shippingCost,
      });

      setIsOrderFinished(true);
      navigate("/order-confirmation", {
        state: {
          order: {
            _id: apiResponse._id,
            createdAt: apiResponse.createdAt,
            status: apiResponse.status,
            products: cartItems.map((item) => ({
              ...item,
              subtotal: item.price * item.quantity,
            })),
            subtotal,
            tax: apiResponse.taxAmount,
            shipping: apiResponse.shippingCost,
            total: apiResponse.totalPrice,
            shippingAddress: selectedAddress,
            paymentMethod: selectedPaymentMethod,
          },
        },
      });
      clearCart();
    } catch (err) {
      logger.error("Checkout: failed to create order", { error: err });
      // Shown next to the confirm button — the cart, address, and payment
      // selections all survive so the user can simply retry.
      setOrderError("Failed to place order. Please try again.");
    }
  };

  return loading ? (
    <div className="checkout-loading">
      <Loading>
        <p>Loading user information...</p>
      </Loading>
    </div>
  ) : error ? (
    <ErrorMessage>{error}</ErrorMessage>
  ) : (
    <div className="checkout-container">
      <div className="checkout-left">
        <SummarySection
          title="1. Shipping address"
          selected={selectedAddress}
          summaryContent={
            <div className="selected-address">
              <p>{selectedAddress?.name}</p>
              <p>{selectedAddress?.address1}</p>
              <p>
                {selectedAddress?.city}, {selectedAddress?.postalCode}
              </p>
            </div>
          }
          isExpanded={showAddressForm || addressSectionOpen || !selectedAddress}
          onToggle={handleAddressToggle}
        >
          {!showAddressForm && !editingAddress ? (
            <AddressList
              addresses={addresses}
              selectedAddress={selectedAddress}
              onSelect={(address) => handleSelectAddress(address)}
              onEdit={(address) => handleAddressEdit(address)}
              onAdd={handleAddressNew}
              onDelete={(address) => handleAddressDelete(address)}
            />
          ) : (
            <Suspense fallback={<Loading />}>
              <AddressForm
                onSubmit={handleAddressSubmit}
                onCancel={handleCancelAddressForm}
                initialValues={editingAddress || {}}
                isEdit={!!editingAddress}
              />
            </Suspense>
          )}
        </SummarySection>

        <SummarySection
          title="2. Payment method"
          selected={selectedPaymentMethod}
          summaryContent={
            <div className="selected-payment">
              <p>{PAYMENT_TYPE_LABELS[selectedPaymentMethod?.type] || ""}</p>
              <p>{getPaymentSummary(selectedPaymentMethod)}</p>
            </div>
          }
          isExpanded={showPaymentForm || paymentSectionOpen || !selectedPaymentMethod}
          onToggle={handlePaymentToggle}
        >
          {paymentError && (
            <ErrorMessage className="error-message checkout-error-inline">
              {paymentError}
            </ErrorMessage>
          )}
          {!showPaymentForm && !editingPaymentMethod ? (
            <PaymentMethodList
              methods={paymentMethods}
              selectedMethod={selectedPaymentMethod}
              onSelect={handleSelectPayment}
              onEdit={handlePaymentEdit}
              onAdd={handlePaymentNew}
              onDelete={handlePaymentDelete}
            />
          ) : (
            <Suspense fallback={<Loading />}>
              <PaymentMethodForm
                onSubmit={handlePaymentSubmit}
                onCancel={handleCancelPaymentForm}
                initialValues={editingPaymentMethod || {}}
                isEdit={!!editingPaymentMethod}
              />
            </Suspense>
          )}
        </SummarySection>

        <SummarySection
          title="3. Order details"
          selected={true}
          isExpanded={true}
        >
          <CartView />
        </SummarySection>
      </div>
      <div className="checkout-right">
        <div className="checkout-summary">
          <h3>Order summary</h3>
          <div className="summary-details">
            <p>
              <strong>Shipping address: </strong>
              {selectedAddress?.name}
            </p>
            <p>
              <strong>Payment method: </strong>
              {PAYMENT_TYPE_LABELS[selectedPaymentMethod?.type] || "Not selected"}
            </p>
            <div className="order-costs">
              <p>
                <strong>Subtotal: </strong>
                {formatMoney(subtotal)}
              </p>
              <p>
                <strong>IVA (16%): </strong>
                {formatMoney(taxAmount)}
              </p>
              <p>
                <strong>Shipping: </strong>
                {formatMoney(shippingCost)}
              </p>
              <p>
                <strong>Total: </strong>
                {formatMoney(grandTotal)}
              </p>
              <p>
                <strong>Estimated delivery: </strong>
                {new Date(
                  Date.now() + 2 * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            {orderError && (
              <ErrorMessage className="error-message checkout-error-inline">
                {orderError}
              </ErrorMessage>
            )}
            <Button
              className="play-button"
              disabled={
                !selectedAddress ||
                !selectedPaymentMethod ||
                !cartItems ||
                cartItems.length === 0
              }
              title={
                !cartItems || cartItems.length === 0
                  ? "No products in cart"
                  : !selectedAddress
                  ? "Choose a shipping address"
                  : !selectedPaymentMethod
                  ? "Choose a payment method"
                  : "Confirm payment"
              }
              onClick={handleCreateOrder}
              data-testid="confirm-payment-btn"
            >
              Confirm payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
