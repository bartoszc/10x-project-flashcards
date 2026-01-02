# POST /api/generations/:session_id/accept - Dokumentacja testowa

## Przegląd

Endpoint służy do akceptacji wybranych sugestii fiszek wygenerowanych przez AI i zapisania ich w bazie danych.

---

## Przykładowe żądania CURL

### 1. Generowanie sesji (wymagane przed akceptacją)

Najpierw wygeneruj fiszki, aby uzyskać `session_id`:

```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Spaced repetition to technika uczenia się polegająca na powtarzaniu materiału w optymalnych odstępach czasowych. Metoda ta opiera się na krzywej zapominania Ebbinghausa, która pokazuje, że informacje są zapominane wykładniczo w czasie. Regularne powtórki w odpowiednich momentach pozwalają przenieść wiedzę do pamięci długotrwałej. Algorytm SM-2, opracowany przez Piotra Woźniaka, jest jednym z najpopularniejszych algorytmów spaced repetition. Wykorzystuje on współczynnik łatwości (ease factor) do określenia optymalnego interwału między powtórkami. Ocena użytkownika (1-5) wpływa na przyszłe interwały - trudne karty są pokazywane częściej, a łatwe rzadziej. FSRS (Free Spaced Repetition Scheduler) to nowszy algorytm, który wykorzystuje machine learning do optymalizacji harmonogramu powtórek. Analizuje on historię odpowiedzi użytkownika i dostosowuje się do jego indywidualnego tempa nauki. Fiszki (flashcards) są podstawowym narzędziem w spaced repetition. Składają się z pytania (front) i odpowiedzi (back). Dobre fiszki powinny zawierać jedną, konkretną informację. Zasada minimum information principle mówi, że fiszka powinna testować tylko jeden fakt. Aktywne przypominanie (active recall) jest kluczowe - zamiast pasywnego czytania, użytkownik musi aktywnie przywołać informację z pamięci."
  }' | jq .
```

Zapisz `session_id` z odpowiedzi do użycia w kolejnych testach.

---

### 2. Akceptacja fiszek (DEV MODE - bez autoryzacji)

```bash
# Użyj session_id z poprzedniego kroku
SESSION_ID="WSTAW_SESSION_ID_TUTAJ"

curl -X POST "http://localhost:3000/api/generations/${SESSION_ID}/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "accepted": [
      {"temp_id": "temp_1", "front": "Czym jest spaced repetition?", "back": "Technika uczenia się polegająca na powtarzaniu materiału w optymalnych odstępach czasowych."},
      {"temp_id": "temp_2", "front": "Kto opracował algorytm SM-2?", "back": "Piotr Woźniak"}
    ],
    "rejected_count": 3
  }' | jq .
```

### 3. Akceptacja z pustą listą (edge case - tylko odrzucenia)

```bash
SESSION_ID="WSTAW_SESSION_ID_TUTAJ"

curl -X POST "http://localhost:3000/api/generations/${SESSION_ID}/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "accepted": [],
    "rejected_count": 5
  }' | jq .
```

---

## Testy błędów

### 4. Nieprawidłowy UUID session_id (oczekiwany: 400)

```bash
curl -X POST "http://localhost:3000/api/generations/invalid-uuid/accept" \
  -H "Content-Type: application/json" \
  -d '{"accepted": [], "rejected_count": 0}' | jq .
```

### 5. Sesja nie istnieje (oczekiwany: 404)

```bash
curl -X POST "http://localhost:3000/api/generations/00000000-0000-0000-0000-000000000000/accept" \
  -H "Content-Type: application/json" \
  -d '{"accepted": [], "rejected_count": 0}' | jq .
```

### 6. Nieprawidłowy JSON (oczekiwany: 400)

```bash
SESSION_ID="WSTAW_SESSION_ID_TUTAJ"

curl -X POST "http://localhost:3000/api/generations/${SESSION_ID}/accept" \
  -H "Content-Type: application/json" \
  -d 'nieprawidłowy json' | jq .
```

### 7. Brak wymaganych pól (oczekiwany: 400)

```bash
SESSION_ID="WSTAW_SESSION_ID_TUTAJ"

curl -X POST "http://localhost:3000/api/generations/${SESSION_ID}/accept" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

### 8. Za długi front (>1000 znaków) (oczekiwany: 400)

```bash
SESSION_ID="WSTAW_SESSION_ID_TUTAJ"
LONG_TEXT=$(python3 -c "print('A' * 1001)")

curl -X POST "http://localhost:3000/api/generations/${SESSION_ID}/accept" \
  -H "Content-Type: application/json" \
  -d "{
    \"accepted\": [{\"temp_id\": \"1\", \"front\": \"${LONG_TEXT}\", \"back\": \"ok\"}],
    \"rejected_count\": 0
  }" | jq .
```

### 9. Ujemny rejected_count (oczekiwany: 400)

```bash
SESSION_ID="WSTAW_SESSION_ID_TUTAJ"

curl -X POST "http://localhost:3000/api/generations/${SESSION_ID}/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "accepted": [],
    "rejected_count": -1
  }' | jq .
```

---

## Przykładowa odpowiedź (201 Created)

```json
{
  "flashcards": [
    {
      "id": "uuid-fiszki-1",
      "front": "Czym jest spaced repetition?",
      "back": "Technika uczenia się polegająca na powtarzaniu materiału w optymalnych odstępach czasowych.",
      "source": "ai",
      "generation_session_id": "uuid-sesji",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid-fiszki-2",
      "front": "Kto opracował algorytm SM-2?",
      "back": "Piotr Woźniak",
      "source": "ai",
      "generation_session_id": "uuid-sesji",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "accepted_count": 2,
  "rejected_count": 3
}
```

---

## Kody błędów

| Kod | Opis                                         |
| --- | -------------------------------------------- |
| 201 | Pomyślne zaakceptowanie fiszek               |
| 400 | Błąd walidacji (UUID, JSON, pola, limity)    |
| 401 | Brak autoryzacji (gdy DEV_SKIP_AUTH = false) |
| 404 | Sesja generowania nie istnieje               |
| 500 | Wewnętrzny błąd serwera                      |

---

## ⚠️ Przed wdrożeniem na produkcję

1. Ustaw `DEV_SKIP_AUTH = false` w pliku `src/pages/api/generations/[session_id]/accept.ts`
2. Upewnij się, że RLS jest włączony na tabelach `generation_sessions` i `flashcards`
3. Dodaj odpowiednie polityki RLS dla tabeli `flashcards` (INSERT, SELECT, UPDATE, DELETE)
