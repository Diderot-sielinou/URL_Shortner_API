import express from'express';
import path,{dirname}  from'path';
import { fileURLToPath } from 'node:url';
import cookieParser from'cookie-parser';
import logger from'morgan';
import createError from 'http-errors'
import swaggerUi from "swagger-ui-express"


import swaggerSpec from './swaggerConfig.js';
import winstonLogger from "./utils/logger.js"

import indexRouter from'./routes/index.js';
import authUserRouter  from'./routes/auth-user.js';
import shortUrlRouter from './routes/short-url.js'


const app = express();
const __filename  = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const morganFormat = process.env.NODE_ENV === "production" ? "combined" : 'dev'
app.use(logger(morganFormat, { stream: winstonLogger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/auth/', authUserRouter);
app.use('/api/',shortUrlRouter)

app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // render the error message and status
  res.status(err.status || 500).json({
    status: err.status,
    message: err.message ,
  });
});

export default app;
