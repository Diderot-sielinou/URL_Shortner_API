import express from "express";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import createError from "http-errors";
import swaggerUi from "swagger-ui-express";
import cors from'cors';

import swaggerSpec from "./swaggerConfig.js";
import winstonLogger from "./utils/logger.js";
import logger from './utils/logger.js'

import indexRouter from "./routes/index.js";
import authUserRouter from "./routes/auth-user.js";
import shortUrlRouter from "./routes/short-url.js";
import userRouter from './routes/user.js'

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, { stream: winstonLogger.stream }));


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("trust proxy", true);
// app.use(express.static(path.join(__dirname, 'public')));

app.use("/", indexRouter);
app.use("/api/auth/", authUserRouter);
app.use("/api/", shortUrlRouter);
app.use('/api/user/',userRouter)

app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  logger.error(err.stack); // journalise dans fichier ou conso
  // render the error message and status
  res.status(err.status || 500).json({
    status: err.status,
    message: err.message || "Internal server error" ,
  });
});

export default app;
