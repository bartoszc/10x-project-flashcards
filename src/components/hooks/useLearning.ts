import { useState, useCallback } from "react";
import type {
  CreateLearningSessionResponseDTO,
  NextFlashcardResponseDTO,
  EndSessionResponseDTO,
  LearningFlashcardDTO,
} from "@/types";
import { toast } from "sonner";

/**
 * State for learning session view.
 */
interface LearningState {
  sessionId: string | null;
  currentFlashcard: LearningFlashcardDTO | null;
  remainingCount: number;
  reviewedCount: number;
  isSessionComplete: boolean;
  isLoading: boolean;
  isStarting: boolean;
  isSubmitting: boolean;
  error: string | null;
  sessionSummary: EndSessionResponseDTO | null;
}

/**
 * Hook for managing learning session state and API interactions.
 */
export function useLearning() {
  const [state, setState] = useState<LearningState>({
    sessionId: null,
    currentFlashcard: null,
    remainingCount: 0,
    reviewedCount: 0,
    isSessionComplete: false,
    isLoading: false,
    isStarting: false,
    isSubmitting: false,
    error: null,
    sessionSummary: null,
  });

  /**
   * Starts a new learning session.
   */
  const startSession = useCallback(async (limit?: number): Promise<boolean> => {
    setState((prev) => ({ ...prev, isStarting: true, error: null }));

    try {
      const response = await fetch("/api/learning-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: limit ? JSON.stringify({ limit }) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          setState((prev) => ({
            ...prev,
            isStarting: false,
            error: "no-flashcards",
          }));
          return false;
        }
        throw new Error(errorData.error?.message || "Failed to start session");
      }

      const data: CreateLearningSessionResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        sessionId: data.session_id,
        remainingCount: data.flashcards_count,
        reviewedCount: 0,
        isSessionComplete: false,
        isStarting: false,
        sessionSummary: null,
      }));

      // Fetch first flashcard
      await fetchNextFlashcard(data.session_id);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, isStarting: false, error: message }));
      toast.error(message);
      return false;
    }
  }, []);

  /**
   * Fetches the next flashcard in the session.
   */
  const fetchNextFlashcard = async (sessionId: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/learning-sessions/${sessionId}/next`);

      if (!response.ok) {
        throw new Error("Failed to fetch next flashcard");
      }

      const data: NextFlashcardResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        currentFlashcard: data.flashcard,
        remainingCount: data.remaining_count,
        reviewedCount: data.reviewed_count,
        isSessionComplete: data.session_complete ?? false,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      toast.error(message);
    }
  };

  /**
   * Submits a rating for the current flashcard.
   * @param rating 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
   */
  const submitRating = useCallback(
    async (rating: 1 | 2 | 3 | 4): Promise<boolean> => {
      if (!state.sessionId || !state.currentFlashcard) {
        return false;
      }

      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const response = await fetch(`/api/learning-sessions/${state.sessionId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flashcard_id: state.currentFlashcard.id,
            rating,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit review");
        }

        // Response contains success status, but we don't need to process it
        await response.json();

        setState((prev) => ({ ...prev, isSubmitting: false }));

        // Fetch next flashcard - sessionId is checked at the start of the function
        const currentSessionId = state.sessionId;
        if (currentSessionId) {
          await fetchNextFlashcard(currentSessionId);
        }
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred";
        setState((prev) => ({ ...prev, isSubmitting: false, error: message }));
        toast.error(message);
        return false;
      }
    },
    [state.sessionId, state.currentFlashcard]
  );

  /**
   * Ends the current session early.
   */
  const endSession = useCallback(async (): Promise<boolean> => {
    if (!state.sessionId) {
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/learning-sessions/${state.sessionId}/end`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to end session");
      }

      const data: EndSessionResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        isSessionComplete: true,
        sessionSummary: data,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      toast.error(message);
      return false;
    }
  }, [state.sessionId]);

  /**
   * Resets state to start a new session.
   */
  const resetSession = useCallback(() => {
    setState({
      sessionId: null,
      currentFlashcard: null,
      remainingCount: 0,
      reviewedCount: 0,
      isSessionComplete: false,
      isLoading: false,
      isStarting: false,
      isSubmitting: false,
      error: null,
      sessionSummary: null,
    });
  }, []);

  return {
    state,
    startSession,
    submitRating,
    endSession,
    resetSession,
  };
}
