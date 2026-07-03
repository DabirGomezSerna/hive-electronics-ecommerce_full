import express from "express";
import { body, param } from "express-validator";
import {
  getCarts,
  getCartById,
  getCartByUser,
  createCart,
  addProductToCart,
  removeProductFromCart,
  updateCart,
  deleteCart,
} from "../controllers/cartController.js";
import validate from "../middleware/validation.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdminMiddleware.js";

const router = express.Router();

const cartIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const modCartValidation = [
  body("userId")
    .isMongoId()
    .withMessage("User id must be a valid MongoDB ObjectId"),
  body("productId")
    .isMongoId()
    .withMessage("Product id must be a valid MongoDB ObjectId"),
];

const createCartValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .optional()
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

const putCartValidation = [
  param("id")
    .isMongoId()
    .withMessage("Cart ID must be a valid MongoDB ObjectId"),
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("products")
    .notEmpty()
    .withMessage("Products array is required")
    .isArray()
    .withMessage("Products must be an array"),
  body("products.*.product")
    .notEmpty()
    .withMessage("Each product item must include product ID")
    .isMongoId()
    .withMessage("Each product must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
];

router.get("/carts", authMiddleware, isAdmin, getCarts);

router.get(
  "/carts/:id",
  authMiddleware,
  isAdmin,
  cartIdValidation,
  validate,
  getCartById,
);

router.get(
  "/carts/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getCartByUser,
);

router.post(
  "/carts",
  authMiddleware,
  createCartValidation,
  validate,
  createCart,
);

router.post(
  "/carts/addToCart",
  authMiddleware,
  modCartValidation,
  validate,
  addProductToCart,
);

router.post(
  "/carts/removeFromCart",
  authMiddleware,
  modCartValidation,
  validate,
  removeProductFromCart,
);

router.put(
  "/carts/:id",
  authMiddleware,
  putCartValidation,
  validate,
  updateCart,
);

router.delete("/carts/:id", authMiddleware, cartIdValidation, deleteCart);

export default router;
