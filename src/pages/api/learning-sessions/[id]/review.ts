import type { APIRoute } from "astro";

import { sessionIdSchema, submitReviewSchema } from "@/lib/schemas/learning.schema";
import { LearningServiceError, submitReview } from "@/lib/services/learning.service";
import type { ErrorResponseDTO, SubmitReviewResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/learning-sessions/:id/review
 *
 * Submits a review rating for a flashcard in the session.
 *
 * Request Body:
 * - flashcard_id (required): UUID of the flashcard
 * - rating (required): 1-4 (Again, Hard, Good, Easy)
 *
 * Responses:
 * - 200: Review submitted with new SR data
 * - 400: Invalid request body
 * - 401: User not authenticated
 * - 404: Session or flashcard not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals, params, request }) => {
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

  // 3. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON in request body",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bodyParseResult = submitReviewSchema.safeParse(body);
  if (!bodyParseResult.success) {
    const firstError = bodyParseResult.error.errors[0];
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
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

  // 4. Submit review via service
  try {
    const result: SubmitReviewResponseDTO = await submitReview(
      locals.supabase,
      user.id,
      idParseResult.data,
      bodyParseResult.data
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error submitting review:", error);

    if (error instanceof LearningServiceError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code,
          message: error.code === "NOT_FOUND" ? "Session or flashcard not found" : "An unexpected error occurred",
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
