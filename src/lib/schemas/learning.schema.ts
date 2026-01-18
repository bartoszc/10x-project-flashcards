import { z } from "zod";

/**
 * Schema for starting a new learning session.
 * Limit is optional, defaults to 20 on the server.
 */
export const startSessionSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

/**
 * Schema for session ID path parameter.
 */
export const sessionIdSchema = z.string().uuid("Invalid session ID format");

/**
 * Schema for submitting a flashcard review.
 * Rating: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy (FSRS compatible)
 */
export const submitReviewSchema = z.object({
  flashcard_id: z.string().uuid("Invalid flashcard ID"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(4, "Rating must be at most 4"),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
