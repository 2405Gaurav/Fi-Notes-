import prisma from "../lib/prisma";
import { PAGINATION } from "../constants";
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

  return note;
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
      select: noteSelect,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.note.count({ where }),
  ]);

  return {
    notes,
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
      ...noteSelect,
      isDeleted: true,
      sharedWith: {
        select: {
          sharedWithUserId: true,
          permission: true,
        },
      },
    },
  });

  if (!note || note.isDeleted) {
    throw new NoteError("Note not found", 404);
  }

  // Check access: owner or shared user
  const isOwner = note.ownerId === userId;
  const isShared = note.sharedWith.some(
    (s) => s.sharedWithUserId === userId
  );

  if (!isOwner && !isShared) {
    throw new NoteError("You do not have access to this note", 403);
  }

  // Strip internal sharedWith array before returning
  const { sharedWith, isDeleted, ...noteData } = note;
  return noteData;
}

// ─── UPDATE (owner only + version snapshot) ──

export async function updateNote(
  noteId: string,
  userId: string,
  data: UpdateNoteInput
) {
  // Fetch current note for ownership check + version snapshot
  const existing = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      content: true,
      ownerId: true,
      isDeleted: true,
      versions: {
        select: { version: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!existing || existing.isDeleted) {
    throw new NoteError("Note not found", 404);
  }

  if (existing.ownerId !== userId) {
    throw new NoteError("You do not have permission to update this note", 403);
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
      select: noteSelect,
    });
  });

  return updated;
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

  if (existing.ownerId !== userId) {
    throw new NoteError("You do not have permission to delete this note", 403);
  }

  await prisma.note.update({
    where: { id: noteId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}
