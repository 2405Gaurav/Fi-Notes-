import dotenv from "dotenv";
dotenv.config();

/**
 * Centralized, validated configuration object.
 * Fails fast at startup if any required env var is missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  // Server
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction:
    process.env.NODE_ENV === "production" || process.env.RENDER === "true",

  // Database
  databaseUrl: requireEnv("DATABASE_URL"),

  // JWT
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
} as const;
