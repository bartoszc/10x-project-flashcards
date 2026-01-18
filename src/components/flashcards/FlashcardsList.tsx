import React from "react";
import type { FlashcardDTO, PaginationDTO } from "@/types";
import { FlashcardCard } from "./FlashcardCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface FlashcardsListProps {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  isUpdating: string | null;
  onEdit: (id: string, front: string, back: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

/**
 * Empty state component when no flashcards exist.
 */
const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📚</div>
    <h3 className="text-lg font-semibold mb-2">Brak fiszek</h3>
    <p className="text-muted-foreground mb-4">
      Nie masz jeszcze żadnych fiszek. Utwórz pierwszą lub wygeneruj za pomocą AI!
    </p>
  </div>
);

/**
 * Loading skeleton for flashcard cards.
 */
const LoadingSkeleton: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-4 border rounded-lg">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-4" />
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Pagination controls.
 */
const Pagination: React.FC<{
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
}> = ({ pagination, onPageChange }) => {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        ← Poprzednia
      </Button>
      <span className="text-sm text-muted-foreground px-4">
        Strona {page} z {total_pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= total_pages}
      >
        Następna →
      </Button>
    </div>
  );
};

/**
 * List of flashcard cards with pagination.
 */
export const FlashcardsList: React.FC<FlashcardsListProps> = ({
  flashcards,
  pagination,
  isLoading,
  isUpdating,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (flashcards.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {flashcards.map((flashcard) => (
          <FlashcardCard
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={onEdit}
            onDelete={onDelete}
            isUpdating={isUpdating === flashcard.id}
          />
        ))}
      </div>
      {pagination && <Pagination pagination={pagination} onPageChange={onPageChange} />}
    </div>
  );
};

FlashcardsList.displayName = "FlashcardsList";
