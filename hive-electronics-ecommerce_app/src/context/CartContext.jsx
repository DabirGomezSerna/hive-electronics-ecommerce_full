import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import { getCurrentUser } from "../services/userServices";

const CartContext = createContext();

const transformCart = (cart) =>
  cart.products.map(({ product, quantity }) => ({ ...product, quantity }));

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);

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
      .catch(() => {
        setCartItems([]);
      });
  }, []);

  // Keep localStorage in sync for guest users
  useEffect(() => {
    if (!getCurrentUser()) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = async (product, quantity = 1) => {
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
      return;
    }

    const cart = await apiClient("/carts/addToCart", {
      method: "POST",
      body: JSON.stringify({ userId: user.userId, productId: product._id, quantity }),
    });
    setCartId(cart._id);
    setCartItems(transformCart(cart));
  };

  const clearCart = async () => {
    const user = getCurrentUser();
    if (!user || !cartId) {
      setCartItems([]);
      return;
    }

    await apiClient(`/carts/${cartId}`, { method: "DELETE" });
    setCartId(null);
    setCartItems([]);
  };

  const removeFromCart = async (productId) => {
    const user = getCurrentUser();
    if (!user) {
      setCartItems((prev) => prev.filter((i) => i._id !== productId));
      return;
    }

    const updatedProducts = cartItems
      .filter((i) => i._id !== productId)
      .map(({ _id, quantity }) => ({ product: _id, quantity }));

    if (updatedProducts.length === 0) {
      await clearCart();
      return;
    }

    const cart = await apiClient(`/carts/${cartId}`, {
      method: "PUT",
      body: JSON.stringify({ user: user.userId, products: updatedProducts }),
    });
    setCartId(cart._id);
    setCartItems(transformCart(cart));
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      setCartItems((prev) =>
        prev.map((i) =>
          i._id === productId ? { ...i, quantity: newQuantity } : i
        )
      );
      return;
    }

    const updatedProducts = cartItems.map(({ _id, quantity }) => ({
      product: _id,
      quantity: _id === productId ? newQuantity : quantity,
    }));

    const cart = await apiClient(`/carts/${cartId}`, {
      method: "PUT",
      body: JSON.stringify({ user: user.userId, products: updatedProducts }),
    });
    setCartId(cart._id);
    setCartItems(transformCart(cart));
  };

  const getTotalItems = () =>
    cartItems.reduce((total, item) => total + item.quantity, 0);

  const getTotalPrice = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = {
    cartItems,
    total: getTotalPrice(),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
