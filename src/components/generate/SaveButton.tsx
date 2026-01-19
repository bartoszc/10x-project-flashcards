import React from "react";
import { Button } from "@/components/ui/button";

interface SaveButtonProps {
  acceptedCount: number;
  onSave: () => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

/**
 * Button for saving accepted flashcards to the database.
 * Shows count of accepted flashcards and loading state.
 */
export const SaveButton: React.FC<SaveButtonProps> = ({ acceptedCount, onSave, isLoading, disabled = false }) => {
  const isDisabled = disabled || acceptedCount === 0 || isLoading;

  const handleClick = async () => {
    if (!isDisabled) {
      await onSave();
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        size="lg"
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Zapisywanie...
          </>
        ) : (
          `Zapisz zaakceptowane fiszki (${acceptedCount})`
        )}
      </Button>
    </div>
  );
};

SaveButton.displayName = "SaveButton";
