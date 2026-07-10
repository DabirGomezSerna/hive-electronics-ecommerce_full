import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "../../context/CartContext";
import Home from "../../pages/Home/Home";
import Layout from "../../layout/Layout";
import Product from "../../pages/Product";
import CategoryPage from "../../pages/CategoryPage";
import Cart from "../../pages/Cart/Cart";
import Checkout from "../../pages/Checkout/Checkout";
import Order from "../../pages/Order/Order";
import Login from "../../pages/Login/Login";
import ProtectedRoute from "../../pages/ProtectedRoute";
import "./App.css";

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/product/:productId" element={<Product />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-confirmation"
              element={
                <ProtectedRoute>
                  <Order />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div>Page not available</div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CartProvider>
  );
}
