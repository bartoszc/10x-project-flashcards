import { z } from "zod";

/**
 * Schema for validating a single accepted flashcard.
 * Validates temp_id, front (max 1000 chars), and back (max 5000 chars).
 */
const acceptedFlashcardSchema = z.object({
  temp_id: z.string().min(1, "Identyfikator tymczasowy jest wymagany"),
  front: z
    .string({ required_error: "Treść pytania jest wymagana" })
    .min(1, "Treść pytania nie może być pusta")
    .max(1000, "Treść pytania nie może przekraczać 1000 znaków"),
  back: z
    .string({ required_error: "Treść odpowiedzi jest wymagana" })
    .min(1, "Treść odpowiedzi nie może być pusta")
    .max(5000, "Treść odpowiedzi nie może przekraczać 5000 znaków"),
});

/**
 * Schema for validating the accept flashcards request body.
 * Contains array of accepted flashcards and rejected_count.
 */
export const acceptFlashcardsSchema = z.object({
  accepted: z.array(acceptedFlashcardSchema).min(0, "Lista zaakceptowanych fiszek musi być tablicą"),
  rejected_count: z
    .number({ required_error: "Liczba odrzuconych fiszek jest wymagana" })
    .int("Liczba odrzuconych musi być liczbą całkowitą")
    .min(0, "Liczba odrzuconych nie może być ujemna"),
});

/**
 * Type inferred from the acceptFlashcardsSchema.
 * Represents validated input for accepting flashcards.
 */
export type AcceptFlashcardsInput = z.infer<typeof acceptFlashcardsSchema>;
