import type { APIRoute } from "astro";
import { resetPasswordSchema } from "../../../lib/schemas/auth.schema";
import { AuthService, AuthError } from "../../../lib/services/auth.service";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/reset-password
 *
 * Requests a password reset email for a given email address.
 *
 * Request body:
 * - email: string (required, valid email format)
 *
 * Responses:
 * - 200: Request accepted (always success message)
 * - 400: Validation error
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const rawBody = await request.json();
    const validationResult = resetPasswordSchema.safeParse(rawBody);

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
    const result = await AuthService.resetPassword(supabase, validationResult.data.email);

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

    console.error("[API] Reset password error:", error);
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
