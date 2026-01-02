import { z } from 'zod';

/**
 * Schema for validating flashcard generation request.
 * Validates source_text field with length constraints (1000-10000 characters).
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string({ required_error: 'Tekst źródłowy jest wymagany' })
    .min(1000, 'Tekst źródłowy musi zawierać co najmniej 1000 znaków')
    .max(10000, 'Tekst źródłowy nie może przekraczać 10000 znaków'),
});

/**
 * Type inferred from the generateFlashcardsSchema.
 * Represents validated input for flashcard generation.
 */
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
