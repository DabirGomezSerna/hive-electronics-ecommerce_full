import Button from "../../common/Button";
import "./PaymentMethodItem.css";

const TYPE_LABELS = {
  credit_card: "Credit card",
  debit_card: "Debit card",
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  cash_on_delivery: "Cash on delivery",
};

const getMethodSummary = (method) => {
  const { type, cardNumber, cardHolderName, paypalEmail, bankName } = method;
  if (type === "credit_card" || type === "debit_card") {
    const last4 = cardNumber ? `****${cardNumber.slice(-4)}` : "";
    return `${cardHolderName || ""}${last4 ? ` · ${last4}` : ""}`;
  }
  if (type === "paypal") return paypalEmail || "";
  if (type === "bank_transfer") return bankName || "";
  return "";
};

const PaymentMethodItem = ({ method, isSelected, onSelect, onEdit, onDelete }) => {
  return (
    <div
      className={`payment-method-item ${isSelected ? "selected" : ""} ${
        method.isDefault ? "default" : ""
      }`}
    >
      <div className="payment-method-content">
        <h4>{TYPE_LABELS[method.type] || method.type}</h4>
        <p>{getMethodSummary(method)}</p>
        {method.isDefault && (
          <span className="default-badge">Default</span>
        )}
      </div>
      <div className="payment-method-actions">
        <Button onClick={() => onSelect(method)} disabled={isSelected}>
          {isSelected ? "Selected" : "Select"}
        </Button>
        <Button variant="secondary" onClick={() => onEdit(method)}>
          Edit
        </Button>
        <Button variant="danger" onClick={() => onDelete(method)}>
          Delete
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodItem;
