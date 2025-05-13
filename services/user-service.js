import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { promisify } from "node:util";
import {
  createUser,
  findUserByEmail,
  getUserInfoByEmail,
  getUserInfoByUserId,
} from "../models/user-model.js";
import logger from "../utils/logger.js";
import AppError from "../utils/AppError.js";
import createError from "http-errors";
import {
  getInformationAboutUserHandle,
  loginUserHandle,
} from "../controller/user-controller.js";

export async function registerUser({
  firstName,
  lastName,
  email,
  password,
  adresse,
  phone,
}) {
  const HASH_SALT = 10;
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    logger.warn(
      `Registrationg attempt failed: Email already exists - ${email}`
    );
    throw new AppError("Email already in use", 409);
  }
  const passwordHash = await bcrypt.hash(password, HASH_SALT);
  logger.debug(`Password hashed for email: ${email}`);
  const newUser = await createUser({
    firstName,
    lastName,
    email,
    password: passwordHash,
    adresse,
    phone,
  });
  return newUser;
}

const signJwt = promisify(jwt.sign);

export async function loginUser({ email, password }) {
  const user = await getUserInfoByEmail(email);
  if (!user) {
    logger.warn(`Login attempt failed: User not found - ${email}`);
    throw new AppError("Invalid Credentials", 401);
  }
  const isPassswordMatch = await bcrypt.compare(password, user.password);
  if (!isPassswordMatch) {
    logger.warn(`Login attempt failed: Incorrect password - ${email}`);
    throw new AppError("Invalid password", 401);
  }

  const payload = {
    user: {
      id: user.id,
      email: user.email,
    },
  };
  let token;
  try {
    token = await signJwt(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  } catch (err) {
    logger.error(`Error generating JWT for ${email}: `, err);
    throw new AppError("Error generating authentication toke", 500);
  }

  return {
    token,
    User: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      adresse: user.adresse,
      phone: user.phone,
      createdAt: user.updated_at,
    },
  };
}

export async function getInformationAboutUser(userId) {
  if (!userId) {
    logger.warn("userId missing from request");
    throw new AppError("Invalid request: user ID missing", 400);
  }
  const infos = await getUserInfoByUserId(userId);
  return infos;
}
