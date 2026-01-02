import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCounter } from "./CharacterCounter";
import { MIN_SOURCE_TEXT_LENGTH, MAX_SOURCE_TEXT_LENGTH } from "./types";

interface TextareaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Textarea component with integrated character counter.
 * Provides real-time character count and validation feedback.
 */
export const TextareaWithCounter: React.FC<TextareaWithCounterProps> = ({
  value,
  onChange,
  minLength = MIN_SOURCE_TEXT_LENGTH,
  maxLength = MAX_SOURCE_TEXT_LENGTH,
  placeholder = "Wklej tekst źródłowy, z którego chcesz wygenerować fiszki...",
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const isInvalid = value.length > 0 && (value.length < minLength || value.length > maxLength);

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`min-h-[200px] resize-y ${
          isInvalid ? "border-destructive focus-visible:ring-destructive" : ""
        }`}
        aria-describedby="character-counter"
        aria-invalid={isInvalid}
      />
      <div id="character-counter">
        <CharacterCounter
          currentCount={value.length}
          minLength={minLength}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
};

TextareaWithCounter.displayName = "TextareaWithCounter";
