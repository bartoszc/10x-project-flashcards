import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlashcardsFiltersProps {
  source?: "ai" | "manual";
  sort: "created_at" | "updated_at" | "next_review_date";
  order: "asc" | "desc";
  onSourceChange: (source?: "ai" | "manual") => void;
  onSortChange: (sort: "created_at" | "updated_at" | "next_review_date") => void;
  onOrderChange: (order: "asc" | "desc") => void;
}

/**
 * Filter controls for flashcards list.
 */
export const FlashcardsFilters: React.FC<FlashcardsFiltersProps> = ({
  source,
  sort,
  order,
  onSourceChange,
  onSortChange,
  onOrderChange,
}) => {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Source filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Źródło:</span>
        <Select
          value={source || "all"}
          onValueChange={(value) => onSourceChange(value === "all" ? undefined : (value as "ai" | "manual"))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
            <SelectItem value="manual">Ręczne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort field */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sortuj:</span>
        <Select value={sort} onValueChange={(value) => onSortChange(value as typeof sort)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Data utworzenia</SelectItem>
            <SelectItem value="updated_at">Data aktualizacji</SelectItem>
            <SelectItem value="next_review_date">Następna powtórka</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort order */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Kolejność:</span>
        <Select value={order} onValueChange={(value) => onOrderChange(value as typeof order)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Malejąco</SelectItem>
            <SelectItem value="asc">Rosnąco</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

FlashcardsFilters.displayName = "FlashcardsFilters";
