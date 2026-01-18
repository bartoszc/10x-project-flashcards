import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type {
  CreateLearningSessionResponseDTO,
  NextFlashcardResponseDTO,
  SubmitReviewResponseDTO,
  EndSessionResponseDTO,
  LearningFlashcardDTO,
} from "../../types";
import type { SubmitReviewInput } from "../schemas/learning.schema";

/**
 * Error thrown when learning service fails.
 */
export class LearningServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "DATABASE_ERROR" | "NOT_FOUND" | "NO_FLASHCARDS" | "INTERNAL_ERROR",
    public readonly httpStatus: number
  ) {
    super(message);
    this.name = "LearningServiceError";
  }
}

/**
 * In-memory session state to track which flashcards are in the queue.
 * In production, this could be stored in Redis or the database.
 */
const sessionFlashcardQueues = new Map<string, string[]>();
const sessionReviewedCounts = new Map<string, number>();

/**
 * Starts a new learning session with flashcards due for review.
 */
export async function startSession(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number
): Promise<CreateLearningSessionResponseDTO> {
  // Get flashcards due for review (next_review_date <= today)
  const today = new Date().toISOString().split("T")[0];

  const { data: flashcards, error: flashcardsError } = await supabase
    .from("flashcards")
    .select("id")
    .eq("user_id", userId)
    .lte("next_review_date", today)
    .order("next_review_date", { ascending: true })
    .limit(limit);

  if (flashcardsError) {
    console.error("Error fetching flashcards for session:", flashcardsError);
    throw new LearningServiceError(
      `Database error: ${flashcardsError.message}`,
      "DATABASE_ERROR",
      500
    );
  }

  if (!flashcards || flashcards.length === 0) {
    throw new LearningServiceError(
      "No flashcards due for review",
      "NO_FLASHCARDS",
      404
    );
  }

  // Create learning session
  const { data: session, error: sessionError } = await supabase
    .from("learning_sessions")
    .insert({
      user_id: userId,
      flashcards_reviewed: 0,
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("Error creating learning session:", sessionError);
    throw new LearningServiceError(
      "Failed to create learning session",
      "DATABASE_ERROR",
      500
    );
  }

  // Store flashcard queue in memory
  const flashcardIds = flashcards.map((f) => f.id);
  sessionFlashcardQueues.set(session.id, flashcardIds);
  sessionReviewedCounts.set(session.id, 0);

  return {
    session_id: session.id,
    flashcards_count: flashcardIds.length,
    started_at: session.started_at,
  };
}

/**
 * Gets the next flashcard to review in the session.
 */
export async function getNextFlashcard(
  supabase: SupabaseClient<Database>,
  userId: string,
  sessionId: string
): Promise<NextFlashcardResponseDTO> {
  // Verify session belongs to user
  const { data: session, error: sessionError } = await supabase
    .from("learning_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    throw new LearningServiceError("Session not found", "NOT_FOUND", 404);
  }

  // Get queue from memory
  const queue = sessionFlashcardQueues.get(sessionId) ?? [];
  const reviewedCount = sessionReviewedCounts.get(sessionId) ?? 0;

  if (queue.length === 0) {
    return {
      flashcard: null,
      remaining_count: 0,
      reviewed_count: reviewedCount,
      session_complete: true,
    };
  }

  // Get first flashcard from queue
  const flashcardId = queue[0];

  const { data: flashcard, error: flashcardError } = await supabase
    .from("flashcards")
    .select("id, front, back")
    .eq("id", flashcardId)
    .single();

  if (flashcardError || !flashcard) {
    // Skip this card if it doesn't exist
    queue.shift();
    sessionFlashcardQueues.set(sessionId, queue);
    return getNextFlashcard(supabase, userId, sessionId);
  }

  const learningFlashcard: LearningFlashcardDTO = {
    id: flashcard.id,
    front: flashcard.front,
    back: flashcard.back,
  };

  return {
    flashcard: learningFlashcard,
    remaining_count: queue.length,
    reviewed_count: reviewedCount,
  };
}

/**
 * Submits a review rating for a flashcard.
 * Uses simplified FSRS: new_interval = interval * (rating * 0.5 + 0.5)
 */
export async function submitReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  sessionId: string,
  input: SubmitReviewInput
): Promise<SubmitReviewResponseDTO> {
  const { flashcard_id, rating } = input;

  // Verify session belongs to user
  const { data: session, error: sessionError } = await supabase
    .from("learning_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    throw new LearningServiceError("Session not found", "NOT_FOUND", 404);
  }

  // Get current flashcard data
  const { data: flashcard, error: flashcardError } = await supabase
    .from("flashcards")
    .select("interval, ease_factor, repetition_count")
    .eq("id", flashcard_id)
    .eq("user_id", userId)
    .single();

  if (flashcardError || !flashcard) {
    throw new LearningServiceError("Flashcard not found", "NOT_FOUND", 404);
  }

  const previousInterval = flashcard.interval;
  const previousEaseFactor = flashcard.ease_factor;

  // Simplified FSRS calculation
  let newInterval: number;
  let newEaseFactor = previousEaseFactor;

  if (rating === 1) {
    // Again - reset to 1 day
    newInterval = 1;
    newEaseFactor = Math.max(1.3, previousEaseFactor - 0.2);
  } else if (rating === 2) {
    // Hard - same interval, decrease ease
    newInterval = Math.max(1, Math.floor(previousInterval * 1.2));
    newEaseFactor = Math.max(1.3, previousEaseFactor - 0.15);
  } else if (rating === 3) {
    // Good - normal progress
    newInterval = Math.max(1, Math.floor(previousInterval * previousEaseFactor));
  } else {
    // Easy - bonus progress
    newInterval = Math.max(1, Math.floor(previousInterval * previousEaseFactor * 1.3));
    newEaseFactor = previousEaseFactor + 0.15;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  const nextReviewDateStr = nextReviewDate.toISOString().split("T")[0];

  // Update flashcard with new SR data
  const { error: updateError } = await supabase
    .from("flashcards")
    .update({
      interval: newInterval,
      ease_factor: newEaseFactor,
      next_review_date: nextReviewDateStr,
      repetition_count: flashcard.repetition_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", flashcard_id);

  if (updateError) {
    console.error("Error updating flashcard:", updateError);
    throw new LearningServiceError(
      "Failed to update flashcard",
      "DATABASE_ERROR",
      500
    );
  }

  // Record review in flashcard_reviews
  await supabase.from("flashcard_reviews").insert({
    learning_session_id: sessionId,
    flashcard_id: flashcard_id,
    rating: rating,
    previous_interval: previousInterval,
    new_interval: newInterval,
  });

  // Remove flashcard from queue, increment reviewed count
  const queue = sessionFlashcardQueues.get(sessionId) ?? [];
  const idx = queue.indexOf(flashcard_id);
  if (idx !== -1) {
    queue.splice(idx, 1);
    sessionFlashcardQueues.set(sessionId, queue);
  }

  const reviewedCount = (sessionReviewedCounts.get(sessionId) ?? 0) + 1;
  sessionReviewedCounts.set(sessionId, reviewedCount);

  // Update session reviewed count
  await supabase
    .from("learning_sessions")
    .update({ flashcards_reviewed: reviewedCount })
    .eq("id", sessionId);

  return {
    flashcard_id: flashcard_id,
    previous_interval: previousInterval,
    new_interval: newInterval,
    next_review_date: nextReviewDateStr,
    ease_factor: newEaseFactor,
  };
}

/**
 * Ends the learning session.
 */
export async function endSession(
  supabase: SupabaseClient<Database>,
  userId: string,
  sessionId: string
): Promise<EndSessionResponseDTO> {
  // Verify session belongs to user
  const { data: session, error: sessionError } = await supabase
    .from("learning_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError || !session) {
    throw new LearningServiceError("Session not found", "NOT_FOUND", 404);
  }

  const endedAt = new Date().toISOString();

  // Update session end time
  const { error: updateError } = await supabase
    .from("learning_sessions")
    .update({ ended_at: endedAt })
    .eq("id", sessionId);

  if (updateError) {
    console.error("Error ending session:", updateError);
    throw new LearningServiceError(
      "Failed to end session",
      "DATABASE_ERROR",
      500
    );
  }

  // Calculate duration
  const startedAt = new Date(session.started_at);
  const endedAtDate = new Date(endedAt);
  const durationMs = endedAtDate.getTime() - startedAt.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  // Clean up in-memory state
  sessionFlashcardQueues.delete(sessionId);
  sessionReviewedCounts.delete(sessionId);

  return {
    session_id: sessionId,
    flashcards_reviewed: sessionReviewedCounts.get(sessionId) ?? session.flashcards_reviewed,
    started_at: session.started_at,
    ended_at: endedAt,
    duration_minutes: durationMinutes,
  };
}
