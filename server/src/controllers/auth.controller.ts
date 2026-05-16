import type { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { registerUser, loginUser, AuthError } from "../services/auth.service";
import { HTTP_STATUS } from "../constants";

// ─── POST /auth/register ────────────────────

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);//it will check against the zod schemaa here

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      // Extract the first field error for a user-friendly message
      const firstError = Object.values(errors).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Invalid registration details. Please check your input.",
        errors,
      });
      return;
    }

    await registerUser(parsed.data);

    res.status(HTTP_STATUS.CREATED).json({
      message: "User registered successfully",
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/login ───────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Invalid credentials format. Please check your input.",
        errors,
      });
      return;
    }

    const result = await loginUser(parsed.data);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}
