import prisma from "../lib/prisma";
import { PAGINATION } from "../constants";
import type { SearchQueryInput } from "../validators/search.validator";

/** Fields returned to the client */
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
      query: query.q,
    },
  };
}
