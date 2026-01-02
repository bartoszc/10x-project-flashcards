# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego

Endpoint `GET /api/flashcards` służy do pobierania listy fiszek edukacyjnych dla uwierzytelnionego użytkownika. Wspiera paginację, filtrowanie po źródle fiszki (AI/manual) oraz sortowanie po różnych polach. Jest to endpoint tylko do odczytu, wykorzystujący Row Level Security (RLS) do zapewnienia izolacji danych między użytkownikami.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/flashcards`
- **Nagłówki:**
  - `Authorization: Bearer <access_token>` (wymagany)

### Parametry Query

| Parametr | Typ     | Wymagany | Domyślnie    | Opis                                                            |
| -------- | ------- | -------- | ------------ | --------------------------------------------------------------- |
| `page`   | integer | Nie      | 1            | Numer strony (min: 1)                                           |
| `limit`  | integer | Nie      | 20           | Elementy na stronę (min: 1, max: 100)                           |
| `source` | string  | Nie      | -            | Filtr po źródle: `ai` lub `manual`                              |
| `sort`   | string  | Nie      | `created_at` | Pole sortowania: `created_at`, `updated_at`, `next_review_date` |
| `order`  | string  | Nie      | `desc`       | Kierunek sortowania: `asc` lub `desc`                           |

## 3. Wykorzystywane typy

### Istniejące DTO (z `src/types.ts`)

```typescript
// Pojedyncza fiszka - wyklucza user_id z odpowiedzi
export type FlashcardDTO = Omit<FlashcardRow, "user_id">;

// Odpowiedź z listą fiszek
export interface FlashcardsListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// Struktura paginacji
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

### Nowy schemat walidacji (Zod)

```typescript
// src/lib/schemas/flashcard.schema.ts
import { z } from "zod";

export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  source: z.enum(["ai", "manual"]).optional(),
  sort: z.enum(["created_at", "updated_at", "next_review_date"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type GetFlashcardsQueryParams = z.infer<typeof getFlashcardsQuerySchema>;
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique that incorporates increasing intervals...",
      "source": "ai",
      "generation_session_id": "uuid",
      "next_review_date": "2024-01-15",
      "interval": 7,
      "ease_factor": 2.5,
      "repetition_count": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-08T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Błędy

| Kod | Opis                    | Struktura odpowiedzi                                                      |
| --- | ----------------------- | ------------------------------------------------------------------------- |
| 400 | Nieprawidłowe parametry | `{ error: { code: "VALIDATION_ERROR", message: "...", details: {...} } }` |
| 401 | Brak autoryzacji        | `{ error: { code: "UNAUTHORIZED", message: "..." } }`                     |
| 500 | Błąd serwera            | `{ error: { code: "INTERNAL_ERROR", message: "..." } }`                   |

## 5. Przepływ danych

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Klient    │────▶│  API Endpoint    │────▶│  FlashcardService   │
│  (Request)  │     │  (Walidacja)     │     │  (getFlashcards)    │
└─────────────┘     └──────────────────┘     └─────────────────────┘
                                                       │
                                                       ▼
                                             ┌─────────────────────┐
                                             │  Supabase Client    │
                                             │  (RLS via user_id)  │
                                             └─────────────────────┘
                                                       │
                                                       ▼
                                             ┌─────────────────────┐
                                             │  PostgreSQL         │
                                             │  (flashcards table) │
                                             └─────────────────────┘
```

### Kroki przepływu:

1. Klient wysyła żądanie GET z tokenem autoryzacji i opcjonalnymi parametrami query
2. Middleware Astro parsuje sesję z ciasteczka (supabase z context.locals)
3. Endpoint waliduje parametry query za pomocą schematu Zod
4. `FlashcardService.getFlashcards()` buduje zapytanie do Supabase
5. RLS automatycznie filtruje fiszki po `user_id = auth.uid()`
6. Serwis zlicza całkowitą liczbę rekordów dla paginacji
7. Endpoint formatuje odpowiedź z danymi i metadanymi paginacji

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- Endpoint wymaga ważnego tokenu JWT przekazanego przez sesję Supabase
- Middleware Astro automatycznie waliduje sesję i udostępnia `context.locals.supabase`

### Autoryzacja

- Row Level Security (RLS) na tabeli `flashcards` zapewnia, że użytkownik widzi tylko swoje fiszki
- Polityka: `USING (user_id = auth.uid())`

### Walidacja danych wejściowych

- Wszystkie parametry query walidowane przez schemat Zod
- Ograniczenie `limit` do maksymalnie 100 zapobiega nadmiernemu obciążeniu

### Ochrona przed atakami

- SQL Injection: Supabase SDK automatycznie sanityzuje parametry
- Parameter tampering: Walidacja Zod odrzuca nieprawidłowe wartości

## 7. Obsługa błędów

| Scenariusz                      | Kod HTTP | Kod błędu        | Obsługa                                    |
| ------------------------------- | -------- | ---------------- | ------------------------------------------ |
| Brak sesji/tokenu               | 401      | UNAUTHORIZED     | Wczesny return przed logiką serwisu        |
| Nieprawidłowy `page` (np. -1)   | 400      | VALIDATION_ERROR | Zod walidacja, szczegóły w `details.field` |
| Nieprawidłowy `limit` (np. 500) | 400      | VALIDATION_ERROR | Zod walidacja, szczegóły w `details.field` |
| Nieprawidłowy `source`          | 400      | VALIDATION_ERROR | Zod walidacja, szczegóły w `details.field` |
| Nieprawidłowy `sort`            | 400      | VALIDATION_ERROR | Zod walidacja, szczegóły w `details.field` |
| Błąd bazy danych                | 500      | INTERNAL_ERROR   | Logowanie błędu, generyczna odpowiedź      |

## 8. Rozważania dotyczące wydajności

### Istniejące indeksy (z db-plan.md)

- `idx_flashcards_user_id` - optymalizacja zapytań po user_id
- `idx_flashcards_next_review_date` - optymalizacja sortowania po dacie przeglądu
- `idx_flashcards_user_next_review` - indeks złożony dla typowych zapytań

### Strategie optymalizacji

- **Paginacja:** Limit domyślny 20, maksymalny 100 elementów na żądanie
- **Zliczanie:** Użycie `count` option w Supabase dla efektywnego obliczenia total
- **Projekcja:** Wykluczenie `user_id` z odpowiedzi (niepotrzebne dla klienta)

### Potencjalne wąskie gardła

- Duża liczba fiszek użytkownika → paginacja rozwiązuje problem
- Sortowanie po `ease_factor` → brak indeksu, ale pole nie jest w opcjach sortowania

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Plik:** `src/lib/schemas/flashcard.schema.ts`

```typescript
import { z } from "zod";

export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  source: z.enum(["ai", "manual"]).optional(),
  sort: z.enum(["created_at", "updated_at", "next_review_date"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type GetFlashcardsQueryParams = z.infer<typeof getFlashcardsQuerySchema>;
```

---

### Krok 2: Utworzenie FlashcardService

**Plik:** `src/lib/services/flashcard.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDTO, PaginationDTO } from "@/types";
import type { GetFlashcardsQueryParams } from "@/lib/schemas/flashcard.schema";

interface GetFlashcardsResult {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcards(userId: string, params: GetFlashcardsQueryParams): Promise<GetFlashcardsResult> {
    const { page, limit, source, sort, order } = params;
    const offset = (page - 1) * limit;

    // Build query
    let query = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply source filter if provided
    if (source) {
      query = query.eq("source", source);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Map to DTO (exclude user_id)
    const flashcards: FlashcardDTO[] = (data ?? []).map(({ user_id, ...flashcard }) => flashcard);

    return {
      data: flashcards,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }
}
```

---

### Krok 3: Implementacja endpointu API

**Plik:** `src/pages/api/flashcards/index.ts`

```typescript
import type { APIRoute } from "astro";
import { getFlashcardsQuerySchema } from "@/lib/schemas/flashcard.schema";
import { FlashcardService } from "@/lib/services/flashcard.service";
import type { FlashcardsListResponseDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  // 1. Check authentication
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  if (!user) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Parse and validate query parameters
  const queryParams = Object.fromEntries(url.searchParams);
  const parseResult = getFlashcardsQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: {
          field: parseResult.error.errors[0]?.path?.join("."),
          reason: parseResult.error.errors[0]?.message,
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Fetch flashcards via service
  try {
    const flashcardService = new FlashcardService(locals.supabase);
    const result = await flashcardService.getFlashcards(user.id, parseResult.data);

    const response: FlashcardsListResponseDTO = result;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

### Krok 4: Testowanie endpointu

#### Przykładowe zapytania cURL

```bash
# Podstawowe zapytanie (domyślne parametry)
curl -X GET "http://localhost:4321/api/flashcards" \
  -H "Cookie: sb-access-token=<token>; sb-refresh-token=<token>"

# Z paginacją
curl -X GET "http://localhost:4321/api/flashcards?page=2&limit=10" \
  -H "Cookie: sb-access-token=<token>; sb-refresh-token=<token>"

# Z filtrem source
curl -X GET "http://localhost:4321/api/flashcards?source=ai" \
  -H "Cookie: sb-access-token=<token>; sb-refresh-token=<token>"

# Z sortowaniem
curl -X GET "http://localhost:4321/api/flashcards?sort=next_review_date&order=asc" \
  -H "Cookie: sb-access-token=<token>; sb-refresh-token=<token>"

# Wszystkie parametry
curl -X GET "http://localhost:4321/api/flashcards?page=1&limit=50&source=manual&sort=updated_at&order=desc" \
  -H "Cookie: sb-access-token=<token>; sb-refresh-token=<token>"
```

#### Oczekiwane wyniki testów

| Test                       | Oczekiwany wynik                 |
| -------------------------- | -------------------------------- |
| Brak autoryzacji           | 401 UNAUTHORIZED                 |
| Nieprawidłowy limit (>100) | 400 VALIDATION_ERROR             |
| Nieprawidłowy source       | 400 VALIDATION_ERROR             |
| Prawidłowe zapytanie       | 200 OK z listą fiszek            |
| Pusta lista fiszek         | 200 OK z pustą tablicą i total=0 |

---

## 10. Podsumowanie pliku i struktury

```
src/
├── lib/
│   ├── schemas/
│   │   └── flashcard.schema.ts    # [NOWY] Schemat walidacji Zod
│   └── services/
│       └── flashcard.service.ts   # [NOWY] Serwis do operacji na fiszkach
├── pages/
│   └── api/
│       └── flashcards/
│           └── index.ts           # [NOWY] GET /api/flashcards endpoint
└── types.ts                       # [ISTNIEJĄCY] DTOs już zdefiniowane
```
