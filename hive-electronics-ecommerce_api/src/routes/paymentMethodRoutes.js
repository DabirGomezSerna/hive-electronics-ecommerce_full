import express from "express";
import { body, param } from "express-validator";
import {
  getPaymentMethods,
  getPaymentMethodById,
  getPaymentMethodsByUser,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../controllers/paymentMethodController.js";
import validate from "../middleware/validation.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdminMiddleware.js";

const router = express.Router();

const paymentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
];

const createPaymentValidation = [
  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("type")
    .notEmpty()
    .withMessage("Payment type is required")
    .isIn([
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment type"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];

const updatePaymentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Payment method ID must be a valid MongoDB ObjectId"),
  body("type")
    .optional()
    .isIn([
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment type"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
  body("cardNumber")
    .optional()
    .isLength({ max: 16 })
    .withMessage("Card number must be at most 16 characters"),
];

const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /payment-methods:
 *   get:
 *     tags: [PaymentMethods]
 *     summary: List all payment methods
 *     description: >
 *       Unlike every other payment-method endpoint, this response does not
 *       exclude "cvv".
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 */
router.get("/payment-methods", authMiddleware, isAdmin, getPaymentMethods);

/**
 * @openapi
 * /payment-methods/user/{id}:
 *   get:
 *     tags: [PaymentMethods]
 *     summary: List payment methods for a user
 *     description: >
 *       Always returns 200, even when the user has no payment methods.
 *       "cvv" is excluded from each item.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of payment methods for the given user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/payment-methods/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getPaymentMethodsByUser,
);

/**
 * @openapi
 * /payment-methods/{id}:
 *   get:
 *     tags: [PaymentMethods]
 *     summary: Get a payment method by id
 *     description: >
 *       "cvv" is excluded from the response. The controller populates
 *       "user" before checking whether the document was found, so a
 *       nonexistent id currently surfaces as a 500 server error rather than
 *       the 404 branch present in the code.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The payment method
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get(
  "/payment-methods/:id",
  authMiddleware,
  isAdmin,
  paymentIdValidation,
  validate,
  getPaymentMethodById,
);

/**
 * @openapi
 * /payment-methods:
 *   post:
 *     tags: [PaymentMethods]
 *     summary: Create a payment method
 *     description: >
 *       "isActive" is read from the request body, but the controller's
 *       fallback logic (isActive || true) means it can never actually be
 *       set to false via this endpoint.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentMethodCreateInput'
 *     responses:
 *       201:
 *         description: Payment method created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post(
  "/payment-methods",
  authMiddleware,
  createPaymentValidation,
  validate,
  createPaymentMethod,
);

/**
 * @openapi
 * /payment-methods/{id}:
 *   put:
 *     tags: [PaymentMethods]
 *     summary: Update a payment method
 *     description: >
 *       Sending "isDefault: true" in the request body currently triggers a
 *       500 server error (the controller references an undeclared variable
 *       on that code path) instead of updating the record.
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
 *             $ref: '#/components/schemas/PaymentMethodUpdateInput'
 *     responses:
 *       200:
 *         description: Updated payment method
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: Payment method not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Payment method not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.put(
  "/payment-methods/:id",
  authMiddleware,
  updatePaymentValidation,
  validate,
  updatePaymentMethod,
);

/**
 * @openapi
 * /payment-methods/{id}:
 *   delete:
 *     tags: [PaymentMethods]
 *     summary: Delete a payment method
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Payment method deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Entry deleted }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: Payment method not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Payment method not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.delete(
  "/payment-methods/:id",
  authMiddleware,
  paymentIdValidation,
  validate,
  deletePaymentMethod,
);

export default router;
