import prisma from "../lib/prisma.js";
import { NoteError } from "./note.service.js";
import type { SharePermission } from "@prisma/client";
import type {
  ShareNoteInput,
  UpdatePermissionInput,
} from "../validators/share.validator.js";

// ═══════════════════════════════════════════════
//  Permission Helpers — reusable across services
// ═══════════════════════════════════════════════

/**
 * Returns the note if it exists and is not deleted.
 * Includes sharedWith data for permission checks.
 */
async function fetchNoteWithAccess(noteId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      ownerId: true,
      isDeleted: true,
      owner: { select: { email: true } },
      sharedWith: {
        select: {
          id: true,
          sharedWithUserId: true,
          permission: true,
          sharedWithUser: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!note || note.isDeleted) {
    throw new NoteError("Note not found", 404);
  }

  return note;
}

/** Check if the user is the note owner */
export function isOwner(noteOwnerId: string, userId: string): boolean {
  return noteOwnerId === userId;
}

/** Check if the user has at least READ access (owner OR shared) */
export function canReadNote(
  noteOwnerId: string,
  userId: string,
  sharedWith: { sharedWithUserId: string; permission: SharePermission }[]
): boolean {
  if (isOwner(noteOwnerId, userId)) return true;
  return sharedWith.some((s) => s.sharedWithUserId === userId);
}

/** Check if the user can edit (owner OR EDIT permission) */
export function canEditNote(
  noteOwnerId: string,
  userId: string,
  sharedWith: { sharedWithUserId: string; permission: SharePermission }[]
): boolean {
  if (isOwner(noteOwnerId, userId)) return true;
  return sharedWith.some(
    (s) => s.sharedWithUserId === userId && s.permission === "EDIT"
  );
}

// ═══════════════════════════════════════════════
//  SHARE NOTE
// ═══════════════════════════════════════════════

/**
 * Shares a note with another user by email.
 *
 * Rules:
 *  - Only the note owner can share
 *  - Cannot share with yourself
 *  - Cannot share a deleted note
 *  - Cannot share twice with the same user (409)
 *  - Recipient must be a registered user
 *  - Accepts optional permission (defaults to READ)
 */
export async function shareNote(
  noteId: string,
  ownerUserId: string,
  data: ShareNoteInput
): Promise<void> {
  const note = await fetchNoteWithAccess(noteId);

  if (!isOwner(note.ownerId, ownerUserId)) {
    throw new NoteError("Only the note owner can share this note", 403);
  }

  // Find the recipient user by email
  const recipient = await prisma.user.findUnique({
    where: { email: data.share_with_email },
    select: { id: true },
  });

  if (!recipient) {
    throw new NoteError("No user exists with this email", 404);
  }

  // Prevent sharing with yourself
  if (recipient.id === ownerUserId) {
    throw new NoteError("You cannot share a note with yourself", 400);
  }

  // Check for duplicate share
  const existingShare = await prisma.sharedNote.findUnique({
    where: {
      noteId_sharedWithUserId: {
        noteId: note.id,
        sharedWithUserId: recipient.id,
      },
    },
  });

  if (existingShare) {
    throw new NoteError("Note already shared with this user", 409);
  }

  // Create the share entry with specified permission
  await prisma.sharedNote.create({
    data: {
      noteId: note.id,
      sharedWithUserId: recipient.id,
      permission: data.permission ?? "READ",
    },
  });
}

// ═══════════════════════════════════════════════
//  UPDATE PERMISSION
// ═══════════════════════════════════════════════

/**
 * Updates the permission of a shared user on a note.
 * Only the note owner can update permissions.
 */
export async function updateSharePermission(
  noteId: string,
  sharedUserId: string,
  ownerUserId: string,
  data: UpdatePermissionInput
): Promise<void> {
  const note = await fetchNoteWithAccess(noteId);

  if (!isOwner(note.ownerId, ownerUserId)) {
    throw new NoteError(
      "Only the note owner can update sharing permissions",
      403
    );
  }

  // Find the share entry
  const share = await prisma.sharedNote.findUnique({
    where: {
      noteId_sharedWithUserId: {
        noteId: note.id,
        sharedWithUserId: sharedUserId,
      },
    },
  });

  if (!share) {
    throw new NoteError("Share entry not found for this user", 404);
  }

  // Update permission
  await prisma.sharedNote.update({
    where: { id: share.id },
    data: { permission: data.permission },
  });
}

// ═══════════════════════════════════════════════
//  REVOKE SHARING
// ═══════════════════════════════════════════════

/**
 * Revokes a user's access to a shared note.
 * Only the note owner can revoke sharing.
 */
export async function revokeShare(
  noteId: string,
  sharedUserId: string,
  ownerUserId: string
): Promise<void> {
  const note = await fetchNoteWithAccess(noteId);

  if (!isOwner(note.ownerId, ownerUserId)) {
    throw new NoteError("Only the note owner can revoke sharing", 403);
  }

  // Find the share entry
  const share = await prisma.sharedNote.findUnique({
    where: {
      noteId_sharedWithUserId: {
        noteId: note.id,
        sharedWithUserId: sharedUserId,
      },
    },
  });

  if (!share) {
    throw new NoteError("Share entry not found for this user", 404);
  }

  // Delete the share entry
  await prisma.sharedNote.delete({
    where: { id: share.id },
  });
}

// ═══════════════════════════════════════════════
//  GET COLLABORATORS (for share modal)
// ═══════════════════════════════════════════════

/**
 * Returns the list of users a note is shared with, plus the owner info.
 * Only accessible by the note owner.
 */
export async function getCollaborators(noteId: string, userId: string) {
  const note = await fetchNoteWithAccess(noteId);

  if (!isOwner(note.ownerId, userId)) {
    throw new NoteError("Only the note owner can view collaborators", 403);
  }

  return {
    owner: { email: note.owner.email },
    collaborators: note.sharedWith.map((s) => ({
      userId: s.sharedWithUserId,
      email: s.sharedWithUser.email,
      name: s.sharedWithUser.name,
      permission: s.permission,
    })),
  };
}
