import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { AcceptedFlashcardResponseDTO, AcceptFlashcardsResponseDTO, GenerationResponseDTO } from "../../types";
import type { AcceptFlashcardsInput } from "../schemas/accept-flashcards.schema";

import { generateFlashcards, OpenRouterError } from "./openrouter.service";

/**
 * Error thrown when generation service fails.
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly code: "DATABASE_ERROR" | "LLM_ERROR" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR" | "NOT_FOUND",
    public readonly httpStatus: number
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

/**
 * Generates flashcard suggestions from source text.
 *
 * This service coordinates the entire generation process:
 * 1. Creates a generation session record in the database
 * 2. Calls OpenRouter API to generate flashcard suggestions
 * 3. Updates the session with LLM response data
 * 4. Returns formatted response with suggestions
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - Authenticated user ID
 * @param sourceText - Source text for flashcard generation (1000-10000 characters)
 * @returns Promise with generation response containing session ID and suggestions
 * @throws GenerationError if any step fails
 */
export async function createGenerationSession(
  supabase: SupabaseClient<Database>,
  userId: string,
  sourceText: string
): Promise<GenerationResponseDTO> {
  // Step 1: Create initial generation session record
  const { data: session, error: insertError } = await supabase
    .from("generation_sessions")
    .insert({
      user_id: userId,
      source_text: sourceText,
      llm_response: {}, // Will be updated after LLM call
      model_name: "pending", // Will be updated after LLM call
      generated_count: 0,
      accepted_count: 0,
      rejected_count: 0,
    })
    .select("id")
    .single();

  if (insertError || !session) {
    console.error("Failed to create generation session:", insertError);
    throw new GenerationError("Nie udało się utworzyć sesji generowania", "DATABASE_ERROR", 500);
  }

  const sessionId = session.id;

  try {
    // Step 2: Call OpenRouter API to generate flashcards
    const llmResult = await generateFlashcards(sourceText);

    // Step 3: Update session with LLM response data
    const { error: updateError } = await supabase
      .from("generation_sessions")
      .update({
        llm_response:
          llmResult.llm_response as Database["public"]["Tables"]["generation_sessions"]["Update"]["llm_response"],
        model_name: llmResult.model_name,
        generated_count: llmResult.suggestions.length,
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update generation session:", updateError);
      // Non-critical error - we can still return the suggestions
      // Just log the error and continue
    }

    // Step 4: Return formatted response
    return {
      session_id: sessionId,
      suggestions: llmResult.suggestions,
      generated_count: llmResult.suggestions.length,
      model_name: llmResult.model_name,
    };
  } catch (error) {
    // Clean up the session on failure (optional - keep for debugging)
    // await supabase.from('generation_sessions').delete().eq('id', sessionId);

    if (error instanceof OpenRouterError) {
      if (error.isRetryable) {
        throw new GenerationError(
          "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za chwilę.",
          "SERVICE_UNAVAILABLE",
          503
        );
      }
      throw new GenerationError("Błąd podczas komunikacji z usługą AI", "LLM_ERROR", 502);
    }

    console.error("Unexpected error during generation:", error);
    throw new GenerationError("Wystąpił nieoczekiwany błąd podczas generowania fiszek", "INTERNAL_ERROR", 500);
  }
}

/**
 * Accepts selected flashcard suggestions and saves them to the database.
 *
 * This service handles the acceptance flow:
 * 1. Verifies the generation session exists and belongs to the user
 * 2. Batch inserts accepted flashcards to the flashcards table
 * 3. Updates session metrics (accepted_count, rejected_count)
 * 4. Returns the created flashcards with their IDs
 *
 * @param supabase - Supabase client from context.locals
 * @param userId - Authenticated user ID
 * @param sessionId - Generation session ID
 * @param command - Accepted flashcards and rejected count
 * @returns Promise with accepted flashcards response
 * @throws GenerationError if session not found or database error
 */
export async function acceptFlashcards(
  supabase: SupabaseClient<Database>,
  userId: string,
  sessionId: string,
  command: AcceptFlashcardsInput
): Promise<AcceptFlashcardsResponseDTO> {
  // Step 1: Verify session exists and belongs to the user (RLS will enforce ownership)
  const { data: session, error: sessionError } = await supabase
    .from("generation_sessions")
    .select("id, user_id")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    console.error("Session not found or access denied:", sessionError);
    throw new GenerationError("Sesja generowania nie została znaleziona", "NOT_FOUND", 404);
  }

  // Step 2: Prepare flashcards for batch insert (if any accepted)
  const createdFlashcards: AcceptedFlashcardResponseDTO[] = [];

  if (command.accepted.length > 0) {
    const flashcardsToInsert = command.accepted.map((flashcard) => ({
      user_id: userId,
      front: flashcard.front,
      back: flashcard.back,
      source: "ai" as const,
      generation_session_id: sessionId,
    }));

    // Batch insert flashcards
    const { data: insertedFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, front, back, source, generation_session_id, created_at");

    if (insertError || !insertedFlashcards) {
      console.error("Failed to insert flashcards:", insertError);
      throw new GenerationError("Wystąpił błąd podczas zapisywania fiszek", "DATABASE_ERROR", 500);
    }

    // Map to response DTO
    for (const flashcard of insertedFlashcards) {
      createdFlashcards.push({
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source,
        generation_session_id: flashcard.generation_session_id ?? sessionId,
        created_at: flashcard.created_at,
      });
    }
  }

  // Step 3: Update session metrics
  const { error: updateError } = await supabase
    .from("generation_sessions")
    .update({
      accepted_count: command.accepted.length,
      rejected_count: command.rejected_count,
    })
    .eq("id", sessionId);

  if (updateError) {
    console.error("Failed to update session metrics:", updateError);
    // Non-critical error - flashcards were saved, log and continue
  }

  // Step 4: Return response
  return {
    flashcards: createdFlashcards,
    accepted_count: command.accepted.length,
    rejected_count: command.rejected_count,
  };
}
