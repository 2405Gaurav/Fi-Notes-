import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthError } from "../services/auth.service.js";
import { NoteError } from "../services/note.service.js";
import { HTTP_STATUS } from "../constants/index.js";

/**
 * Global error-handling middleware.
 *
 * Catches all errors forwarded via `next(err)` and sends a structured
 * JSON response with the appropriate HTTP status code.
 *
 * Handles:
 * - AuthError / NoteError → custom status code
 * - ZodError              → 400 with field-level details
 * - JWT errors            → 401
 * - Prisma errors         → 400 / 409 / 500 depending on code
 * - Everything else       → 500
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Known service errors (AuthError, NoteError) ──
  if (err instanceof AuthError || err instanceof NoteError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // ── Zod validation errors ─────────────────
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: firstError || "Invalid input. Please check your data.",
      errors: fieldErrors,
    });
    return;
  }

  // ── JWT errors ────────────────────────────
  if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError" ||
    err.name === "NotBeforeError"
  ) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Invalid or expired token",
    });
    return;
  }

  // ── Prisma known errors ───────────────────
  if (err.constructor?.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as Error & { code: string; meta?: Record<string, unknown> };

    switch (prismaErr.code) {
      case "P2002": // Unique constraint violation
        res.status(HTTP_STATUS.CONFLICT).json({
          message: "A record with that value already exists",
        });
        return;
      case "P2025": // Record not found
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Record not found",
        });
        return;
      case "P2007": // Invalid input value (e.g. bad UUID format)
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Note not found",
        });
        return;
      default:
        break;
    }
  }

  if (err.constructor?.name === "PrismaClientValidationError") {
    // Invalid UUID format in path params → treat as "not found"
    if (err.message?.includes("Uuid") || err.message?.includes("uuid") || err.message?.includes("Invalid value")) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Note not found",
      });
      return;
    }
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: "Invalid data provided",
    });
    return;
  }

  // ── Fallback ──────────────────────────────
  console.error("Unhandled error:", err);

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error",
  });
}
