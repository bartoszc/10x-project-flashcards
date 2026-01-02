import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/register
 *
 * Registers a new user account.
 *
 * Request body:
 * - email: string (required, valid email format, max 255 chars)
 * - password: string (required, min 8 chars, max 72 chars)
 *
 * Responses:
 * - 201: User registered successfully with session data
 * - 400: Validation error (invalid input)
 * - 409: Email already registered
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const rawBody = await request.json();

    // Validate input using Zod schema
    const validationResult = registerSchema.safeParse(rawBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: {
            field: firstError.path.join("."),
            reason: firstError.message,
          },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Register user via AuthService
    const supabase = locals.supabase;
    const result = await AuthService.register(supabase, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle AuthError with specific status codes
    if (error instanceof AuthError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: error.code,
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
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

    // Handle unexpected errors
    console.error("[API] Register error:", error);
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
