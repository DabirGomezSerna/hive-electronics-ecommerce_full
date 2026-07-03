import express from "express";
import { body, param } from "express-validator";
import {
  getUsers,
  getUserById,
  searchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import validate from "../middleware/validation.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdminMiddleware.js";

const router = express.Router();

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createUserValidation = [
  body("displayName").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
  body("avatar").isURL().withMessage("Avatar URL must be a valid URL"),
];

const updateUserValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectID"),
  body("displayName")
    .optional()
    .notEmpty()
    .withMessage("Display name must not be empty"),
  body("email").optional().isEmail().withMessage("A valid email is required"),
  body("role")
    .optional()
    .isIn(["customer", "admin"])
    .withMessage("Role must be customer or admin"),
];

router.get("/users/search", authMiddleware, isAdmin, searchUsers);

router.get("/users", authMiddleware, isAdmin, getUsers);

router.get(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  validate,
  getUserById,
);

router.post("/users", createUserValidation, validate, createUser);

router.put(
  "/users/:id",
  authMiddleware,
  [userIdValidation, updateUserValidation],
  validate,
  updateUser,
);

router.delete(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  deleteUser,
);

export default router;
