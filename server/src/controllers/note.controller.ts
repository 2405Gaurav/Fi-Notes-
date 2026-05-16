import type { Response, NextFunction } from "express";
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
} from "../validators/note.validator";
import * as noteService from "../services/note.service";
import { HTTP_STATUS } from "../constants";
import type { AuthRequest } from "../types";

// ─── POST /notes ────────────────────────────

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = createNoteSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Please provide a valid title and content.",
        errors,
      });
      return;
    }

    const note = await noteService.createNote(req.user!.userId, parsed.data);

    res.status(HTTP_STATUS.CREATED).json(note);
  } catch (err) {
    next(err);
  }
}

// ─── GET /notes ─────────────────────────────

export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = noteQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid query parameters",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await noteService.listNotes(req.user!.userId, parsed.data);

    res.status(HTTP_STATUS.OK).json(result.notes);
  } catch (err) {
    next(err);
  }
}

// ─── GET /notes/:id ─────────────────────────

export async function getById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const noteId = req.params.id as string;
    const note = await noteService.getNoteById(noteId, req.user!.userId);

    res.status(HTTP_STATUS.OK).json(note);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /notes/:id ─────────────────────────

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updateNoteSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors).flat()[0];
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: firstError || "Invalid note data. Please check your input.",
        errors,
      });
      return;
    }

    const noteId = req.params.id as string;
    const note = await noteService.updateNote(
      noteId,
      req.user!.userId,
      parsed.data
    );

    res.status(HTTP_STATUS.OK).json(note);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /notes/:id ──────────────────────

export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const noteId = req.params.id as string;
    await noteService.deleteNote(noteId, req.user!.userId);

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}
