import { memo } from "react";
import { Link } from "react-router-dom";
import { useCartActions } from "../../context/CartContext";
import Button from "../common/Button";
import "./ProductCard.css";

function ProductCard({ product, orientation = "vertical", index = 0 }) {
  const { addToCart } = useCartActions();
  const { name, price, stock, image, description } = product || {};

  if (!product) {
    return (
      <div
        className="product-card"
        style={{ padding: "24px", textAlign: "center" }}
      >
        <p className="muted">Product not available</p>
      </div>
    );
  }
  
  const handleAddToCart = () => addToCart(product, 1);
  const productLink = `/product/${product._id}`;
  const cardClass = `product-card product-card--${orientation}`;

  return (
    <div className={cardClass} data-testid="product-card">
      <Link to={productLink} className="product-card-image-link">
        <img
          src={image ? image[0] : "/img/products/placeholder.svg"}
          alt={name}
          className="product-card-image"
          loading={index < 4 ? "eager" : "lazy"}
          onError={(event) => {
            event.target.src = "/img/products/placeholder.svg";
          }}
        />
      </Link>
      <div className="product-card-content">
        <h3 className="product-card-title">
          <Link
            to={productLink}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {name}
          </Link>
        </h3>
        {description && (
          <p
            className="muted"
            style={{ fontSize: "13px", marginBottom: "8px" }}
          >
            {description.length > 60
              ? `${description.substring(0, 60)}...`
              : description}
          </p>
        )}
        <div className="product-card-price">${price}</div>
      </div>
      <div className="product-card-actions">
        <div className="product-card-badges">
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={stock === 0}
          onClick={handleAddToCart}
          data-testid="add-to-cart-btn"
        >
          Add to cart
        </Button>
      </div>
    </div>
  );
}

export default memo(ProductCard);
