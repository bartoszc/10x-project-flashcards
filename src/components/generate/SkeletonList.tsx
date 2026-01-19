import React from "react";
import { SuggestionCardSkeleton } from "./SuggestionCardSkeleton";

interface SkeletonListProps {
  count?: number;
}

/**
 * List of skeleton placeholders during flashcard generation.
 * Shows multiple skeleton cards to indicate loading state.
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({ count = 4 }) => {
  return (
    <ul className="space-y-4" aria-label="Ładowanie propozycji fiszek">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <SuggestionCardSkeleton />
        </li>
      ))}
    </ul>
  );
};

SkeletonList.displayName = "SkeletonList";
