import type { Response, NextFunction } from "express";
import { searchQuerySchema } from "../validators/search.validator.js";
import { searchNotes } from "../services/search.service.js";
import { HTTP_STATUS } from "../constants/index.js";
import type { AuthRequest } from "../types/index.js";

// ─── GET /search?q=keyword ──────────────────

export async function search(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Please provide a search query.",
        errors,
      });
      return;
    }

    const result = await searchNotes(req.user!.userId, parsed.data);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}
