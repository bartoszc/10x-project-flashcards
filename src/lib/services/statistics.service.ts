import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { GenerationStatisticsDTO, FlashcardsBySourceDTO } from "../../types";

/**
 * Gets AI generation statistics for a user.
 */
export async function getGenerationStatistics(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<GenerationStatisticsDTO> {
  // Get generation sessions summary
  const { data: sessions, error: sessionsError } = await supabase
    .from("generation_sessions")
    .select("generated_count, accepted_count, rejected_count")
    .eq("user_id", userId);

  if (sessionsError) {
    console.error("Error fetching generation sessions:", sessionsError);
    throw new Error("Failed to fetch generation statistics");
  }

  const totalSessions = sessions?.length ?? 0;
  const totalGenerated = sessions?.reduce((sum, s) => sum + s.generated_count, 0) ?? 0;
  const totalAccepted = sessions?.reduce((sum, s) => sum + s.accepted_count, 0) ?? 0;
  const totalRejected = sessions?.reduce((sum, s) => sum + s.rejected_count, 0) ?? 0;

  // Get flashcards by source
  const { data: flashcards, error: flashcardsError } = await supabase
    .from("flashcards")
    .select("source")
    .eq("user_id", userId);

  if (flashcardsError) {
    console.error("Error fetching flashcards:", flashcardsError);
    throw new Error("Failed to fetch flashcard statistics");
  }

  const aiCount = flashcards?.filter((f) => f.source === "ai").length ?? 0;
  const manualCount = flashcards?.filter((f) => f.source === "manual").length ?? 0;
  const totalFlashcards = aiCount + manualCount;

  const flashcardsBySource: FlashcardsBySourceDTO = {
    ai: aiCount,
    manual: manualCount,
  };

  // Calculate rates
  const acceptanceRate = totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 1000) / 10 : 0;

  const aiUsagePercentage = totalFlashcards > 0 ? Math.round((aiCount / totalFlashcards) * 1000) / 10 : 0;

  return {
    total_sessions: totalSessions,
    total_generated: totalGenerated,
    total_accepted: totalAccepted,
    total_rejected: totalRejected,
    acceptance_rate: acceptanceRate,
    flashcards_by_source: flashcardsBySource,
    ai_usage_percentage: aiUsagePercentage,
  };
}
