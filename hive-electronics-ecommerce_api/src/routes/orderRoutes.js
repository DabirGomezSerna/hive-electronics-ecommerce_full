import express from "express";
import { body, param } from "express-validator";
import {
  getOrders,
  getOrderById,
  getOrderByUser,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import validate from "../middleware/validation.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdminMiddleware.js";

const router = express.Router();

const orderIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

const createOrderValidation = [
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
    .withMessage("Each product item must include productId")
    .isMongoId()
    .withMessage("Each productId must be a valid MongoDB ObjectId"),
  body("products.*.quantity")
    .notEmpty()
    .withMessage("Each product item must include quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1"),
  body("products.*.price")
    .notEmpty()
    .withMessage("Each product item must include price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isMongoId()
    .withMessage("Address must be a valid MongoDB ObjectId"),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isMongoId()
    .withMessage("Payment method must be a valid MongoDB ObjectId"),
  body("shippingCost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a positive number"),
];

const updateOrderStatusValidation = [
  param("id")
    .isMongoId()
    .withMessage("Order ID must be a valid MongoDB ObjectId"),
  body("status")
    .optional()
    .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
    .withMessage("Invalid order status"),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status"),
];

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List all orders
 *     description: >
 *       The controller calls .populate() on the array resolved from
 *       Order.find() — arrays do not have a .populate() method, so this
 *       currently throws and the request surfaces as a 500 server error
 *       via the generic error handler rather than the intended 200 array.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of orders (see description — not currently reachable)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       500:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get("/orders", authMiddleware, isAdmin, getOrders);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by id
 *     description: >
 *       Response is populated with user, products.product, address, and
 *       paymentMethod.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Order not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/orders/:id",
  authMiddleware,
  orderIdValidation,
  validate,
  getOrderById,
);

/**
 * @openapi
 * /orders/user/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: List orders belonging to a user
 *     description: >
 *       Always returns 200 with an array (possibly empty) — Order.find()
 *       never resolves to a falsy value, so the controller's not-found
 *       branch is unreachable.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of orders for the given user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/orders/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getOrderByUser,
);

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an order
 *     description: >
 *       taxAmount is computed server-side as 16% of the product subtotal,
 *       and totalPrice as subtotal + taxAmount + shippingCost — neither can
 *       be set by the client. However, each product line's "price" and the
 *       "shippingCost" value ARE taken directly from the request body and
 *       are only format-validated, not cross-checked against the Product
 *       collection. The response is populated with user and
 *       products.product only — "address" and "paymentMethod" are returned
 *       as raw ObjectIds, unlike GET /orders/:id.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreateInput'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post(
  "/orders",
  authMiddleware,
  createOrderValidation,
  validate,
  createOrder,
);

/**
 * @openapi
 * /orders/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Update an order's status/paymentStatus
 *     description: >
 *       The response is not populated. When the order is not found, the
 *       controller responds 204 with a JSON body {"message":"Order not
 *       found"} — a 404 would be the conventional choice, and a 204 is not
 *       meant to carry a body, but this is the actual current behavior.
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
 *             $ref: '#/components/schemas/OrderUpdateInput'
 *     responses:
 *       200:
 *         description: Updated order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       204:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Order not found }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.put(
  "/orders/:id",
  authMiddleware,
  updateOrderStatusValidation,
  validate,
  updateOrderStatus,
);

export default router;
