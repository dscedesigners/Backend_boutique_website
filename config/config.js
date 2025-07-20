import dotenv from 'dotenv'
dotenv.config()

const config = {
  JWT_SECRET: process.env.JWT_SECRET || "jwt_secret_key", // Secret for signing JWT
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d", // Token expiry (eg 7 days)
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12//password hashing
}

export default config