import { z } from "zod";

/**
 * Schema for validating GET /api/flashcards query parameters.
 * Supports pagination, filtering by source, and sorting.
 */
export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  source: z.enum(["ai", "manual"]).optional(),
  sort: z.enum(["created_at", "updated_at", "next_review_date"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type GetFlashcardsQueryParams = z.infer<typeof getFlashcardsQuerySchema>;
