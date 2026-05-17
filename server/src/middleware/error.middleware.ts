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
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestError = err as Error & {
    type?: string;
    status?: number;
    body?: unknown;
  };

  if (
    requestError.type === "entity.parse.failed" ||
    (requestError.name === "SyntaxError" && requestError.body !== undefined)
  ) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: "Invalid JSON payload",
    });
    return;
  }

  if (err instanceof AuthError || err instanceof NoteError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: firstError || "Invalid input. Please check your data.",
      errors: fieldErrors,
    });
    return;
  }

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

  if (err.constructor?.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as Error & {
      code: string;
      meta?: Record<string, unknown>;
    };

    switch (prismaErr.code) {
      case "P2002":
        res.status(HTTP_STATUS.CONFLICT).json({
          message: "A record with that value already exists",
        });
        return;
      case "P2025":
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Record not found",
        });
        return;
      case "P2007":
        res.status(HTTP_STATUS.NOT_FOUND).json({
          message: "Note not found",
        });
        return;
      default:
        break;
    }
  }

  if (err.constructor?.name === "PrismaClientValidationError") {
    if (
      err.message?.includes("Uuid") ||
      err.message?.includes("uuid") ||
      err.message?.includes("Invalid value")
    ) {
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

  console.error("Unhandled error:", err);
  console.error("Unhandled error name:", err.name);
  console.error("Unhandled error message:", err.message);
  console.error("Unhandled error stack:", err.stack);

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error",
  });
}
