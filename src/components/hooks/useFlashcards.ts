import { useState, useCallback, useEffect } from "react";
import type { FlashcardDTO, PaginationDTO } from "@/types";
import { toast } from "sonner";

/**
 * Filter and sorting options for flashcards list.
 */
interface FlashcardsFilters {
  page: number;
  limit: number;
  source?: "ai" | "manual";
  sort: "created_at" | "updated_at" | "next_review_date";
  order: "asc" | "desc";
}

/**
 * State for flashcards list view.
 */
interface FlashcardsState {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO | null;
  filters: FlashcardsFilters;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: string | null; // ID of flashcard being updated
  isDeleting: string | null; // ID of flashcard being deleted
  error: string | null;
}

const DEFAULT_FILTERS: FlashcardsFilters = {
  page: 1,
  limit: 20,
  sort: "created_at",
  order: "desc",
};

/**
 * Hook for managing flashcards list state and CRUD operations.
 */
export function useFlashcards() {
  const [state, setState] = useState<FlashcardsState>({
    flashcards: [],
    pagination: null,
    filters: DEFAULT_FILTERS,
    isLoading: false,
    isCreating: false,
    isUpdating: null,
    isDeleting: null,
    error: null,
  });

  /**
   * Fetches flashcards from API with current filters.
   */
  const fetchFlashcards = useCallback(
    async (filters?: Partial<FlashcardsFilters>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const currentFilters = { ...state.filters, ...filters };

      try {
        const params = new URLSearchParams();
        params.set("page", currentFilters.page.toString());
        params.set("limit", currentFilters.limit.toString());
        params.set("sort", currentFilters.sort);
        params.set("order", currentFilters.order);
        if (currentFilters.source) {
          params.set("source", currentFilters.source);
        }

        const response = await fetch(`/api/flashcards?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch flashcards");
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          flashcards: data.data,
          pagination: data.pagination,
          filters: currentFilters,
          isLoading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred";
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        toast.error(message);
      }
    },
    [state.filters]
  );

  /**
   * Creates a new flashcard.
   */
  const createFlashcard = useCallback(async (front: string, back: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isCreating: true, error: null }));

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front, back }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create flashcard");
      }

      const newFlashcard: FlashcardDTO = await response.json();

      setState((prev) => ({
        ...prev,
        flashcards: [newFlashcard, ...prev.flashcards],
        pagination: prev.pagination ? { ...prev.pagination, total: prev.pagination.total + 1 } : null,
        isCreating: false,
      }));

      toast.success("Fiszka utworzona!");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, isCreating: false, error: message }));
      toast.error(message);
      return false;
    }
  }, []);

  /**
   * Updates an existing flashcard.
   */
  const updateFlashcard = useCallback(async (id: string, front: string, back: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isUpdating: id, error: null }));

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front, back }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update flashcard");
      }

      const updatedFlashcard: FlashcardDTO = await response.json();

      setState((prev) => ({
        ...prev,
        flashcards: prev.flashcards.map((f) => (f.id === id ? updatedFlashcard : f)),
        isUpdating: null,
      }));

      toast.success("Fiszka zaktualizowana!");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, isUpdating: null, error: message }));
      toast.error(message);
      return false;
    }
  }, []);

  /**
   * Deletes a flashcard.
   */
  const deleteFlashcard = useCallback(async (id: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isDeleting: id, error: null }));

    try {
      const response = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete flashcard");
      }

      setState((prev) => ({
        ...prev,
        flashcards: prev.flashcards.filter((f) => f.id !== id),
        pagination: prev.pagination ? { ...prev.pagination, total: prev.pagination.total - 1 } : null,
        isDeleting: null,
      }));

      toast.success("Fiszka usunięta!");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, isDeleting: null, error: message }));
      toast.error(message);
      return false;
    }
  }, []);

  /**
   * Updates filters and refetches.
   */
  const setFilters = useCallback(
    (newFilters: Partial<FlashcardsFilters>) => {
      fetchFlashcards(newFilters);
    },
    [fetchFlashcards]
  );

  /**
   * Goes to a specific page.
   */
  const goToPage = useCallback(
    (page: number) => {
      fetchFlashcards({ page });
    },
    [fetchFlashcards]
  );

  // Fetch flashcards on mount

  useEffect(() => {
    fetchFlashcards();
  }, []);

  return {
    state,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    setFilters,
    goToPage,
  };
}
