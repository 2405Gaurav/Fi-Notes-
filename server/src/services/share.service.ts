import prisma from "../lib/prisma";
import { NoteError } from "./note.service";
import type { ShareNoteInput } from "../validators/share.validator";

// ─── SHARE NOTE ──────────────────────────────

/**
 * Shares a note with another user by email.
 *
 * Rules:
 *  - Only the note owner can share
 *  - Cannot share with yourself
 *  - Cannot share a deleted note
 *  - Cannot share twice with the same user (409)
 *  - Recipient must be a registered user
 *  - Default permission: READ
 */
export async function shareNote(
  noteId: string,
  ownerUserId: string,
  data: ShareNoteInput
): Promise<void> {
  // 1. Fetch the note and verify ownership
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, ownerId: true, isDeleted: true },
  });

  if (!note || note.isDeleted) {
    throw new NoteError("Note not found", 404);
  }

  if (note.ownerId !== ownerUserId) {
    throw new NoteError("You are not authorized to share this note", 403);
  }

  // 2. Find the recipient user by email
  const recipient = await prisma.user.findUnique({
    where: { email: data.share_with_email },
    select: { id: true },
  });

  if (!recipient) {
    throw new NoteError("User not found", 404);
  }

  // 3. Prevent sharing with yourself
  if (recipient.id === ownerUserId) {
    throw new NoteError("You cannot share a note with yourself", 400);
  }

  // 4. Check for duplicate share
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

  // 5. Create the share entry (default permission: READ)
  await prisma.sharedNote.create({
    data: {
      noteId: note.id,
      sharedWithUserId: recipient.id,
      // permission defaults to READ via schema
    },
  });
}
