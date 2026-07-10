import { useEffect, useState } from "react";
import Button from "../../common/Button";
import Input from "../../common/Input";
import "./PaymentMethodForm.css";

const PAYMENT_TYPES = [
  { value: "credit_card", label: "Credit card" },
  { value: "debit_card", label: "Debit card" },
  { value: "paypal", label: "PayPal" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash_on_delivery", label: "Cash on delivery" },
];

const EMPTY_FORM = {
  type: "credit_card",
  cardNumber: "",
  cardHolderName: "",
  expiryDate: "",
  cvv: "",
  paypalEmail: "",
  bankName: "",
  accountNumber: "",
  isDefault: false,
};

const PaymentMethodForm = ({
  onSubmit,
  onCancel,
  initialValues = {},
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({ ...EMPTY_FORM, ...initialValues });

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({ ...EMPTY_FORM, ...initialValues });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    if (!isEdit) {
      setFormData(EMPTY_FORM);
    }
  };

  const isCard =
    formData.type === "credit_card" || formData.type === "debit_card";

  return (
    <form className="payment-method-form" onSubmit={handleSubmit}>
      <h3>{isEdit ? "Edit payment method" : "New payment method"}</h3>

      <div className="form-field">
        <label htmlFor="type">Payment type</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          {PAYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {isCard && (
        <>
          <Input
            label="Card holder name"
            name="cardHolderName"
            value={formData.cardHolderName}
            onChange={handleChange}
            required
          />
          <Input
            label="Card number"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            maxLength={16}
            required
          />
          <Input
            label="Expiry date (MM/YY)"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
          />
          <Input
            label="CVV"
            name="cvv"
            type="password"
            value={formData.cvv}
            onChange={handleChange}
            maxLength={4}
            required
          />
        </>
      )}

      {formData.type === "paypal" && (
        <Input
          label="PayPal email"
          name="paypalEmail"
          type="email"
          value={formData.paypalEmail}
          onChange={handleChange}
          required
        />
      )}

      {formData.type === "bank_transfer" && (
        <>
          <Input
            label="Bank name"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            required
          />
          <Input
            label="Account number"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            required
          />
        </>
      )}

      <div className="form-checkbox">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          id="defaultPayment"
        />
        <label htmlFor="defaultPayment">Set as default payment method</label>
      </div>

      <div className="form-actions">
        <Button type="submit">
          {isEdit ? "Save changes" : "Add payment method"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default PaymentMethodForm;
