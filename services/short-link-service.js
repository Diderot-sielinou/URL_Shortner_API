import { DateTime } from "luxon";
import createError from "http-errors";
import dotenv from "dotenv";
dotenv.config();

import { generateUniqueShortCode } from "../utils/generateUniqueShortCode.js";
import logger from "../utils/logger.js";
import AppError from "../utils/AppError.js";
import {
  checkShortCode,
  createShortLink,
  getAllShortURL,
  getShortLinkInfo,
  getUrlLog,
  insertClinkLogs,
  updateClinkCount,
} from "../models/short-link-model.js";

export async function createShortUrl({
  shortCode,
  originalUrl,
  expires_at,
  userId,
}) {
  const click_count = 0;
  const formatWithTime = "dd/MM/yyyy HH:mm";
  const formatWithoutTime = "dd/MM/yyyy";
  let expiresAt;

  if (expires_at) {
    // convert to a js date in central africa time zone
    let jsDateExpiresAt = DateTime.fromFormat(expires_at, formatWithTime, {
      zone: "Africa/Lagos",
    });
    if (!jsDateExpiresAt.isValid) {
      jsDateExpiresAt = DateTime.fromFormat(expires_at, formatWithoutTime, {
        zone: "Africa/Lagos",
      });
    }
    if (jsDateExpiresAt < DateTime.now().setZone("Africa/Lagos")) {
      throw new AppError("Expiration date must be in the future", 400);
    }
    expiresAt = jsDateExpiresAt.toJSDate();
  } else {
    expiresAt = null;
  }

  if (!shortCode) {
    shortCode = await generateUniqueShortCode();
  }

  const shortCodeIsExist = await checkShortCode(shortCode);
  if (shortCodeIsExist) {
    throw new AppError("shortCode already exists, please change it", 409);
  }
  const shortLink = `${process.env.BASE_URL}/${shortCode}`;
  const insertResult = await createShortLink({
    shortCode,
    originalUrl,
    expires_at: expiresAt,
    userId,
    shortLink,
    click_count,
  });
  if (insertResult) {
    logger.info(`Short URL created successfully for userId:${userId}`);
  }

  return {
    shortUrl: `${process.env.BASE_URL}/${shortCode}`,
    shortCode: shortCode,
  };
}

export async function redirection({ shortCode, ip, userAgent, referer }) {
  const shortLinkInfo = await getShortLinkInfo(shortCode);
  if (shortLinkInfo.length === 0) {
    logger.info(`Short link not found for shortcode: ${shortCode}`);
    throw new AppError("Short link not found", 404);
  }

  const { original_url, expires_at } = shortLinkInfo[0];
  if (
    expires_at &&
    DateTime.fromJSDate(expires_at).setZone("Africa/Lagos") <
      DateTime.now().setZone("Africa/Lagos")
  ) {
    logger.info(`Short link expired: ${shortCode}`);
    logger.info(
      `Expiration date: ${DateTime.fromJSDate(expires_at)
        .setZone("Africa/Lagos")
        .toISO()}`
    );
    throw new AppError("Short link has expired", 410);
  }
  await updateClinkCount(shortCode);
  logger.info(`Click count incremented for shortcode: ${shortCode}`);
  await insertClinkLogs({ shortCode, ip, userAgent, referer });
  logger.info(`Metadata logged for shortcode: ${shortCode}`);
  logger.info(`Metadata ip:${ip},${userAgent},referen:${referer}`);

  return original_url;
}

export async function getAllCreateUrlByUser(userId) {
  return await getAllShortURL(userId);
}

export async function getUrlStats(shortCode, userId) {
  const rows = await getUrlLog(shortCode, userId);
  if (rows.length === 0) {
    throw new AppError("Short link not found or access denied", 404);
  }
  // Extraire les infos du lien et des clics
  const {
    short_code,
    original_url,
    short_link,
    expires_at,
    click_count,
    link_created_at,
  } = rows[0];

  const clicks = rows
    .filter((row) => row.click_id !== null)
    .map((row) => ({
      id: row.click_id,
      timestamp: row.click_timestamp,
      ip: row.ip,
      user_agent: row.user_agent,
      referer: row.referer,
    }));

  return {
    short_code,
    original_url,
    short_link,
    expires_at,
    click_count,
    created_at: link_created_at,
    clicks,
  };
}
