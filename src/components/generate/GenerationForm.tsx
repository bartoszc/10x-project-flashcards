import React from "react";
import { Button } from "@/components/ui/button";
import { TextareaWithCounter } from "./TextareaWithCounter";

interface GenerationFormProps {
  onSubmit: (sourceText: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  isTextValid: boolean;
}

/**
 * Form component for entering source text and triggering AI flashcard generation.
 */
export const GenerationForm: React.FC<GenerationFormProps> = ({
  onSubmit,
  isLoading,
  disabled = false,
  sourceText,
  onSourceTextChange,
  isTextValid,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTextValid && !isLoading && !disabled) {
      await onSubmit(sourceText);
    }
  };

  const isButtonDisabled = !isTextValid || isLoading || disabled;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="source-text" className="block text-sm font-medium mb-2">
          Tekst źródłowy
        </label>
        <TextareaWithCounter
          id="source-text"
          value={sourceText}
          onChange={onSourceTextChange}
          disabled={isLoading || disabled}
          placeholder="Wklej tekst źródłowy, z którego chcesz wygenerować fiszki (1000-10000 znaków)..."
        />
      </div>

      <Button type="submit" disabled={isButtonDisabled} className="w-full sm:w-auto" size="lg">
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Generowanie...
          </>
        ) : (
          "Generuj fiszki"
        )}
      </Button>
    </form>
  );
};

GenerationForm.displayName = "GenerationForm";
