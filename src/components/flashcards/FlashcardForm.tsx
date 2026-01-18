import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FlashcardFormProps {
  onSubmit: (front: string, back: string) => Promise<boolean>;
  isLoading: boolean;
  trigger: React.ReactNode;
}

/**
 * Modal dialog for creating a new flashcard.
 */
export const FlashcardForm: React.FC<FlashcardFormProps> = ({ onSubmit, isLoading, trigger }) => {
  const [open, setOpen] = React.useState(false);
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [errors, setErrors] = React.useState<{ front?: string; back?: string }>({});

  const validate = (): boolean => {
    const newErrors: { front?: string; back?: string } = {};

    if (!front.trim()) {
      newErrors.front = "Tekst przedni jest wymagany";
    } else if (front.length > 500) {
      newErrors.front = "Maksymalnie 500 znaków";
    }

    if (!back.trim()) {
      newErrors.back = "Tekst tylny jest wymagany";
    } else if (back.length > 1000) {
      newErrors.back = "Maksymalnie 1000 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const success = await onSubmit(front.trim(), back.trim());

    if (success) {
      setFront("");
      setBack("");
      setErrors({});
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFront("");
      setBack("");
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nowa fiszka</DialogTitle>
            <DialogDescription>Utwórz nową fiszkę ręcznie.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">Przód (pytanie)</Label>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Wpisz pytanie lub termin..."
                rows={3}
                className={errors.front ? "border-destructive" : ""}
              />
              {errors.front && <p className="text-sm text-destructive">{errors.front}</p>}
              <p className="text-xs text-muted-foreground text-right">{front.length}/500</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">Tył (odpowiedź)</Label>
              <Textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Wpisz odpowiedź lub definicję..."
                rows={3}
                className={errors.back ? "border-destructive" : ""}
              />
              {errors.back && <p className="text-sm text-destructive">{errors.back}</p>}
              <p className="text-xs text-muted-foreground text-right">{back.length}/1000</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Tworzenie..." : "Utwórz fiszkę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

FlashcardForm.displayName = "FlashcardForm";
