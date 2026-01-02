# Plan implementacji widoku Generowanie fiszek AI

## 1. Przegląd

Widok "Generowanie fiszek AI" (`/generate`) umożliwia zalogowanym użytkownikom tworzenie fiszek edukacyjnych przy użyciu sztucznej inteligencji. Użytkownik wkleja tekst źródłowy (1000-10000 znaków), a aplikacja generuje propozycje fiszek poprzez API modelu LLM. Następnie użytkownik może przeglądać, edytować, akceptować lub odrzucać poszczególne propozycje, a na końcu zapisać wybrane fiszki do swojej kolekcji.

Ten widok realizuje kluczowe user stories US-003 (Generowanie fiszek przy użyciu AI) oraz US-004 (Przegląd i zatwierdzanie propozycji fiszek).

## 2. Routing widoku

- **Ścieżka**: `/generate`
- **Plik**: `src/pages/generate.astro`
- **Dostęp**: Tylko dla zalogowanych użytkowników (wymaga przekierowania na `/login` dla niezalogowanych)
- **Typ renderowania**: Server-side rendering z hydrowanymi komponentami React (`client:load`)

## 3. Struktura komponentów

```
src/pages/generate.astro (Astro page)
└── Layout.astro
    └── GenerateView (React, client:load)
        ├── GenerationForm
        │   ├── TextareaWithCounter
        │   │   ├── Textarea (Shadcn/ui)
        │   │   └── CharacterCounter
        │   └── Button (Shadcn/ui) – "Generuj fiszki"
        ├── SuggestionsList
        │   ├── BulkActions
        │   │   ├── Button – "Zaakceptuj wszystkie"
        │   │   └── Button – "Odrzuć wszystkie"
        │   ├── SkeletonList (stan ładowania)
        │   │   └── SuggestionCardSkeleton (×N)
        │   └── SuggestionCard (×N)
        │       ├── Editable front/back fields
        │       └── ActionButtons (Akceptuj/Edytuj/Odrzuć)
        ├── SaveButton
        │   └── Button (Shadcn/ui) – "Zapisz zaakceptowane fiszki"
        └── Toast (Shadcn/ui) – komunikaty błędów
```

## 4. Szczegóły komponentów

### 4.1 GenerateView

- **Opis**: Główny komponent kontenerowy React zarządzający całym widokiem generowania fiszek. Odpowiada za orkiestrację stanu, komunikację z API i koordynację podkomponentów.
- **Główne elementy**: `<main>` z sekcjami formularza i listy propozycji
- **Obsługiwane interakcje**:
  - Inicjalizacja stanu przy montowaniu
  - Obsługa callbacków z komponentów potomnych
- **Obsługiwana walidacja**: Brak (delegowana do komponentów potomnych)
- **Typy**: `GenerateViewState`, `GenerationResponseDTO`, `FlashcardSuggestionDTO`
- **Propsy**: `initialSessionId?: string` (opcjonalnie dla wznowienia sesji)

### 4.2 GenerationForm

- **Opis**: Formularz zawierający pole tekstowe na tekst źródłowy z licznikiem znaków oraz przycisk do uruchomienia generowania.
- **Główne elementy**:
  - `<form>` z obsługą submit
  - `TextareaWithCounter` - textarea z licznikiem
  - `Button` - przycisk "Generuj fiszki"
- **Obsługiwane interakcje**:
  - `onChange` - aktualizacja tekstu źródłowego
  - `onSubmit` - wywołanie generowania fiszek
- **Obsługiwana walidacja**:
  - Minimalna długość tekstu: 1000 znaków
  - Maksymalna długość tekstu: 10000 znaków
  - Przycisk disabled gdy tekst poza zakresem lub trwa generowanie
- **Typy**: `GenerateFlashcardsCommand`
- **Propsy**:
  ```typescript
  interface GenerationFormProps {
    onSubmit: (sourceText: string) => Promise<void>;
    isLoading: boolean;
    disabled?: boolean;
  }
  ```

### 4.3 TextareaWithCounter

- **Opis**: Pole tekstowe z dynamicznym licznikiem znaków pokazującym aktualną liczbę znaków i feedback kolorystyczny.
- **Główne elementy**:
  - `Textarea` (Shadcn/ui) - pole tekstowe
  - `CharacterCounter` - licznik znaków
- **Obsługiwane interakcje**:
  - `onChange` - aktualizacja wartości i licznika
  - `onFocus/onBlur` - zarządzanie focusem
- **Obsługiwana walidacja**:
  - Walidacja zakresu 1000-10000 znaków
  - Kolorystyczny feedback: szary (<1000), zielony (1000-10000), czerwony (>10000)
- **Typy**: Brak specyficznych typów
- **Propsy**:
  ```typescript
  interface TextareaWithCounterProps {
    value: string;
    onChange: (value: string) => void;
    minLength: number;
    maxLength: number;
    placeholder?: string;
    disabled?: boolean;
  }
  ```

### 4.4 CharacterCounter

- **Opis**: Komponent wyświetlający aktualną liczbę znaków z kolorowym feedbackiem.
- **Główne elementy**:
  - `<span>` z liczbą znaków i zakresem
  - Dynamiczne klasy CSS dla kolorów
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  ```typescript
  interface CharacterCounterProps {
    currentCount: number;
    minLength: number;
    maxLength: number;
  }
  ```

### 4.5 SuggestionsList

- **Opis**: Lista wygenerowanych propozycji fiszek z akcjami zbiorczymi. Wyświetla skeleton podczas ładowania, pustą wiadomość lub listę kart.
- **Główne elementy**:
  - `BulkActions` - akcje zbiorcze
  - `<ul>` z `SuggestionCard` lub `SkeletonList`
  - Region `aria-live="polite"` dla dynamicznych aktualizacji
- **Obsługiwane interakcje**:
  - Akceptuj wszystkie
  - Odrzuć wszystkie
  - Delegacja akcji pojedynczych kart
- **Obsługiwana walidacja**: Brak
- **Typy**: `SuggestionViewModel[]`
- **Propsy**:
  ```typescript
  interface SuggestionsListProps {
    suggestions: SuggestionViewModel[];
    isLoading: boolean;
    onAccept: (tempId: string) => void;
    onReject: (tempId: string) => void;
    onEdit: (tempId: string, front: string, back: string) => void;
    onAcceptAll: () => void;
    onRejectAll: () => void;
  }
  ```

### 4.6 BulkActions

- **Opis**: Przyciski akcji zbiorczych dla listy propozycji.
- **Główne elementy**:
  - `Button` - "Zaakceptuj wszystkie"
  - `Button` - "Odrzuć wszystkie"
- **Obsługiwane interakcje**:
  - `onClick` na przyciskach
- **Obsługiwana walidacja**: Przyciski disabled gdy brak propozycji w odpowiednim stanie
- **Typy**: Brak
- **Propsy**:
  ```typescript
  interface BulkActionsProps {
    onAcceptAll: () => void;
    onRejectAll: () => void;
    hasUnreviewedSuggestions: boolean;
    disabled?: boolean;
  }
  ```

### 4.7 SuggestionCard

- **Opis**: Pojedyncza karta propozycji fiszki z możliwością edycji inline oraz akcjami akceptacji/odrzucenia.
- **Główne elementy**:
  - `<article>` jako kontener karty
  - Pola front/back (tryb odczytu lub edycji)
  - Przyciski akcji: Akceptuj, Edytuj, Odrzuć
  - Wizualne oznaczenie stanu (pending/accepted/rejected)
- **Obsługiwane interakcje**:
  - Przełączanie trybu edycji
  - Aktualizacja wartości front/back
  - Zapisanie edycji
  - Anulowanie edycji
  - Akceptacja/Odrzucenie
- **Obsługiwana walidacja**:
  - Front nie może być pusty
  - Back nie może być pusty
- **Typy**: `SuggestionViewModel`
- **Propsy**:
  ```typescript
  interface SuggestionCardProps {
    suggestion: SuggestionViewModel;
    onAccept: () => void;
    onReject: () => void;
    onEdit: (front: string, back: string) => void;
  }
  ```

### 4.8 SuggestionCardSkeleton

- **Opis**: Skeleton placeholder dla pojedynczej karty propozycji podczas ładowania.
- **Główne elementy**:
  - `Skeleton` (Shadcn/ui) elementy dla front/back
  - Animacja pulse
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### 4.9 SkeletonList

- **Opis**: Lista skeleton placeholderów podczas generowania fiszek.
- **Główne elementy**:
  - `<ul>` z wieloma `SuggestionCardSkeleton`
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  ```typescript
  interface SkeletonListProps {
    count?: number; // domyślnie 3-5
  }
  ```

### 4.10 SaveButton

- **Opis**: Przycisk zapisujący zaakceptowane fiszki do bazy danych.
- **Główne elementy**:
  - `Button` (Shadcn/ui) - "Zapisz zaakceptowane fiszki"
  - Licznik zaakceptowanych fiszek
- **Obsługiwane interakcje**:
  - `onClick` - wywołanie zapisania fiszek
- **Obsługiwana walidacja**:
  - Disabled gdy brak zaakceptowanych fiszek
  - Disabled podczas zapisywania
- **Typy**: Brak
- **Propsy**:
  ```typescript
  interface SaveButtonProps {
    acceptedCount: number;
    onSave: () => Promise<void>;
    isLoading: boolean;
    disabled?: boolean;
  }
  ```

## 5. Typy

### 5.1 Istniejące typy (z `src/types.ts`)

```typescript
// Command dla generowania fiszek
interface GenerateFlashcardsCommand {
  source_text: string;
}

// Pojedyncza propozycja fiszki z AI
interface FlashcardSuggestionDTO {
  temp_id: string;
  front: string;
  back: string;
}

// Odpowiedź z endpointu generowania
interface GenerationResponseDTO {
  session_id: string;
  suggestions: FlashcardSuggestionDTO[];
  generated_count: number;
  model_name: string;
}

// Command dla akceptacji fiszek
interface AcceptFlashcardsCommand {
  accepted: AcceptedFlashcardDTO[];
  rejected_count: number;
}

// Pojedyncza zaakceptowana fiszka (może zawierać edycje)
interface AcceptedFlashcardDTO {
  temp_id: string;
  front: string;
  back: string;
}

// Odpowiedź z endpointu akceptacji
interface AcceptFlashcardsResponseDTO {
  flashcards: AcceptedFlashcardResponseDTO[];
  accepted_count: number;
  rejected_count: number;
}

// Standardowa odpowiedź błędu
interface ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetailsDTO;
  };
}
```

### 5.2 Nowe typy ViewModel (do utworzenia w `src/components/generate/types.ts`)

```typescript
// Status pojedynczej propozycji w UI
type SuggestionStatus = "pending" | "accepted" | "rejected";

// ViewModel dla pojedynczej propozycji (rozszerza DTO o stan UI)
interface SuggestionViewModel {
  temp_id: string;
  front: string; // aktualna wartość (może być edytowana)
  back: string; // aktualna wartość (może być edytowana)
  originalFront: string; // oryginalna wartość z AI
  originalBack: string; // oryginalna wartość z AI
  status: SuggestionStatus;
  isEditing: boolean;
}

// Stan głównego widoku generowania
interface GenerateViewState {
  sourceText: string;
  isGenerating: boolean;
  isSaving: boolean;
  sessionId: string | null;
  suggestions: SuggestionViewModel[];
  error: string | null;
  generatedCount: number;
  modelName: string | null;
}

// Typ dla walidacji formularza
interface TextValidationResult {
  isValid: boolean;
  characterCount: number;
  status: "too-short" | "valid" | "too-long";
  message: string;
}
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useGenerateFlashcards`

Główny hook zarządzający logiką widoku generowania fiszek.

```typescript
interface UseGenerateFlashcardsReturn {
  // Stan
  state: GenerateViewState;

  // Akcje formularza
  setSourceText: (text: string) => void;
  generateFlashcards: () => Promise<void>;

  // Akcje na propozycjach
  acceptSuggestion: (tempId: string) => void;
  rejectSuggestion: (tempId: string) => void;
  editSuggestion: (tempId: string, front: string, back: string) => void;
  acceptAllSuggestions: () => void;
  rejectAllSuggestions: () => void;

  // Akcja zapisu
  saveAcceptedFlashcards: () => Promise<void>;

  // Computed values
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  isTextValid: boolean;
  canGenerate: boolean;
  canSave: boolean;
}
```

**Lokalizacja**: `src/components/hooks/useGenerateFlashcards.ts`

### 6.2 Przepływ stanu

1. **Inicjalizacja**: `sourceText: ""`, `suggestions: []`, `sessionId: null`
2. **Wprowadzanie tekstu**: Aktualizacja `sourceText`, walidacja długości w czasie rzeczywistym
3. **Generowanie**: `isGenerating: true` → wywołanie API → aktualizacja `suggestions`, `sessionId`
4. **Przegląd propozycji**: Zmiana statusów poszczególnych propozycji
5. **Edycja inline**: Aktualizacja `front`/`back` w `SuggestionViewModel`
6. **Zapis**: `isSaving: true` → wywołanie API akceptacji → przekierowanie lub reset

## 7. Integracja API

### 7.1 Generowanie fiszek

**Endpoint**: `POST /api/generations`

**Request**:

```typescript
const response = await fetch("/api/generations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    source_text: sourceText,
  } satisfies GenerateFlashcardsCommand),
});
```

**Response (201)**:

```typescript
const data: GenerationResponseDTO = await response.json();
// { session_id, suggestions, generated_count, model_name }
```

**Error handling**:

- `400` - Błąd walidacji (tekst poza zakresem)
- `401` - Brak autoryzacji → przekierowanie na `/login`
- `502` - Błąd API LLM → Toast z komunikatem
- `503` - Serwis niedostępny → Toast z komunikatem

### 7.2 Akceptacja fiszek

**Endpoint**: `POST /api/generations/:session_id/accept`

**Request**:

```typescript
const acceptedSuggestions = suggestions
  .filter((s) => s.status === "accepted")
  .map((s) => ({
    temp_id: s.temp_id,
    front: s.front,
    back: s.back,
  }));

const response = await fetch(`/api/generations/${sessionId}/accept`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    accepted: acceptedSuggestions,
    rejected_count: suggestions.filter((s) => s.status === "rejected").length,
  } satisfies AcceptFlashcardsCommand),
});
```

**Response (201)**:

```typescript
const data: AcceptFlashcardsResponseDTO = await response.json();
// { flashcards, accepted_count, rejected_count }
```

## 8. Interakcje użytkownika

| Interakcja                               | Element             | Akcja                              | Rezultat                                        |
| ---------------------------------------- | ------------------- | ---------------------------------- | ----------------------------------------------- |
| Wpisywanie tekstu                        | TextareaWithCounter | Aktualizacja `sourceText`          | Zmiana licznika, walidacja                      |
| Kliknięcie "Generuj fiszki"              | GenerationForm      | Wywołanie API                      | Wyświetlenie skeletonów → lista propozycji      |
| Kliknięcie "Akceptuj" na karcie          | SuggestionCard      | Zmiana statusu na `accepted`       | Wizualna zmiana karty (np. zielone obramowanie) |
| Kliknięcie "Odrzuć" na karcie            | SuggestionCard      | Zmiana statusu na `rejected`       | Wizualna zmiana karty (np. przekreślenie)       |
| Kliknięcie "Edytuj" na karcie            | SuggestionCard      | Włączenie trybu edycji             | Pola front/back stają się edytowalne            |
| Zapisanie edycji                         | SuggestionCard      | Aktualizacja wartości              | Zamknięcie trybu edycji, zachowanie zmian       |
| Anulowanie edycji                        | SuggestionCard      | Przywrócenie oryginalnych wartości | Zamknięcie trybu edycji                         |
| Kliknięcie "Zaakceptuj wszystkie"        | BulkActions         | Zmiana statusu wszystkich pending  | Wszystkie karty oznaczone jako zaakceptowane    |
| Kliknięcie "Odrzuć wszystkie"            | BulkActions         | Zmiana statusu wszystkich pending  | Wszystkie karty oznaczone jako odrzucone        |
| Kliknięcie "Zapisz zaakceptowane fiszki" | SaveButton          | Wywołanie API akceptacji           | Toast sukcesu, opcjonalne przekierowanie        |

## 9. Warunki i walidacja

### 9.1 Walidacja tekstu źródłowego

| Warunek                             | Komponent                             | Wpływ na UI                                   |
| ----------------------------------- | ------------------------------------- | --------------------------------------------- |
| `length < 1000`                     | TextareaWithCounter, CharacterCounter | Licznik szary, przycisk "Generuj" disabled    |
| `length >= 1000 && length <= 10000` | TextareaWithCounter, CharacterCounter | Licznik zielony, przycisk "Generuj" enabled   |
| `length > 10000`                    | TextareaWithCounter, CharacterCounter | Licznik czerwony, przycisk "Generuj" disabled |

### 9.2 Walidacja edycji fiszki

| Warunek               | Komponent      | Wpływ na UI                                      |
| --------------------- | -------------- | ------------------------------------------------ |
| `front.trim() === ""` | SuggestionCard | Przycisk zapisu edycji disabled, komunikat błędu |
| `back.trim() === ""`  | SuggestionCard | Przycisk zapisu edycji disabled, komunikat błędu |

### 9.3 Walidacja akcji zapisu

| Warunek               | Komponent  | Wpływ na UI                         |
| --------------------- | ---------- | ----------------------------------- |
| `acceptedCount === 0` | SaveButton | Przycisk "Zapisz" disabled          |
| `isSaving === true`   | SaveButton | Przycisk "Zapisz" disabled, spinner |

## 10. Obsługa błędów

### 10.1 Błędy API generowania

| Kod HTTP | Error Code            | Obsługa                                                          |
| -------- | --------------------- | ---------------------------------------------------------------- |
| `400`    | `VALIDATION_ERROR`    | Toast z komunikatem, podświetlenie textarea                      |
| `401`    | `UNAUTHORIZED`        | Przekierowanie na `/login`                                       |
| `502`    | `LLM_ERROR`           | Toast: "Wystąpił problem z usługą AI. Spróbuj ponownie później." |
| `503`    | `SERVICE_UNAVAILABLE` | Toast: "Usługa jest tymczasowo niedostępna. Spróbuj za chwilę."  |
| `500`    | `INTERNAL_ERROR`      | Toast: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."          |

### 10.2 Błędy API akceptacji

| Kod HTTP | Error Code         | Obsługa                                                  |
| -------- | ------------------ | -------------------------------------------------------- |
| `400`    | `VALIDATION_ERROR` | Toast z komunikatem o błędzie walidacji                  |
| `401`    | `UNAUTHORIZED`     | Przekierowanie na `/login`                               |
| `404`    | `NOT_FOUND`        | Toast: "Sesja generowania nie została znaleziona."       |
| `500`    | `INTERNAL_ERROR`   | Toast: "Nie udało się zapisać fiszek. Spróbuj ponownie." |

### 10.3 Błędy sieciowe

- **Brak połączenia**: Toast: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- **Timeout**: Toast: "Upłynął limit czasu żądania. Spróbuj ponownie."

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

```
src/
├── pages/
│   └── generate.astro
├── components/
│   ├── generate/
│   │   ├── GenerateView.tsx
│   │   ├── GenerationForm.tsx
│   │   ├── TextareaWithCounter.tsx
│   │   ├── CharacterCounter.tsx
│   │   ├── SuggestionsList.tsx
│   │   ├── BulkActions.tsx
│   │   ├── SuggestionCard.tsx
│   │   ├── SuggestionCardSkeleton.tsx
│   │   ├── SkeletonList.tsx
│   │   ├── SaveButton.tsx
│   │   └── types.ts
│   ├── hooks/
│   │   └── useGenerateFlashcards.ts
│   └── ui/
│       ├── textarea.tsx (Shadcn/ui - do dodania)
│       ├── skeleton.tsx (Shadcn/ui - do dodania)
│       ├── toast.tsx (Shadcn/ui - do dodania)
│       └── card.tsx (Shadcn/ui - do dodania)
```

### Krok 2: Instalacja brakujących komponentów Shadcn/ui

```bash
npx shadcn@latest add textarea
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add card
```

### Krok 3: Implementacja typów ViewModel

Utworzenie pliku `src/components/generate/types.ts` z definicjami `SuggestionStatus`, `SuggestionViewModel`, `GenerateViewState`, `TextValidationResult`.

### Krok 4: Implementacja komponentów atomowych

1. `CharacterCounter` - prosty komponent prezentacyjny
2. `TextareaWithCounter` - pole tekstowe z licznikiem
3. `SuggestionCardSkeleton` - skeleton dla karty
4. `SkeletonList` - lista skeletonów

### Krok 5: Implementacja custom hooka

Utworzenie `useGenerateFlashcards` z pełną logiką zarządzania stanem i komunikacji z API.

### Krok 6: Implementacja komponentów złożonych

1. `GenerationForm` - formularz z textarea i przyciskiem
2. `SuggestionCard` - karta pojedynczej propozycji z edycją inline
3. `BulkActions` - przyciski akcji zbiorczych
4. `SuggestionsList` - lista propozycji z obsługą stanów
5. `SaveButton` - przycisk zapisu

### Krok 7: Implementacja głównego widoku

1. `GenerateView` - komponent kontenerowy React
2. `generate.astro` - strona Astro z uwierzytelnieniem

### Krok 8: Implementacja obsługi błędów i Toast

Dodanie systemu Toast dla komunikatów błędów i sukcesu.

### Krok 9: Stylowanie i dostępność

1. Implementacja stylów Tailwind dla wszystkich komponentów
2. Dodanie atrybutów ARIA (`aria-live`, `aria-label`, `aria-describedby`)
3. Obsługa nawigacji klawiaturą
4. Testy kontrastu kolorów licznika

### Krok 10: Weryfikacja

#### Testy manualne

1. Otworzyć `/generate` jako zalogowany użytkownik
2. Wpisać tekst <1000 znaków → sprawdzić czy licznik jest szary i przycisk disabled
3. Wpisać tekst 1000-10000 znaków → sprawdzić czy licznik jest zielony i przycisk enabled
4. Wpisać tekst >10000 znaków → sprawdzić czy licznik jest czerwony i przycisk disabled
5. Kliknąć "Generuj fiszki" → sprawdzić skeleton loading
6. Po wygenerowaniu: akceptować/odrzucać/edytować poszczególne karty
7. Kliknąć "Zapisz zaakceptowane fiszki" → sprawdzić czy fiszki zostały zapisane
8. Sprawdzić obsługę błędów poprzez symulację błędów API (np. offline mode)

#### Testy dostępności

1. Nawigacja klawiaturą przez cały formularz i listę
2. Sprawdzenie poprawności `aria-live` dla dynamicznych aktualizacji
3. Testy z czytnikiem ekranu

#### Testy responsywności

1. Weryfikacja widoku na różnych rozdzielczościach (mobile, tablet, desktop)
