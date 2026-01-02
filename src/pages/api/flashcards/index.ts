import type { APIRoute } from "astro";

import { getFlashcardsQuerySchema } from "@/lib/schemas/flashcard.schema";
import { FlashcardServiceError, getFlashcards } from "@/lib/services/flashcard.service";
import type { ErrorResponseDTO, FlashcardsListResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/flashcards
 *
 * Retrieves paginated list of flashcards for the authenticated user.
 * Supports filtering by source (ai/manual) and sorting by various fields.
 *
 * Query Parameters:
 * - page (optional, default: 1): Page number (min: 1)
 * - limit (optional, default: 20): Items per page (min: 1, max: 100)
 * - source (optional): Filter by source - "ai" or "manual"
 * - sort (optional, default: "created_at"): Sort field - "created_at", "updated_at", "next_review_date"
 * - order (optional, default: "desc"): Sort order - "asc" or "desc"
 *
 * Responses:
 * - 200: List of flashcards with pagination metadata
 * - 400: Invalid query parameters
 * - 401: User not authenticated
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  // 1. Check authentication
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  if (!user) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Parse and validate query parameters
  const queryParams = Object.fromEntries(url.searchParams);
  const parseResult = getFlashcardsQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: {
          field: firstError?.path?.join("."),
          reason: firstError?.message,
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Fetch flashcards via service
  try {
    const result = await getFlashcards(locals.supabase, user.id, parseResult.data);

    const response: FlashcardsListResponseDTO = result;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);

    if (error instanceof FlashcardServiceError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code === "DATABASE_ERROR" ? "INTERNAL_ERROR" : error.code,
          message: "An unexpected error occurred",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.httpStatus,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
