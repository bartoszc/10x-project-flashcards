// ============================================================================
// ViewModel Types for Generate Flashcards View
// ============================================================================

/**
 * Status of an individual suggestion in the UI.
 */
export type SuggestionStatus = "pending" | "accepted" | "rejected";

/**
 * ViewModel for a single flashcard suggestion.
 * Extends the DTO with UI-specific state.
 */
export interface SuggestionViewModel {
  /** Temporary ID for frontend tracking */
  temp_id: string;
  /** Current front value (may be edited) */
  front: string;
  /** Current back value (may be edited) */
  back: string;
  /** Original front value from AI */
  originalFront: string;
  /** Original back value from AI */
  originalBack: string;
  /** Current status of the suggestion */
  status: SuggestionStatus;
  /** Whether the suggestion is currently being edited */
  isEditing: boolean;
}

/**
 * Main state for the generate flashcards view.
 */
export interface GenerateViewState {
  /** Source text for AI generation */
  sourceText: string;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Whether saving is in progress */
  isSaving: boolean;
  /** Current generation session ID */
  sessionId: string | null;
  /** List of flashcard suggestions with UI state */
  suggestions: SuggestionViewModel[];
  /** Current error message */
  error: string | null;
  /** Count of generated flashcards from last generation */
  generatedCount: number;
  /** Model name used for generation */
  modelName: string | null;
}

/**
 * Text validation status for character count feedback.
 */
export type TextValidationStatus = "too-short" | "valid" | "too-long";

/**
 * Result of text validation.
 */
export interface TextValidationResult {
  /** Whether the text is valid for generation */
  isValid: boolean;
  /** Current character count */
  characterCount: number;
  /** Validation status for UI feedback */
  status: TextValidationStatus;
  /** User-friendly validation message */
  message: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum character count for source text */
export const MIN_SOURCE_TEXT_LENGTH = 1000;

/** Maximum character count for source text */
export const MAX_SOURCE_TEXT_LENGTH = 10000;
