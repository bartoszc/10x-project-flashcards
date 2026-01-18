import React from "react";
import { useLearning } from "@/components/hooks/useLearning";
import { FlashcardFlip } from "./FlashcardFlip";
import { RatingButtons } from "./RatingButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";

/**
 * Empty state when no flashcards are due for review.
 */
const NoFlashcardsState: React.FC<{ onGoToFlashcards: () => void }> = ({ onGoToFlashcards }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🎉</div>
    <h2 className="text-2xl font-bold mb-2">Wszystko przerobione!</h2>
    <p className="text-muted-foreground mb-6">Nie masz teraz żadnych fiszek do powtórki.</p>
    <Button onClick={onGoToFlashcards}>Przejdź do fiszek</Button>
  </div>
);

/**
 * Start session screen.
 */
const StartSessionScreen: React.FC<{
  onStart: () => void;
  isStarting: boolean;
}> = ({ onStart, isStarting }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📚</div>
    <h2 className="text-2xl font-bold mb-2">Sesja nauki</h2>
    <p className="text-muted-foreground mb-6">
      Rozpocznij sesję nauki z wykorzystaniem algorytmu spaced repetition.
    </p>
    <Button onClick={onStart} disabled={isStarting} size="lg">
      {isStarting ? "Ładowanie..." : "Rozpocznij naukę"}
    </Button>
  </div>
);

/**
 * Session summary after completion.
 */
const SessionSummary: React.FC<{
  reviewedCount: number;
  durationMinutes: number;
  onNewSession: () => void;
  onGoHome: () => void;
}> = ({ reviewedCount, durationMinutes, onNewSession, onGoHome }) => (
  <Card className="max-w-md mx-auto">
    <CardHeader>
      <CardTitle className="text-center">🎉 Sesja zakończona!</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-3xl font-bold">{reviewedCount}</p>
          <p className="text-sm text-muted-foreground">Przerobione fiszki</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-3xl font-bold">{durationMinutes}</p>
          <p className="text-sm text-muted-foreground">Minuty</p>
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={onGoHome}>
          Strona główna
        </Button>
        <Button onClick={onNewSession}>Kolejna sesja</Button>
      </div>
    </CardContent>
  </Card>
);

/**
 * Progress bar for session.
 */
const ProgressBar: React.FC<{ reviewed: number; total: number }> = ({ reviewed, total }) => {
  const progress = total > 0 ? (reviewed / total) * 100 : 0;

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-1">
        <span>Postęp</span>
        <span>
          {reviewed} / {total}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Main learning session view component.
 */
export const LearningView: React.FC = () => {
  const { state, startSession, submitRating, endSession, resetSession } = useLearning();
  const [isFlipped, setIsFlipped] = React.useState(false);

  const handleStart = async () => {
    await startSession();
  };

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    setIsFlipped(false);
    await submitRating(rating);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleEndSession = async () => {
    await endSession();
  };

  const handleNewSession = () => {
    resetSession();
  };

  const handleGoToFlashcards = () => {
    window.location.href = "/flashcards";
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  // No session started yet
  if (!state.sessionId && !state.isStarting && state.error !== "no-flashcards") {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Toaster richColors position="top-right" />
        <StartSessionScreen onStart={handleStart} isStarting={state.isStarting} />
      </div>
    );
  }

  // No flashcards available
  if (state.error === "no-flashcards") {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Toaster richColors position="top-right" />
        <NoFlashcardsState onGoToFlashcards={handleGoToFlashcards} />
      </div>
    );
  }

  // Session complete
  if (state.isSessionComplete) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Toaster richColors position="top-right" />
        <SessionSummary
          reviewedCount={state.sessionSummary?.flashcards_reviewed ?? state.reviewedCount}
          durationMinutes={state.sessionSummary?.duration_minutes ?? 0}
          onNewSession={handleNewSession}
          onGoHome={handleGoHome}
        />
      </div>
    );
  }

  // Loading state
  if (state.isLoading || state.isStarting) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Toaster richColors position="top-right" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-full max-w-lg mx-auto rounded-xl" />
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    );
  }

  // Active session with flashcard
  const totalCards = state.remainingCount + state.reviewedCount;

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Toaster richColors position="top-right" />

      {/* Header with progress */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Nauka</h1>
          <Button variant="ghost" size="sm" onClick={handleEndSession}>
            Zakończ sesję
          </Button>
        </div>
        <ProgressBar reviewed={state.reviewedCount} total={totalCards} />
      </header>

      {/* Flashcard */}
      {state.currentFlashcard && (
        <main className="space-y-8">
          <FlashcardFlip
            front={state.currentFlashcard.front}
            back={state.currentFlashcard.back}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />

          {/* Rating buttons - only show when flipped */}
          {isFlipped && (
            <RatingButtons onRate={handleRate} isDisabled={state.isSubmitting} />
          )}
        </main>
      )}
    </div>
  );
};

LearningView.displayName = "LearningView";
