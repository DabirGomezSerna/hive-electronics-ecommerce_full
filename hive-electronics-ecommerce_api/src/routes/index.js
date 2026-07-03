import express from "express";

import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import userRoutes from "./userRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import shippingRoutes from "./shippingAddressRoutes.js";
import cartRoutes from "./cartRoutes.js";
import paymentMethodRoutes from "./paymentMethodRoutes.js";
import orderRoutes from "./orderRoutes.js";

const router = express.Router();

router.use(authRoutes);
router.use(productRoutes);
router.use(userRoutes);
router.use(categoryRoutes);
router.use(shippingRoutes);
router.use(cartRoutes);
router.use(paymentMethodRoutes);
router.use(orderRoutes);

export default router;
