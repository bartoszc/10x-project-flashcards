import React from "react";
import { useFlashcards } from "@/components/hooks/useFlashcards";
import { FlashcardsList } from "./FlashcardsList";
import { FlashcardForm } from "./FlashcardForm";
import { FlashcardsFilters } from "./FlashcardsFilters";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

/**
 * Main container component for the flashcards management view.
 * Orchestrates state management and renders all child components.
 */
export const FlashcardsView: React.FC = () => {
  const { state, createFlashcard, updateFlashcard, deleteFlashcard, setFilters, goToPage } = useFlashcards();

  // State for delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteFlashcard(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Moje fiszki</h1>
            <p className="text-muted-foreground mt-1">
              {state.pagination ? `${state.pagination.total} fiszek` : "Zarządzaj swoimi fiszkami"}
            </p>
          </div>
          <FlashcardForm
            onSubmit={createFlashcard}
            isLoading={state.isCreating}
            trigger={<Button>+ Nowa fiszka</Button>}
          />
        </div>

        {/* Filters */}
        <FlashcardsFilters
          source={state.filters.source}
          sort={state.filters.sort}
          order={state.filters.order}
          onSourceChange={(source) => setFilters({ source, page: 1 })}
          onSortChange={(sort) => setFilters({ sort, page: 1 })}
          onOrderChange={(order) => setFilters({ order, page: 1 })}
        />
      </header>

      {/* Main content */}
      <main>
        <FlashcardsList
          flashcards={state.flashcards}
          pagination={state.pagination}
          isLoading={state.isLoading}
          isUpdating={state.isUpdating}
          onEdit={updateFlashcard}
          onDelete={handleDeleteClick}
          onPageChange={goToPage}
        />
      </main>

      {/* Delete confirmation dialog */}
      <DeleteFlashcardDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={state.isDeleting !== null}
      />
    </div>
  );
};

FlashcardsView.displayName = "FlashcardsView";
