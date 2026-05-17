import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import type { JwtPayload } from "../types/index.js";

/**
 * Sign a JWT containing `{ userId, email }`.
 * Expiry is read from `config.jwtExpiresIn` (default "7d").
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verify and decode a JWT.
 * Throws if the token is expired, malformed, or the signature is invalid.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
