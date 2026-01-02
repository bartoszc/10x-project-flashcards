import React from "react";
import { MIN_SOURCE_TEXT_LENGTH, MAX_SOURCE_TEXT_LENGTH } from "./types";

interface CharacterCounterProps {
  currentCount: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Character counter component with color-coded validation feedback.
 * Displays current count and provides visual cues for text length validity.
 */
export const CharacterCounter: React.FC<CharacterCounterProps> = React.memo(
  ({
    currentCount,
    minLength = MIN_SOURCE_TEXT_LENGTH,
    maxLength = MAX_SOURCE_TEXT_LENGTH,
  }) => {
    const getStatusColor = (): string => {
      if (currentCount < minLength) {
        return "text-muted-foreground";
      }
      if (currentCount > maxLength) {
        return "text-destructive";
      }
      return "text-green-600 dark:text-green-400";
    };

    const getStatusMessage = (): string => {
      if (currentCount < minLength) {
        return `Minimum ${minLength} znaków`;
      }
      if (currentCount > maxLength) {
        return `Przekroczono limit ${maxLength} znaków`;
      }
      return "Poprawna długość";
    };

    return (
      <div
        className={`flex items-center justify-between text-sm ${getStatusColor()}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">{getStatusMessage()}</span>
        <span aria-hidden="true">
          {currentCount.toLocaleString("pl-PL")} / {maxLength.toLocaleString("pl-PL")} znaków
        </span>
      </div>
    );
  }
);

CharacterCounter.displayName = "CharacterCounter";
