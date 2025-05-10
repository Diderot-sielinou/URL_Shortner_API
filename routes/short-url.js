import express from "express";
import {
  createShortLinkValidator,
  readShortCodeValidator,
} from "../validators/short-link.validator.js";
import {
  createShortUrlHandle,
  getAllShortUrlByUser,
  getShortUrlStats,
} from "../controller/short-link-controller.js";
import authMiddleware from "../middleware/authmiddleware.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ShortLinks
 *   description: create shortened links, retrieve links, create, retrieve statistics of a shortened link
 */


/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Create a custom short link
 *     tags: [ShortLinks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shortCode:
 *                 type: string
 *                 description: Custom short code (optional). Si absent, un code aléatoire sera généré.
 *                 example: promo2025
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *                 description: The original URL to shorten.
 *                 example: https://example.com/landing-page
 *               expiresAtString:
 *                 type: string
 *                 description: Expiration date in `dd/MM/yyyy` or `dd/MM/yyyy HH:mm` format (Africa/Lagos time zone).
 *                 example: "15/06/2025 23:00"
 *             required:
 *               - originalUrl
 *     responses:
 *       201:
 *         description: Short URL created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Short URL created successfully
 *                 shortUrl:
 *                   type: string
 *                   format: uri
 *                   example: http://localhost:3000/promo2025
 *                 shortCode:
 *                   type: string
 *                   example: promo2025
 *       400:
 *         description: Expiration date must be in the future
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized (Missing or invalid token).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: shortCode already exists, please change it
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/shorten",
  authMiddleware,
  createShortLinkValidator,
  createShortUrlHandle
);

/**
 * @swagger
 * /api/my-urls:
 *   get:
 *     summary: Retrieve all short links created by the logged in user
 *     tags: [ShortLinks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's short links
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully retrieved short URLs
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       short_code:
 *                         type: string
 *                         example: abc123
 *                       original_url:
 *                         type: string
 *                         format: uri
 *                         example: https://example.com
 *                       short_link:
 *                         type: string
 *                         format: uri
 *                         example: http://localhost:3000/abc123
 *                       expires_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-06-15T21:00:00.000Z"
 *                       click_count:
 *                         type: integer
 *                         example: 42
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-05-01T12:34:56.000Z"
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized (Missing or invalid token).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Erreur serveur lors de la récupération des liens courts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get("/my-urls", authMiddleware, getAllShortUrlByUser);


/**
 * @swagger
 * /api/shorten/:shortCode/stats:
 *   get:
 *     summary: Get statistics and clicks for a specific short link
 *     tags: [ShortLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shortCode
 *         in: path
 *         required: true
 *         description: The link's shortcode
 *         schema:
 *           type: string
 *           example: abc123
 *     responses:
 *       200:
 *         description: Short link statistics with click logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 short_code:
 *                   type: string
 *                   example: abc123
 *                 original_url:
 *                   type: string
 *                   format: uri
 *                   example: https://example.com
 *                 short_link:
 *                   type: string
 *                   format: uri
 *                   example: http://localhost:3000/abc123
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-06-30T23:59:59.000Z"
 *                 click_count:
 *                   type: integer
 *                   example: 10
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-05-01T12:34:56.000Z"
 *                 clicks:
 *                   type: array
 *                   description: Link click details
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "550e8400-e29b-41d4-a716-446655440000"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-05-08T14:23:11.000Z"
 *                       ip:
 *                         type: string
 *                         format: ipv4
 *                         example: "192.168.1.1"
 *                       user_agent:
 *                         type: string
 *                         example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
 *                       referer:
 *                         type: string
 *                         nullable: true
 *                         example: "https://google.com"
 *       401:
 *         description: Unauthorized (Missing or invalid token).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Short link not found or user cannot access it
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error while retrieving statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get("/shorten/:shortCode/stats", authMiddleware, getShortUrlStats);

export default router;
