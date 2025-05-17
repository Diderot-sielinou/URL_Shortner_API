import { OAuth2Client } from 'google-auth-library';
import AppError from '../utils/AppError.js'
import logger from './logger.js';
import dotenv from 'dotenv'
dotenv.config()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleIdToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Assure que le token est destiné à ton app
    });

    const payload = ticket.getPayload(); // contient email, name, picture, sub, etc.
    return payload;
  } catch (error) {
    logger.error('Erreur de vérification du token Google :', error);
    throw new AppError("Échec de la vérification du token Google", 401);
  }
}
