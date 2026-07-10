import apiClient from "./apiClient";

export const fetchProducts = async () => {
  return await apiClient("/products");
};

export const searchProducts = async (query) => {
  const lowerQuery = query.trim().toLowerCase();
  const products = await fetchProducts();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description?.toLowerCase().includes(lowerQuery)
  );
};

export const getProductsByCategory = async (categoryId) => {
  const products = await fetchProducts();
  return products.filter((product) => product.category?._id === categoryId);
};

export async function getProductById(id) {
  return await apiClient(`/products/${id}`);
}
