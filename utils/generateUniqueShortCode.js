
const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(length) {
  let result = "";
  const charsLength = ALPHANUMERIC.length;
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
}

export async function generateUniqueShortCode(min = 4, max = 10) {
  let shortCode;
try {
    const length = Math.floor(Math.random() * (max - min + 1)) + min;
    shortCode = randomString(length);
  return shortCode;
} catch (error) {
  throw new Error("Unable to generate a unique short ",error.message);
}
 
}
