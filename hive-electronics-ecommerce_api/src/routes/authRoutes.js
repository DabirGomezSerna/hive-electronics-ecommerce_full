import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

/**
 * @openapi
 * /register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: >
 *       Creates a user with role always forced to "customer" server-side —
 *       role cannot be set via this endpoint. This route has no
 *       express-validator chain, so the request body is not format-validated
 *       at the route layer.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: A user with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exist
 */
router.post("/register", register);

/**
 * @openapi
 * /login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate a user and issue JWTs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: User does not exist, or credentials are invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid Credentials
 */
router.post("/login", login);

export default router;