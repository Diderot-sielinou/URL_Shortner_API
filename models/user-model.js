import { query } from "../config/db.js";

export async function findUserByEmail(email) {
  const checkUserQuery = `SELECT email FROM users WHERE email = $1`;
  const checkUserResult = await query(checkUserQuery, [email]);
  console.log("email",checkUserResult.rows[0])
  return checkUserResult.rows[0];
}

export async function createUser({
  firstName,
  lastName,
  email,
  password,
  adresse,
  phone,
}) {
  const insertUsersql = `INSERT INTO users (first_name, last_name, email, password,adresse,phone) 
  VALUES($1,$2,$3,$4,$5,$6)
  RETURNING id`;
  const newUserResult = await query(insertUsersql, [
    firstName,
    lastName,
    email,
    password,
    adresse,
    phone,
  ]);

  return newUserResult.rows[0];
}

export async function createGoogleUser({
  firstName,
  lastName,
  email,
  picture,
}) {
  const insertUsersql = `INSERT INTO users (first_name, last_name, email, profile_image_url,auth_provider) 
  VALUES($1,$2,$3,$4,$5)
  RETURNING *`;
  const newUserResult = await query(insertUsersql, [
    firstName,
    lastName,
    email,
    picture,
    "google"
  ]);

  return newUserResult.rows[0];
}



export async function getUserInfoByEmail(email) {
  const findUserQuery = `SELECT id,first_name,last_name,email,password,adresse,phone,created_at,updated_at FROM users 
                         WHERE email=$1`;
  const UserResult = await query(findUserQuery, [email]);
  return UserResult.rows[0];
}

export async function getUserInfoByUserId(userId) {
  const getUserInfoQuery = `
                          SELECT first_name, last_name, email, adresse, phone, profile_image_url 
                          FROM users 
                          WHERE id = $1
                                         `;
  const getInfoResults = await query(getUserInfoQuery, [userId]);
  return getInfoResults.rows[0];
}


