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

/**
 * @openapi
 * /users/search:
 *   get:
 *     tags: [Users]
 *     summary: Search users
 *     description: >
 *       No express-validator chain on this route — all query parameters are
 *       read directly by the controller and unvalidated. The "email" and
 *       "role" query parameters are accepted but not applied to the query
 *       filter, and the "q" text search matches against a "name" field that
 *       does not exist on the User schema (the field is "displayName"), so
 *       in practice "q" does not narrow results. Response items are NOT
 *       password-filtered (unlike GET /users and GET /users/:id).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string }
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
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     totalResults: { type: integer }
 *                     hasNext: { type: boolean }
 *                     hasPrev: { type: boolean }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 */
router.get("/users/search", authMiddleware, isAdmin, searchUsers);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 */
router.get("/users", authMiddleware, isAdmin, getUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.get(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  validate,
  getUserById,
);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateInput'
 *     responses:
 *       201:
 *         description: User created (password stripped from the response)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.post("/users", createUserValidation, validate, createUser);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user
 *     description: >
 *       Only displayName, email, and role are read and persisted — password
 *       and avatar are not updatable via this endpoint.
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
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User not found }
 *       422:
 *         $ref: '#/components/responses/ValidationErrorResponse'
 */
router.put(
  "/users/:id",
  authMiddleware,
  [userIdValidation, updateUserValidation],
  validate,
  updateUser,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
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
 *         description: User deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Entry deleted }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User not found }
 */
router.delete(
  "/users/:id",
  authMiddleware,
  isAdmin,
  userIdValidation,
  deleteUser,
);

export default router;
