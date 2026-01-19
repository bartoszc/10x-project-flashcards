import React from "react";
import type { FlashcardDTO } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FlashcardCardProps {
  flashcard: FlashcardDTO;
  onEdit: (id: string, front: string, back: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

/**
 * Single flashcard card with inline editing capability.
 */
export const FlashcardCard: React.FC<FlashcardCardProps> = ({ flashcard, onEdit, onDelete, isUpdating }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editFront, setEditFront] = React.useState(flashcard.front);
  const [editBack, setEditBack] = React.useState(flashcard.back);

  const handleSave = async () => {
    const success = await onEdit(flashcard.id, editFront, editBack);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditFront(flashcard.front);
    setEditBack(flashcard.back);
    setIsEditing(false);
  };

  const sourceLabel = flashcard.source === "ai" ? "AI" : "Ręczna";
  const sourceBadgeClass =
    flashcard.source === "ai"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label htmlFor={`edit-front-${flashcard.id}`} className="text-sm font-medium text-muted-foreground">
                Przód
              </label>
              <Textarea
                id={`edit-front-${flashcard.id}`}
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <label htmlFor={`edit-back-${flashcard.id}`} className="text-sm font-medium text-muted-foreground">
                Tył
              </label>
              <Textarea
                id={`edit-back-${flashcard.id}`}
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUpdating}>
                Anuluj
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{flashcard.front}</p>
                <p className="text-muted-foreground mt-1 text-sm">{flashcard.back}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${sourceBadgeClass}`}>
                {sourceLabel}
              </span>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edytuj
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(flashcard.id)}>
                Usuń
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

FlashcardCard.displayName = "FlashcardCard";
