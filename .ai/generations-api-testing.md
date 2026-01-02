# POST /api/generations - Dokumentacja testowa

## Przykładowe żądania CURL

### 1. Generowanie fiszek (DEV MODE - bez autoryzacji)

```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Spaced repetition to technika uczenia się polegająca na powtarzaniu materiału w optymalnych odstępach czasowych. Metoda ta opiera się na krzywej zapominania Ebbinghausa, która pokazuje, że informacje są zapominane wykładniczo w czasie. Regularne powtórki w odpowiednich momentach pozwalają przenieść wiedzę do pamięci długotrwałej. Algorytm SM-2, opracowany przez Piotra Woźniaka, jest jednym z najpopularniejszych algorytmów spaced repetition. Wykorzystuje on współczynnik łatwości (ease factor) do określenia optymalnego interwału między powtórkami. Ocena użytkownika (1-5) wpływa na przyszłe interwały - trudne karty są pokazywane częściej, a łatwe rzadziej. FSRS (Free Spaced Repetition Scheduler) to nowszy algorytm, który wykorzystuje machine learning do optymalizacji harmonogramu powtórek. Analizuje on historię odpowiedzi użytkownika i dostosowuje się do jego indywidualnego tempa nauki. Fiszki (flashcards) są podstawowym narzędziem w spaced repetition. Składają się z pytania (front) i odpowiedzi (back). Dobre fiszki powinny zawierać jedną, konkretną informację. Zasada minimum information principle mówi, że fiszka powinna testować tylko jeden fakt. Aktywne przypominanie (active recall) jest kluczowe - zamiast pasywnego czytania, użytkownik musi aktywnie przywołać informację z pamięci."
  }' | jq .
```

### 2. Test walidacji - tekst za krótki (oczekiwany: 400)

```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Za krótki tekst - mniej niż 1000 znaków"}' | jq .
```

### 3. Test walidacji - nieprawidłowy JSON (oczekiwany: 400)

```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d 'nieprawidłowy json' | jq .
```

### 4. Test walidacji - brak pola source_text (oczekiwany: 400)

```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

---

## Przykładowa odpowiedź (201 Created)

```json
{
  "session_id": "1af6b095-87ef-4181-9728-008542a72f6a",
  "suggestions": [
    {
      "temp_id": "temp_1",
      "front": "Czym jest spaced repetition?",
      "back": "To technika uczenia się polegająca na powtarzaniu materiału w optymalnych odstępach czasowych."
    },
    {
      "temp_id": "temp_2",
      "front": "Kto opracował algorytm SM-2?",
      "back": "Algorytm SM-2 został opracowany przez Piotra Woźniaka."
    }
  ],
  "generated_count": 12,
  "model_name": "openai/gpt-4o-mini"
}
```

---

## ⚠️ Przed wdrożeniem na produkcję

### 1. Wyłącz DEV MODE w kodzie

Plik: `src/pages/api/generations.ts`

```typescript
// Zmień:
const DEV_SKIP_AUTH = true;

// Na:
const DEV_SKIP_AUTH = false;
```

### 2. Włącz RLS na tabeli generation_sessions

```bash
docker exec -it $(docker ps --filter "name=supabase_db" -q) psql -U postgres -c \
  "ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;"
```

### 3. Przywróć polityki RLS

Utwórz nową migrację w `supabase/migrations/` lub wykonaj SQL:

```sql
-- Przywróć polityki dla generation_sessions
CREATE POLICY "Users can view own generation sessions"
    ON generation_sessions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generation sessions"
    ON generation_sessions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Przywróć polityki dla flashcards (jeśli usunięte)
CREATE POLICY "Users can view own flashcards"
    ON flashcards FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own flashcards"
    ON flashcards FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own flashcards"
    ON flashcards FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own flashcards"
    ON flashcards FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
```

### 4. Przetestuj z prawdziwą autoryzacją

```bash
# 1. Zaloguj się i pobierz token
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "testpassword123"}' | jq .access_token

# 2. Użyj tokena w żądaniu
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"source_text": "...1000+ znaków..."}' | jq .
```

---

## Kody błędów

| Kod | Opis                                             |
| --- | ------------------------------------------------ |
| 201 | Pomyślne wygenerowanie fiszek                    |
| 400 | Błąd walidacji (tekst < 1000 lub > 10000 znaków) |
| 401 | Brak autoryzacji (gdy DEV_SKIP_AUTH = false)     |
| 502 | Błąd API OpenRouter                              |
| 503 | Usługa AI tymczasowo niedostępna                 |
| 500 | Wewnętrzny błąd serwera                          |
