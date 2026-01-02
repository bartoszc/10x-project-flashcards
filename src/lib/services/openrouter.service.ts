import type { FlashcardSuggestionDTO } from "../../types";

/**
 * Response structure from OpenRouter API for flashcard generation.
 */
export interface OpenRouterFlashcardResponse {
  suggestions: FlashcardSuggestionDTO[];
  model_name: string;
  llm_response: unknown;
}

/**
 * Error thrown when OpenRouter API fails.
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isRetryable = false
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Configuration for OpenRouter API.
 */
interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout: number;
}

/**
 * Structure of flashcard in LLM response.
 */
export interface LLMFlashcard {
  front: string;
  back: string;
}

/**
 * Expected JSON structure from LLM response.
 */
export interface LLMResponseContent {
  flashcards: LLMFlashcard[];
}

/**
 * JSON Schema for flashcard generation response.
 * Used with response_format to enforce structured output.
 */
const FLASHCARD_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      description: "Array of generated flashcards",
      items: {
        type: "object",
        properties: {
          front: {
            type: "string",
            description: "Question or front side of the flashcard",
          },
          back: {
            type: "string",
            description: "Answer or back side of the flashcard",
          },
        },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
} as const;

/**
 * Prompt template for flashcard generation.
 * Note: JSON format instructions are removed as response_format handles this.
 */
const FLASHCARD_GENERATION_PROMPT = `Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Na podstawie podanego tekstu źródłowego wygeneruj zestaw fiszek w formacie pytanie-odpowiedź.

Zasady:
1. Każda fiszka powinna zawierać konkretne, sprawdzalne fakty
2. Pytania (front) powinny być jasne i jednoznaczne
3. Odpowiedzi (back) powinny być zwięzłe, ale kompletne
4. Unikaj pytań zbyt ogólnych lub wieloznacznych
5. Wygeneruj 5-15 fiszek w zależności od ilości materiału

Tekst źródłowy:
{source_text}`;

/**
 * OpenRouter API response structure.
 */
interface OpenRouterAPIResponse {
  id: string;
  model: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Gets OpenRouter configuration from environment variables.
 */
function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured", undefined, false);
  }

  return {
    apiKey,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    timeout: 60000, // 60 seconds
  };
}

/**
 * Parses JSON content from LLM response.
 * Handles cases where response might be wrapped in markdown code blocks.
 */
export function parseLLMResponse(content: string): LLMResponseContent {
  // Remove potential markdown code blocks
  let cleanedContent = content.trim();

  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.slice(7);
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.slice(3);
  }

  if (cleanedContent.endsWith("```")) {
    cleanedContent = cleanedContent.slice(0, -3);
  }

  cleanedContent = cleanedContent.trim();

  try {
    const parsed = JSON.parse(cleanedContent) as LLMResponseContent;

    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new OpenRouterError("Invalid LLM response: missing flashcards array", undefined, false);
    }

    // Validate each flashcard has required fields
    for (const flashcard of parsed.flashcards) {
      if (typeof flashcard.front !== "string" || typeof flashcard.back !== "string") {
        throw new OpenRouterError("Invalid LLM response: flashcard missing front or back", undefined, false);
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw error;
    }
    throw new OpenRouterError(
      `Failed to parse LLM response: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      false
    );
  }
}

/**
 * Converts LLM flashcards to DTOs with temporary IDs.
 */
export function convertToSuggestions(flashcards: LLMFlashcard[]): FlashcardSuggestionDTO[] {
  return flashcards.map((flashcard, index) => ({
    temp_id: `temp_${index + 1}`,
    front: flashcard.front,
    back: flashcard.back,
  }));
}

/**
 * Generates flashcard suggestions from source text using OpenRouter API.
 *
 * @param sourceText - The source text to generate flashcards from (1000-10000 characters)
 * @returns Promise with flashcard suggestions, model name, and raw LLM response
 * @throws OpenRouterError if API call fails or response parsing fails
 */
export async function generateFlashcards(sourceText: string): Promise<OpenRouterFlashcardResponse> {
  const config = getOpenRouterConfig();

  const prompt = FLASHCARD_GENERATION_PROMPT.replace("{source_text}", sourceText);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://10x-cards.app",
        "X-Title": "10x-cards",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content: "You are an expert educational flashcard creator.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "flashcard_generation",
            strict: true,
            schema: FLASHCARD_RESPONSE_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const isRetryable = response.status >= 500;
      throw new OpenRouterError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        response.status,
        isRetryable
      );
    }

    const data = (await response.json()) as OpenRouterAPIResponse;

    if (!data.choices?.[0]?.message?.content) {
      throw new OpenRouterError("OpenRouter API returned empty response", undefined, false);
    }

    const llmContent = data.choices[0].message.content;
    const parsedResponse = parseLLMResponse(llmContent);
    const suggestions = convertToSuggestions(parsedResponse.flashcards);

    return {
      suggestions,
      model_name: data.model || config.model,
      llm_response: data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof OpenRouterError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenRouterError("OpenRouter API request timed out", undefined, true);
    }

    throw new OpenRouterError(
      `Failed to call OpenRouter API: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      false
    );
  }
}
