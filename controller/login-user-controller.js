import { query } from "../config/db.js"
import logger from "../utils/logger.js"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import createError from "http-errors";
import dotenv from "dotenv";
dotenv.config();


export async function loginUserHandle(req,res,next) {
  const {email,password}= req.body
  try {
    const findUserQuery= `SELECT id,first_name,last_name,email,password,adresse,phone,updated_at FROM users WHERE email=$1`
    const UserResult = await query(findUserQuery,[email])
    if(UserResult.rows.length === 0){
      logger.warn(`Login attempt failed: User not found - ${email}`)
      return next(createError(401,'Invalid Credentials'))
    }
    const User = UserResult.rows[0]

    const isPassswordMatch = await bcrypt.compare(password, User.password)

    if(!isPassswordMatch){
      logger.warn(`Login attempt failed: Incorrect password - ${email}`)
      return next(createError(401,"Invalid password")) 
    }

    const payload = {
      user: {
        id: User.id,
        email: User.email
      }
    }
    jwt.sign(payload, process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }, (err, token) => {
        if (err) {
          logger.error(`Error generating JWT for ${email}: `, err)
          throw new Error('Error generating authentication toke')
        }
        logger.info(`User logged in successfully: ${email} (ID: ${User.id})`)
        res.status(200).json({
          message: "Login Successfull!",
          token: token,
          User: {
            id: User.id,
            firstName: User.first_name,
            lastName: User.last_name,
            email: User.email,
            adresse:User.adresse,
            phone:User.phone,
            createdAt:User.updated_at
          }
        })
      })

  } catch (error) {
    logger.error(`Error during login process for ${email}: `, error)
    return next(createError(500,error.message || "Server error during login" ))

  }
}