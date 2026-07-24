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

/**
 * @openapi
 * /addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: List all shipping addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of shipping addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 */
router.get("/addresses", authMiddleware, isAdmin, getShippingAddresses);

/**
 * @openapi
 * /addresses/user/{id}:
 *   get:
 *     tags: [Addresses]
 *     summary: List shipping addresses for a user
 *     description: >
 *       Always returns 200, even when the user has no addresses (an empty
 *       array is not treated as a 404).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of shipping addresses for the given user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ShippingAddress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/addresses/user/:id",
  authMiddleware,
  userIdValidation,
  validate,
  getShippingAddressesByUser,
);

/**
 * @openapi
 * /addresses/{id}:
 *   get:
 *     tags: [Addresses]
 *     summary: Get a shipping address by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The shipping address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShippingAddress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Address not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/addresses/:id",
  authMiddleware,
  isAdmin,
  addressIdValidation,
  validate,
  getShippingAddressById,
);

/**
 * @openapi
 * /addresses:
 *   post:
 *     tags: [Addresses]
 *     summary: Create a shipping address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShippingAddressCreateInput'
 *     responses:
 *       201:
 *         description: Shipping address created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShippingAddress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post(
  "/addresses",
  authMiddleware,
  createAddressValidation,
  validate,
  createShippingAddress,
);

/**
 * @openapi
 * /addresses/{id}:
 *   put:
 *     tags: [Addresses]
 *     summary: Update a shipping address
 *     description: >
 *       "user" is not accepted/persisted by this endpoint even if sent, and
 *       the response is not populated (unlike the create response).
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
 *             $ref: '#/components/schemas/ShippingAddressUpdateInput'
 *     responses:
 *       200:
 *         description: Updated shipping address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ShippingAddress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Address not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.put(
  "/addresses/:id",
  authMiddleware,
  updateAddressValidation,
  validate,
  updateShippingAddress,
);

/**
 * @openapi
 * /addresses/{id}:
 *   delete:
 *     tags: [Addresses]
 *     summary: Delete a shipping address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Address deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Entry deleted }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Address not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.delete(
  "/addresses/:id",
  authMiddleware,
  addressIdValidation,
  validate,
  deleteShippingAddress,
);

export default router;
