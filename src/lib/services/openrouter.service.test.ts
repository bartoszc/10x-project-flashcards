import { describe, expect, it } from "vitest";

import {
  convertToSuggestions,
  type LLMFlashcard,
  OpenRouterError,
  parseLLMResponse,
} from "@/lib/services/openrouter.service";

/**
 * Unit tests for OpenRouter service functions.
 *
 * Tests cover:
 * - OpenRouterError: error class with status codes and retryable flag
 * - parseLLMResponse: JSON parsing with markdown cleanup
 * - convertToSuggestions: temp_id generation and field mapping
 */
describe("OpenRouter Service", () => {
  describe("OpenRouterError", () => {
    it("should create error with message only", () => {
      const error = new OpenRouterError("Test error message");

      expect(error.message).toBe("Test error message");
      expect(error.name).toBe("OpenRouterError");
      expect(error.statusCode).toBeUndefined();
      expect(error.isRetryable).toBe(false);
    });

    it("should create error with status code", () => {
      const error = new OpenRouterError("API error", 500);

      expect(error.message).toBe("API error");
      expect(error.statusCode).toBe(500);
      expect(error.isRetryable).toBe(false);
    });

    it("should create retryable error for 5xx status codes", () => {
      const error = new OpenRouterError("Server error", 503, true);

      expect(error.message).toBe("Server error");
      expect(error.statusCode).toBe(503);
      expect(error.isRetryable).toBe(true);
    });

    it("should create non-retryable error for 4xx status codes", () => {
      const error = new OpenRouterError("Bad request", 400, false);

      expect(error.message).toBe("Bad request");
      expect(error.statusCode).toBe(400);
      expect(error.isRetryable).toBe(false);
    });

    it("should be an instance of Error", () => {
      const error = new OpenRouterError("Test");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OpenRouterError);
    });

    it("should have correct error stack", () => {
      const error = new OpenRouterError("Test");

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("OpenRouterError");
    });
  });

  describe("parseLLMResponse", () => {
    describe("clean JSON input", () => {
      it("should parse valid JSON with flashcards array", () => {
        const input = JSON.stringify({
          flashcards: [
            { front: "Question 1?", back: "Answer 1" },
            { front: "Question 2?", back: "Answer 2" },
          ],
        });

        const result = parseLLMResponse(input);

        expect(result.flashcards).toHaveLength(2);
        expect(result.flashcards[0].front).toBe("Question 1?");
        expect(result.flashcards[0].back).toBe("Answer 1");
      });

      it("should return parsed flashcards with correct structure", () => {
        const input = JSON.stringify({
          flashcards: [{ front: "Q?", back: "A" }],
        });

        const result = parseLLMResponse(input);

        expect(result.flashcards[0]).toEqual({
          front: "Q?",
          back: "A",
        });
      });

      it("should handle empty flashcards array", () => {
        const input = JSON.stringify({ flashcards: [] });

        const result = parseLLMResponse(input);

        expect(result.flashcards).toEqual([]);
      });
    });

    describe("markdown code blocks", () => {
      it("should remove ```json prefix from response", () => {
        const input = '```json\n{"flashcards":[{"front":"Q?","back":"A"}]}\n```';

        const result = parseLLMResponse(input);

        expect(result.flashcards).toHaveLength(1);
        expect(result.flashcards[0].front).toBe("Q?");
      });

      it("should remove ``` prefix without json language tag", () => {
        const input = '```\n{"flashcards":[{"front":"Q?","back":"A"}]}\n```';

        const result = parseLLMResponse(input);

        expect(result.flashcards).toHaveLength(1);
      });

      it("should handle response with extra whitespace", () => {
        const input = '  \n```json\n{"flashcards":[{"front":"Q?","back":"A"}]}\n```  \n';

        const result = parseLLMResponse(input);

        expect(result.flashcards).toHaveLength(1);
      });

      it("should handle only closing backticks", () => {
        const input = '{"flashcards":[{"front":"Q?","back":"A"}]}\n```';

        const result = parseLLMResponse(input);

        expect(result.flashcards).toHaveLength(1);
      });
    });

    describe("validation errors", () => {
      it("should throw OpenRouterError for missing flashcards array", () => {
        const input = JSON.stringify({ other: "data" });

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
        expect(() => parseLLMResponse(input)).toThrow("missing flashcards array");
      });

      it("should throw OpenRouterError for non-array flashcards", () => {
        const input = JSON.stringify({ flashcards: "not an array" });

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
        expect(() => parseLLMResponse(input)).toThrow("missing flashcards array");
      });

      it("should throw OpenRouterError for flashcard without front field", () => {
        const input = JSON.stringify({
          flashcards: [{ back: "A" }],
        });

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
        expect(() => parseLLMResponse(input)).toThrow("missing front or back");
      });

      it("should throw OpenRouterError for flashcard without back field", () => {
        const input = JSON.stringify({
          flashcards: [{ front: "Q?" }],
        });

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
        expect(() => parseLLMResponse(input)).toThrow("missing front or back");
      });

      it("should throw OpenRouterError for non-string front field", () => {
        const input = JSON.stringify({
          flashcards: [{ front: 123, back: "A" }],
        });

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
      });

      it("should throw OpenRouterError for non-string back field", () => {
        const input = JSON.stringify({
          flashcards: [{ front: "Q?", back: null }],
        });

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
      });
    });

    describe("JSON parsing errors", () => {
      it("should throw OpenRouterError for invalid JSON", () => {
        const input = "not valid json at all";

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
        expect(() => parseLLMResponse(input)).toThrow("Failed to parse");
      });

      it("should throw OpenRouterError for empty string", () => {
        expect(() => parseLLMResponse("")).toThrow(OpenRouterError);
      });

      it("should throw OpenRouterError for malformed JSON", () => {
        const input = '{"flashcards": [{"front": "Q?"';

        expect(() => parseLLMResponse(input)).toThrow(OpenRouterError);
      });
    });

    describe("edge cases", () => {
      it("should handle flashcards with Polish characters", () => {
        const input = JSON.stringify({
          flashcards: [{ front: "Pytanie z ąćę?", back: "Odpowiedź z żźł" }],
        });

        const result = parseLLMResponse(input);

        expect(result.flashcards[0].front).toBe("Pytanie z ąćę?");
        expect(result.flashcards[0].back).toBe("Odpowiedź z żźł");
      });

      it("should handle flashcards with special characters", () => {
        const input = JSON.stringify({
          flashcards: [{ front: "What's 2 + 2?", back: "It's 4!" }],
        });

        const result = parseLLMResponse(input);

        expect(result.flashcards[0].front).toBe("What's 2 + 2?");
      });

      it("should handle flashcards with newlines in content", () => {
        const input = JSON.stringify({
          flashcards: [{ front: "Line 1\nLine 2", back: "Answer\nwith\nnewlines" }],
        });

        const result = parseLLMResponse(input);

        expect(result.flashcards[0].front).toContain("\n");
        expect(result.flashcards[0].back).toContain("\n");
      });
    });
  });

  describe("convertToSuggestions", () => {
    describe("temp_id generation", () => {
      it("should generate temp_id as 'temp_1' for first flashcard", () => {
        const flashcards: LLMFlashcard[] = [{ front: "Q?", back: "A" }];

        const result = convertToSuggestions(flashcards);

        expect(result[0].temp_id).toBe("temp_1");
      });

      it("should generate sequential temp_ids starting from 1", () => {
        const flashcards: LLMFlashcard[] = [
          { front: "Q1?", back: "A1" },
          { front: "Q2?", back: "A2" },
          { front: "Q3?", back: "A3" },
        ];

        const result = convertToSuggestions(flashcards);

        expect(result[0].temp_id).toBe("temp_1");
        expect(result[1].temp_id).toBe("temp_2");
        expect(result[2].temp_id).toBe("temp_3");
      });

      it("should handle 15 flashcards with correct temp_ids", () => {
        const flashcards: LLMFlashcard[] = Array.from({ length: 15 }, (_, i) => ({
          front: `Question ${i + 1}?`,
          back: `Answer ${i + 1}`,
        }));

        const result = convertToSuggestions(flashcards);

        expect(result).toHaveLength(15);
        expect(result[0].temp_id).toBe("temp_1");
        expect(result[14].temp_id).toBe("temp_15");
      });
    });

    describe("field mapping", () => {
      it("should copy front field from input to output", () => {
        const flashcards: LLMFlashcard[] = [{ front: "Original Question?", back: "A" }];

        const result = convertToSuggestions(flashcards);

        expect(result[0].front).toBe("Original Question?");
      });

      it("should copy back field from input to output", () => {
        const flashcards: LLMFlashcard[] = [{ front: "Q?", back: "Original Answer" }];

        const result = convertToSuggestions(flashcards);

        expect(result[0].back).toBe("Original Answer");
      });

      it("should preserve content with special characters", () => {
        const flashcards: LLMFlashcard[] = [{ front: "Pytanie z ąćę?", back: "Odpowiedź z żźł" }];

        const result = convertToSuggestions(flashcards);

        expect(result[0].front).toBe("Pytanie z ąćę?");
        expect(result[0].back).toBe("Odpowiedź z żźł");
      });
    });

    describe("edge cases", () => {
      it("should return empty array for empty input", () => {
        const result = convertToSuggestions([]);

        expect(result).toEqual([]);
      });

      it("should handle single flashcard", () => {
        const flashcards: LLMFlashcard[] = [{ front: "Q?", back: "A" }];

        const result = convertToSuggestions(flashcards);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          temp_id: "temp_1",
          front: "Q?",
          back: "A",
        });
      });

      it("should return FlashcardSuggestionDTO structure", () => {
        const flashcards: LLMFlashcard[] = [{ front: "Q?", back: "A" }];

        const result = convertToSuggestions(flashcards);

        // Verify structure matches FlashcardSuggestionDTO
        expect(result[0]).toHaveProperty("temp_id");
        expect(result[0]).toHaveProperty("front");
        expect(result[0]).toHaveProperty("back");
        expect(Object.keys(result[0])).toHaveLength(3);
      });
    });
  });
});
