import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "../../context/CartContext";
import Home from "../../pages/Home/Home";
import Layout from "../../layout/Layout";
import ProtectedRoute from "../../pages/ProtectedRoute";
import Loading from "../common/Loading/Loading";
import "./App.css";

const Product = lazy(() => import("../../pages/Product"));
const CategoryPage = lazy(() => import("../../pages/CategoryPage"));
const Cart = lazy(() => import("../../pages/Cart/Cart"));
const Checkout = lazy(() => import("../../pages/Checkout/Checkout"));
const Order = lazy(() => import("../../pages/Order/Order"));
const Login = lazy(() => import("../../pages/Login/Login"));

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<Loading />}>
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
          </Suspense>
        </Layout>
      </BrowserRouter>
    </CartProvider>
  );
}
