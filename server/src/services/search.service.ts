import prisma from "../lib/prisma.js";
import { PAGINATION } from "../constants/index.js";
import type { SearchQueryInput } from "../validators/search.validator.js";

const noteSelectWithSharing = {
  id: true,
  title: true,
  content: true,
  isPinned: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
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
  owner: { email: string; name: string } | null;
  sharedWith: ShareEntry[];
};

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
    ownerId: note.ownerId,
    permission,
    sharedBy,
    sharedWith,
  };
}

export async function searchNotes(userId: string, query: SearchQueryInput) {
  const page = query.page ?? PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    query.limit ?? PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    OR: [
      { ownerId: userId },
      { sharedWith: { some: { sharedWithUserId: userId } } },
    ],
    AND: [
      {
        OR: [
          { title: { contains: query.q, mode: "insensitive" as const } },
          { content: { contains: query.q, mode: "insensitive" as const } },
        ],
      },
    ],
  };

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
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), query: query.q },
  };
}