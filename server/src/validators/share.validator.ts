import { z } from "zod";

/**
 * Share note request body.
 * Requires a valid email of the user to share with.
 */
export const shareNoteSchema = z.object({
  share_with_email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Invalid email address"),
});

/** Inferred type */
export type ShareNoteInput = z.infer<typeof shareNoteSchema>;
