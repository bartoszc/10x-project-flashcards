import type { APIRoute } from "astro";

import { updateFlashcardSchema, flashcardIdSchema } from "@/lib/schemas/flashcard.schema";
import { FlashcardServiceError, updateFlashcard, deleteFlashcard } from "@/lib/services/flashcard.service";
import type { ErrorResponseDTO, FlashcardDTO } from "@/types";

export const prerender = false;

/**
 * PUT /api/flashcards/:id
 *
 * Updates an existing flashcard for the authenticated user.
 *
 * Path Parameters:
 * - id (required): UUID of the flashcard to update
 *
 * Request Body:
 * - front (required): Updated front text (1-500 chars)
 * - back (required): Updated back text (1-1000 chars)
 *
 * Responses:
 * - 200: Updated flashcard
 * - 400: Invalid request body or ID format
 * - 401: User not authenticated
 * - 404: Flashcard not found
 * - 500: Internal server error
 */
export const PUT: APIRoute = async ({ locals, request, params }) => {
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

  // 2. Validate path parameter
  const idParseResult = flashcardIdSchema.safeParse(params.id);
  if (!idParseResult.success) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid flashcard ID format",
        details: {
          field: "id",
          reason: idParseResult.error.errors[0]?.message,
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const flashcardId = idParseResult.data;

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

  const bodyParseResult = updateFlashcardSchema.safeParse(body);

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

  // 4. Update flashcard via service
  try {
    const flashcard: FlashcardDTO = await updateFlashcard(
      locals.supabase,
      user.id,
      flashcardId,
      bodyParseResult.data
    );

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);

    if (error instanceof FlashcardServiceError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code === "DATABASE_ERROR" ? "INTERNAL_ERROR" : error.code,
          message: error.code === "NOT_FOUND" ? "Flashcard not found" : "An unexpected error occurred",
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

/**
 * DELETE /api/flashcards/:id
 *
 * Permanently deletes a flashcard for the authenticated user.
 *
 * Path Parameters:
 * - id (required): UUID of the flashcard to delete
 *
 * Responses:
 * - 200: Success message
 * - 400: Invalid ID format
 * - 401: User not authenticated
 * - 404: Flashcard not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

  // 2. Validate path parameter
  const idParseResult = flashcardIdSchema.safeParse(params.id);
  if (!idParseResult.success) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid flashcard ID format",
        details: {
          field: "id",
          reason: idParseResult.error.errors[0]?.message,
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const flashcardId = idParseResult.data;

  // 3. Delete flashcard via service
  try {
    const result = await deleteFlashcard(locals.supabase, user.id, flashcardId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting flashcard:", error);

    if (error instanceof FlashcardServiceError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code === "DATABASE_ERROR" ? "INTERNAL_ERROR" : error.code,
          message: error.code === "NOT_FOUND" ? "Flashcard not found" : "An unexpected error occurred",
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
