import type { Response, NextFunction } from "express";
import {
  shareNoteSchema,
  updatePermissionSchema,
  shareParamsSchema,
} from "../validators/share.validator";
import {
  shareNote,
  updateSharePermission,
  revokeShare,
  getCollaborators,
} from "../services/share.service";
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
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Please enter a valid email address",
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

// ─── PATCH /notes/:id/share/:sharedUserId ───

export async function updatePermission(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate route params
    const paramsParsed = shareParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      const firstError = Object.values(
        paramsParsed.error.flatten().fieldErrors
      ).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Invalid route parameters",
      });
      return;
    }

    // Validate body
    const bodyParsed = updatePermissionSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const firstError = Object.values(
        bodyParsed.error.flatten().fieldErrors
      ).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Permission must be either READ or EDIT",
      });
      return;
    }

    const { id: noteId, sharedUserId } = paramsParsed.data;

    await updateSharePermission(
      noteId,
      sharedUserId,
      req.user!.userId,
      bodyParsed.data
    );

    res.status(HTTP_STATUS.OK).json({
      message: "Permission updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /notes/:id/share/:sharedUserId ──

export async function revoke(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const paramsParsed = shareParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      const firstError = Object.values(
        paramsParsed.error.flatten().fieldErrors
      ).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Invalid route parameters",
      });
      return;
    }

    const { id: noteId, sharedUserId } = paramsParsed.data;

    await revokeShare(noteId, sharedUserId, req.user!.userId);

    res.status(HTTP_STATUS.OK).json({
      message: "Access revoked successfully",
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /notes/:id/collaborators ───────────

export async function collaborators(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const noteId = req.params.id as string;
    const result = await getCollaborators(noteId, req.user!.userId);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}
