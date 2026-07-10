import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts, searchProducts } from "../../services/productServices";
import List from "../../components/List/List";
import ErrorMessage from "../../components/common/ErrorMessage/ErrorMessage";
import Loading from "../../components/common/Loading/Loading";
import "./Home.css";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const productsData = query
          ? await searchProducts(query)
          : await fetchProducts();
        setProducts(productsData);
      } catch (error) {
        setError("Products didn't load. Try again later.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [query]);

  const title = query
    ? `Search results for "${query}"`
    : "Our products";

  return (
    <div>
      {loading ? (
        <Loading>Loading products</Loading>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : products.length > 0 ? (
        <List title={title} products={products} layout="grid" />
      ) : (
        <ErrorMessage>
          {query
            ? `No products found for "${query}".`
            : "No products in store! We're sorry about that."}
        </ErrorMessage>
      )}
    </div>
  );
}
