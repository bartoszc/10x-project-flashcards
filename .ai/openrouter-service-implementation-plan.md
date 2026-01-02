# Przewodnik implementacji usługi OpenRouter

## 1. Opis usługi

Usługa OpenRouter (`openrouter.service.ts`) odpowiada za komunikację z API OpenRouter.ai w celu generowania fiszek edukacyjnych przy użyciu modeli LLM. API OpenRouter jest kompatybilne z formatem OpenAI Chat Completions, co umożliwia łatwą integrację i wymienialność modeli.

### Aktualny stan implementacji

Usługa jest **w pełni zaimplementowana** w pliku `src/lib/services/openrouter.service.ts`. Obecna implementacja zawiera:

- Funkcję `generateFlashcards()` do generowania fiszek
- Klasę błędu `OpenRouterError`
- **`response_format` ze schematem JSON** dla ustrukturyzowanych odpowiedzi ✅
- Parsowanie odpowiedzi LLM z walidacją struktury
- Obsługę timeout i retry

---

## 2. Opis konstruktora

> [!NOTE]
> Obecna implementacja wykorzystuje **funkcje modułowe** zamiast klasy. Poniżej opisano oba podejścia.

### Podejście funkcyjne (obecne)

```typescript
// Konfiguracja pobierana z funkcji pomocniczej
function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured", undefined, false);
  }

  return {
    apiKey,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    timeout: 60000, // 60 sekund
  };
}
```

### Podejście klasowe (alternatywne)

```typescript
class OpenRouterService {
  private readonly config: OpenRouterConfig;

  constructor(config?: Partial<OpenRouterConfig>) {
    const apiKey = config?.apiKey ?? import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new OpenRouterError("OPENROUTER_API_KEY is not configured");
    }

    this.config = {
      apiKey,
      baseUrl: config?.baseUrl ?? "https://openrouter.ai/api/v1",
      model: config?.model ?? "openai/gpt-4o-mini",
      timeout: config?.timeout ?? 60000,
    };
  }
}
```

### Interfejs konfiguracji

```typescript
interface OpenRouterConfig {
  apiKey: string; // Klucz API OpenRouter
  baseUrl: string; // URL bazowy API (https://openrouter.ai/api/v1)
  model: string; // Nazwa modelu (np. 'openai/gpt-4o-mini')
  timeout: number; // Timeout w milisekundach
}
```

---

## 3. Publiczne metody i pola

### 3.1. `generateFlashcards(sourceText: string): Promise<OpenRouterFlashcardResponse>`

Główna metoda generująca fiszki z tekstu źródłowego.

**Parametry:**
| Parametr | Typ | Opis |
|--------------|----------|----------------------------------------|
| `sourceText` | `string` | Tekst źródłowy (1000-10000 znaków) |

**Zwraca:**

```typescript
interface OpenRouterFlashcardResponse {
  suggestions: FlashcardSuggestionDTO[]; // Wygenerowane fiszki
  model_name: string; // Nazwa użytego modelu
  llm_response: unknown; // Surowa odpowiedź API
}

interface FlashcardSuggestionDTO {
  temp_id: string; // Tymczasowy identyfikator (np. "temp_1")
  front: string; // Pytanie/przód fiszki
  back: string; // Odpowiedź/tył fiszki
}
```

### 3.2. Klasa `OpenRouterError`

Wyspecjalizowana klasa błędu dla operacji OpenRouter.

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number, // Kod HTTP (jeśli dostępny)
    public readonly isRetryable: boolean = false // Czy można ponowić
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

---

## 4. Prywatne metody i pola

### 4.1. `FLASHCARD_RESPONSE_SCHEMA`

Schemat JSON definiujący strukturę odpowiedzi z LLM. Używany z `response_format` do wymuszenia ustrukturyzowanej odpowiedzi.

```typescript
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
```

### 4.2. `parseLLMResponse(content: string): LLMResponseContent`

Parsuje odpowiedź tekstową z LLM na strukturę fiszek.

**Funkcjonalność:**

- Usuwa bloki markdown (`json`) - zachowane dla kompatybilności wstecznej
- Parsuje JSON do struktury `LLMResponseContent`
- Waliduje obecność tablicy `flashcards`
- Weryfikuje pola `front` i `back` każdej fiszki

```typescript
interface LLMResponseContent {
  flashcards: LLMFlashcard[];
}

interface LLMFlashcard {
  front: string;
  back: string;
}
```

### 4.3. `convertToSuggestions(flashcards: LLMFlashcard[]): FlashcardSuggestionDTO[]`

Konwertuje fiszki z formatu LLM na DTO z tymczasowymi identyfikatorami.

```typescript
function convertToSuggestions(flashcards: LLMFlashcard[]): FlashcardSuggestionDTO[] {
  return flashcards.map((flashcard, index) => ({
    temp_id: `temp_${index + 1}`,
    front: flashcard.front,
    back: flashcard.back,
  }));
}
```

### 4.4. Prompt systemowy

```typescript
const FLASHCARD_GENERATION_PROMPT = `Jesteś ekspertem w tworzeniu fiszek edukacyjnych...`;
```

---

## 5. Konfiguracja kluczowych elementów

### 5.1. Komunikat systemowy (System Message)

Komunikat systemowy definiuje rolę i zachowanie modelu:

```typescript
{
  role: "system",
  content: "You are an expert educational flashcard creator."
}
```

> [!TIP]
> Komunikat systemowy jest krótki i precyzyjny. Szczegółowe instrukcje znajdują się w komunikacie użytkownika. Format JSON jest wymuszany przez `response_format`.

### 5.2. Komunikat użytkownika (User Message)

Komunikat użytkownika zawiera tekst źródłowy i szczegółowe instrukcje:

```typescript
{
  role: "user",
  content: `Jesteś ekspertem w tworzeniu fiszek edukacyjnych...

  Tekst źródłowy:
  ${sourceText}`
}
```

### 5.3. Ustrukturyzowane odpowiedzi (response_format) ✅

Implementacja wykorzystuje `response_format` z `json_schema` do wymuszenia struktury odpowiedzi:

```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "flashcard_generation",
    strict: true,
    schema: FLASHCARD_RESPONSE_SCHEMA,
  },
}
```

**Pełna struktura żądania:**

```typescript
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
});
```

**Korzyści z `response_format`:**

1. ✅ Gwarantowana struktura odpowiedzi JSON
2. ✅ Eliminacja potrzeby instrukcji o formacie JSON w prompcie
3. ✅ Automatyczna walidacja po stronie API
4. ✅ Mniejsze ryzyko błędów parsowania

> [!CAUTION]
> Nie wszystkie modele wspierają `response_format`. Model `openai/gpt-4o-mini` wspiera tę funkcję.

### 5.4. Nazwa modelu (Model Name)

Konfiguracja modelu przez zmienną środowiskową lub wartość domyślną:

```typescript
// Lokalizacja: getOpenRouterConfig()
model: import.meta.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
```

**Dostępne modele** (przykłady):
| Model | Opis |
|--------------------------|--------------------------------|
| `openai/gpt-4o-mini` | Szybki, ekonomiczny (domyślny)|
| `openai/gpt-4o` | Najnowszy model OpenAI |
| `anthropic/claude-3-haiku`| Szybki model Anthropic |
| `google/gemini-pro` | Model Google |

### 5.5. Parametry modelu

```typescript
{
  temperature: 0.7,    // Kreatywność (0.0-2.0)
  max_tokens: 4096,    // Maksymalna długość odpowiedzi
  // Opcjonalne:
  top_p: 1.0,          // Nucleus sampling
  frequency_penalty: 0, // Kara za powtórzenia
  presence_penalty: 0,  // Kara za nowe tematy
}
```

---

## 6. Obsługa błędów

### 6.1. Scenariusze błędów

| Scenariusz          | Kod HTTP | `isRetryable` | Obsługa                         |
| ------------------- | -------- | ------------- | ------------------------------- |
| Brak klucza API     | -        | `false`       | Rzuć wyjątek przy inicjalizacji |
| Timeout żądania     | -        | `true`        | Zwróć błąd 502                  |
| Błąd sieci          | -        | `true`        | Zwróć błąd 502                  |
| API error 4xx       | 4xx      | `false`       | Zwróć błąd 502                  |
| API error 5xx       | 5xx      | `true`        | Zwróć błąd 503                  |
| Pusty content       | -        | `false`       | Zwróć błąd 502                  |
| Niepoprawny JSON    | -        | `false`       | Zwróć błąd 502                  |
| Brak tablicy fiszek | -        | `false`       | Zwróć błąd 502                  |

### 6.2. Wzorzec obsługi błędów

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const isRetryable = response.status >= 500;
    throw new OpenRouterError(
      `OpenRouter API error: ${response.status} ${response.statusText}`,
      response.status,
      isRetryable
    );
  }

  // Parsowanie i walidacja odpowiedzi...
} catch (error) {
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
```

### 6.3. Mapowanie błędów na odpowiedzi HTTP

```typescript
// W endpoint API
try {
  const result = await generateFlashcards(sourceText);
  return new Response(JSON.stringify(result), { status: 201 });
} catch (error) {
  if (error instanceof OpenRouterError) {
    const status = error.isRetryable ? 503 : 502;
    return new Response(
      JSON.stringify({
        error: {
          code: error.isRetryable ? "SERVICE_UNAVAILABLE" : "LLM_ERROR",
          message: "Błąd podczas komunikacji z usługą AI",
        },
      }),
      { status }
    );
  }
  // Nieoczekiwany błąd
  return new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Błąd serwera" } }), { status: 500 });
}
```

---

## 7. Kwestie bezpieczeństwa

### 7.1. Ochrona klucza API

- ✅ Klucz przechowywany w zmiennej środowiskowej `OPENROUTER_API_KEY`
- ✅ Klucz nigdy nie jest eksponowany w odpowiedziach API
- ✅ Klucz nie jest logowany

```env
# .env (NIE commituj tego pliku!)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

```typescript
// src/env.d.ts - typowanie zmiennych środowiskowych
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
}
```

### 7.2. Walidacja danych wejściowych

```typescript
// Przed wywołaniem OpenRouter API
import { z } from "zod";

const sourceTextSchema = z.string().min(1000, "Tekst zbyt krótki").max(10000, "Tekst zbyt długi");
```

### 7.3. Rate Limiting

> [!WARNING]
> Obecna implementacja nie ma wbudowanego rate limitingu. Zalecane jest:

1. **Limity na OpenRouter** - ustawienie limitów finansowych w panelu OpenRouter
2. **Middleware rate limiting** - implementacja w Astro middleware
3. **Per-user limiting** - ograniczenie żądań na użytkownika

### 7.4. Nagłówki bezpieczeństwa

```typescript
headers: {
  'Authorization': `Bearer ${config.apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://10x-cards.app',  // Identyfikacja aplikacji
  'X-Title': '10x-cards',                    // Nazwa aplikacji
}
```

---

## 8. Plan wdrożenia krok po kroku

### Krok 1: Weryfikacja istniejącej implementacji ✅

Usługa jest już zaimplementowana w:

- `src/lib/services/openrouter.service.ts`

**Status:** Kompletna, działająca implementacja z `response_format`.

### Krok 2: Konfiguracja zmiennych środowiskowych ✅

**Plik:** `.env`

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

**Status:** Wymaga dodania klucza przez użytkownika.

### Krok 3: Implementacja response_format ✅

**Status:** Zaimplementowane.

Schemat JSON (`FLASHCARD_RESPONSE_SCHEMA`) jest używany z `response_format`:

```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "flashcard_generation",
    strict: true,
    schema: FLASHCARD_RESPONSE_SCHEMA,
  },
}
```

### Krok 4: Weryfikacja działania

**Testowanie manualne:**

```bash
# Generowanie fiszek przez API
curl -X POST http://localhost:4321/api/generations \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "[tekst 1000-10000 znaków]"
  }'
```

**Oczekiwana odpowiedź:**

```json
{
  "session_id": "uuid",
  "suggestions": [
    {
      "temp_id": "temp_1",
      "front": "Wygenerowane pytanie?",
      "back": "Wygenerowana odpowiedź"
    }
  ],
  "generated_count": 5,
  "model_name": "openai/gpt-4o-mini"
}
```

---

## 9. Podsumowanie

### Istniejące pliki

| Plik                                     | Status       | Opis                                         |
| ---------------------------------------- | ------------ | -------------------------------------------- |
| `src/lib/services/openrouter.service.ts` | ✅ Kompletny | Główna usługa OpenRouter z `response_format` |
| `src/lib/schemas/generation.schema.ts`   | ✅ Istnieje  | Schemat walidacji Zod                        |
| `src/lib/services/generation.service.ts` | ✅ Istnieje  | Serwis logiki biznesowej                     |
| `src/pages/api/generations.ts`           | ✅ Istnieje  | Endpoint API                                 |

### Zalecane ulepszenia

| Ulepszenie                | Priorytet | Status           |
| ------------------------- | --------- | ---------------- |
| Dodanie `response_format` | ✅        | Zaimplementowane |
| Rate limiting             | 🔴 Wysoki | Do zrobienia     |
| Retry logic               | 🔶 Średni | Do zrobienia     |
| Streaming                 | ⚪ Niski  | Do zrobienia     |

### Architektura przepływu danych

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Klient    │────▶│  /api/generations│────▶│  generation.    │
│             │     │                  │     │  service.ts     │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
                    ┌──────────────────┐     ┌─────────────────┐
                    │  OpenRouter API  │◀────│  openrouter.    │
                    │  (openrouter.ai) │     │  service.ts     │
                    └──────────────────┘     └─────────────────┘
```
