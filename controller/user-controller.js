import { query } from "../config/db.js";
import logger from "../utils/logger.js";
export async function getInformationAboutUserHandle(req, res) {
  const userId = req.user?.id;

  if (!userId) {
    logger.warn("userId missing from request");
    return res
      .status(400)
      .json({ message: "Invalid request: user ID missing" });
  }
  try {
    const getUserInfoQuery = `
      SELECT first_name, last_name, email, adresse, phone, profile_image_url 
      FROM users 
      WHERE id = $1
    `;
    const getInfoResults = await query(getUserInfoQuery, [userId]);

    if (getInfoResults.rows.length === 0) {
      logger.info(`User with ID ${userId} not found in database`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Successfully retrieved information for user ID: ${userId}`);

    return res.status(200).json({
      message: "Successfully retrieved user information",
      results: getInfoResults.rows[0],
    });
  } catch (error) {
    logger.error("Error while getting user information:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
