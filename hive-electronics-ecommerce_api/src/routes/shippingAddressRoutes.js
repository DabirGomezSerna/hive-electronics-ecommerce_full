import express from "express";
import { body, param } from "express-validator";
import {
  getShippingAddresses,
  getShippingAddressesByUser,
  getShippingAddressById,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress,
} from "../controllers/shippingAddressController.js";
import validate from "../middleware/validation.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdminMiddleware.js";

const router = express.Router();

const addressIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createAddressValidation = [
  body("user")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectID"),
  body("address1").notEmpty().withMessage("Address is required"),
  body("postalCode").notEmpty().withMessage("Post code is required"),
  body("city").notEmpty().withMessage("City is required"),
  body("country").notEmpty().withMessage("Country is required"),
];

const updateAddressValidation = [
  param("id")
    .isMongoId()
    .withMessage("Address ID must be a valid MongoDB ObjectID"),
  body("address1")
    .optional()
    .notEmpty()
    .withMessage("Address 1 must not be empty"),
  body("postalCode")
    .optional()
    .notEmpty()
    .withMessage("Post code must not be empty"),
  body("city").optional().notEmpty().withMessage("City must not be empty"),
  body("country")
    .optional()
    .notEmpty()
    .withMessage("Country must not be empty"),
];

router.get("/addresses", authMiddleware, isAdmin, getShippingAddresses);

router.get(
  "/addresses/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getShippingAddressesByUser,
);

router.get(
  "/addresses/:id",
  authMiddleware,
  isAdmin,
  addressIdValidation,
  validate,
  getShippingAddressById,
);

router.post(
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createShippingAddress,
);

router.put(
  "/addresses/:id",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateShippingAddress,
);

router.delete(
  "/addresses/:id",
  authMiddleware,
  addressIdValidation,
  validate,
  deleteShippingAddress,
);

export default router;
