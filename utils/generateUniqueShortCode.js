import { query } from "../config/db";

const ALPHANUMERIC =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(length) {
  let result = "";
  const charsLength = ALPHANUMERIC.length;
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
}

export async function generateUniqueShortCode(
  min = 4,
  max = 10,
  maxAttempts = 10
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const length = Math.floor(Math.random() * (max - min + 1)) + min;
    const shortCode = randomString(length);
    const checkShortCodeQuery = `SELECT 1 FROM short_links WHERE short_code = $1`;
    const checkShortCodeResult = await query(checkShortCodeQuery, [shortCode]);
    if (checkShortCodeResult.rows.length === 0) {
      return shortCode;
    }
  }

  throw new Error(
    "Unable to generate a unique short code after multiple attempts"
  );
}
