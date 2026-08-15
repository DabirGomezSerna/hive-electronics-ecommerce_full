import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "../services/apiClient";
import { getCurrentUser } from "../services/userServices";
import logger from "../services/logger";

const CartContext = createContext();
// Separate context carrying only the stable addToCart reference, so components
// that don't display cart contents (e.g. ProductCard) don't re-render on every
// cart change — only on changes to their own props.
const CartActionsContext = createContext();

const transformCart = (cart) =>
  cart.products.map(({ product, quantity }) => ({ ...product, quantity }));

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [cartError, setCartError] = useState(null);

  // Load cart on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      const saved = localStorage.getItem("cart");
      setCartItems(saved ? JSON.parse(saved) : []);
      return;
    }

    apiClient(`/carts/user/${user.userId}`)
      .then((cart) => {
        setCartId(cart._id);
        setCartItems(transformCart(cart));
      })
      .catch((error) => {
        logger.warn("Cart could not be loaded from the API", { error });
        setCartItems([]);
      });
  }, []);

  // Keep localStorage in sync for guest users
  useEffect(() => {
    if (!getCurrentUser()) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    const user = getCurrentUser();
    if (!user) {
      setCartItems((prev) => {
        const existing = prev.find((i) => i._id === product._id);
        if (existing) {
          return prev.map((i) =>
            i._id === product._id ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { ...product, quantity }];
      });
      return true;
    }

    try {
      const cart = await apiClient("/carts/addToCart", {
        method: "POST",
        body: JSON.stringify({ userId: user.userId, productId: product._id, quantity }),
      });
      setCartId(cart._id);
      setCartItems(transformCart(cart));
      setCartError(null);
      return true;
    } catch (error) {
      logger.error("Failed to add product to cart", { productId: product._id, error });
      setCartError("We couldn't add that product to your cart. Please try again.");
      return false;
    }
  }, []);

  const clearCart = useCallback(async () => {
    const user = getCurrentUser();
    if (!user || !cartId) {
      setCartItems([]);
      return true;
    }

    try {
      await apiClient(`/carts/${cartId}`, { method: "DELETE" });
      setCartId(null);
      setCartItems([]);
      setCartError(null);
      return true;
    } catch (error) {
      logger.error("Failed to clear cart", { cartId, error });
      setCartError("We couldn't empty your cart. Please try again.");
      return false;
    }
  }, [cartId]);

  const removeFromCart = useCallback(async (productId) => {
    const user = getCurrentUser();
    if (!user) {
      setCartItems((prev) => prev.filter((i) => i._id !== productId));
      return true;
    }

    const updatedProducts = cartItems
      .filter((i) => i._id !== productId)
      .map(({ _id, quantity }) => ({ product: _id, quantity }));

    if (updatedProducts.length === 0) {
      return clearCart();
    }

    try {
      const cart = await apiClient(`/carts/${cartId}`, {
        method: "PUT",
        body: JSON.stringify({ user: user.userId, products: updatedProducts }),
      });
      setCartId(cart._id);
      setCartItems(transformCart(cart));
      setCartError(null);
      return true;
    } catch (error) {
      logger.error("Failed to remove product from cart", { productId, error });
      setCartError("We couldn't remove that product. Please try again.");
      return false;
    }
  }, [cartItems, cartId, clearCart]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      return removeFromCart(productId);
    }

    const user = getCurrentUser();
    if (!user) {
      setCartItems((prev) =>
        prev.map((i) =>
          i._id === productId ? { ...i, quantity: newQuantity } : i
        )
      );
      return true;
    }

    const updatedProducts = cartItems.map(({ _id, quantity }) => ({
      product: _id,
      quantity: _id === productId ? newQuantity : quantity,
    }));

    try {
      const cart = await apiClient(`/carts/${cartId}`, {
        method: "PUT",
        body: JSON.stringify({ user: user.userId, products: updatedProducts }),
      });
      setCartId(cart._id);
      setCartItems(transformCart(cart));
      setCartError(null);
      return true;
    } catch (error) {
      logger.error("Failed to update product quantity", { productId, newQuantity, error });
      setCartError("We couldn't update the quantity. Please try again.");
      return false;
    }
  }, [cartItems, cartId, removeFromCart]);

  const getTotalItems = useCallback(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const getTotalPrice = useCallback(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const clearCartError = useCallback(() => setCartError(null), []);

  const value = useMemo(
    () => ({
      cartItems,
      total: getTotalPrice(),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      cartError,
      clearCartError,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      cartError,
      clearCartError,
    ]
  );

  // addToCart never changes identity (see its useCallback deps above), so this
  // value is created once and never triggers a re-render in its consumers.
  const actionsValue = useMemo(() => ({ addToCart }), [addToCart]);

  return (
    <CartActionsContext.Provider value={actionsValue}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

// For components that only need to add a product to the cart (e.g. ProductCard,
// ProductDetails) — avoids re-rendering when cartItems/total change elsewhere.
export function useCartActions() {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error("useCartActions must be used within CartProvider");
  return context;
}
