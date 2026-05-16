import type { Response, NextFunction } from "express";
import { shareNoteSchema } from "../validators/share.validator";
import { shareNote } from "../services/share.service";
import { HTTP_STATUS } from "../constants";
import type { AuthRequest } from "../types";

// ─── POST /notes/:id/share ──────────────────

export async function share(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = shareNoteSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Please enter a valid email address",
      });
      return;
    }

    const noteId = req.params.id as string;

    await shareNote(noteId, req.user!.userId, parsed.data);

    res.status(HTTP_STATUS.OK).json({
      message: "Note shared successfully",
    });
  } catch (err) {
    next(err);
  }
}
