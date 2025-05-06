import { DateTime } from "luxon";
import { generateUniqueShortCode } from "../utils/generateUniqueShortCode.js";
import { query } from "../config/db.js";
import logger from "../utils/logger.js";
import dotenv from 'dotenv'
dotenv.config()

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

    const insertShortLinkQuery = `
                              INSERT INTO short_links (short_code, original_url, expires_at, user_id)
                              VALUES ($1, $2, $3, $4)
                              RETURNING *;
                                              `;

    const insertResult = await query(insertShortLinkQuery, [
      shortCode,
      originalUrl,
      expiresAt,
      userId,
    ]);
    if(insertResult.rows.length>0){
      logger.info(`Short URL created successfully for userId:${userId}`)
    }
    return res.status(201).json({
      message: "Short URL created successfully",
      shortUrl: `http://${process.env.HOSTNAME}:${process.env.PORT}/${shortCode}`,
      short_link:insertResult.rows[0]
    });
  } catch (error) {
    logger.error("Error while creating short URL:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
