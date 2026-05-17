import type { Response, NextFunction } from "express";
import { verifyToken } from "../utils/index.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";

/**
 * Express middleware that protects routes behind JWT authentication.
 *
 * Expects: `Authorization: Bearer <token>`
 *
 * On success → attaches `{ userId, email }` to `req.user` and calls `next()`.
 * On failure → responds 401 immediately.
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Access denied. No token provided.",
    });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Invalid or expired token",
    });
  }
}
