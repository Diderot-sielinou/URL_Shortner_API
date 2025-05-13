import { query } from "../config/db.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import createError from "http-errors";
import dotenv from "dotenv";
import {
  getInformationAboutUser,
  loginUser,
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
