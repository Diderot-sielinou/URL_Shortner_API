import { query } from "../config/db.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";
import createError from "http-errors";


const HASH_SALT = 10;

export async function registerUserHandle(req, res, next) {
  const { firstName, lastName, email, password, adresse, phone } = req.body;
  try {
    const checkUserQuery = `SELECT email FROM users WHERE email = $1`;
    const checkUserResult = await query(checkUserQuery, [email]);
    if (checkUserResult.rows.length >  0) {
      logger.warn(
        `Registrationg attempt failed: Email already exists - ${email}`
      );
      return next(createError(409,"Email already in use"))
    }
    const passwordHash = await bcrypt.hash(password, HASH_SALT);
    logger.debug(`Password hashed for email: ${email}`);

    const insertUsersql = `INSERT INTO users (first_name, last_name, email, password,adresse,phone) 
                        VALUES($1,$2,$3,$4,$5,$6)
                        RETURNING id`;
    const newUserResult = await query(insertUsersql, [
      firstName,
      lastName,
      email,
      passwordHash,
      adresse,
      phone,
    ]);

    const newUser = newUserResult.rows[0];
    logger.info(`client registered successfully: ${newUser.id}`);

    return res.status(201).json({
      message: "client registered successfully",
      userId: {
        id: newUser.id,
      },
    });
  } catch (error) {
    logger.error(`Error during client registration for ${email}: `, error);
    next(createError(error.status,"Error during client registration"));
  }
}
