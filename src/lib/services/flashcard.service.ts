import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { FlashcardDTO, PaginationDTO } from "../../types";
import type { GetFlashcardsQueryParams, CreateFlashcardInput, UpdateFlashcardInput } from "../schemas/flashcard.schema";

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
    public readonly code: "DATABASE_ERROR" | "INTERNAL_ERROR" | "NOT_FOUND",
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

/**
 * Creates a new flashcard manually for the authenticated user.
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - Authenticated user ID
 * @param input - Flashcard data (front, back)
 * @returns Created FlashcardDTO
 * @throws FlashcardServiceError if database insert fails
 */
export async function createFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateFlashcardInput
): Promise<FlashcardDTO> {
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      front: input.front,
      back: input.back,
      source: "manual",
      // Spaced repetition defaults
      next_review_date: new Date().toISOString().split("T")[0],
      interval: 0,
      ease_factor: 2.5,
      repetition_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating flashcard:", error);
    throw new FlashcardServiceError(`Database error: ${error.message}`, "DATABASE_ERROR", 500);
  }

  if (!data) {
    throw new FlashcardServiceError("Failed to create flashcard", "INTERNAL_ERROR", 500);
  }

  // Map to DTO (exclude user_id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...flashcard } = data;
  return flashcard;
}

/**
 * Updates an existing flashcard for the authenticated user.
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - Authenticated user ID
 * @param flashcardId - ID of the flashcard to update
 * @param input - Updated flashcard data (front, back)
 * @returns Updated FlashcardDTO
 * @throws FlashcardServiceError if flashcard not found or database error
 */
export async function updateFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: string,
  input: UpdateFlashcardInput
): Promise<FlashcardDTO> {
  const { data, error } = await supabase
    .from("flashcards")
    .update({
      front: input.front,
      back: input.back,
      updated_at: new Date().toISOString(),
    })
    .eq("id", flashcardId)
    .eq("user_id", userId) // Ensures ownership
    .select()
    .single();

  if (error) {
    // Check if it's a "no rows" error (PGRST116)
    if (error.code === "PGRST116") {
      throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
    }
    console.error("Error updating flashcard:", error);
    throw new FlashcardServiceError(`Database error: ${error.message}`, "DATABASE_ERROR", 500);
  }

  if (!data) {
    throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
  }

  // Map to DTO (exclude user_id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...flashcard } = data;
  return flashcard;
}

/**
 * Deletes a flashcard for the authenticated user.
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - Authenticated user ID
 * @param flashcardId - ID of the flashcard to delete
 * @returns Success message
 * @throws FlashcardServiceError if flashcard not found or database error
 */
export async function deleteFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: string
): Promise<{ message: string }> {
  // First check if flashcard exists and belongs to user
  const { data: existing, error: checkError } = await supabase
    .from("flashcards")
    .select("id")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (checkError || !existing) {
    throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
  }

  const { error } = await supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

  if (error) {
    console.error("Error deleting flashcard:", error);
    throw new FlashcardServiceError(`Database error: ${error.message}`, "DATABASE_ERROR", 500);
  }

  return { message: "Flashcard deleted successfully" };
}
