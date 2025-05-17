import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { promisify } from "node:util";
import {
  createGoogleUser,
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
import { verifyGoogleIdToken } from "../utils/verifyGoogleIdToken.js";
import dotenv from "dotenv";

dotenv.config();

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
      createdAt: user.created_at,
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

export async function loginUserByGoogle(code) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

  if (!GOOGLE_CLIENT_ID) {
    logger.warn(`missing GOOGLE_CLIENT_ID check your env file `);
    throw new AppError("missing GOOGLE_CLIENT_ID in environment");
  }

  if (!GOOGLE_CLIENT_SECRET) {
    logger.warn(`missing GOOGLE_CLIENT_SECRET check your env file `);
    throw new AppError("missing GOOGLE_CLIENT_SECRET in environment");
  }

  const GOOGLE_REDIRECT_URI =
    process.env.NODE_ENV === "development"
      ? process.env.LOCAL_REDIRECT_URI
      : process.env.PRODUCTION_REDIRECT_URI;
  if (!GOOGLE_REDIRECT_URI) {
    logger.warn(`missing GOOGLE_REDIRECT_URI check your env file `);
    throw new AppError("missing GOOGLE_REDIRECT_URI in environment");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();
  const idToken = tokenData.id_token;

  if (!idToken) throw new AppError("Échec de l'authentification", 401);

  //  verifi l'id_token avec la cle secret de google
  const payload = await verifyGoogleIdToken(idToken);

  const { email, name, sub, picture, family_name } = payload;

  const user = await getUserInfoByEmail(email);
  // 👤 Créer un nouvel utilisateur si inexistant
  if (!user) {
    const newUser = await createGoogleUser({
      firstName: name,
      lastName: family_name,
      email: email,
      picture: picture,
    });

    const localPayload = {
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };
    let token;
    try {
      token = await signJwt(localPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });
    } catch (err) {
      logger.error(`Error generating JWT for ${email}: `, err);
      throw new AppError("Error generating authentication toke", 500);
    }

    logger.info(`User logged in successfully: ${newUser.email} (ID: ${newUser.id})`);

    return {
      token,
      User: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        adresse: newUser.adresse,
        phone: newUser.phone,
        createdAt: newUser.created_at,
      },
    };
  }

  const localPayload = {
    user: {
      id: user.id,
      email: user.email,
    },
  };

  let token;
  try {
    token = await signJwt(localPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  } catch (err) {
    logger.error(`Error generating JWT for ${email}: `, err);
    throw new AppError("Error generating authentication toke", 500);
  }

  logger.info(`User logged in successfully: ${user.email} (ID: ${user.id})`);

  return {
    token,
    User: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      adresse: user.adresse,
      phone: user.phone,
      createdAt: user.created_at,
    },
  };
}
