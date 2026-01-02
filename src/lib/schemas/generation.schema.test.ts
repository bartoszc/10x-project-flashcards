import { describe, expect, it } from "vitest";

import { generateFlashcardsSchema } from "@/lib/schemas/generation.schema";

/**
 * Unit tests for generation schema.
 *
 * Business rules:
 * - source_text is required
 * - source_text minimum: 1000 characters
 * - source_text maximum: 10000 characters
 */
describe("Generation Schema", () => {
  describe("generateFlashcardsSchema", () => {
    // Helper to create source text of specific length
    const createTextOfLength = (length: number): string => "a".repeat(length);

    describe("valid inputs", () => {
      it("should accept text with exactly 1000 characters (minimum boundary)", () => {
        const validData = {
          source_text: createTextOfLength(1000),
        };

        const result = generateFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept text with exactly 10000 characters (maximum boundary)", () => {
        const validData = {
          source_text: createTextOfLength(10000),
        };

        const result = generateFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept text within valid range (5000 characters)", () => {
        const validData = {
          source_text: createTextOfLength(5000),
        };

        const result = generateFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept text with Polish diacritics and special characters", () => {
        // Polish text with diacritics (each char counts as 1)
        const polishText = "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ".repeat(50) + "a".repeat(50);
        const paddedText = polishText + "a".repeat(1000 - polishText.length);

        const validData = {
          source_text: paddedText,
        };

        const result = generateFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid inputs - too short", () => {
      it("should reject text with 0 characters (empty string)", () => {
        const invalidData = {
          source_text: "",
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("1000");
        }
      });

      it("should reject text with 999 characters (one below minimum)", () => {
        const invalidData = {
          source_text: createTextOfLength(999),
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("1000");
        }
      });

      it("should reject text with 500 characters (well below minimum)", () => {
        const invalidData = {
          source_text: createTextOfLength(500),
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - too long", () => {
      it("should reject text with 10001 characters (one above maximum)", () => {
        const invalidData = {
          source_text: createTextOfLength(10001),
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("10000");
        }
      });

      it("should reject text with 15000 characters (well above maximum)", () => {
        const invalidData = {
          source_text: createTextOfLength(15000),
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - missing or wrong type", () => {
      it("should reject missing source_text field", () => {
        const invalidData = {};

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject null source_text", () => {
        const invalidData = {
          source_text: null,
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject numeric source_text", () => {
        const invalidData = {
          source_text: 12345,
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject array source_text", () => {
        const invalidData = {
          source_text: ["some", "text"],
        };

        const result = generateFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("whitespace handling", () => {
      it("should count whitespace characters in length", () => {
        // Text with spaces should count each space as a character
        const textWithSpaces = "word ".repeat(200); // 1000 chars
        const validData = {
          source_text: textWithSpaces,
        };

        const result = generateFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept text with newlines and tabs", () => {
        const textWithNewlines = "line\n".repeat(200) + createTextOfLength(200);
        const validData = {
          source_text: textWithNewlines,
        };

        const result = generateFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });
});
