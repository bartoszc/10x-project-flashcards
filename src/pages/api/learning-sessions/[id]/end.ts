import type { APIRoute } from "astro";

import { sessionIdSchema } from "@/lib/schemas/learning.schema";
import { LearningServiceError, endSession } from "@/lib/services/learning.service";
import type { ErrorResponseDTO, EndSessionResponseDTO } from "@/types";

export const prerender = false;

/**
 * PATCH /api/learning-sessions/:id/end
 *
 * Ends the learning session.
 *
 * Responses:
 * - 200: Session ended with summary
 * - 401: User not authenticated
 * - 404: Session not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async ({ locals, params }) => {
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

  // 3. End session via service
  try {
    const result: EndSessionResponseDTO = await endSession(
      locals.supabase,
      user.id,
      idParseResult.data
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error ending session:", error);

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
