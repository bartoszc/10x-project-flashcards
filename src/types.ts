import type { Database } from "./db/database.types";

// ============================================================================
// Base Entity Types (derived from database types)
// ============================================================================

/**
 * Base row types extracted from Supabase database schema.
 * These represent the raw database entities.
 */
type FlashcardRow = Database["public"]["Tables"]["flashcards"]["Row"];
type GenerationSessionRow = Database["public"]["Tables"]["generation_sessions"]["Row"];
type LearningSessionRow = Database["public"]["Tables"]["learning_sessions"]["Row"];
type FlashcardReviewRow = Database["public"]["Tables"]["flashcard_reviews"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Flashcard source enum extracted from database schema.
 */
export type FlashcardSource = Database["public"]["Enums"]["flashcard_source"];

// ============================================================================
// Shared DTOs
// ============================================================================

/**
 * Standard pagination structure used across all list endpoints.
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// ============================================================================
// Flashcard DTOs and Commands
// ============================================================================

/**
 * Flashcard data returned by API endpoints.
 * Derives from FlashcardRow, excluding internal user_id field.
 */
export type FlashcardDTO = Omit<FlashcardRow, "user_id">;

/**
 * Paginated list of flashcards with metadata.
 */
export interface FlashcardsListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

/**
 * Command for creating a new flashcard manually.
 * Only front and back are required - other fields are auto-generated.
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * Command for updating an existing flashcard.
 * Both front and back are required for update.
 */
export interface UpdateFlashcardCommand {
  front: string;
  back: string;
}

// ============================================================================
// AI Generation DTOs and Commands
// ============================================================================

/**
 * Command for initiating AI flashcard generation.
 * source_text must be between 1000-10000 characters.
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
}

/**
 * Individual flashcard suggestion returned by AI generation.
 * Contains a temporary ID for frontend tracking before acceptance.
 */
export interface FlashcardSuggestionDTO {
  temp_id: string;
  front: string;
  back: string;
}

/**
 * Response from AI flashcard generation endpoint.
 */
export interface GenerationResponseDTO {
  session_id: string;
  suggestions: FlashcardSuggestionDTO[];
  generated_count: number;
  model_name: string;
}

/**
 * Individual flashcard to accept from AI suggestions.
 * May contain edited content from original suggestion.
 */
export interface AcceptedFlashcardDTO {
  temp_id: string;
  front: string;
  back: string;
}

/**
 * Command for accepting selected AI-generated flashcard suggestions.
 */
export interface AcceptFlashcardsCommand {
  accepted: AcceptedFlashcardDTO[];
  rejected_count: number;
}

/**
 * Flashcard item in accept response with minimal fields.
 */
export interface AcceptedFlashcardResponseDTO {
  id: string;
  front: string;
  back: string;
  source: FlashcardSource;
  generation_session_id: string;
  created_at: string;
}

/**
 * Response from accepting AI-generated flashcards.
 */
export interface AcceptFlashcardsResponseDTO {
  flashcards: AcceptedFlashcardResponseDTO[];
  accepted_count: number;
  rejected_count: number;
}

/**
 * Generation session item for history list.
 * Includes a preview of source text instead of full content.
 */
export interface GenerationSessionDTO {
  id: GenerationSessionRow["id"];
  source_text_preview: string;
  model_name: GenerationSessionRow["model_name"];
  generated_count: GenerationSessionRow["generated_count"];
  accepted_count: GenerationSessionRow["accepted_count"];
  rejected_count: GenerationSessionRow["rejected_count"];
  created_at: GenerationSessionRow["created_at"];
}

/**
 * Paginated list of generation sessions.
 */
export interface GenerationSessionsListResponseDTO {
  data: GenerationSessionDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Learning Session DTOs and Commands
// ============================================================================

/**
 * Command for starting a new learning session.
 * Limit is optional - defaults to server-side value if not provided.
 */
export interface CreateLearningSessionCommand {
  limit?: number;
}

/**
 * Response from creating a new learning session.
 */
export interface CreateLearningSessionResponseDTO {
  session_id: string;
  flashcards_count: number;
  started_at: string;
}

/**
 * Flashcard data for learning session - only front/back needed for review UI.
 */
export interface LearningFlashcardDTO {
  id: string;
  front: string;
  back: string;
}

/**
 * Response for getting the next flashcard to review in a session.
 */
export interface NextFlashcardResponseDTO {
  flashcard: LearningFlashcardDTO | null;
  remaining_count: number;
  reviewed_count: number;
  session_complete?: boolean;
}

/**
 * Command for submitting a review rating for a flashcard.
 * Rating values: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy (FSRS compatible)
 */
export interface SubmitReviewCommand {
  flashcard_id: string;
  rating: number;
}

/**
 * Response from submitting a flashcard review.
 * Contains updated spaced repetition data.
 */
export interface SubmitReviewResponseDTO {
  flashcard_id: string;
  previous_interval: number;
  new_interval: number;
  next_review_date: string;
  ease_factor: number;
}

/**
 * Response from ending a learning session.
 */
export interface EndSessionResponseDTO {
  session_id: string;
  flashcards_reviewed: number;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
}

/**
 * Learning session item for history list.
 * Derives from database row, excluding user_id.
 */
export type LearningSessionDTO = Omit<LearningSessionRow, "user_id">;

/**
 * Paginated list of learning sessions.
 */
export interface LearningSessionsListResponseDTO {
  data: LearningSessionDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Statistics DTOs
// ============================================================================

/**
 * Breakdown of flashcards by source type.
 */
export interface FlashcardsBySourceDTO {
  ai: number;
  manual: number;
}

/**
 * AI generation statistics for the authenticated user.
 */
export interface GenerationStatisticsDTO {
  total_sessions: number;
  total_generated: number;
  total_accepted: number;
  total_rejected: number;
  acceptance_rate: number;
  flashcards_by_source: FlashcardsBySourceDTO;
  ai_usage_percentage: number;
}

// ============================================================================
// User Profile DTOs and Commands
// ============================================================================

/**
 * User preferences stored as JSON in the profile.
 */
export interface UserPreferencesDTO {
  daily_goal?: number;
  theme?: "light" | "dark";
  [key: string]: unknown; // Allow additional preferences
}

/**
 * User profile data returned by API.
 * Combines profile data with email from auth.users.
 */
export interface ProfileDTO {
  id: ProfileRow["id"];
  email: string;
  preferences: UserPreferencesDTO | null;
  created_at: ProfileRow["created_at"];
  updated_at: ProfileRow["updated_at"];
}

/**
 * Command for updating user preferences.
 */
export interface UpdateProfileCommand {
  preferences: UserPreferencesDTO;
}

/**
 * Response from updating user profile.
 */
export interface UpdateProfileResponseDTO {
  id: string;
  preferences: UserPreferencesDTO;
  updated_at: string;
}

// ============================================================================
// Error DTOs
// ============================================================================

/**
 * Error codes used in API responses.
 */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "LLM_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

/**
 * Detailed error information for validation errors.
 */
export interface ErrorDetailsDTO {
  field?: string;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Standard error response structure.
 */
export interface ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetailsDTO;
  };
}

// ============================================================================
// Authentication DTOs and Commands
// ============================================================================

/**
 * Command for user registration.
 */
export interface RegisterCommand {
  email: string;
  password: string;
}

/**
 * Command for user login.
 */
export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * User data returned in auth responses.
 */
export interface AuthUserDTO {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Session data returned after successful authentication.
 */
export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Response from register and login endpoints.
 */
export interface AuthResponseDTO {
  user: AuthUserDTO;
  session?: SessionDTO;
}

/**
 * Response from logout endpoint.
 */
export interface LogoutResponseDTO {
  message: string;
}

/**
 * Response from delete account endpoint.
 */
export interface DeleteAccountResponseDTO {
  message: string;
}
