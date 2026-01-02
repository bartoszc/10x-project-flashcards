import React from "react";
import type { SuggestionViewModel } from "./types";
import { SuggestionCard } from "./SuggestionCard";
import { SkeletonList } from "./SkeletonList";
import { BulkActions } from "./BulkActions";

interface SuggestionsListProps {
  suggestions: SuggestionViewModel[];
  isLoading: boolean;
  onAccept: (tempId: string) => void;
  onReject: (tempId: string) => void;
  onEdit: (tempId: string, front: string, back: string) => void;
  onToggleEdit: (tempId: string, isEditing: boolean) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

/**
 * List of AI-generated flashcard suggestions with bulk actions.
 * Displays skeleton loaders during generation, empty state, or list of cards.
 */
export const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  isLoading,
  onAccept,
  onReject,
  onEdit,
  onToggleEdit,
  onAcceptAll,
  onRejectAll,
}) => {
  const pendingCount = suggestions.filter((s) => s.status === "pending").length;
  const hasUnreviewedSuggestions = pendingCount > 0;

  if (isLoading) {
    return (
      <section aria-busy="true" aria-label="Generowanie propozycji fiszek">
        <SkeletonList count={4} />
      </section>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section aria-label="Lista propozycji fiszek">
      {/* Header with bulk actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Propozycje fiszek ({suggestions.length})</h2>
        <BulkActions
          onAcceptAll={onAcceptAll}
          onRejectAll={onRejectAll}
          hasUnreviewedSuggestions={hasUnreviewedSuggestions}
        />
      </div>

      {/* Status summary */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4" aria-live="polite">
          <span>Oczekujące: {pendingCount}</span>
          <span className="text-green-600 dark:text-green-400">
            Zaakceptowane: {suggestions.filter((s) => s.status === "accepted").length}
          </span>
          <span className="text-destructive">
            Odrzucone: {suggestions.filter((s) => s.status === "rejected").length}
          </span>
        </div>
      )}

      {/* Cards list */}
      <ul className="space-y-4">
        {suggestions.map((suggestion) => (
          <li key={suggestion.temp_id}>
            <SuggestionCard
              suggestion={suggestion}
              onAccept={() => onAccept(suggestion.temp_id)}
              onReject={() => onReject(suggestion.temp_id)}
              onEdit={(front, back) => onEdit(suggestion.temp_id, front, back)}
              onToggleEdit={(isEditing) => onToggleEdit(suggestion.temp_id, isEditing)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

SuggestionsList.displayName = "SuggestionsList";
