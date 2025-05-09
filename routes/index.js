import express from 'express';
import { redirectionShortCodeHandle } from '../controller/short-link-controller.js';
import { readShortCodeValidator } from '../validators/short-link.validator.js';
const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Redirect
 *   description: User registration and login
 */

/**
 * @swagger
 * /{shortCode}:
 *   get:
 *     summary: Redirect to the original URL from the shortcode
 *     description: |
 *       This route redirects a user to the original URL corresponding to the shortCode.  
 *       It increases the click counter and records metadata (IP, user-agent, referer).
 *     tags: [Redirect]
 *     parameters:
 *       - name: shortCode
 *         in: path
 *         required: true
 *         description: Shortcode of the link to redirect
 *         schema:
 *           type: string
 *           example: abc123
 *     responses:
 *       301:
 *         description: Permanent redirect to the original URL
 *         headers:
 *           Location:
 *             description: URL de destination
 *             schema:
 *               type: string
 *               format: uri
 *               example: https://example.com
 *       404:
 *         description: Short link not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       410:
 *         description: The short link has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error while redirecting
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/:shortCode',redirectionShortCodeHandle);

export default router;
