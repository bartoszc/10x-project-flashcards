import type { APIRoute } from "astro";

import { sessionIdSchema } from "@/lib/schemas/learning.schema";
import { LearningServiceError, getNextFlashcard } from "@/lib/services/learning.service";
import type { ErrorResponseDTO, NextFlashcardResponseDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/learning-sessions/:id/next
 *
 * Gets the next flashcard to review in the session.
 *
 * Responses:
 * - 200: Next flashcard or session complete
 * - 401: User not authenticated
 * - 404: Session not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
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

  // 2. Validate session ID
  const idParseResult = sessionIdSchema.safeParse(params.id);
  if (!idParseResult.success) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid session ID format",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Get next flashcard via service
  try {
    const result: NextFlashcardResponseDTO = await getNextFlashcard(locals.supabase, user.id, idParseResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting next flashcard:", error);

    if (error instanceof LearningServiceError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code,
          message: error.code === "NOT_FOUND" ? "Session not found" : "An unexpected error occurred",
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
