import type { APIRoute } from "astro";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * DELETE /api/auth/account
 *
 * Deletes the authenticated user's account and all associated data.
 * This operation is irreversible and complies with GDPR requirements.
 *
 * Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Responses:
 * - 200: Account deleted successfully
 * - 401: Not authenticated
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Delete account via AuthService
    const result = await AuthService.deleteAccount(supabase, user.id);

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

    // Handle unexpected errors
    console.error("[API] Delete account error:", error);
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
