import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import CartView from "../../components/Cart/CartView";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon/Icon";
import "./Cart.css";

export default function Cart() {
  const { cartItems, clearCart, getTotalItems, getTotalPrice } = useCart();
  const totalItems = getTotalItems();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <Icon name="cart" size={100}></Icon>
        <h2>No items in shopping cart</h2>
        <p>Add some products to you cart to start shopping!</p>
        <Button variant="primary" onClick={() => navigate("/")}>
          <span>Back to products</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-header">
        <div className="cart-header-title">
          <Icon name="cart" size={32} />
          <h1>Shopping cart</h1>
        </div>
        <div className="cart-header-info">
          <span className="cart-items-count">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
          <Button
            variant="ghost"
            className="danger clear-cart-btn"
            onClick={clearCart}
            title="Vaciar carrito"
            size="sm"
          >
            <Icon name="trash" size={18} />
            <span>Empty cart</span>
          </Button>
        </div>
      </div>

      <div className="cart-items">
        <CartView />
        <div className="cart-summary">
          <div className="cart-total">
            <span className="cart-total-subtitle">Total</span>
            <h2>${getTotalPrice().toFixed(2)}</h2>
          </div>
          <div className="cart-actions">
            <Button variant="secondary" size="md" onClick={() => navigate("/")}>
              <span>Back to products</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/checkout")}
              size="md"
              disabled={!cartItems || cartItems.length === 0}
              title={
                !cartItems || cartItems.length === 0
                  ? "Add products to cart to continue"
                  : "Proceed to payment"
              }
              data-testid="checkout-btn"
            >
              <Icon name="creditCard" size={20} />
              <span>Proceed to payment</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
