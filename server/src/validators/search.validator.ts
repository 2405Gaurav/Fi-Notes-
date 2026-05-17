import { z } from "zod";

/**
 * Search query parameters.
 * - `q`: required search keyword (minimum 1 character)
 * - `page`: page number (default 1)
 * - `limit`: items per page (default 20, max 100)
 */
export const searchQuerySchema = z.object({
  q: z
    .string({ error: "Search query is required" })
    .trim()
    .min(1, "Search query cannot be empty"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
