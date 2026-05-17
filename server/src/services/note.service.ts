import prisma from "../lib/prisma.js";
import { PAGINATION } from "../constants/index.js";
import { isOwner, canEditNote } from "./share.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateNoteInput,
  UpdateNoteInput,
  NoteQueryInput,
} from "../validators/note.validator.js";

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

// ─── Shared types ─────────────────────────────

type ShareEntry = {
  sharedWithUserId: string;
  permission: string;
  sharedWithUser: { email: string; name: string };
};

type NoteWithSharing = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner?: { email: string; name: string } | null;
  sharedWith: ShareEntry[];
};

// ─── Response shape (strip internal fields) ──

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

// ─── Helpers ──────────────────────────────────

function formatNoteResponse(note: NoteWithSharing, userId: string) {
  const isNoteOwner = note.ownerId === userId;

  const sharedBy =
    !isNoteOwner && note.owner
      ? { email: note.owner.email, name: note.owner.name }
      : null;

  const sharedWith = isNoteOwner
    ? note.sharedWith.map((s) => ({
        userId: s.sharedWithUserId,
        email: s.sharedWithUser.email,
        name: s.sharedWithUser.name,
        permission: s.permission,
      }))
    : [];

  let permission = "OWNER";
  if (!isNoteOwner) {
    const share = note.sharedWith.find((s) => s.sharedWithUserId === userId);
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
    created_at: note.createdAt,
    updated_at: note.updatedAt,
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

  return {
    ...note,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    permission: "OWNER",
    sharedBy: null,
    sharedWith: [],
  };
}

// ─── LIST ─────────────────────────────────────

export async function listNotes(userId: string, query: NoteQueryInput) {
  const page = query.page ?? PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    query.limit ?? PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const isTrash = query.deleted === true;

  const accessFilter = isTrash
    ? [{ ownerId: userId }]
    : [
        { ownerId: userId },
        { sharedWith: { some: { sharedWithUserId: userId } } },
      ];

  const where: Record<string, unknown> = {
    isDeleted: isTrash,
    OR: accessFilter,
  };

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

// ─── GET BY ID ────────────────────────────────

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

  const noteOwner = isOwner(note.ownerId, userId);
  const isShared = note.sharedWith.some((s) => s.sharedWithUserId === userId);

  if (!noteOwner && !isShared) {
    throw new NoteError("You do not have access to this note", 403);
  }

  const { isDeleted: _deleted, ...noteData } = note;
  return formatNoteResponse(noteData, userId);
}

// ─── UPDATE ───────────────────────────────────

export async function updateNote(
  noteId: string,
  userId: string,
  data: UpdateNoteInput
) {
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

  if (!canEditNote(existing.ownerId, userId, existing.sharedWith)) {
    throw new NoteError("You do not have permission to edit this note", 403);
  }

  if (!isOwner(existing.ownerId, userId)) {
    const { title: _t, content: _c, ...ownerOnlyFields } =
      data as Record<string, unknown>;
    if (Object.keys(ownerOnlyFields).length > 0) {
      throw new NoteError("Shared users can only edit title and content", 403);
    }
  }

  const lastVersion = existing.versions[0]?.version ?? 0;
  const nextVersion = lastVersion + 1;

  const updated = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      await tx.noteVersion.create({
        data: {
          noteId: existing.id,
          version: nextVersion,
          title: existing.title,
          content: existing.content,
        },
      });

      return tx.note.update({
        where: { id: noteId },
        data,
        select: noteSelectWithSharing,
      });
    }
  );

  return formatNoteResponse(updated, userId);
}

// ─── SOFT DELETE ──────────────────────────────

export async function deleteNote(noteId: string, userId: string) {
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true, isDeleted: true },
  });

  if (!existing) {
    throw new NoteError("Note not found", 404);
  }

  if (existing.isDeleted) {
    throw new NoteError("Note is already in trash", 400);
  }

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

// ─── RESTORE ─────────────────────────────────

export async function restoreNote(noteId: string, userId: string) {
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true, isDeleted: true },
  });

  if (!existing) {
    throw new NoteError("Note not found", 404);
  }

  if (!existing.isDeleted) {
    throw new NoteError("Note is not in trash", 400);
  }

  if (!isOwner(existing.ownerId, userId)) {
    throw new NoteError("Only the note owner can restore this note", 403);
  }

  const restored = await prisma.note.update({
    where: { id: noteId },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
    select: noteSelectWithSharing,
  });

  return formatNoteResponse(restored, userId);
}

// ─── PERMANENT DELETE ─────────────────────────

export async function permanentDeleteNote(noteId: string, userId: string) {
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: { ownerId: true, isDeleted: true },
  });

  if (!existing) {
    throw new NoteError("Note not found", 404);
  }

  if (!existing.isDeleted) {
    throw new NoteError(
      "Note must be in trash before permanent deletion. Move it to trash first.",
      400
    );
  }

  if (!isOwner(existing.ownerId, userId)) {
    throw new NoteError(
      "Only the note owner can permanently delete this note",
      403
    );
  }

  await prisma.note.delete({
    where: { id: noteId },
  });
}

// ─── VERSION HISTORY ─────────────────────────

export async function getNoteVersions(
  noteId: string,
  userId: string,
  page = 1,
  limit = 20
) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      ownerId: true,
      isDeleted: true,
      sharedWith: {
        select: { sharedWithUserId: true, permission: true },
      },
    },
  });

  if (!note) {
    throw new NoteError("Note not found", 404);
  }

  const noteOwner = isOwner(note.ownerId, userId);
  const isShared = note.sharedWith.some((s) => s.sharedWithUserId === userId);

  if (!noteOwner && !isShared) {
    throw new NoteError("You do not have access to this note", 403);
  }

  if (note.isDeleted && !noteOwner) {
    throw new NoteError("Note not found", 404);
  }

  const skip = (page - 1) * limit;

  const [versions, total] = await Promise.all([
    prisma.noteVersion.findMany({
      where: { noteId },
      select: {
        id: true,
        version: true,
        title: true,
        content: true,
        createdAt: true,
      },
      orderBy: { version: "desc" },
      skip,
      take: limit,
    }),
    prisma.noteVersion.count({ where: { noteId } }),
  ]);

  return {
    versions,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
