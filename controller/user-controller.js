import logger from "../utils/logger.js";

import dotenv from "dotenv";
import {
  getInformationAboutUser,
  loginUser,
  loginUserByGoogle,
  registerUser,
} from "../services/user-service.js";
dotenv.config();

export async function registerUserHandle(req, res, next) {
  const { firstName, lastName, email, password, adresse, phone } = req.body;
  try {
    const newUser = await registerUser({
      firstName,
      lastName,
      email,
      password,
      adresse,
      phone,
    });
    logger.info(`client registered successfully: ${newUser.id}`);
    return res.status(201).json({
      message: "client registered successfully",
      userId: {
        id: newUser.id,
      },
    });
  } catch (error) {
    logger.error(`Error during client registration for ${email}: `, error);
    next(error);
  }
}

export async function loginUserHandle(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await loginUser({ email, password });
    logger.info(`User logged in successfully: ${email} (ID: ${user.id})`);
    res.status(200).json({
      message: "Login Successfull!",
      ...user,
    });
  } catch (error) {
    logger.error(`Error during login process for ${email}: `, error);
    next(error);
  }
}

export async function getInformationAboutUserHandle(req, res, next) {
  const userId = req.user?.id;
  try {
    const results = await getInformationAboutUser(userId);
    logger.info(`Successfully retrieved information for user ID: ${userId}`);
    return res.status(200).json({
      message: "Successfully retrieved user information",
      results,
    });
  } catch (error) {
    logger.error("Error while getting user information:", error);
    return next(error);
  }
}

export async function redirectionToGoogleHandle(req, res, next) {
  const { GOOGLE_CLIENT_ID } = process.env;
  if (!GOOGLE_CLIENT_ID) {
    logger.warn(`missing GOOGLE_CLIENT_ID check your env file `);
    return;
  }
  const GOOGLE_REDIRECT_URI =
    process.env.NODE_ENV === "development"
      ? process.env.LOCAL_REDIRECT_URI
      : process.env.PRODUCTION_REDIRECT_URI;
  if (!GOOGLE_REDIRECT_URI) {
    logger.warn(`missing GOOGLE_REDIRECT_URI check your env file `);
    return;
  }
  try {
    const redirectUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    redirectUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    redirectUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    redirectUrl.searchParams.set("response_type", "code");
    redirectUrl.searchParams.set("scope", "openid email profile");
    redirectUrl.searchParams.set("access_type", "offline");
    redirectUrl.searchParams.set("prompt", "select_account");

    res.redirect(redirectUrl.toString());
    logger.info(`successfully redirect to google auth`);
  } catch (error) {
    logger.info(`error occurred while redirecting to google oauth2`);
    next(error);
  }
}

export async function loginUserByGoogleHandle(req, res, next) {
  const code = req.query.code;

  if (!code) {
    logger.warn("Missing Google Redirect Code.");
    return res
      .status(400)
      .json({ message: "Missing Google authorization code." });
  }

  try {
    const authToken = await loginUserByGoogle(code);
    res.redirect(
      `https://short-link-front-production.up.railway.app/login-success?token=${authToken}`
    );
  } catch (error) {
    logger.error("Error during Google login process:", error);
    next(error);
  }
}
