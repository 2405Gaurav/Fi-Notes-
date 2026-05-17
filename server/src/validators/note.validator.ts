import { z } from "zod";

/**
 * Create note request body.
 * - `title`:   1–255 chars
 * - `content`: 1 char minimum (no upper limit — stored as TEXT)
 */
export const createNoteSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters"),

  content: z
    .string({ error: "Content is required" })
    .min(1, "Content is required"),
});

/**
 * Update note request body.
 * At least one field must be present; both are optional individually.
 */
export const updateNoteSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(255, "Title must be at most 255 characters")
      .optional(),

    content: z.string().min(1, "Content cannot be empty").optional(),

    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * Pagination + search query params.
 * Used by GET /notes and GET /search.
 */
export const noteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  deleted: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean()
  ).optional().default(false),
});

/** Inferred types */
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
