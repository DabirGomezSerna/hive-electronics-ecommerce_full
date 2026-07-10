import Button from "../../common/Button";
import PaymentMethodItem from "./PaymentMethodItem";
import "./PaymentMethodList.css";

const PaymentMethodList = ({
  methods,
  selectedMethod,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
}) => {
  return (
    <div className="payment-method-list">
      <div className="payment-method-list-header">
        <h3>Payment methods</h3>
        <Button onClick={onAdd}>Add new payment method</Button>
      </div>
      <div className="payment-method-list-content">
        {methods.map((method) => (
          <PaymentMethodItem
            key={method._id}
            method={method}
            isSelected={selectedMethod?._id === method._id}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodList;
