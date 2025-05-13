import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();
import {
  createShortUrl,
  getAllCreateUrlByUser,
  getUrlStats,
  redirection,
} from "../services/short-link-service.js";

export async function createShortUrlHandle(req, res, next) {
  const { shortCode, originalUrl, expires_at } = req.body;
  const userId = req.user.id;
  try {
    const shortLinkInfo = await createShortUrl({
      shortCode,
      originalUrl,
      expires_at,
      userId,
    });
    return res.status(201).json({
      message: "Short URL created successfully",
      ...shortLinkInfo,
    });
  } catch (error) {
    logger.error("Error while creating short URL:", error);
    next(error);
  }
}

export async function redirectionShortCodeHandle(req, res, next) {
  const shortCode = req.params.shortCode;
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];
  const referer = req.headers["referer"] || "direct";
  try {
    const original_url = await redirection({
      shortCode,
      ip,
      userAgent,
      referer,
    });
    return res.redirect(301, original_url);
  } catch (error) {
    logger.error(`Redirection error for shortcode ${shortCode}:`, error);
    return next(error);
  }
}

export async function getAllShortUrlByUser(req, res, next) {
  const userId = req.user.id;
  try {
    const results = await getAllCreateUrlByUser(userId);
    logger.info(`Fetched all short URLs created by user: ${userId}`);
    return res.status(200).json({
      message: "Successfully retrieved short URLs",
      ...results,
    });
  } catch (error) {
    logger.error(`Error fetching short URLs for user ${userId}:`, error);
    return next(error);
  }
}

export async function getShortUrlStats(req, res, next) {
  const shortCode = req.params.shortCode;
  const userId = req.user.id;
  try {
    const urlStats = await getUrlStats(shortCode, userId);

    return res.status(200).json({ ...urlStats });
  } catch (error) {
    logger.error(
      `Error getting short link info for ${shortCode}: ${error.message}`
    );
    return next(error);
  }
}
