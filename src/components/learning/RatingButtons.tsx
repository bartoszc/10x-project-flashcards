import React from "react";
import { Button } from "@/components/ui/button";

interface RatingButtonsProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  isDisabled: boolean;
}

/**
 * Rating buttons for FSRS-compatible flashcard review.
 * 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
 */
export const RatingButtons: React.FC<RatingButtonsProps> = ({ onRate, isDisabled }) => {
  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (isDisabled) return;

      const key = e.key;
      if (key === "1") onRate(1);
      else if (key === "2") onRate(2);
      else if (key === "3") onRate(3);
      else if (key === "4") onRate(4);
    },
    [onRate, isDisabled]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">Oceń swoją odpowiedź (klawisze 1-4)</p>
      <div className="flex gap-2 justify-center flex-wrap">
        <Button variant="destructive" onClick={() => onRate(1)} disabled={isDisabled} className="min-w-[80px]">
          <span className="mr-1">1</span> Powtórz
        </Button>
        <Button
          variant="outline"
          onClick={() => onRate(2)}
          disabled={isDisabled}
          className="min-w-[80px] border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
        >
          <span className="mr-1">2</span> Trudne
        </Button>
        <Button
          variant="outline"
          onClick={() => onRate(3)}
          disabled={isDisabled}
          className="min-w-[80px] border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
        >
          <span className="mr-1">3</span> Dobrze
        </Button>
        <Button
          variant="default"
          onClick={() => onRate(4)}
          disabled={isDisabled}
          className="min-w-[80px] bg-green-600 hover:bg-green-700"
        >
          <span className="mr-1">4</span> Łatwe
        </Button>
      </div>
    </div>
  );
};

RatingButtons.displayName = "RatingButtons";
