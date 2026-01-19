import type { APIContext } from "astro";

import { acceptFlashcardsSchema } from "../../../../lib/schemas/accept-flashcards.schema";
import { acceptFlashcards, GenerationError } from "../../../../lib/services/generation.service";
import { isValidUUID } from "../../../../lib/utils/uuid";
import type { AcceptFlashcardsResponseDTO, ErrorResponseDTO } from "../../../../types";

export const prerender = false;

/**
 * DEV MODE: Set to true to skip authentication (for testing only!)
 * TODO: Remove before production deployment
 */
const DEV_SKIP_AUTH = false;
const DEV_USER_ID = "a6d50d3f-2e5e-4d1a-9c02-186799b18741";

/**
 * POST /api/generations/:session_id/accept
 *
 * Accepts selected AI-generated flashcard suggestions and saves them to the database.
 *
 * Path Parameters:
 *   - session_id: UUID of the generation session
 *
 * Request Body:
 *   - accepted: array of flashcard objects with temp_id, front, back
 *   - rejected_count: number of rejected flashcards
 *
 * Response:
 *   - 201: AcceptFlashcardsResponseDTO with created flashcards
 *   - 400: Validation error (invalid UUID or body)
 *   - 401: Unauthorized
 *   - 404: Session not found
 *   - 500: Internal server error
 */
export async function POST({ params, request, locals }: APIContext): Promise<Response> {
  let userId: string;

  // 1. Authentication check (skip in dev mode)
  if (DEV_SKIP_AUTH) {
    console.warn("⚠️ DEV MODE: Skipping authentication!");
    userId = DEV_USER_ID;
  } else {
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Wymagana autoryzacja",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    userId = user.id;
  }

  // 2. Validate session_id path parameter
  const sessionId = params.session_id;

  if (!sessionId || !isValidUUID(sessionId)) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Nieprawidłowy format identyfikatora sesji",
        details: {
          field: "session_id",
          reason: "Identyfikator sesji musi być poprawnym UUID",
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Body parsing (early return)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Nieprawidłowy format JSON",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Input validation (early return)
  const validationResult = acceptFlashcardsSchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Walidacja danych wejściowych nie powiodła się",
        details: {
          field: firstError?.path.join(".") || "unknown",
          reason: firstError?.message || "Nieprawidłowa wartość",
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Business logic - accept flashcards (happy path)
  try {
    const result: AcceptFlashcardsResponseDTO = await acceptFlashcards(
      locals.supabase,
      userId,
      sessionId,
      validationResult.data
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known errors from generation service
    if (error instanceof GenerationError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_ERROR",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.httpStatus,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    console.error("Unexpected error in POST /api/generations/:session_id/accept:", error);
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Wystąpił nieoczekiwany błąd serwera",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
