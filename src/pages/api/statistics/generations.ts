import type { APIRoute } from "astro";

import { getGenerationStatistics } from "@/lib/services/statistics.service";
import type { ErrorResponseDTO, GenerationStatisticsDTO } from "@/types";

export const prerender = false;

/**
 * GET /api/statistics/generations
 *
 * Gets AI generation statistics for the authenticated user.
 *
 * Responses:
 * - 200: Statistics retrieved successfully
 * - 401: User not authenticated
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
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

  // 2. Get statistics via service
  try {
    const statistics: GenerationStatisticsDTO = await getGenerationStatistics(locals.supabase, user.id);

    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting generation statistics:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve statistics",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
