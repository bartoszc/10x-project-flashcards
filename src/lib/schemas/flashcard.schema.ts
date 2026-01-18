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

/**
 * Schema for validating POST /api/flashcards request body.
 * Creates a new flashcard manually.
 */
export const createFlashcardSchema = z.object({
  front: z.string().min(1, "Front text is required").max(500, "Front text must be at most 500 characters"),
  back: z.string().min(1, "Back text is required").max(1000, "Back text must be at most 1000 characters"),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;

/**
 * Schema for validating PUT /api/flashcards/:id request body.
 * Updates an existing flashcard.
 */
export const updateFlashcardSchema = z.object({
  front: z.string().min(1, "Front text is required").max(500, "Front text must be at most 500 characters"),
  back: z.string().min(1, "Back text is required").max(1000, "Back text must be at most 1000 characters"),
});

export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

/**
 * Schema for validating flashcard ID path parameter.
 */
export const flashcardIdSchema = z.string().uuid("Invalid flashcard ID format");
