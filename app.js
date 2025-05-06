import express from'express';
import path,{dirname}  from'path';
import { fileURLToPath } from 'node:url';
import cookieParser from'cookie-parser';
import logger from'morgan';
import createError from 'http-errors'


import indexRouter from'./routes/index.js';
import usersRouter  from'./routes/users.js';

const app = express();
const __filename  = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

export default app;
