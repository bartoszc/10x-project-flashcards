import type { APIRoute } from "astro";

import { startSessionSchema } from "@/lib/schemas/learning.schema";
import { LearningServiceError, startSession } from "@/lib/services/learning.service";
import type { ErrorResponseDTO, CreateLearningSessionResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/learning-sessions
 *
 * Starts a new learning session with flashcards due for review.
 *
 * Request Body (optional):
 * - limit (optional, default: 20): Maximum flashcards in session
 *
 * Responses:
 * - 201: Session created
 * - 401: User not authenticated
 * - 404: No flashcards due for review
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals, request }) => {
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

  // 2. Parse request body (optional)
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    // Empty body is fine
  }

  const parseResult = startSessionSchema.safeParse(body);
  const limit = parseResult.success ? parseResult.data.limit : 20;

  // 3. Start session via service
  try {
    const result: CreateLearningSessionResponseDTO = await startSession(
      locals.supabase,
      user.id,
      limit
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error starting learning session:", error);

    if (error instanceof LearningServiceError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code === "NO_FLASHCARDS" ? "NOT_FOUND" : error.code,
          message: error.code === "NO_FLASHCARDS" 
            ? "No flashcards due for review" 
            : "An unexpected error occurred",
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
