import type { APIContext } from "astro";

import { generateFlashcardsSchema } from "../../lib/schemas/generation.schema";
import { createGenerationSession, GenerationError } from "../../lib/services/generation.service";
import type { ErrorResponseDTO, GenerationResponseDTO } from "../../types";

export const prerender = false;

/**
 * DEV MODE: Set to true to skip authentication (for testing only!)
 * TODO: Remove before production deployment
 */
const DEV_SKIP_AUTH = false;
const DEV_USER_ID = "a6d50d3f-2e5e-4d1a-9c02-186799b18741";

/**
 * POST /api/generations
 *
 * Generates flashcard suggestions from provided source text using AI.
 *
 * Request Body:
 *   - source_text: string (1000-10000 characters)
 *
 * Response:
 *   - 201: GenerationResponseDTO with session_id and suggestions
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 502: LLM API error
 *   - 503: Service temporarily unavailable
 *   - 500: Internal server error
 */
export async function POST({ request, locals }: APIContext): Promise<Response> {
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

  // 2. Body parsing (early return)
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

  // 3. Input validation (early return)
  const validationResult = generateFlashcardsSchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Walidacja danych wejściowych nie powiodła się",
        details: {
          field: firstError?.path.join(".") || "source_text",
          reason: firstError?.message || "Nieprawidłowa wartość",
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Business logic - generate flashcards (happy path)
  try {
    const result: GenerationResponseDTO = await createGenerationSession(
      locals.supabase,
      userId,
      validationResult.data.source_text
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
          code:
            error.code === "SERVICE_UNAVAILABLE"
              ? "SERVICE_UNAVAILABLE"
              : error.code === "LLM_ERROR"
                ? "LLM_ERROR"
                : "INTERNAL_ERROR",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.httpStatus,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    console.error("Unexpected error in POST /api/generations:", error);
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
