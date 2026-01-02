import React from "react";
import { useGenerateFlashcards } from "../hooks/useGenerateFlashcards";
import { GenerationForm } from "./GenerationForm";
import { SuggestionsList } from "./SuggestionsList";
import { SaveButton } from "./SaveButton";
import { Toaster, toast } from "sonner";

/**
 * Main container component for the AI flashcard generation view.
 * Orchestrates state management and renders all child components.
 */
export const GenerateView: React.FC = () => {
  const {
    state,
    setSourceText,
    generateFlashcards,
    acceptSuggestion,
    rejectSuggestion,
    editSuggestion,
    toggleEditMode,
    acceptAllSuggestions,
    rejectAllSuggestions,
    saveAcceptedFlashcards,
    acceptedCount,
    textValidation,
    canSave,
  } = useGenerateFlashcards();

  // Show error toast when error state changes
  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  // Show success toast after saving
  const [lastSavedCount, setLastSavedCount] = React.useState(0);
  React.useEffect(() => {
    if (
      state.generatedCount > 0 &&
      !state.isSaving &&
      state.suggestions.length === 0 &&
      lastSavedCount !== state.generatedCount
    ) {
      toast.success(`Zapisano ${state.generatedCount} fiszek!`);
      setLastSavedCount(state.generatedCount);
    }
  }, [state.generatedCount, state.isSaving, state.suggestions.length, lastSavedCount]);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Generowanie fiszek AI</h1>
        <p className="text-muted-foreground">
          Wklej tekst źródłowy, a sztuczna inteligencja wygeneruje dla Ciebie propozycje fiszek edukacyjnych.
        </p>
      </header>

      {/* Main content */}
      <main className="space-y-8">
        {/* Generation Form */}
        <section>
          <GenerationForm
            sourceText={state.sourceText}
            onSourceTextChange={setSourceText}
            onSubmit={generateFlashcards}
            isLoading={state.isGenerating}
            disabled={state.isSaving}
            isTextValid={textValidation.isValid}
          />
        </section>

        {/* Suggestions List */}
        <SuggestionsList
          suggestions={state.suggestions}
          isLoading={state.isGenerating}
          onAccept={acceptSuggestion}
          onReject={rejectSuggestion}
          onEdit={editSuggestion}
          onToggleEdit={toggleEditMode}
          onAcceptAll={acceptAllSuggestions}
          onRejectAll={rejectAllSuggestions}
        />

        {/* Save Button - only show when there are suggestions */}
        {state.suggestions.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <SaveButton
              acceptedCount={acceptedCount}
              onSave={saveAcceptedFlashcards}
              isLoading={state.isSaving}
              disabled={!canSave}
            />
          </div>
        )}
      </main>
    </div>
  );
};

GenerateView.displayName = "GenerateView";
