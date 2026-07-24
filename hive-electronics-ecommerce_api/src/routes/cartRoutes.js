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

/**
 * @openapi
 * /carts:
 *   get:
 *     tags: [Carts]
 *     summary: List all carts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of carts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cart'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 */
router.get("/carts", authMiddleware, isAdmin, getCarts);

/**
 * @openapi
 * /carts/{id}:
 *   get:
 *     tags: [Carts]
 *     summary: Get a cart by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Cart not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/carts/:id",
  authMiddleware,
  isAdmin,
  cartIdValidation,
  validate,
  getCartById,
);

/**
 * @openapi
 * /carts/user/{id}:
 *   get:
 *     tags: [Carts]
 *     summary: Get the cart belonging to a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The user's cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: No cart found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: No cart found for this user }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/carts/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getCartByUser,
);

/**
 * @openapi
 * /carts:
 *   post:
 *     tags: [Carts]
 *     summary: Create a cart
 *     description: >
 *       In addition to express-validator's checks, the controller runs its
 *       own manual validation of "user" and "products" and returns ad-hoc
 *       400 responses shaped {"error": "<message>"} — a different shape
 *       than this codebase's usual {"message": "<text>"} error convention.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartCreateInput'
 *     responses:
 *       201:
 *         description: Cart created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: >
 *           Manual controller-level validation failure (e.g. missing user,
 *           products not an array, a product item missing its id, or a
 *           non-positive quantity).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: User is required }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post(
  "/carts",
  authMiddleware,
  createCartValidation,
  validate,
  createCart,
);

/**
 * @openapi
 * /carts/addToCart:
 *   post:
 *     tags: [Carts]
 *     summary: Add a product to a user's cart
 *     description: >
 *       Creates the cart for this user if one does not already exist, or
 *       increments the product's quantity if it's already in the cart.
 *       "quantity" defaults to 1 and is not validated by express-validator.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartModifyInput'
 *     responses:
 *       200:
 *         description: Updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post(
  "/carts/addToCart",
  authMiddleware,
  modCartValidation,
  validate,
  addProductToCart,
);

/**
 * @openapi
 * /carts/removeFromCart:
 *   post:
 *     tags: [Carts]
 *     summary: Remove (or decrement) a product in a user's cart
 *     description: >
 *       "quantity" is read from the request body but is not actually used
 *       by the decrement logic and is not validated by express-validator.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartModifyInput'
 *     responses:
 *       200:
 *         description: Updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: No cart found for the user, or the product is not in the cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Product not found in cart }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post(
  "/carts/removeFromCart",
  authMiddleware,
  modCartValidation,
  validate,
  removeProductFromCart,
);

/**
 * @openapi
 * /carts/{id}:
 *   put:
 *     tags: [Carts]
 *     summary: Replace a cart's user/products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CartPutInput'
 *     responses:
 *       200:
 *         description: Updated cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Cart not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.put(
  "/carts/:id",
  authMiddleware,
  putCartValidation,
  validate,
  updateCart,
);

/**
 * @openapi
 * /carts/{id}:
 *   delete:
 *     tags: [Carts]
 *     summary: Delete a cart
 *     description: >
 *       This route declares an id validator but does not chain the
 *       "validate" middleware after it, so an invalid id is never rejected
 *       with a 422 here — it falls through to Mongoose and surfaces as a
 *       500 via the generic error handler.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Cart deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Entry deleted }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: Cart not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Cart not found }
 */
router.delete("/carts/:id", authMiddleware, cartIdValidation, deleteCart);

export default router;
