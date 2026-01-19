import type { APIRoute } from "astro";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by invalidating their session.
 * Requires authentication - user must have a valid session.
 *
 * Headers:
 * - Authorization: Bearer <access_token> (required)
 *
 * Responses:
 * - 200: Logout successful
 * - 401: Not authenticated
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ locals }) => {
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

    // Logout user via AuthService
    await AuthService.logout(supabase);

    // Redirect to homepage after successful logout
    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
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
    console.error("[API] Logout error:", error);
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
