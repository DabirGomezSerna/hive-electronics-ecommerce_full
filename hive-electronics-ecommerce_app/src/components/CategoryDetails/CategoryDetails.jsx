import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCategoryById,
  getProductsByCategoryAndChildren,
} from "../../services/categoryServices";
import ProductCard from "../ProductCard/ProductCard";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Loading from "../common/Loading/Loading";
import "./CategoryDetails.css";

export default function CategoryDetails({ categoryId }) {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadCategoryAndProducts = async () => {
      try {
        // Load category and products
        const [categoryData, productsData] = await Promise.all([
          getCategoryById(categoryId),
          getProductsByCategoryAndChildren(categoryId),
        ]);

        if (!categoryData) {
          setError("Category not found");
          return;
        }

        setCategory(categoryData);
        setProducts(productsData);
      } catch (err) {
        setError("Error while loading category or product");
      } finally {
        setLoading(false);
      }
    };

    loadCategoryAndProducts();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="category-products-root">
        <Loading message="Loading category and products..." />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="category-products-root">
        <ErrorMessage message={error || "Category not found"}>
          <p className="category-products-muted">
            Please check our <Link to="/">main page</Link> or explore other
            categories.
          </p>
        </ErrorMessage>
      </div>
    );
  }

  return (
    <div className="category-products-root">
      <div className="category-products-container">
        <div className="category-products-header">
          <div className="category-products-title">
            <h1 className="category-products-h1">
              {category.parentCategory
                ? `${category.parentCategory.name}: ${category.name}`
                : category.name}
            </h1>
            {category.description && (
              <p className="category-products-muted">{category.description}</p>
            )}
          </div>
        </div>
        {products.length > 0 ? (
          <div className="category-products-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                orientation="vertical"
                className="card"
              />
            ))}
          </div>
        ) : (
          <ErrorMessage message="No products found">
            <p className="category-products-muted">
              This category has no available products at the moment.
            </p>
          </ErrorMessage>
        )}
      </div>
    </div>
  );
}
