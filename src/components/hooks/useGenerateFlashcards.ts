import { useState, useCallback, useMemo } from "react";
import type { GenerateViewState, SuggestionViewModel, TextValidationResult } from "../generate/types";
import { MIN_SOURCE_TEXT_LENGTH, MAX_SOURCE_TEXT_LENGTH } from "../generate/types";
import type { GenerationResponseDTO, AcceptFlashcardsResponseDTO, ErrorResponseDTO } from "../../types";

/**
 * Return type for the useGenerateFlashcards hook.
 */
export interface UseGenerateFlashcardsReturn {
  // State
  state: GenerateViewState;

  // Form actions
  setSourceText: (text: string) => void;
  generateFlashcards: () => Promise<void>;

  // Suggestion actions
  acceptSuggestion: (tempId: string) => void;
  rejectSuggestion: (tempId: string) => void;
  editSuggestion: (tempId: string, front: string, back: string) => void;
  toggleEditMode: (tempId: string, isEditing: boolean) => void;
  acceptAllSuggestions: () => void;
  rejectAllSuggestions: () => void;

  // Save action
  saveAcceptedFlashcards: () => Promise<void>;

  // Computed values
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  textValidation: TextValidationResult;
  canGenerate: boolean;
  canSave: boolean;
}

const initialState: GenerateViewState = {
  sourceText: "",
  isGenerating: false,
  isSaving: false,
  sessionId: null,
  suggestions: [],
  error: null,
  generatedCount: 0,
  modelName: null,
};

/**
 * Custom hook for managing the AI flashcard generation view.
 * Handles state management, API communication, and business logic.
 */
export function useGenerateFlashcards(): UseGenerateFlashcardsReturn {
  const [state, setState] = useState<GenerateViewState>(initialState);

  // --- Text validation ---
  const textValidation = useMemo((): TextValidationResult => {
    const count = state.sourceText.length;

    if (count < MIN_SOURCE_TEXT_LENGTH) {
      return {
        isValid: false,
        characterCount: count,
        status: "too-short",
        message: `Tekst musi zawierać minimum ${MIN_SOURCE_TEXT_LENGTH} znaków`,
      };
    }

    if (count > MAX_SOURCE_TEXT_LENGTH) {
      return {
        isValid: false,
        characterCount: count,
        status: "too-long",
        message: `Tekst nie może przekraczać ${MAX_SOURCE_TEXT_LENGTH} znaków`,
      };
    }

    return {
      isValid: true,
      characterCount: count,
      status: "valid",
      message: "Poprawna długość tekstu",
    };
  }, [state.sourceText.length]);

  // --- Computed counts ---
  const acceptedCount = useMemo(
    () => state.suggestions.filter((s) => s.status === "accepted").length,
    [state.suggestions]
  );

  const rejectedCount = useMemo(
    () => state.suggestions.filter((s) => s.status === "rejected").length,
    [state.suggestions]
  );

  const pendingCount = useMemo(
    () => state.suggestions.filter((s) => s.status === "pending").length,
    [state.suggestions]
  );

  const canGenerate = textValidation.isValid && !state.isGenerating;
  const canSave = acceptedCount > 0 && !state.isSaving;

  // --- Form actions ---
  const setSourceText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, sourceText: text, error: null }));
  }, []);

  const generateFlashcards = useCallback(async () => {
    if (!textValidation.isValid || state.isGenerating) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
      suggestions: [],
      sessionId: null,
    }));

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_text: state.sourceText,
        }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        const errorCode = errorData.error?.code;

        // Provide user-friendly messages based on error code
        let message: string;
        switch (errorCode) {
          case "VALIDATION_ERROR":
            message = errorData.error?.message || "Tekst nie spełnia wymagań walidacji.";
            break;
          case "LLM_ERROR":
            message = "Wystąpił problem z usługą AI. Spróbuj ponownie później.";
            break;
          case "SERVICE_UNAVAILABLE":
            message = "Usługa jest tymczasowo niedostępna. Spróbuj za chwilę.";
            break;
          default:
            message = errorData.error?.message || "Wystąpił błąd podczas generowania fiszek.";
        }
        throw new Error(message);
      }

      const data: GenerationResponseDTO = await response.json();

      // Map API suggestions to ViewModels
      const suggestions: SuggestionViewModel[] = data.suggestions.map((s) => ({
        temp_id: s.temp_id,
        front: s.front,
        back: s.back,
        originalFront: s.front,
        originalBack: s.back,
        status: "pending",
        isEditing: false,
      }));

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        sessionId: data.session_id,
        suggestions,
        generatedCount: data.generated_count,
        modelName: data.model_name,
      }));
    } catch (error) {
      let message: string;

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        message = "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.";
      } else if (error instanceof Error) {
        message = error.message;
      } else {
        message = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
      }

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: message,
      }));
    }
  }, [textValidation.isValid, state.isGenerating, state.sourceText]);

  // --- Suggestion actions ---
  const updateSuggestion = useCallback((tempId: string, updates: Partial<SuggestionViewModel>) => {
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((s) => (s.temp_id === tempId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const acceptSuggestion = useCallback(
    (tempId: string) => {
      updateSuggestion(tempId, { status: "accepted", isEditing: false });
    },
    [updateSuggestion]
  );

  const rejectSuggestion = useCallback(
    (tempId: string) => {
      updateSuggestion(tempId, { status: "rejected", isEditing: false });
    },
    [updateSuggestion]
  );

  const editSuggestion = useCallback(
    (tempId: string, front: string, back: string) => {
      updateSuggestion(tempId, { front, back, isEditing: false });
    },
    [updateSuggestion]
  );

  const toggleEditMode = useCallback(
    (tempId: string, isEditing: boolean) => {
      updateSuggestion(tempId, { isEditing });
    },
    [updateSuggestion]
  );

  const acceptAllSuggestions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((s) =>
        s.status === "pending" ? { ...s, status: "accepted", isEditing: false } : s
      ),
    }));
  }, []);

  const rejectAllSuggestions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((s) =>
        s.status === "pending" ? { ...s, status: "rejected", isEditing: false } : s
      ),
    }));
  }, []);

  // --- Save action ---
  const saveAcceptedFlashcards = useCallback(async () => {
    if (!state.sessionId || acceptedCount === 0 || state.isSaving) {
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const acceptedSuggestions = state.suggestions
        .filter((s) => s.status === "accepted")
        .map((s) => ({
          temp_id: s.temp_id,
          front: s.front,
          back: s.back,
        }));

      const response = await fetch(`/api/generations/${state.sessionId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accepted: acceptedSuggestions,
          rejected_count: rejectedCount,
        }),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        const errorCode = errorData.error?.code;

        let message: string;
        switch (errorCode) {
          case "VALIDATION_ERROR":
            message = errorData.error?.message || "Błąd walidacji danych.";
            break;
          case "NOT_FOUND":
            message = "Sesja generowania nie została znaleziona.";
            break;
          default:
            message = errorData.error?.message || "Nie udało się zapisać fiszek.";
        }
        throw new Error(message);
      }

      const data: AcceptFlashcardsResponseDTO = await response.json();

      // Reset state after successful save
      setState({
        ...initialState,
        generatedCount: data.accepted_count,
      });

      // Could redirect to flashcards list or show success message
      // For now, we'll just reset the form
    } catch (error) {
      let message: string;

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        message = "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.";
      } else if (error instanceof Error) {
        message = error.message;
      } else {
        message = "Nie udało się zapisać fiszek. Spróbuj ponownie.";
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: message,
      }));
    }
  }, [state.sessionId, state.suggestions, state.isSaving, acceptedCount, rejectedCount]);

  return {
    state,
    setSourceText,
    generateFlashcards,
    acceptSuggestion,
    rejectSuggestion,
    editSuggestion,
    toggleEditMode,
    acceptAllSuggestions,
    rejectAllSuggestions,
    saveAcceptedFlashcards,
    acceptedCount,
    rejectedCount,
    pendingCount,
    textValidation,
    canGenerate,
    canSave,
  };
}
