import apiClient from "./apiClient";

export const fetchCategories = async () => {
  return await apiClient("/categories");
};

export const fetchProducts = async () => {
  return await apiClient("/products");
};

export const searchCategories = async (query) => {
  const lowerQuery = query.trim().toLowerCase();
  const categories = await fetchCategories();
  return categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description?.toLowerCase().includes(lowerQuery)
  );
};

export const getCategoryById = async (categoryId) => {
  return await apiClient(`/categories/${categoryId}`);
};

export const getChildCategories = async (parentCategoryId) => {
  const categories = await fetchCategories();
  return categories.filter((cat) => cat.parentCategory?._id === parentCategoryId);
};

export const getProductsByCategory = async (categoryId) => {
  const products = await fetchProducts();
  return products.filter((product) => product.category._id === categoryId);
};

export const getProductsByCategoryAndChildren = async (categoryId) => {
  const [allProducts, allCategories] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
  ]);

  const category = allCategories.find((cat) => cat._id === categoryId);
  if (!category) return [];

  if (!category.parentCategory) {
    const childCategoryIds = allCategories
      .filter((cat) => cat.parentCategory?._id === categoryId)
      .map((cat) => cat._id);

    const allCategoryIds = [categoryId, ...childCategoryIds];
    return allProducts.filter((product) =>
      allCategoryIds.includes(product.category._id)
    );
  }

  return allProducts.filter((product) => product.category._id === categoryId);
};

export const getParentCategories = async () => {
  const categories = await fetchCategories();
  return categories.filter((cat) => cat.parentCategory === null);
};
