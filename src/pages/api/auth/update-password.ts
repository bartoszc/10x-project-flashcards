import type { APIRoute } from "astro";
import { updatePasswordSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/update-password
 *
 * Updates the password for the current authenticated user.
 * Expects the user to be authenticated (e.g., via recovery token).
 *
 * Request body:
 * - password: string (required, min 8 chars)
 * - confirmPassword: string (required, must match password)
 *
 * Responses:
 * - 200: Password updated successfully
 * - 400: Validation error or weak password
 * - 401: Unauthorized (missing session)
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const rawBody = await request.json();
    const validationResult = updatePasswordSchema.safeParse(rawBody);

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

    const supabase = locals.supabase;
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
       const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired session. Please try resetting your password again.",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await AuthService.updatePassword(supabase, validationResult.data.password);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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

    console.error("[API] Update password error:", error);
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
