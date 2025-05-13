import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import createError from "http-errors";

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    logger.warn(`Auth middleware: no token provided`);
    return next(createError(401, "No token, authorication has been denied"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    logger.debug(`Auth middleware: Token verified for user ID ${req.user.id}`);
    next();
  } catch (error) {
    logger.error("Auth iddleware: token verification failed", error);
    if (error.name === "TokenExpiredError") {
      return next(createError(401, "Token is expired"));
    }
    if (error.name === "JsonWebTokenError") {
      return next(createError(401, "Token is not valid"));
    }
    return next(
      createError(
        error.status || 500,
        error.message || "server error during token verification"
      )
    );
  } finally {
  }
};

export default authMiddleware;
