import prisma from "../lib/prisma";
import { PAGINATION } from "../constants";
import type { SearchQueryInput } from "../validators/search.validator";

/** Extended select that includes sharing metadata */
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

/** Format note response with sharing context */
function formatNoteResponse(note: any, userId: string) {
  const isNoteOwner = note.ownerId === userId;

  const sharedBy =
    !isNoteOwner && note.owner
      ? { email: note.owner.email, name: note.owner.name }
      : null;

  const sharedWith =
    isNoteOwner && note.sharedWith
      ? note.sharedWith.map((s: any) => ({
          userId: s.sharedWithUserId,
          email: s.sharedWithUser.email,
          name: s.sharedWithUser.name,
          permission: s.permission,
        }))
      : [];

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

/**
 * Full-text search across notes the user has access to (owned + shared).
 *
 * Searches case-insensitively in both `title` and `content`.
 * Results are paginated and sorted by relevance (updatedAt DESC).
 */
export async function searchNotes(userId: string, query: SearchQueryInput) {
  const page = query.page ?? PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    query.limit ?? PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
    // Access control: owned OR shared-with-me
    OR: [
      { ownerId: userId },
      { sharedWith: { some: { sharedWithUserId: userId } } },
    ],
    // Full-text search across title and content
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
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      query: query.q,
    },
  };
}
