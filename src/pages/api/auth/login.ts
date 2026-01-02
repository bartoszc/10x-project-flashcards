import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 *
 * Request body:
 * - email: string (required, valid email format)
 * - password: string (required, min 1 char)
 *
 * Responses:
 * - 200: Login successful with session data
 * - 400: Validation error (invalid input)
 * - 401: Invalid credentials
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const rawBody = await request.json();

    // Validate input using Zod schema
    const validationResult = loginSchema.safeParse(rawBody);

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

    // Login user via AuthService
    const supabase = locals.supabase;
    const result = await AuthService.login(supabase, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
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
    console.error("[API] Login error:", error);
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
