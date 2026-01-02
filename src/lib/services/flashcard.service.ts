import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { FlashcardDTO, PaginationDTO } from "../../types";
import type { GetFlashcardsQueryParams } from "../schemas/flashcard.schema";

/**
 * Result of getFlashcards operation.
 */
interface GetFlashcardsResult {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

/**
 * Error thrown when flashcard service fails.
 */
export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "DATABASE_ERROR" | "INTERNAL_ERROR",
    public readonly httpStatus: number
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

/**
 * Retrieves paginated flashcards for a user with optional filtering and sorting.
 *
 * This service handles:
 * 1. Building query with user-specific filtering (RLS enforced)
 * 2. Applying optional source filter (ai/manual)
 * 3. Sorting by specified field and order
 * 4. Pagination with offset-based approach
 * 5. Mapping results to DTO (excluding user_id)
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - Authenticated user ID
 * @param params - Query parameters (page, limit, source, sort, order)
 * @returns Promise with flashcards list and pagination metadata
 * @throws FlashcardServiceError if database query fails
 */
export async function getFlashcards(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: GetFlashcardsQueryParams
): Promise<GetFlashcardsResult> {
  const { page, limit, source, sort, order } = params;
  const offset = (page - 1) * limit;

  // Build query with count for pagination
  let query = supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply source filter if provided
  if (source) {
    query = query.eq("source", source);
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === "asc" });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching flashcards:", error);
    throw new FlashcardServiceError(`Database error: ${error.message}`, "DATABASE_ERROR", 500);
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Map to DTO (exclude user_id)
  const flashcards: FlashcardDTO[] = (data ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ user_id, ...flashcard }) => flashcard
  );

  return {
    data: flashcards,
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
    },
  };
}
