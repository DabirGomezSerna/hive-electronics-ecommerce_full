import express from "express";
import { body, param } from "express-validator";
import {
  getProduct,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import validate from "../middleware/validation.js";
import authMiddleware from "../middleware/authMiddleware.js";
import isAdmin from "../middleware/isAdminMiddleware.js";

const router = express.Router();

const productIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
];

const createProductValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 1 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 1 })
    .withMessage("Stock must be a postive whole number"),
  body("category")
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

const updateProductValidation = [
  param("id")
    .isMongoId()
    .withMessage("Product ID must be a valid MongoDB ObjectId"),
  body("name").optional().notEmpty().withMessage("Name is required"),
  body("price")
    .optional()
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("stock")
    .optional()
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 1 })
    .withMessage("Stock must be a postive whole number"),
  body("image")
    .optional()
    .isArray()
    .withMessage("Image URL must be in an array"),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Category must be a valid MongoDB ObjectId"),
];

/**
 * @openapi
 * /products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products
 *     description: >
 *       No express-validator chain on this route — all query parameters are
 *       read directly by the controller and unvalidated.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Matched against name/description via a case-insensitive regex.
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category ObjectId, used as-is (not cast/validated).
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: inStock
 *         schema: { type: string, enum: ["true", "false"] }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     totalResults: { type: integer }
 *                     hasNext: { type: boolean }
 *                     hasPrev: { type: boolean }
 */
router.get("/products/search", searchProducts);

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List all products
 *     responses:
 *       200:
 *         description: Array of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/products", getProduct);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Product not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get("/products/:id", productIdValidation, validate, getProductById);

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateInput'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post(
  "/products",
  authMiddleware,
  isAdmin,
  createProductValidation,
  validate,
  createProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     description: >
 *       Unlike the create/list/get responses, this endpoint's response is
 *       not populated — "category" is returned as a raw ObjectId, not the
 *       full Category document.
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
 *             $ref: '#/components/schemas/ProductUpdateInput'
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Product not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.put(
  "/products/:id",
  authMiddleware,
  isAdmin,
  updateProductValidation,
  validate,
  updateProduct,
);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Product deleted }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Product not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.delete(
  "/products/:id",
  authMiddleware,
  isAdmin,
  productIdValidation,
  validate,
  deleteProduct,
);

export default router;
