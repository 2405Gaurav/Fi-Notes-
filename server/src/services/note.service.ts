import prisma from "../lib/prisma";
import { PAGINATION } from "../constants";
import { isOwner, canEditNote } from "./share.service";
import type {
  CreateNoteInput,
  UpdateNoteInput,
  NoteQueryInput,
} from "../validators/note.validator";

// ─── Custom error for note operations ────────

export class NoteError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "NoteError";
  }
}

// ─── Response shape (strip internal fields) ──

/** Fields returned to the client — matches assignment spec */
const noteSelect = {
  id: true,
  title: true,
  content: true,
  isPinned: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
} as const;

/** Extended select that includes sharing metadata for list/detail views */
const noteSelectWithSharing = {
  ...noteSelect,
  owner: {
    select: { email: true, name: true },
  },
  sharedWith: {
    select: {
      sharedWithUserId: true,
      permission: true,
      sharedWithUser: {
        select: { email: true, name: true },
      },
    },
  },
} as const;

// ─── Helpers: format response with sharing context ──

function formatNoteResponse(
  note: any,
  userId: string
) {
  const isNoteOwner = note.ownerId === userId;

  // Build sharing info
  const sharedBy = !isNoteOwner && note.owner
    ? { email: note.owner.email, name: note.owner.name }
    : null;

  const sharedWith = isNoteOwner && note.sharedWith
    ? note.sharedWith.map((s: any) => ({
        userId: s.sharedWithUserId,
        email: s.sharedWithUser.email,
        name: s.sharedWithUser.name,
        permission: s.permission,
      }))
    : [];

  // The user's own permission on this note
  let permission: string = "OWNER";
  if (!isNoteOwner && note.sharedWith) {
    const share = note.sharedWith.find(
      (s: any) => s.sharedWithUserId === userId
    );
    permission = share?.permission ?? "READ";
  }

  return {
    id: note.id,
    title: note.title,
    content: note.content,
    isPinned: note.isPinned,
    isArchived: note.isArchived,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    ownerId: note.ownerId,
    permission,
    sharedBy,
    sharedWith,
  };
}

// ─── CREATE ──────────────────────────────────

export async function createNote(userId: string, data: CreateNoteInput) {
  const note = await prisma.note.create({
    data: {
      title: data.title,
      content: data.content,
      ownerId: userId,
    },
    select: noteSelect,
  });

  return { ...note, permission: "OWNER", sharedBy: null, sharedWith: [] };
}

// ─── LIST (owned + shared, non-deleted, paginated) ──

export async function listNotes(userId: string, query: NoteQueryInput) {
  const page = query.page ?? PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    query.limit ?? PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  // Base filter: (owned OR shared-with-me) AND not deleted
  const accessFilter = [
    { ownerId: userId },
    { sharedWith: { some: { sharedWithUserId: userId } } },
  ];

  const where: Record<string, unknown> = {
    isDeleted: false,
    OR: accessFilter,
  };

  // Optional text search — AND-ed with the access filter
  if (query.search) {
    where.AND = [
      {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { content: { contains: query.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      select: noteSelectWithSharing,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.note.count({ where }),
  ]);

  return {
    notes: notes.map((n) => formatNoteResponse(n, userId)),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── GET BY ID (owner OR shared user) ────────

export async function getNoteById(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      ...noteSelectWithSharing,
      isDeleted: true,
    },
  });

  if (!note || note.isDeleted) {
    throw new NoteError("Note not found", 404);
  }

  // Check access: owner or shared user (READ or EDIT)
  const noteOwner = isOwner(note.ownerId, userId);
  const isShared = note.sharedWith.some(
    (s) => s.sharedWithUserId === userId
  );

  if (!noteOwner && !isShared) {
    throw new NoteError("You do not have access to this note", 403);
  }

  const { isDeleted, ...noteData } = note;
  return formatNoteResponse(noteData, userId);
}

// ─── UPDATE (owner + EDIT users, with version snapshot) ──

export async function updateNote(
  noteId: string,
  userId: string,
  data: UpdateNoteInput
) {
  // Fetch current note for permission check + version snapshot
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      content: true,
      ownerId: true,
      isDeleted: true,
      sharedWith: {
        select: {
          sharedWithUserId: true,
          permission: true,
        },
      },
      versions: {
        select: { version: true },
        orderBy: { version: "desc" as const },
        take: 1,
      },
    },
  });

  if (!existing || existing.isDeleted) {
    throw new NoteError("Note not found", 404);
  }

  // Owner OR EDIT-permissioned users can update
  if (!canEditNote(existing.ownerId, userId, existing.sharedWith)) {
    throw new NoteError(
      "You do not have permission to edit this note",
      403
    );
  }

  // EDIT users can only change title and content, not pin/archive/etc.
  if (!isOwner(existing.ownerId, userId)) {
    const { title, content, ...ownerOnlyFields } = data as Record<string, unknown>;
    const hasOwnerOnlyFields = Object.keys(ownerOnlyFields).length > 0;
    if (hasOwnerOnlyFields) {
      throw new NoteError(
        "Shared users can only edit title and content",
        403
      );
    }
  }

  // Determine next version number
  const lastVersion = existing.versions[0]?.version ?? 0;
  const nextVersion = lastVersion + 1;

  // Transaction: snapshot current state → update note
  const updated = await prisma.$transaction(async (tx) => {
    // Save immutable version snapshot of the *current* state
    await tx.noteVersion.create({
      data: {
        noteId: existing.id,
        version: nextVersion,
        title: existing.title,
        content: existing.content,
      },
    });

    // Apply the update
    return tx.note.update({
      where: { id: noteId },
      data,
      select: noteSelectWithSharing,
    });
  });

  return formatNoteResponse(updated, userId);
}

// ─── SOFT DELETE (owner only) ────────────────

export async function deleteNote(noteId: string, userId: string) {
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true, isDeleted: true },
  });

  if (!existing || existing.isDeleted) {
    throw new NoteError("Note not found", 404);
  }

  // Only owner can delete — never shared users
  if (!isOwner(existing.ownerId, userId)) {
    throw new NoteError("Only the note owner can delete this note", 403);
  }

  await prisma.note.update({
    where: { id: noteId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}
