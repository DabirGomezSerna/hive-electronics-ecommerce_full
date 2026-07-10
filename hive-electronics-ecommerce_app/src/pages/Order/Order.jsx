import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";
import "./Order.css";

const PAYMENT_TYPE_LABELS = {
  credit_card: "Credit card",
  debit_card: "Debit card",
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  cash_on_delivery: "Cash on delivery",
};

export default function Order() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  useEffect(() => {
    if (!order) {
      navigate("/");
      return;
    }
  }, [order, navigate]);

  if (!order) return null;

  const address = order.shippingAddress || {};
  const payment = order.paymentMethod || {};
  const subtotal = order.subtotal || 0;
  const tax = order.tax || 0;
  const shipping = order.shipping || 0;
  const total = order.total || 0;
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString()
    : "Not available";

  const formatMoney = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v);

  return (
    <div className="order-confirmation" data-testid="order-confirmation">
      <div className="confirmation-content">
        <div className="confirmation-icon">
          <Icon name="checkCircle" size={64} className="success"></Icon>
        </div>
        <h1>Thank you for shopping with us!</h1>
        <p className="confirmation-message">
          Your order <strong>#{order._id || "N/A"}</strong> has been confirmed
          and is being processed
        </p>
        <div className="confirmation-details">
          <h2>Order details</h2>
          <div className="order-info">
            <p>
              <strong>Date: </strong>
              {orderDate}
            </p>
            <h3>Products</h3>
            <ul className="order-items">
              {(order.products || []).map((item) => (
                <li key={item._id}>
                  {item.name} x {item.quantity} - {formatMoney(item.price)} --
                  <span>{formatMoney(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="order-totals">
              <p>
                <strong>Subtotal: </strong>
                {formatMoney(subtotal)}
              </p>
              <p>
                <strong>IVA: </strong>
                {formatMoney(tax)}
              </p>
              <p>
                <strong>Shipping: </strong>
                {formatMoney(shipping)}
              </p>
              <p>
                <strong>Total:</strong> {formatMoney(total)}
              </p>

              <p>
                <strong>Shipping address:</strong>
              </p>
              <address>
                {address.name || "Not available"}
                <br />
                {address.address1 || ""}
                {address.address1 && <br />}
                {address.address2 || ""}
                {address.address2 && <br />}
                {address.city && address.postalCode
                  ? `${address.city}, ${address.postalCode}`
                  : "City and zip code not available"}
                <br />
                {address.country || "Country not available"}
              </address>

              <p>
                <strong>Payment method:</strong>{" "}
                {PAYMENT_TYPE_LABELS[payment.type] || "Not available"}
              </p>
            </div>
          </div>
          <p>
            We've sent your purchase details to your registered email. Thank you
            for shopping with hiveElectronics!
          </p>
        </div>
        <div className="confirmation-actions">
          <Link to="/" className="button primary">
            <Icon name="home" size={20} />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
