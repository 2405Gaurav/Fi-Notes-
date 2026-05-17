import { z } from "zod";

// ─── Permission enum (mirrors Prisma SharePermission) ──

const permissionEnum = z.enum(["READ", "EDIT"], {
  error: "Permission must be either READ or EDIT",
});

// ─── POST /notes/:id/share ──────────────────

/**
 * Share note request body.
 * Requires a valid email and optional permission (defaults to READ).
 */
export const shareNoteSchema = z.object({
  share_with_email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Please enter a valid email address"),
  permission: permissionEnum.default("READ"),
});

// ─── PATCH /notes/:id/share/:sharedUserId ───

/**
 * Update permission request body.
 */
export const updatePermissionSchema = z.object({
  permission: permissionEnum,
});

// ─── Route params ───────────────────────────

/**
 * Validates note + sharedUser route params.
 */
export const shareParamsSchema = z.object({
  id: z.string().uuid("Invalid note ID"),
  sharedUserId: z.string().uuid("Invalid shared user ID"),
});

/** Inferred types */
export type ShareNoteInput = z.infer<typeof shareNoteSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type ShareParams = z.infer<typeof shareParamsSchema>;
