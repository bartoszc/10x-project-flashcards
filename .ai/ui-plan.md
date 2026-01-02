# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Aplikacja 10x-cards to webowa platforma do tworzenia i zarządzania fiszkami edukacyjnymi z wykorzystaniem AI. Architektura UI opiera się na Astro 5 jako frameworku głównym, z React 19 dla komponentów interaktywnych, Tailwind 4 do stylowania i Shadcn/ui jako biblioteki komponentów bazowych.

### Główne założenia architektoniczne:

- **Podejście mobile-first** z responsywnymi breakpointami Tailwind
- **Server-side rendering** (Astro) dla stron statycznych, **client-side React** dla interaktywności
- **Supabase Auth** do autentykacji z automatycznym zarządzaniem tokenami
- **Prosty state management** oparty na React hooks bez zewnętrznych bibliotek
- **Globalny error boundary** z lokalnymi obsługami błędów i toast notifications

### Podział stron:

- **Publiczne**: logowanie, rejestracja
- **Chronione (wymagają autentykacji)**: generowanie fiszek, lista fiszek, sesja nauki, profil użytkownika

---

## 2. Lista widoków

### 2.1. Strona logowania

- **Ścieżka**: `/auth/login`
- **Główny cel**: Umożliwienie zalogowania się istniejącemu użytkownikowi
- **Kluczowe informacje do wyświetlenia**:
  - Formularz z polami email i hasło
  - Link do rejestracji
  - Komunikaty o błędach logowania
- **Kluczowe komponenty**:
  - `LoginForm` – formularz z walidacją email/hasło
  - `Button` – przycisk submit
  - `Input` – pola formularza (Shadcn)
  - `Alert` – komunikaty o błędach
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja client-side z natychmiastowym feedbackiem
  - `aria-describedby` dla komunikatów o błędach
  - Obsługa klawiatury: Tab nawigacja, Enter submit
  - Przekierowanie do `/generate` po pomyślnym logowaniu
  - Ukrycie hasła z opcją "pokaż hasło"

### 2.2. Strona rejestracji

- **Ścieżka**: `/auth/register`
- **Główny cel**: Utworzenie nowego konta użytkownika
- **Kluczowe informacje do wyświetlenia**:
  - Formularz z polami email i hasło (z potwierdzeniem)
  - Link do logowania
  - Wymagania dotyczące hasła
  - Komunikaty o błędach/sukcesie
- **Kluczowe komponenty**:
  - `RegisterForm` – formularz rejestracji z walidacją
  - `PasswordStrengthIndicator` – wizualna ocena siły hasła
  - `Input`, `Button` (Shadcn)
- **UX, dostępność i bezpieczeństwo**:
  - Inline walidacja pól (format email, siła hasła, zgodność haseł)
  - Wyraźne komunikaty o wymaganiach hasła
  - Automatyczne logowanie po pomyślnej rejestracji
  - Obsługa błędu 409 (email już zarejestrowany)

### 2.3. Strona odzyskiwania hasła

- **Ścieżka**: `/auth/reset-password`
- **Główny cel**: Umożliwienie użytkownikowi zresetowania zapomnianego hasła
- **Kluczowe informacje do wyświetlenia**:
  - Formularz z polem email
  - Komunikat o wysłaniu linku resetującego
  - Link powrotu do logowania
- **Kluczowe komponenty**:
  - `ResetPasswordForm` – formularz z polem email
  - `Input`, `Button` (Shadcn)
  - `Alert` – komunikat o statusie (sukces/błąd)
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja client-side formatu email
  - Bezpieczny komunikat: zawsze "Link został wysłany" (bez ujawniania czy email istnieje)
  - Link do powrotu na stronę logowania
  - `aria-describedby` dla komunikatów o błędach
  - Rate limiting: max 3 żądania na godzinę dla jednego emaila

### 2.4. Strona ustawienia nowego hasła

- **Ścieżka**: `/auth/new-password`
- **Główny cel**: Umożliwienie użytkownikowi ustawienia nowego hasła po kliknięciu w link resetujący
- **Kluczowe informacje do wyświetlenia**:
  - Formularz z polami: nowe hasło i potwierdzenie hasła
  - Wymagania dotyczące hasła
  - Komunikat o pomyślnej zmianie hasła
- **Kluczowe komponenty**:
  - `NewPasswordForm` – formularz z polami hasła
  - `PasswordStrengthIndicator` – wizualna ocena siły hasła
  - `Input`, `Button` (Shadcn)
  - `Alert` – komunikaty o błędach/sukcesie
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja siły hasła (min. 8 znaków)
  - Walidacja zgodności haseł
  - Obsługa wygaśnięcia tokena (redirect do `/auth/reset-password`)
  - Przekierowanie do `/auth/login` po pomyślnej zmianie hasła

### 2.5. Generowanie fiszek AI

- **Ścieżka**: `/generate`
- **Główny cel**: Wklejenie tekstu i wygenerowanie propozycji fiszek przez AI
- **Kluczowe informacje do wyświetlenia**:
  - Pole tekstowe na tekst źródłowy (1000-10000 znaków)
  - Licznik znaków z kolorowym feedbackiem
  - Lista wygenerowanych propozycji fiszek
  - Status operacji (generowanie, sukces, błąd)
- **Kluczowe komponenty**:
  - `GenerationForm` – textarea z licznikiem znaków i przyciskiem "Generuj"
  - `SuggestionsList` – lista propozycji AI
  - `SuggestionCard` – pojedyncza propozycja z akcjami (akceptuj/edytuj/odrzuć)
  - `Skeleton` – stan ładowania podczas generowania
  - `Button` – "Zapisz zaakceptowane fiszki"
- **UX, dostępność i bezpieczeństwo**:
  - Live character counter z kolorami: szary (<1000), zielony (1000-10000), czerwony (>10000)
  - Disabled button gdy tekst poza zakresem
  - Skeleton loading podczas wywołania API AI
  - Toast z komunikatem błędu przy problemach z API (502/503)
  - Bulk actions: "Zaakceptuj wszystkie", "Odrzuć wszystkie"
  - `aria-live="polite"` dla dynamicznych aktualizacji listy
  - Edycja inline propozycji przed zaakceptowaniem

### 2.6. Lista fiszek (Moje fiszki)

- **Ścieżka**: `/flashcards`
- **Główny cel**: Przeglądanie, edycja i zarządzanie własnymi fiszkami
- **Kluczowe informacje do wyświetlenia**:
  - Lista fiszek użytkownika z paginacją (20 elementów na stronę)
  - Filtr źródła (AI / ręczne / wszystkie)
  - Sortowanie (data utworzenia, data aktualizacji, data następnej powtórki)
  - Przycisk dodania nowej fiszki
  - Empty state gdy brak fiszek
- **Kluczowe komponenty**:
  - `FlashcardList` – kontener listy z paginacją
  - `FlashcardCard` – pojedyncza fiszka z inline editing
  - `FlashcardForm` – modal (Dialog) do tworzenia nowej fiszki
  - `Pagination` – nawigacja między stronami
  - `Select` – filtr źródła i sortowanie
  - `AlertDialog` – potwierdzenie usunięcia
  - `EmptyState` – ilustracja i CTA gdy brak fiszek
- **UX, dostępność i bezpieczeństwo**:
  - Inline editing: kliknięcie w fiszkę przełącza w tryb edycji
  - Potwierdzenie przed usunięciem (AlertDialog)
  - Skeleton loading podczas pobierania danych
  - Responsywność: karty na mobile, tabela na desktop
  - `aria-label` dla przycisków akcji
  - Focus trap w modalu tworzenia fiszki

### 2.7. Sesja nauki

- **Ścieżka**: `/learn`
- **Główny cel**: Przeprowadzenie sesji nauki z algorytmem spaced repetition (FSRS)
- **Kluczowe informacje do wyświetlenia**:
  - Aktualna fiszka (przód → kliknięcie → tył)
  - Postęp sesji (przerobione / pozostałe)
  - Przyciski oceny (1-4: Again, Hard, Good, Easy)
  - Podsumowanie na koniec sesji
  - Empty state gdy brak fiszek do nauki
- **Kluczowe komponenty**:
  - `LearningSession` – główny kontener sesji (fullscreen mode)
  - `FlashcardFlip` – karta z animacją flip (3D transform)
  - `RatingButtons` – 4 przyciski oceny zgodne z FSRS
  - `ProgressBar` – pasek postępu sesji
  - `SessionSummary` – podsumowanie po zakończeniu
  - `EmptyState` – komunikat "Wszystkie fiszki przerobione"
- **UX, dostępność i bezpieczeństwo**:
  - Fullscreen focus mode (minimalne rozproszenie)
  - Animacja flip przy odkrywaniu odpowiedzi
  - Keyboard navigation: `Space` = flip, `1-4` = ocena
  - Możliwość przerwania sesji w dowolnym momencie
  - `aria-live` dla informacji o postępie
  - Responsywność: fullscreen na wszystkich urządzeniach
  - Graceful handling braku fiszek (404 → empty state)

### 2.8. Profil użytkownika

- **Ścieżka**: `/profile`
- **Główny cel**: Wyświetlenie danych użytkownika, statystyk i opcji konta
- **Kluczowe informacje do wyświetlenia**:
  - Email użytkownika
  - Statystyki generowania (acceptance rate, AI vs manual)
  - Preferencje (daily goal, theme)
  - Opcja usunięcia konta (GDPR)
- **Kluczowe komponenty**:
  - `ProfileCard` – dane użytkownika
  - `StatisticsSection` – statystyki generowania AI
  - `PreferencesForm` – formularz edycji preferencji
  - `DeleteAccountDialog` – modal potwierdzenia usunięcia konta
  - `Tabs` – zakładki (profil / statystyki / ustawienia)
- **UX, dostępność i bezpieczeństwo**:
  - Wyraźne ostrzeżenie przed usunięciem konta
  - Dwuetapowe potwierdzenie usunięcia (wpisanie emaila lub hasła)
  - Wizualizacja statystyk (acceptance rate jako procent, wykresy)
  - Auto-save preferencji lub wyraźny przycisk "Zapisz"

---

## 3. Mapa podróży użytkownika

### 3.1. Przepływ nowego użytkownika (onboarding)

```
[Landing /] → [Rejestracja /auth/register] → [Auto-login] → [Generowanie /generate]
                                                              ↓
                                              [Wklej tekst → Generuj AI]
                                                              ↓
                                              [Lista propozycji fiszek]
                                                              ↓
                                              [Akceptuj/Edytuj/Odrzuć]
                                                              ↓
                                              [Zapisz → redirect /flashcards]
```

### 3.2. Przepływ powracającego użytkownika

```
[Landing /] → [Logowanie /auth/login] → [Generowanie /generate (domyślny widok)]
                                         ↓
         ┌─────────────────┬─────────────┴────────────┬─────────────────┐
         ↓                 ↓                          ↓                 ↓
   [/generate]       [/flashcards]               [/learn]         [/profile]
   Generuj fiszki    Zarządzaj fiszkami          Sesja nauki      Statystyki
```

### 3.3. Przepływ generowania fiszek AI (główny przypadek użycia)

1. Użytkownik przechodzi do `/generate`
2. Wkleja tekst źródłowy w pole textarea
3. Licznik znaków pokazuje aktualną liczbę (1000-10000 wymagane)
4. Klika przycisk "Generuj fiszki"
5. Wyświetla się skeleton loading
6. API zwraca listę propozycji z `session_id`
7. Użytkownik przegląda propozycje:
   - ✓ Akceptuje bez zmian
   - ✎ Edytuje i akceptuje
   - ✗ Odrzuca
8. Klika "Zapisz zaakceptowane"
9. API `/api/generations/:session_id/accept` zapisuje fiszki
10. Toast o sukcesie + opcjonalny redirect do `/flashcards`

### 3.4. Przepływ sesji nauki

1. Użytkownik przechodzi do `/learn`
2. Klient wywołuje `POST /api/learning-sessions`
3. Jeśli brak fiszek do review → empty state
4. Wyświetlana jest pierwsza fiszka (przód)
5. Użytkownik klika/naciska Space → animacja flip → tył
6. Użytkownik ocenia (1-4):
   - 1 = Again (powtórka tego samego dnia)
   - 2 = Hard (krótszy interwał)
   - 3 = Good (standardowy interwał)
   - 4 = Easy (dłuższy interwał)
7. Klient wywołuje `POST /api/learning-sessions/:id/review`
8. Wyświetlana jest następna fiszka lub podsumowanie
9. Użytkownik może zakończyć wcześniej przyciskiem "Zakończ sesję"

### 3.5. Przepływ zarządzania fiszkami

```
[/flashcards] → [Lista fiszek z paginacją]
                        ↓
     ┌──────────────────┼──────────────────┐
     ↓                  ↓                  ↓
[Edycja inline]   [Usunięcie]        [+ Nowa fiszka]
     ↓                  ↓                  ↓
[Zapisz zmiany]   [AlertDialog]      [Dialog modal]
     ↓              potwierdzenia         ↓
                        ↓            [Zapisz → lista]
                   [Fiszka usunięta]
```

### 3.6. Przepływ usunięcia konta (GDPR)

1. Użytkownik przechodzi do `/profile`
2. Klika "Usuń konto"
3. Wyświetla się AlertDialog z ostrzeżeniem
4. Użytkownik potwierdza (wpisuje email lub hasło)
5. API `DELETE /api/auth/account` usuwa wszystkie dane
6. Redirect do `/auth/login` z komunikatem o usunięciu

---

## 4. Układ i struktura nawigacji

### 4.1. Layout główny

```
┌─────────────────────────────────────────────────────────┐
│ HEADER (sticky top)                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Logo      [Generate] [My Cards] [Learn]    [Avatar] │ │ ← desktop
│ │ Logo      [☰ Hamburger]                    [Avatar] │ │ ← mobile
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ MAIN CONTENT (scrollable)                               │
│                                                         │
│    [Zawartość widoku]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2. Nawigacja główna

| Element          | Ścieżka       | Ikona | Widoczność |
| ---------------- | ------------- | ----- | ---------- |
| Logo (10x-cards) | `/generate`   | —     | Zawsze     |
| Generuj          | `/generate`   | ✨    | Zalogowany |
| Moje fiszki      | `/flashcards` | 📚    | Zalogowany |
| Nauka            | `/learn`      | 🎓    | Zalogowany |
| Avatar/Menu      | —             | 👤    | Zalogowany |

### 4.3. Menu użytkownika (dropdown z avatara)

- Profil → `/profile`
- Statystyki → `/profile?tab=stats`
- Wyloguj → `POST /api/auth/logout` → `/auth/login`

### 4.4. Nawigacja na mobile

- Hamburger menu otwierający drawer z boku
- Drawer zawiera wszystkie linki nawigacyjne
- Avatar w górnym rogu (bez dropdownu, pełny ekran)

### 4.5. Nawigacja w sesji nauki

- Minimalna nawigacja (fullscreen focus)
- Tylko przycisk "Zakończ sesję" i logo (escape route)
- Brak górnego menu podczas aktywnej sesji

### 4.6. Chronione vs publiczne ścieżki

| Ścieżka                | Typ       | Middleware action                             |
| ---------------------- | --------- | --------------------------------------------- |
| `/auth/login`          | Publiczna | Redirect do `/generate` jeśli zalogowany      |
| `/auth/register`       | Publiczna | Redirect do `/generate` jeśli zalogowany      |
| `/auth/reset-password` | Publiczna | Redirect do `/generate` jeśli zalogowany      |
| `/auth/new-password`   | Publiczna | Obsługa tokena z Supabase Auth callback       |
| `/generate`            | Chroniona | Redirect do `/auth/login` jeśli niezalogowany |
| `/flashcards`          | Chroniona | Redirect do `/auth/login` jeśli niezalogowany |
| `/learn`               | Chroniona | Redirect do `/auth/login` jeśli niezalogowany |
| `/profile`             | Chroniona | Redirect do `/auth/login` jeśli niezalogowany |

---

## 5. Kluczowe komponenty

### 5.1. Komponenty współdzielone (layout/)

| Komponent      | Opis                                                  | Użycie                     |
| -------------- | ----------------------------------------------------- | -------------------------- |
| `Header`       | Górny pasek nawigacyjny z logo, linkami i avatar menu | Wszystkie strony chronione |
| `Navigation`   | Linki nawigacyjne (desktop: inline, mobile: drawer)   | Wewnątrz Header            |
| `UserMenu`     | Dropdown z avatara: profil, statystyki, wyloguj       | Header                     |
| `MobileDrawer` | Boczny drawer z nawigacją na mobile                   | Header (mobile)            |

### 5.2. Komponenty formularzy (ui/)

| Komponent     | Opis                                                    | Użycie                                |
| ------------- | ------------------------------------------------------- | ------------------------------------- |
| `Input`       | Pole tekstowe (Shadcn)                                  | Logowanie, rejestracja, edycja fiszek |
| `Textarea`    | Pole wieloliniowe z opcjonalnym licznikiem              | Generowanie AI                        |
| `Button`      | Przycisk z wariantami (primary, secondary, destructive) | Wszystkie formularze                  |
| `Dialog`      | Modal (Shadcn)                                          | Tworzenie fiszki, potwierdzenia       |
| `AlertDialog` | Modal potwierdzenia destrukcyjnej akcji                 | Usunięcie fiszki/konta                |
| `Select`      | Dropdown wyboru (Shadcn)                                | Filtry, sortowanie                    |

### 5.3. Komponenty fiszek (flashcards/)

| Komponent       | Opis                                              | Props                                      |
| --------------- | ------------------------------------------------- | ------------------------------------------ |
| `FlashcardCard` | Pojedyncza fiszka z przód/tył, inline edit, akcje | `flashcard`, `onEdit`, `onDelete`          |
| `FlashcardList` | Lista fiszek z paginacją                          | `flashcards`, `pagination`, `onPageChange` |
| `FlashcardForm` | Formularz tworzenia/edycji fiszki                 | `onSubmit`, `initialData?`                 |

### 5.4. Komponenty generowania (generation/)

| Komponent          | Opis                                   | Props                                          |
| ------------------ | -------------------------------------- | ---------------------------------------------- |
| `GenerationForm`   | Textarea + licznik + przycisk generuj  | `onGenerate`, `isLoading`                      |
| `SuggestionsList`  | Lista propozycji AI z bulk actions     | `suggestions`, `onAccept`, `onReject`          |
| `SuggestionCard`   | Pojedyncza propozycja z akcjami        | `suggestion`, `onAccept`, `onEdit`, `onReject` |
| `CharacterCounter` | Licznik znaków z kolorowym feedbackiem | `count`, `min`, `max`                          |

### 5.5. Komponenty nauki (learning/)

| Komponent         | Opis                        | Props                                  |
| ----------------- | --------------------------- | -------------------------------------- |
| `LearningSession` | Kontener sesji (fullscreen) | `sessionId`                            |
| `FlashcardFlip`   | Karta z animacją flip 3D    | `front`, `back`, `isFlipped`, `onFlip` |
| `RatingButtons`   | 4 przyciski oceny FSRS      | `onRate`, `disabled`                   |
| `ProgressBar`     | Pasek postępu sesji         | `reviewed`, `total`                    |
| `SessionSummary`  | Podsumowanie po zakończeniu | `stats`                                |

### 5.6. Komponenty stanów (ui/)

| Komponent          | Opis                          | Użycie                            |
| ------------------ | ----------------------------- | --------------------------------- |
| `Skeleton`         | Placeholder podczas ładowania | Listy, karty, formularze          |
| `EmptyState`       | Ilustracja + komunikat + CTA  | Puste listy, brak fiszek do nauki |
| `ErrorBoundary`    | Globalny error boundary       | Root aplikacji                    |
| `Toast` / `Sonner` | Powiadomienia o akcjach       | Po operacjach CRUD, błędach API   |
| `Spinner`          | Wskaźnik ładowania (inline)   | Przyciski podczas submit          |

### 5.7. Custom hooks (hooks/)

| Hook            | Opis                                   | Zwracane wartości                                                                  |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `useFlashcards` | CRUD fiszek z paginacją                | `flashcards`, `loading`, `error`, `create`, `update`, `delete`, `pagination`       |
| `useGeneration` | Generowanie AI i akceptacja            | `generate`, `acceptFlashcards`, `suggestions`, `sessionId`, `loading`, `error`     |
| `useLearning`   | Sesja nauki                            | `startSession`, `getNext`, `submitReview`, `endSession`, `currentCard`, `progress` |
| `useAuth`       | Autentykacja (wrapper na Supabase SDK) | `user`, `login`, `register`, `logout`, `deleteAccount`                             |

---

## 6. Mapowanie wymagań na elementy UI

### 6.1. Mapowanie historyjek użytkownika

| ID     | Historyjka               | Widok                                        | Komponenty kluczowe                                     |
| ------ | ------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| US-001 | Rejestracja konta        | `/auth/register`                             | `RegisterForm`, `PasswordStrengthIndicator`             |
| US-002 | Logowanie                | `/auth/login`                                | `LoginForm`, `Alert`                                    |
| US-003 | Generowanie fiszek AI    | `/generate`                                  | `GenerationForm`, `SuggestionsList`, `CharacterCounter` |
| US-004 | Przegląd i zatwierdzanie | `/generate`                                  | `SuggestionCard`, `SuggestionsList` (bulk actions)      |
| US-005 | Edycja fiszek            | `/flashcards`, `/generate`                   | `FlashcardCard` (inline edit), `SuggestionCard` (edit)  |
| US-006 | Usuwanie fiszek          | `/flashcards`                                | `FlashcardCard`, `AlertDialog`                          |
| US-007 | Ręczne tworzenie         | `/flashcards`                                | `FlashcardForm` (Dialog)                                |
| US-008 | Sesja nauki              | `/learn`                                     | `LearningSession`, `FlashcardFlip`, `RatingButtons`     |
| US-009 | Bezpieczny dostęp        | Middleware                                   | RLS (Supabase), protected routes                        |
| US-010 | Wylogowanie              | Header (menu)                                | `UserMenu`, `Button`                                    |
| US-011 | Odzyskiwanie hasła       | `/auth/reset-password`, `/auth/new-password` | `ResetPasswordForm`, `NewPasswordForm`                  |

### 6.2. Mapowanie punktów końcowych API

| Endpoint                                 | Widok                  | Hook            | Akcja UI                      |
| ---------------------------------------- | ---------------------- | --------------- | ----------------------------- |
| `POST /api/auth/register`                | `/auth/register`       | `useAuth`       | Submit formularza rejestracji |
| `POST /api/auth/login`                   | `/auth/login`          | `useAuth`       | Submit formularza logowania   |
| `POST /api/auth/logout`                  | Header (menu)          | `useAuth`       | Klik "Wyloguj"                |
| `POST /api/auth/reset-password`          | `/auth/reset-password` | `useAuth`       | Submit formularza resetu      |
| `POST /api/auth/update-password`         | `/auth/new-password`   | `useAuth`       | Submit nowego hasła           |
| `DELETE /api/auth/account`               | `/profile`             | `useAuth`       | Potwierdzenie usunięcia       |
| `GET /api/flashcards`                    | `/flashcards`          | `useFlashcards` | Inicjalizacja listy           |
| `POST /api/flashcards`                   | `/flashcards`          | `useFlashcards` | Submit formularza tworzenia   |
| `PUT /api/flashcards/:id`                | `/flashcards`          | `useFlashcards` | Save inline edit              |
| `DELETE /api/flashcards/:id`             | `/flashcards`          | `useFlashcards` | Potwierdzenie usunięcia       |
| `POST /api/generations`                  | `/generate`            | `useGeneration` | Klik "Generuj"                |
| `POST /api/generations/:id/accept`       | `/generate`            | `useGeneration` | Klik "Zapisz zaakceptowane"   |
| `POST /api/learning-sessions`            | `/learn`               | `useLearning`   | Inicjalizacja sesji           |
| `GET /api/learning-sessions/:id/next`    | `/learn`               | `useLearning`   | Pobranie kolejnej fiszki      |
| `POST /api/learning-sessions/:id/review` | `/learn`               | `useLearning`   | Submit oceny                  |
| `PATCH /api/learning-sessions/:id/end`   | `/learn`               | `useLearning`   | Klik "Zakończ sesję"          |
| `GET /api/statistics/generations`        | `/profile`             | custom          | Wyświetlenie statystyk        |

---

## 7. Obsługa stanów i przypadków brzegowych

### 7.1. Stany ładowania

| Widok            | Stan ładowania                 | Komponent                  |
| ---------------- | ------------------------------ | -------------------------- |
| `/generate` (AI) | Skeleton lista + "AI myśli..." | `Skeleton`, animacja pulse |
| `/flashcards`    | Skeleton karty/wiersze         | `Skeleton`                 |
| `/learn`         | Skeleton karta                 | `Skeleton`                 |
| Formularze       | Spinner w przycisku            | `Button` z `isLoading`     |

### 7.2. Empty states

| Widok         | Warunek                  | Komunikat                                       | CTA                                            |
| ------------- | ------------------------ | ----------------------------------------------- | ---------------------------------------------- |
| `/flashcards` | Brak fiszek              | "Nie masz jeszcze fiszek"                       | "Wygeneruj pierwsze fiszki" / "Utwórz ręcznie" |
| `/learn`      | Brak fiszek do review    | "Świetna robota! Wszystkie fiszki przerobione." | "Wróć jutro"                                   |
| `/generate`   | Po odrzuceniu wszystkich | "Wszystkie propozycje odrzucone"                | "Wygeneruj ponownie"                           |

### 7.3. Obsługa błędów API

| Kod błędu                 | Scenariusz               | Reakcja UI                                       |
| ------------------------- | ------------------------ | ------------------------------------------------ |
| `401 Unauthorized`        | Sesja wygasła            | Redirect → `/auth/login` + toast "Sesja wygasła" |
| `400 Bad Request`         | Błąd walidacji           | Inline error pod polem formularza                |
| `404 Not Found`           | Zasób nie istnieje       | Friendly empty state lub redirect                |
| `409 Conflict`            | Email już zarejestrowany | Inline error + link do logowania                 |
| `502 Bad Gateway`         | Błąd AI                  | Toast error + przycisk "Spróbuj ponownie"        |
| `503 Service Unavailable` | Serwis niedostępny       | Toast + retry z exponential backoff              |

### 7.4. Przypadki brzegowe

| Przypadek                             | Obsługa                                      |
| ------------------------------------- | -------------------------------------------- |
| Tekst <1000 znaków                    | Disabled button "Generuj", szary licznik     |
| Tekst >10000 znaków                   | Disabled button, czerwony licznik, komunikat |
| Utrata połączenia podczas generowania | Toast error + zachowanie wpisanego tekstu    |
| Przerwanie sesji nauki                | Zapisanie postępu, możliwość kontynuacji     |
| Długi czas odpowiedzi AI (>30s)       | Timeout + komunikat + retry                  |
| Edycja fiszki podczas sesji nauki     | Brak możliwości (focus mode)                 |
| Usunięcie ostatniej fiszki            | Empty state z CTA                            |
| Równoczesna edycja (konflikt)         | Optymistic UI z rollback przy błędzie        |
