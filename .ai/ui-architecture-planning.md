# UI Architecture Planning Summary

## Conversation Summary

<decisions>

### Decyzje podjęte przez użytkownika:

1. **Hierarchia widoków** – Akceptacja struktury z pięcioma głównymi widokami: logowanie/rejestracja, generowanie fiszek, "Moje fiszki", sesja nauki, profil ze statystykami
2. **Flow generowania** – Dwuetapowe podejście na jednym ekranie (pole tekstowe + lista propozycji inline)
3. **Stany ładowania** – Skeleton loading dla wywołań API, szczególnie przy generowaniu AI
4. **Zarządzanie stanem** – Proste podejście z React hooks bez zewnętrznych bibliotek state management
5. **Obsługa błędów** – Globalny error boundary + lokalne obsługi błędów z toast notifications
6. **Widok sesji nauki** – Fullscreen focus mode z flip animation i przyciskami oceny FSRS (1-4)
7. **Responsywność** – Mobile-first approach z Tailwind 4 breakpoints
8. **Dostępność** – ARIA landmarks, keyboard navigation, focus management
9. **Autentykacja** – Supabase Auth SDK z automatycznym zarządzaniem tokenami
10. **Statystyki** – Integracja w widoku profilu jako sekcja/tab
11. **Layout** – Top navigation bar z hamburger menu na mobile
12. **Paginacja** – Klasyczna paginacja (20 elementów na stronę)
13. **Edycja fiszek** – Inline editing zamiast modali
14. **Struktura komponentów** – Organizacja według funkcjonalności (flashcards/, generation/, learning/, layout/, hooks/)
15. **Walidacja formularza** – Live character counter z kolorami i disabled button
16. **Sesja nauki** – Możliwość przerwania w dowolnym momencie
17. **Animacje** – Minimalistyczne (flip, fade-in, slide-out, skeleton shimmer)
18. **Empty states** – Dedykowane ilustracje i CTA dla każdego widoku
19. **Formularz ręcznej fiszki** – Modal (Shadcn Dialog)
20. **Routing** – Chronione i publiczne ścieżki z middleware protection

</decisions>

<matched_recommendations>

### Dopasowane rekomendacje:

1. **Struktura głównych widoków:**
   - `/login`, `/register` – widoki publiczne
   - `/generate` – główny widok generowania fiszek (pole 1000-10000 znaków + propozycje AI)
   - `/flashcards` – lista fiszek użytkownika z inline editing
   - `/learn` – fullscreen sesja nauki z algorytmem FSRS
   - `/profile` – profil użytkownika + statystyki generowania

2. **Strategia integracji z API:**
   - Custom hooks do komunikacji z API (`useFlashcards`, `useGeneration`, `useLearning`)
   - Cache na poziomie widoku z invalidacją po operacjach CRUD
   - Klasyczna paginacja z parametrami `page` i `limit`

3. **Komponenty UI (Shadcn/ui):**
   - `AlertDialog` – potwierdzenie usunięcia
   - `Dialog` – formularz tworzenia fiszki
   - `Sonner` (Toast) – powiadomienia o operacjach
   - Skeleton – stany ładowania

4. **Obsługa błędów API:**
   - `401` → redirect do `/login`
   - `400` → inline walidacja
   - `404` → empty state
   - `502/503` → retry button z komunikatem

5. **Dostępność (a11y):**
   - ARIA landmarks dla regionów
   - Keyboard navigation w sesji nauki (spacja = flip, 1-4 = ocena)
   - Focus management przy modalach
   - `aria-live` dla dynamicznych komunikatów

</matched_recommendations>

<ui_architecture_planning_summary>

## Szczegółowe podsumowanie architektury UI

### A. Główne wymagania dotyczące architektury UI

| Wymaganie    | Rozwiązanie                                       |
| ------------ | ------------------------------------------------- |
| Framework    | Astro 5 + React 19 dla komponentów interaktywnych |
| Styling      | Tailwind 4 z mobile-first approach                |
| Komponenty   | Shadcn/ui jako baza                               |
| TypeScript   | TypeScript 5 dla typowania                        |
| Autentykacja | Supabase Auth SDK                                 |

### B. Kluczowe widoki, ekrany i przepływy użytkownika

#### Struktura stron (`src/pages/`)

```
src/pages/
├── index.astro           # Landing → redirect do /generate lub /login
├── login.astro           # Formularz logowania (publiczny)
├── register.astro        # Formularz rejestracji (publiczny)
├── generate.astro        # Generowanie fiszek AI (chroniony)
├── flashcards.astro      # Lista "Moje fiszki" (chroniony)
├── learn.astro           # Sesja nauki (chroniony)
├── profile.astro         # Profil + statystyki (chroniony)
└── api/                  # REST API endpoints
```

#### Flow użytkownika

```
[Niezalogowany] → /login → [Zalogowany] → /generate
                    ↓
              /register
                    ↓
             Aktywacja konta → auto-login → /generate

[Zalogowany]
    /generate → wklej tekst → "Generuj" → propozycje AI → akceptuj/edytuj/odrzuć → "Zapisz"
                                                                ↓
    /flashcards ← lista fiszek ← dodane fiszki
         ↓
    inline edit / delete (z potwierdzeniem)
         ↓
    "+ Nowa fiszka" → modal → zapisz

    /learn → start sesji → [przód fiszki] → flip → [tył] → ocena (1-4) → następna
                                                                ↓
                                        "Zakończ sesję" lub ukończenie wszystkich
                                                                ↓
                                                    podsumowanie sesji

    /profile → dane użytkownika + statystyki (acceptance rate, AI vs manual)
            → "Usuń konto" (GDPR)
```

### C. Strategia integracji z API i zarządzania stanem

#### Struktura komponentów React

```
src/components/
├── ui/                 # Shadcn/ui (Button, Dialog, Card, Input, Textarea, etc.)
├── flashcards/
│   ├── FlashcardCard.tsx       # Pojedyncza fiszka z inline edit
│   ├── FlashcardList.tsx       # Lista z paginacją
│   └── FlashcardForm.tsx       # Modal tworzenia
├── generation/
│   ├── GenerationForm.tsx      # Textarea + character counter + button
│   ├── SuggestionsList.tsx     # Lista propozycji AI
│   └── SuggestionCard.tsx      # Pojedyncza propozycja (accept/edit/reject)
├── learning/
│   ├── LearningSession.tsx     # Główny kontener sesji
│   ├── FlashcardFlip.tsx       # Karta z animacją flip
│   └── RatingButtons.tsx       # Przyciski 1-4 (Again, Hard, Good, Easy)
├── layout/
│   ├── Header.tsx              # Top navigation + user menu
│   └── Navigation.tsx          # Linki nawigacyjne
└── hooks/
    ├── useFlashcards.ts        # CRUD fiszek, paginacja
    ├── useGeneration.ts        # Generowanie AI, akceptacja
    └── useLearning.ts          # Sesja nauki, review
```

#### API Integration Pattern

```typescript
// Przykład: useGeneration hook
const useGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const generate = async (sourceText: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: sourceText }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();
      setSuggestions(data.suggestions);
      setSessionId(data.session_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptFlashcards = async (accepted: Suggestion[], rejectedCount: number) => {
    // POST /api/generations/:session_id/accept
  };

  return { generate, acceptFlashcards, suggestions, sessionId, loading, error };
};
```

### D. Responsywność, dostępność i bezpieczeństwo

#### Responsywność (Tailwind breakpoints)

| Breakpoint | Min-width | Zastosowanie               |
| ---------- | --------- | -------------------------- |
| default    | 0px       | Mobile (smartphone 360px+) |
| `sm:`      | 640px     | Mobile landscape           |
| `md:`      | 768px     | Tablet                     |
| `lg:`      | 1024px    | Desktop                    |
| `xl:`      | 1280px    | Large desktop              |

**Kluczowe adaptacje:**

- Navigation: hamburger menu na mobile, pełne menu na desktop
- Flashcard list: karty (mobile) vs tabela (desktop)
- Learning session: fullscreen na wszystkich urządzeniach

#### Dostępność (a11y)

1. **ARIA landmarks:** `<main>`, `<nav>`, `<header>`, `role="search"`
2. **Keyboard navigation:**
   - Sesja nauki: `Space` = flip, `1-4` = ocena
   - Formularze: `Tab` navigation, `Enter` submit
3. **Focus management:** trap focus w modalach, return focus po zamknięciu
4. **Screen reader support:** `aria-live="polite"` dla toastów i dynamicznych komunikatów
5. **Color contrast:** WCAG AA minimum

#### Bezpieczeństwo

1. **Protected routes:** Middleware sprawdza sesję Supabase
2. **Token management:** Automatyczne przez Supabase SDK
3. **CSRF protection:** Supabase handles via cookies
4. **XSS prevention:** React escaping + Content Security Policy

### E. Stany UI

#### Loading States

| Widok          | Stan ładowania                             |
| -------------- | ------------------------------------------ |
| Generowanie AI | Skeleton list + "AI thinking..." animation |
| Lista fiszek   | Skeleton cards/rows                        |
| Sesja nauki    | Skeleton card                              |

#### Empty States

| Widok                        | Komunikat                                       | CTA                                            |
| ---------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| Moje fiszki (puste)          | "Nie masz jeszcze fiszek"                       | "Wygeneruj pierwsze fiszki" / "Utwórz ręcznie" |
| Sesja nauki (brak do review) | "Świetna robota! Wszystkie fiszki przerobione." | "Wróć jutro"                                   |
| Historia generowania (pusta) | "Jeszcze nie generowałeś fiszek"                | "Spróbuj teraz"                                |

#### Error States

| Błąd API         | Obsługa UI                                |
| ---------------- | ----------------------------------------- |
| 401 Unauthorized | Redirect → /login + toast "Sesja wygasła" |
| 400 Bad Request  | Inline error message pod polem formularza |
| 404 Not Found    | Friendly empty state                      |
| 502/503 (AI)     | Toast error + "Spróbuj ponownie" button   |

</ui_architecture_planning_summary>

<unresolved_issues>

### Kwestie do rozstrzygnięcia w kolejnych etapach:

1. **Dokładny design system** – kolory, typografia, spacing (do ustalenia podczas implementacji UI)
2. **Ilustracje dla empty states** – SVG lub emoji (do ustalenia)
3. **Limit fiszek w sesji nauki** – czy ustawiać domyślny limit, czy pozwalać na wszystkie due?
4. **Offline support** – czy cache'ować fiszki do nauki offline? (prawdopodobnie post-MVP)
5. **Powiadomienia push** – o nadchodzących sesjach nauki (poza zakresem MVP)
6. **Dark mode** – API profilu wspiera `theme: "dark"`, ale implementacja UI do ustalenia

</unresolved_issues>
