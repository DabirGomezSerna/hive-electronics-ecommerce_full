import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCartActions } from "../../context/CartContext";
import categoriesData from "../../data/categories.json";
import { getProductById } from "../../services/productServices";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Loading from "../common/Loading/Loading";
import "./ProductDetails.css";

export default function ProductDetails({ productId }) {
  const { addToCart } = useCartActions();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProductById(productId)
      .then((foundProduct) => {
        if (!foundProduct) {
          setError("Product not found");
        } else {
          setProduct(foundProduct);
        }
      })
      .catch(() => setError("Encountered error while loading product."))
      .finally(() => setLoading(false));
  }, [productId]);

  const resolvedCategory = useMemo(() => {
    if (!product?.category) return null;
    return (
      categoriesData.find((cat) => cat._id === product.category._id) ||
      categoriesData.find(
        (cat) => cat.name.toLowerCase() === product.category.name?.toLowerCase()
      ) ||
      null
    );
  }, [product]);

  const handleAddToCart = () => {
    if (product) addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className="product-details-container">
        <Loading message="Loading product..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-details-container">
        <ErrorMessage message={error}>
          <p className="muted">
            Please check our <Link to="/">main page</Link> or explore other
            categories.
          </p>
        </ErrorMessage>
      </div>
    );
  }
  if (!product) return null;

  const { name, price, description, stock, image, category } = product || {};

  return (
    <div className="product-details-container">
      <div className="product-details-main">
        <div className="product-details-image">
          <img
            src={
              image ? image[0] : "/img/products/placeholder.svg"
            }
            alt={name}
            loading="eager"
            fetchpriority="high"
            onError={(event) => {
              event.target.src = "/img/products/placeholder.svg";
            }}
          ></img>
        </div>
        <div className="product-details-info">
          <div className="product-details-title">
            <h1 className="h1">{name}</h1>
            {(resolvedCategory?.name || category?.name) && (
              <span className="product-details-category">
                {resolvedCategory?.name || category?.name}
              </span>
            )}
          </div>
          <p className="product-details-description">{description}</p>
          <div className="product-details-stock">
            {stock > 0 && <span className="muted">{stock} units in stock</span>}
          </div>
          <div className="product-details-price">${price}</div>
          <div className="product-details-actions">
            <Button
              variant="primary"
              size="lg"
              disabled={stock === 0}
              onClick={handleAddToCart}
            >
              Add to cart
            </Button>
            <Link to="/cart" className="btn btn-outline btn-lg">
              See cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
