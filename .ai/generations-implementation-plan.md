# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Endpoint `POST /api/generations` służy do generowania sugestii fiszek edukacyjnych przez model AI na podstawie dostarczonego tekstu źródłowego. Jest to kluczowa funkcjonalność aplikacji 10x-cards, umożliwiająca automatyczne tworzenie materiałów do nauki.

**Główne zadania:**

- Przyjęcie tekstu źródłowego od użytkownika (1000-10000 znaków)
- Utworzenie rekordu sesji generowania w bazie danych
- Wywołanie API OpenRouter.ai z odpowiednim promptem
- Parsowanie odpowiedzi LLM na strukturę fiszek
- Zwrócenie sugestii fiszek z tymczasowymi identyfikatorami

---

## 2. Szczegóły żądania

### Metoda HTTP

`POST`

### Struktura URL

```
/api/generations
```

### Nagłówki

| Nagłówek        | Wartość                 | Wymagany |
| --------------- | ----------------------- | -------- |
| `Authorization` | `Bearer <access_token>` | Tak      |
| `Content-Type`  | `application/json`      | Tak      |

### Parametry

#### Wymagane

| Parametr      | Typ      | Opis                      | Walidacja                           |
| ------------- | -------- | ------------------------- | ----------------------------------- |
| `source_text` | `string` | Tekst źródłowy do analizy | Min: 1000 znaków, Max: 10000 znaków |

#### Opcjonalne

Brak opcjonalnych parametrów.

### Request Body

```json
{
  "source_text": "Długi tekst źródłowy zawierający treść edukacyjną między 1000 a 10000 znaków..."
}
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// src/types.ts - istniejące typy

/**
 * Command dla inicjowania generacji fiszek AI.
 */
export interface GenerateFlashcardsCommand {
  source_text: string;
}

/**
 * Pojedyncza sugestia fiszki zwrócona przez generację AI.
 */
export interface FlashcardSuggestionDTO {
  temp_id: string;
  front: string;
  back: string;
}

/**
 * Odpowiedź z endpointu generacji fiszek AI.
 */
export interface GenerationResponseDTO {
  session_id: string;
  suggestions: FlashcardSuggestionDTO[];
  generated_count: number;
  model_name: string;
}

/**
 * Standardowa struktura odpowiedzi błędu.
 */
export interface ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetailsDTO;
  };
}
```

### Zod Schemas (do utworzenia)

```typescript
// src/lib/schemas/generation.schema.ts

import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

---

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "session_id": "uuid",
  "suggestions": [
    {
      "temp_id": "temp_1",
      "front": "Wygenerowane pytanie 1?",
      "back": "Wygenerowana odpowiedź 1"
    },
    {
      "temp_id": "temp_2",
      "front": "Wygenerowane pytanie 2?",
      "back": "Wygenerowana odpowiedź 2"
    }
  ],
  "generated_count": 5,
  "model_name": "gpt-4o-mini"
}
```

### Kody statusu

| Kod                         | Opis                                                          |
| --------------------------- | ------------------------------------------------------------- |
| `201 Created`               | Pomyślne wygenerowanie sugestii fiszek                        |
| `400 Bad Request`           | `source_text` nie spełnia wymagań (długość 1000-10000 znaków) |
| `401 Unauthorized`          | Brak autoryzacji lub nieprawidłowy token                      |
| `502 Bad Gateway`           | Błąd API LLM (OpenRouter)                                     |
| `503 Service Unavailable`   | Usługa LLM tymczasowo niedostępna                             |
| `500 Internal Server Error` | Nieoczekiwany błąd serwera                                    |

### Przykłady odpowiedzi błędów

#### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Walidacja danych wejściowych nie powiodła się",
    "details": {
      "field": "source_text",
      "reason": "Tekst musi zawierać od 1000 do 10000 znaków"
    }
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wymagana autoryzacja"
  }
}
```

#### 502 Bad Gateway

```json
{
  "error": {
    "code": "LLM_ERROR",
    "message": "Błąd podczas komunikacji z usługą AI"
  }
}
```

---

## 5. Przepływ danych

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  API Endpoint    │────▶│  Auth Check     │
│             │     │  /api/generations│     │  (Middleware)   │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
                    ┌──────────────────┐     ┌─────────────────┐
                    │  Zod Validation  │◀────│  Request Body   │
                    │  (Schema)        │     │  Parsing        │
                    └────────┬─────────┘     └─────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Generation      │
                    │  Service         │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Create     │  │  Call       │  │  Parse      │
    │  Session    │  │  OpenRouter │  │  LLM        │
    │  (Supabase) │  │  API        │  │  Response   │
    └─────────────┘  └─────────────┘  └─────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Update Session  │
                    │  with LLM Data   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Return Response │
                    │  (201 Created)   │
                    └──────────────────┘
```

### Szczegółowy przepływ:

1. **Weryfikacja autoryzacji**
   - Middleware sprawdza token JWT z nagłówka `Authorization`
   - Pobiera `user_id` z sesji Supabase

2. **Walidacja danych wejściowych**
   - Parsowanie JSON z body żądania
   - Walidacja przez schemat Zod (`generateFlashcardsSchema`)
   - Sprawdzenie długości `source_text` (1000-10000 znaków)

3. **Utworzenie sesji generowania**
   - Wstawienie rekordu do tabeli `generation_sessions`
   - Zapisanie `source_text`, `user_id`, inicjalne wartości

4. **Wywołanie OpenRouter API**
   - Przygotowanie promptu z tekstem źródłowym
   - Wywołanie API z konfiguracją modelu
   - Obsługa timeout i retry

5. **Parsowanie odpowiedzi LLM**
   - Ekstrakcja struktury fiszek z odpowiedzi
   - Generowanie tymczasowych ID (`temp_1`, `temp_2`, ...)
   - Walidacja formatu odpowiedzi

6. **Aktualizacja sesji**
   - Zapisanie `llm_response` (surowa odpowiedź)
   - Zapisanie `model_name` i `model_params`
   - Ustawienie `generated_count`

7. **Zwrócenie odpowiedzi**
   - Format `GenerationResponseDTO`
   - Status 201 Created

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie

- **JWT Token**: Wymagany ważny token w nagłówku `Authorization: Bearer <token>`
- **Weryfikacja sesji**: Użycie `supabase.auth.getUser()` do weryfikacji tokena
- **Timeout tokena**: Tokeny wygasają po 1 godzinie

### 6.2. Autoryzacja

- **RLS (Row Level Security)**: Automatyczne filtrowanie po `user_id = auth.uid()`
- **Izolacja danych**: Użytkownik ma dostęp tylko do własnych sesji generowania

### 6.3. Walidacja danych wejściowych

| Zagrożenie        | Zabezpieczenie                         |
| ----------------- | -------------------------------------- |
| SQL Injection     | Parametryzowane zapytania Supabase SDK |
| XSS               | Walidacja Zod, brak renderowania HTML  |
| Oversized payload | Limit 10000 znaków dla `source_text`   |
| Missing fields    | Walidacja wymaganych pól przez Zod     |

### 6.4. Ochrona API klucza

- Klucz OpenRouter przechowywany w zmiennych środowiskowych (`import.meta.env.OPENROUTER_API_KEY`)
- Klucz nigdy nie jest eksponowany w odpowiedziach API
- Rate limiting na poziomie OpenRouter (limity finansowe)

### 6.5. Rate Limiting

- **Zalecane**: 10 żądań na minutę na użytkownika dla endpointu generacji
- Implementacja przez middleware lub Supabase Edge Functions

---

## 7. Obsługa błędów

### 7.1. Scenariusze błędów i kody statusu

| Scenariusz                        | Kod HTTP | ErrorCode             | Obsługa                      |
| --------------------------------- | -------- | --------------------- | ---------------------------- |
| Brak tokena autoryzacji           | 401      | `UNAUTHORIZED`        | Early return przed walidacją |
| Nieprawidłowy token               | 401      | `UNAUTHORIZED`        | Supabase auth error          |
| `source_text` < 1000 znaków       | 400      | `VALIDATION_ERROR`    | Zod validation error         |
| `source_text` > 10000 znaków      | 400      | `VALIDATION_ERROR`    | Zod validation error         |
| Brak `source_text`                | 400      | `VALIDATION_ERROR`    | Zod required field           |
| OpenRouter API timeout            | 502      | `LLM_ERROR`           | Catch timeout, return error  |
| OpenRouter API error (4xx)        | 502      | `LLM_ERROR`           | Log error, generic message   |
| OpenRouter API error (5xx)        | 503      | `SERVICE_UNAVAILABLE` | Retry logic, then error      |
| Niepoprawny format odpowiedzi LLM | 502      | `LLM_ERROR`           | Parse error handling         |
| Błąd zapisu do bazy               | 500      | `INTERNAL_ERROR`      | Log error, rollback          |
| Nieoczekiwany błąd                | 500      | `INTERNAL_ERROR`      | Generic error, logging       |

### 7.2. Strategia logowania błędów

```typescript
// Struktura logowania błędów
interface ErrorLog {
  timestamp: string;
  endpoint: string;
  user_id: string | null;
  error_code: ErrorCode;
  error_message: string;
  stack_trace?: string;
  request_id?: string;
}
```

### 7.3. Wzorzec obsługi błędów

```typescript
// Guard clauses pattern
export async function POST({ request, locals }: APIContext) {
  // 1. Auth check (early return)
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: { code: "UNAUTHORIZED", message: "Wymagana autoryzacja" },
      }),
      { status: 401 }
    );
  }

  // 2. Body parsing (early return)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: { code: "VALIDATION_ERROR", message: "Nieprawidłowy format JSON" },
      }),
      { status: 400 }
    );
  }

  // 3. Validation (early return)
  const validationResult = generateFlashcardsSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Walidacja nie powiodła się",
          details: validationResult.error.flatten(),
        },
      }),
      { status: 400 }
    );
  }

  // 4. Business logic (happy path)
  // ...
}
```

---

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

| Operacja                  | Czas   | Ryzyko     |
| ------------------------- | ------ | ---------- |
| Wywołanie OpenRouter API  | 5-30s  | ⚠️ Wysokie |
| Zapis do bazy danych      | <100ms | ✅ Niskie  |
| Walidacja Zod             | <10ms  | ✅ Niskie  |
| Parsowanie odpowiedzi LLM | <50ms  | ✅ Niskie  |

### 8.2. Strategie optymalizacji

1. **Timeout dla OpenRouter API**
   - Ustawić timeout na 60 sekund
   - Informować użytkownika o długim czasie oczekiwania

2. **Streaming odpowiedzi (przyszła optymalizacja)**
   - OpenRouter wspiera streaming
   - Możliwość pokazania postępu generowania

3. **Caching modeli**
   - Cache konfiguracji modelu (nie odpowiedzi)

4. **Indeksy bazodanowe**
   - `idx_generation_sessions_user_id` już utworzony

### 8.3. Limity zasobów

| Zasób               | Limit        | Powód                                    |
| ------------------- | ------------ | ---------------------------------------- |
| `source_text`       | 10000 znaków | Kontrola kosztów API, czas przetwarzania |
| Generowane fiszki   | ~10-20       | Zależne od tekstu źródłowego             |
| Concurrent requests | 10/min/user  | Rate limiting                            |

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/schemas/generation.schema.ts`

```typescript
import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  source_text: z
    .string({ required_error: "Tekst źródłowy jest wymagany" })
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków"),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

---

### Krok 2: Utworzenie serwisu OpenRouter

**Plik:** `src/lib/services/openrouter.service.ts`

**Odpowiedzialności:**

- Konfiguracja klienta HTTP dla OpenRouter API
- Budowanie promptu dla generacji fiszek
- Wywołanie API z obsługą błędów
- Parsowanie odpowiedzi LLM na strukturę fiszek

**Interfejs:**

```typescript
export interface OpenRouterService {
  generateFlashcards(sourceText: string): Promise<{
    suggestions: FlashcardSuggestionDTO[];
    model_name: string;
    llm_response: unknown;
  }>;
}
```

---

### Krok 3: Utworzenie serwisu generacji

**Plik:** `src/lib/services/generation.service.ts`

**Odpowiedzialności:**

- Koordynacja procesu generacji
- Tworzenie sesji generowania w bazie
- Wywołanie OpenRouter service
- Aktualizacja sesji z wynikami

**Interfejs:**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

export interface GenerationService {
  generateFlashcards(
    supabase: SupabaseClient<Database>,
    userId: string,
    sourceText: string
  ): Promise<GenerationResponseDTO>;
}
```

---

### Krok 4: Utworzenie endpointu API

**Plik:** `src/pages/api/generations.ts`

**Struktura:**

```typescript
import type { APIContext } from "astro";
import { generateFlashcardsSchema } from "@/lib/schemas/generation.schema";
import { generationService } from "@/lib/services/generation.service";

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  // 1. Autoryzacja
  // 2. Walidacja
  // 3. Wywołanie serwisu
  // 4. Zwrócenie odpowiedzi
}
```

---

### Krok 5: Konfiguracja zmiennych środowiskowych

**Plik:** `.env` (aktualizacja)

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini
```

**Plik:** `src/env.d.ts` (aktualizacja)

```typescript
interface ImportMetaEnv {
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_BASE_URL: string;
  readonly OPENROUTER_MODEL: string;
}
```

---

### Krok 6: Implementacja promptu dla LLM

**Lokalizacja:** `src/lib/services/openrouter.service.ts` lub osobny plik prompts

**Format promptu:**

```typescript
const FLASHCARD_GENERATION_PROMPT = `
Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Na podstawie podanego tekstu źródłowego wygeneruj zestaw fiszek w formacie pytanie-odpowiedź.

Zasady:
1. Każda fiszka powinna zawierać konkretne, sprawdzalne fakty
2. Pytania (front) powinny być jasne i jednoznaczne
3. Odpowiedzi (back) powinny być zwięzłe, ale kompletne
4. Unikaj pytań zbyt ogólnych lub wieloznacznych
5. Wygeneruj 5-15 fiszek w zależności od ilości materiału

Tekst źródłowy:
{source_text}

Odpowiedz WYŁĄCZNIE w formacie JSON:
{
  "flashcards": [
    {"front": "pytanie 1", "back": "odpowiedź 1"},
    {"front": "pytanie 2", "back": "odpowiedź 2"}
  ]
}
`;
```

---

### Krok 7: Testy jednostkowe

**Pliki testów:**

- `src/lib/services/__tests__/generation.service.test.ts`
- `src/lib/services/__tests__/openrouter.service.test.ts`
- `src/lib/schemas/__tests__/generation.schema.test.ts`

**Przypadki testowe:**

1. **Walidacja schematu**
   - ✅ Tekst 1000 znaków - akceptacja
   - ✅ Tekst 10000 znaków - akceptacja
   - ❌ Tekst 999 znaków - odrzucenie
   - ❌ Tekst 10001 znaków - odrzucenie
   - ❌ Brak pola source_text - odrzucenie

2. **Serwis OpenRouter**
   - ✅ Poprawna odpowiedź LLM
   - ❌ Timeout API
   - ❌ Błąd 4xx
   - ❌ Błąd 5xx
   - ❌ Niepoprawny format JSON

3. **Serwis generacji**
   - ✅ Pełny przepływ sukcesu
   - ❌ Błąd zapisu sesji
   - ❌ Błąd aktualizacji sesji

---

### Krok 8: Testy integracyjne

**Plik:** `tests/api/generations.test.ts`

**Scenariusze:**

1. Pełny przepływ generacji (E2E)
2. Brak autoryzacji
3. Nieprawidłowe dane wejściowe
4. Mock błędu OpenRouter

---

## 10. Podsumowanie plików do utworzenia/modyfikacji

| Plik                                     | Akcja       | Opis                                   |
| ---------------------------------------- | ----------- | -------------------------------------- |
| `src/lib/schemas/generation.schema.ts`   | NOWY        | Schemat walidacji Zod                  |
| `src/lib/services/openrouter.service.ts` | NOWY        | Serwis komunikacji z OpenRouter        |
| `src/lib/services/generation.service.ts` | NOWY        | Serwis logiki biznesowej generacji     |
| `src/pages/api/generations.ts`           | NOWY        | Endpoint API                           |
| `src/env.d.ts`                           | MODYFIKACJA | Dodanie typów dla zmiennych OpenRouter |
| `.env`                                   | MODYFIKACJA | Dodanie kluczy OpenRouter              |

---

## 11. Definicja ukończenia (Definition of Done)

- [ ] Endpoint `POST /api/generations` zwraca status 201 dla prawidłowego żądania
- [ ] Walidacja Zod odrzuca teksty < 1000 i > 10000 znaków
- [ ] Nieautoryzowane żądania zwracają 401
- [ ] Błędy OpenRouter są prawidłowo obsługiwane (502/503)
- [ ] Sesja generowania jest zapisywana w bazie danych
- [ ] Odpowiedź LLM jest parsowana na strukturę fiszek
- [ ] Testy jednostkowe pokrywają główne ścieżki
- [ ] Dokumentacja API jest aktualna
