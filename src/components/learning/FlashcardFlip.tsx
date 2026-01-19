import React from "react";

interface FlashcardFlipProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

/**
 * 3D flip card component for learning sessions.
 * Click or press Space to flip.
 */
export const FlashcardFlip: React.FC<FlashcardFlipProps> = ({ front, back, isFlipped, onFlip }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div
      className="perspective-1000 w-full max-w-lg mx-auto h-64 cursor-pointer"
      onClick={onFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={
        isFlipped
          ? "Flashcard showing answer, click to show question"
          : "Flashcard showing question, click to show answer"
      }
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front side */}
        <div className="absolute w-full h-full backface-hidden bg-card border rounded-xl shadow-lg flex items-center justify-center p-6">
          <p className="text-xl font-medium text-center text-foreground">{front}</p>
        </div>

        {/* Back side */}
        <div className="absolute w-full h-full backface-hidden bg-primary/10 border rounded-xl shadow-lg flex items-center justify-center p-6 rotate-y-180">
          <p className="text-lg text-center text-foreground">{back}</p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        {isFlipped ? "Kliknij lub naciśnij Space, aby wrócić" : "Kliknij lub naciśnij Space, aby odkryć odpowiedź"}
      </p>
    </div>
  );
};

FlashcardFlip.displayName = "FlashcardFlip";
