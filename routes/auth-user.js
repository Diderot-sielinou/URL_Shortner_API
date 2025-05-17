import express from'express';
import { loginUserValidator, registerUsertValidate } from '../validators/auth-users-validators.js';
import { loginUserByGoogleHandle, redirectionToGoogleHandle, registerUserHandle } from '../controller/user-controller.js';
import { loginUserHandle } from '../controller/user-controller.js';
const router = express.Router();



/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and login
 */


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account
 *     tags: [Authentication]
 *     security: []  # Ce endpoint est public, pas besoin de JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - address
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Fonou
 *               lastName:
 *                 type: string
 *                 example: Aristide
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ngoran@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: P@word123
 *               address:
 *                 type: string
 *                 example: limbe
 *               phone:
 *                 type: string
 *                 example: +237654345656
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/registerRequest'
 *       400:
 *         description: Validation error (e.g., invalid input).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already in use.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during registration.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post('/register', registerUsertValidate,registerUserHandle);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     description: Authenticates a user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, format: email, example: john.doe@example.com }
 *               password: { type: string, format: password, example: P@sswOrd123 }
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error (e.g., missing fields).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Invalid credentials (email not found or password incorrect).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error during login.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *     security: [] # Override global security - this endpoint is public
 */
router.post('/login', loginUserValidator,loginUserHandle);

router.get('/google',redirectionToGoogleHandle)
router.get('/callback',loginUserByGoogleHandle)


export default router;
