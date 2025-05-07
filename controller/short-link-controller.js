import { DateTime } from "luxon";
import { generateUniqueShortCode } from "../utils/generateUniqueShortCode.js";
import { query } from "../config/db.js";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

export async function createShortUrlHandle(req, res, next) {
  let { shortCode, originalUrl, expiresAtString } = req.body;
  const userId = req.user.id;
  const formatWithTime = "dd/MM/yyyy HH:mm";
  const formatWithoutTime = "dd/MM/yyyy";
  // convert to a js date in central africa time zone
  let jsDateExpiresAt = DateTime.fromFormat(expiresAtString, formatWithTime, {
    zone: "Africa/Lagos",
  });
  if (!jsDateExpiresAt.isValid) {
    jsDateExpiresAt = DateTime.fromFormat(expiresAtString, formatWithoutTime, {
      zone: "Africa/Lagos",
    });
  }
  if (jsDateExpiresAt < DateTime.now().setZone("Africa/Lagos")) {
    return res
      .status(400)
      .json({ error: "Expiration date must be in the future" });
  }
  const expiresAt = jsDateExpiresAt.toJSDate();
  if (!shortCode) {
    shortCode = await generateUniqueShortCode();
  }
  try {
    const checkShortCodeQuery = `SELECT 1 FROM short_links WHERE short_code = $1`;
    const checkShortCodeResult = await query(checkShortCodeQuery, [shortCode]);
    if (checkShortCodeResult.rows.length > 0) {
      return res.status(409).json({
        message: "shortCode already exists, please change it",
      });
    }

    const shortLink = `http://${process.env.HOSTNAME}:${process.env.PORT}/${shortCode}`

    const insertShortLinkQuery = `
                              INSERT INTO short_links (short_code, original_url, expires_at, user_id,short_link)
                              VALUES ($1, $2, $3, $4,$5)
                              RETURNING *;
                                              `;

    const insertResult = await query(insertShortLinkQuery, [
      shortCode,
      originalUrl,
      expiresAt,
      userId,
      shortLink
    ]);
    if (insertResult.rows.length > 0) {
      logger.info(`Short URL created successfully for userId:${userId}`);
    }
    return res.status(201).json({
      message: "Short URL created successfully",
      shortUrl: `http://${process.env.HOSTNAME}:${process.env.PORT}/${shortCode}`,
    });
  } catch (error) {
    logger.error("Error while creating short URL:", error);
    return res.status(500).json({ error:error.message || "Internal server error" });
  }
}

export async function redirectionShortCodeHandle(req, res, next) {
  const shortCode = req.params.shortCode;

  try {

    const { rows } = await query(
      `SELECT original_url, expires_at FROM short_links WHERE short_code = $1`,
      [shortCode]
    );

    if (rows.length === 0) {
      logger.info(`Short link not found for shortcode: ${shortCode}`);
      return res.status(404).json({ message: "Short link not found" });
    }

    const { original_url, expires_at } = rows[0];

   
    if (expires_at && DateTime.fromJSDate(expires_at).setZone("Africa/Lagos") < DateTime.now().setZone("Africa/Lagos")) {
      logger.info(`Short link expired: ${shortCode}`);
      logger.info(`Expiration date: ${DateTime.fromJSDate(expires_at).setZone("Africa/Lagos").toISO()}`);
      return res.status(410).json({ message: "Short link has expired" });
    }

   
    await query(
      `UPDATE short_links SET click_count = click_count + 1 WHERE short_code = $1`,
      [shortCode]
    );
    logger.info(`Click count incremented for shortcode: ${shortCode}`);

    await query(
      `INSERT INTO click_logs (short_code, ip, user_agent, referer)
       VALUES ($1, $2, $3, $4)`,
      [
        shortCode,
        req.ip,
        req.headers["user-agent"],
        req.headers["referer"] || "direct"
      ]
    );
    logger.info(`Metadata logged for shortcode: ${shortCode}`);
    logger.info(`Metadata ip:${req.ip},${req.headers["user-agent"]},referen:${req.headers["referer"] || "direct"}`)

  
    return res.redirect(301, original_url);

  } catch (error) {
    logger.error(`Redirection error for shortcode ${shortCode}:`, error);
    return res
      .status(error.status || 500)
      .json({ message: "Server error during redirection" });
  }
}

export async function getAllShortUrlByUser(req, res, next) {
  const userId = req.user.id;
  try {
    const allShortUrlQuery = `
      SELECT short_code, original_url, short_link, expires_at, click_count, created_at
      FROM short_links
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const results = await query(allShortUrlQuery, [userId]);
    logger.info(`Fetched all short URLs created by user: ${userId}`);
    return res.status(200).json({
      message: "Successfully retrieved short URLs",
      results: results.rows,
      count:results.rowCount
    });

  } catch (error) {
    logger.error(`Error fetching short URLs for user ${userId}:`, error);
    return res.status(500).json({
      message: "Server error while fetching short URLs",
    });
  }
}


