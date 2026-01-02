import React, { useState, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SuggestionViewModel } from "./types";

interface SuggestionCardProps {
  suggestion: SuggestionViewModel;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (front: string, back: string) => void;
  onToggleEdit: (isEditing: boolean) => void;
}

/**
 * Individual flashcard suggestion card with inline editing and action buttons.
 */
export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  onEdit,
  onToggleEdit,
}) => {
  const [editFront, setEditFront] = useState(suggestion.front);
  const [editBack, setEditBack] = useState(suggestion.back);

  const handleStartEdit = useCallback(() => {
    setEditFront(suggestion.front);
    setEditBack(suggestion.back);
    onToggleEdit(true);
  }, [suggestion.front, suggestion.back, onToggleEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditFront(suggestion.front);
    setEditBack(suggestion.back);
    onToggleEdit(false);
  }, [suggestion.front, suggestion.back, onToggleEdit]);

  const handleSaveEdit = useCallback(() => {
    if (editFront.trim() && editBack.trim()) {
      onEdit(editFront.trim(), editBack.trim());
    }
  }, [editFront, editBack, onEdit]);

  const isEditValid = editFront.trim().length > 0 && editBack.trim().length > 0;

  const getStatusStyles = () => {
    switch (suggestion.status) {
      case "accepted":
        return "border-green-500 bg-green-50 dark:bg-green-950/30";
      case "rejected":
        return "border-destructive bg-destructive/10 opacity-60";
      default:
        return "border-border";
    }
  };

  const getStatusBadge = () => {
    switch (suggestion.status) {
      case "accepted":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Zaakceptowana
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Odrzucona
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`w-full transition-colors ${getStatusStyles()}`}>
      <CardContent className="pt-6 space-y-4">
        {/* Status badge */}
        {suggestion.status !== "pending" && <div className="flex justify-end">{getStatusBadge()}</div>}

        {/* Front field */}
        <div className="space-y-2">
          <label htmlFor={`front-${suggestion.temp_id}`} className="text-sm font-medium text-muted-foreground">
            Przód
          </label>
          {suggestion.isEditing ? (
            <Textarea
              id={`front-${suggestion.temp_id}`}
              value={editFront}
              onChange={(e) => setEditFront(e.target.value)}
              className="min-h-[80px]"
              placeholder="Wpisz treść przodu fiszki..."
            />
          ) : (
            <p id={`front-${suggestion.temp_id}`} className="p-3 bg-muted rounded-md min-h-[80px] whitespace-pre-wrap">
              {suggestion.front}
            </p>
          )}
        </div>

        {/* Back field */}
        <div className="space-y-2">
          <label htmlFor={`back-${suggestion.temp_id}`} className="text-sm font-medium text-muted-foreground">
            Tył
          </label>
          {suggestion.isEditing ? (
            <Textarea
              id={`back-${suggestion.temp_id}`}
              value={editBack}
              onChange={(e) => setEditBack(e.target.value)}
              className="min-h-[80px]"
              placeholder="Wpisz treść tyłu fiszki..."
            />
          ) : (
            <p id={`back-${suggestion.temp_id}`} className="p-3 bg-muted rounded-md min-h-[80px] whitespace-pre-wrap">
              {suggestion.back}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap justify-end gap-2">
        {suggestion.isEditing ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
              Anuluj
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={!isEditValid}>
              Zapisz zmiany
            </Button>
          </>
        ) : suggestion.status === "pending" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              Odrzuć
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              Edytuj
            </Button>
            <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700 text-white">
              Akceptuj
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleStartEdit}>
            Edytuj
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

SuggestionCard.displayName = "SuggestionCard";
