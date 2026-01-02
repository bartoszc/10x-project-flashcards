import React from "react";
import { Button } from "@/components/ui/button";

interface BulkActionsProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  hasUnreviewedSuggestions: boolean;
  disabled?: boolean;
}

/**
 * Bulk action buttons for accepting or rejecting all pending suggestions.
 */
export const BulkActions: React.FC<BulkActionsProps> = ({
  onAcceptAll,
  onRejectAll,
  hasUnreviewedSuggestions,
  disabled = false,
}) => {
  const isDisabled = disabled || !hasUnreviewedSuggestions;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onAcceptAll}
        disabled={isDisabled}
        className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
      >
        Zaakceptuj wszystkie
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRejectAll}
        disabled={isDisabled}
        className="text-destructive border-destructive hover:bg-destructive/10"
      >
        Odrzuć wszystkie
      </Button>
    </div>
  );
};

BulkActions.displayName = "BulkActions";
