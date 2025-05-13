import { query } from "../config/db.js";

export async function createShortLink({
  shortCode,
  originalUrl,
  expires_at,
  userId,
  shortLink,
  click_count,
}) {
  const insertShortLinkQuery = `
  INSERT INTO short_links (short_code, original_url, expires_at, user_id,short_link,click_count)
  VALUES ($1, $2, $3, $4,$5,$6)
  RETURNING *;
                  `;

  const insertResult = await query(insertShortLinkQuery, [
    shortCode,
    originalUrl,
    expires_at,
    userId,
    shortLink,
    click_count,
  ]);

  return insertResult.rows[0];
}

export async function checkShortCode(shortCode) {
  const checkShortCodeQuery = `SELECT 1 FROM short_links WHERE short_code = $1`;
  const checkShortCodeResult = await query(checkShortCodeQuery, [shortCode]);
  return checkShortCodeResult.rows[0];
}

export async function getShortLinkInfo(shortCode) {
  const { rows } = await query(
    `SELECT original_url, expires_at FROM short_links WHERE short_code = $1`,
    [shortCode]
  );

  return rows;
}

export async function updateClinkCount(shortCode) {
  await query(
    `UPDATE short_links SET click_count = click_count + 1 WHERE short_code = $1`,
    [shortCode]
  );
}

export async function insertClinkLogs({ shortCode, ip, userAgent, referer }) {
  await query(
    `INSERT INTO click_logs (short_code, ip, user_agent, referer)
     VALUES ($1, $2, $3, $4)`,
    [shortCode, ip, userAgent, referer]
  );
}

export async function getAllShortURL(userId) {
  const allShortUrlQuery = `
  SELECT short_code, original_url, short_link, expires_at, click_count, created_at
  FROM short_links
  WHERE user_id = $1
  ORDER BY created_at DESC
`;
  const results = await query(allShortUrlQuery, [userId]);
  return {
    results:results.rows,
    count:results.rowCount
  }
}

export async function getUrlLog(shortCode,userId){
  const joinQuery = `
      SELECT 
        sl.short_code,
        sl.original_url,
        sl.short_link,
        sl.expires_at,
        sl.click_count,
        sl.created_at AS link_created_at,
        cl.id AS click_id,
        cl.timestamp AS click_timestamp,
        cl.ip,
        cl.user_agent,
        cl.referer
      FROM short_links sl
      LEFT JOIN click_logs cl ON sl.short_code = cl.short_code
      WHERE sl.short_code = $1 AND sl.user_id = $2
      ORDER BY cl.timestamp DESC;
    `;
    const { rows } = await query(joinQuery, [shortCode, userId]);
    return rows
}
