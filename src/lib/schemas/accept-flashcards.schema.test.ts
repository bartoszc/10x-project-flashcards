import { describe, expect, it } from "vitest";

import { acceptFlashcardsSchema } from "@/lib/schemas/accept-flashcards.schema";

/**
 * Unit tests for accept-flashcards schema.
 *
 * Business rules:
 * - accepted: array of flashcards (can be empty)
 * - Each flashcard must have: temp_id (non-empty), front (1-1000 chars), back (1-5000 chars)
 * - rejected_count: non-negative integer
 */
describe("Accept Flashcards Schema", () => {
  describe("acceptFlashcardsSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid request with multiple flashcards", () => {
        const validData = {
          accepted: [
            { temp_id: "temp_1", front: "Question 1?", back: "Answer 1" },
            { temp_id: "temp_2", front: "Question 2?", back: "Answer 2" },
          ],
          rejected_count: 3,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept empty accepted array with rejected_count", () => {
        const validData = {
          accepted: [],
          rejected_count: 5,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept when all flashcards accepted (rejected_count = 0)", () => {
        const validData = {
          accepted: [{ temp_id: "temp_1", front: "Q?", back: "A" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept front with exactly 1000 characters (maximum boundary)", () => {
        const validData = {
          accepted: [
            {
              temp_id: "temp_1",
              front: "a".repeat(1000),
              back: "Answer",
            },
          ],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept back with exactly 5000 characters (maximum boundary)", () => {
        const validData = {
          accepted: [
            {
              temp_id: "temp_1",
              front: "Question?",
              back: "a".repeat(5000),
            },
          ],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should accept flashcard with Polish characters", () => {
        const validData = {
          accepted: [
            {
              temp_id: "temp_1",
              front: "Jakie są polskie znaki? ąćęłńóśźż",
              back: "Polskie znaki to: ĄĆĘŁŃÓŚŹŻ i ąćęłńóśźż",
            },
          ],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe("invalid temp_id", () => {
      it("should reject empty temp_id", () => {
        const invalidData = {
          accepted: [{ temp_id: "", front: "Q?", back: "A" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject missing temp_id", () => {
        const invalidData = {
          accepted: [{ front: "Q?", back: "A" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid front field", () => {
      it("should reject empty front", () => {
        const invalidData = {
          accepted: [{ temp_id: "temp_1", front: "", back: "A" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          const frontError = result.error.issues.find((i) => i.path.includes("front"));
          expect(frontError).toBeDefined();
        }
      });

      it("should reject front exceeding 1000 characters", () => {
        const invalidData = {
          accepted: [
            {
              temp_id: "temp_1",
              front: "a".repeat(1001),
              back: "Answer",
            },
          ],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("1000");
        }
      });

      it("should reject missing front field", () => {
        const invalidData = {
          accepted: [{ temp_id: "temp_1", back: "A" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid back field", () => {
      it("should reject empty back", () => {
        const invalidData = {
          accepted: [{ temp_id: "temp_1", front: "Q?", back: "" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject back exceeding 5000 characters", () => {
        const invalidData = {
          accepted: [
            {
              temp_id: "temp_1",
              front: "Question?",
              back: "a".repeat(5001),
            },
          ],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("5000");
        }
      });

      it("should reject missing back field", () => {
        const invalidData = {
          accepted: [{ temp_id: "temp_1", front: "Q?" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid rejected_count", () => {
      it("should reject negative rejected_count", () => {
        const invalidData = {
          accepted: [],
          rejected_count: -1,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject non-integer rejected_count", () => {
        const invalidData = {
          accepted: [],
          rejected_count: 2.5,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject missing rejected_count", () => {
        const invalidData = {
          accepted: [{ temp_id: "temp_1", front: "Q?", back: "A" }],
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject string rejected_count", () => {
        const invalidData = {
          accepted: [],
          rejected_count: "5",
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("invalid accepted array", () => {
      it("should reject non-array accepted", () => {
        const invalidData = {
          accepted: "not an array",
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it("should reject missing accepted field", () => {
        const invalidData = {
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should accept single character front and back", () => {
        const validData = {
          accepted: [{ temp_id: "temp_1", front: "Q", back: "A" }],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should handle large number of flashcards", () => {
        const manyFlashcards = Array.from({ length: 100 }, (_, i) => ({
          temp_id: `temp_${i + 1}`,
          front: `Question ${i + 1}?`,
          back: `Answer ${i + 1}`,
        }));

        const validData = {
          accepted: manyFlashcards,
          rejected_count: 50,
        };

        const result = acceptFlashcardsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it("should validate all flashcards in array (fail on last invalid)", () => {
        const invalidData = {
          accepted: [
            { temp_id: "temp_1", front: "Valid Q?", back: "Valid A" },
            { temp_id: "temp_2", front: "Valid Q2?", back: "Valid A2" },
            { temp_id: "temp_3", front: "", back: "A3" }, // Invalid front
          ],
          rejected_count: 0,
        };

        const result = acceptFlashcardsSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });
});
