# Schemat bazy danych PostgreSQL – 10x-cards

## 1. Tabele

### 1.1. `profiles`

Przechowuje dane profilu użytkownika, powiązane z `auth.users` (managed by Supabase Auth).

| Kolumna       | Typ danych    | Ograniczenia                                                 |
| ------------- | ------------- | ------------------------------------------------------------ |
| `id`          | `UUID`        | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` |
| `preferences` | `JSONB`       | `DEFAULT '{}'::jsonb`                                        |
| `created_at`  | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                     |
| `updated_at`  | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                     |

**Uwagi:**

- Relacja 1:1 z `auth.users` – `id` jest jednocześnie FK i PK.
- `preferences` przechowuje elastyczne ustawienia użytkownika (np. domyślne parametry nauki).

---

### 1.2. `flashcards`

Główna tabela fiszek edukacyjnych.

| Kolumna                 | Typ danych         | Ograniczenia                                            |
| ----------------------- | ------------------ | ------------------------------------------------------- |
| `id`                    | `UUID`             | `PRIMARY KEY DEFAULT gen_random_uuid()`                 |
| `user_id`               | `UUID`             | `NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`    |
| `front`                 | `TEXT`             | `NOT NULL`                                              |
| `back`                  | `TEXT`             | `NOT NULL`                                              |
| `source`                | `flashcard_source` | `NOT NULL DEFAULT 'manual'`                             |
| `generation_session_id` | `UUID`             | `REFERENCES generation_sessions(id) ON DELETE SET NULL` |
| `next_review_date`      | `DATE`             | `DEFAULT CURRENT_DATE`                                  |
| `interval`              | `INTEGER`          | `NOT NULL DEFAULT 0`                                    |
| `ease_factor`           | `NUMERIC(4,2)`     | `NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30)`     |
| `repetition_count`      | `INTEGER`          | `NOT NULL DEFAULT 0`                                    |
| `created_at`            | `TIMESTAMPTZ`      | `NOT NULL DEFAULT now()`                                |
| `updated_at`            | `TIMESTAMPTZ`      | `NOT NULL DEFAULT now()`                                |

**Uwagi:**

- `source` – ENUM do rozróżnienia pochodzenia fiszki (`'ai'` vs `'manual'`).
- `generation_session_id` – nullable FK dla fiszek wygenerowanych przez AI.
- Kolumny spaced repetition (`next_review_date`, `interval`, `ease_factor`, `repetition_count`) przechowują stan algorytmu.
- Walidacja długości `front`/`back` odbywa się na poziomie aplikacji.

---

### 1.3. `generation_sessions`

Śledzi sesje generowania fiszek przez AI.

| Kolumna           | Typ danych     | Ograniczenia                                                       |
| ----------------- | -------------- | ------------------------------------------------------------------ |
| `id`              | `UUID`         | `PRIMARY KEY DEFAULT gen_random_uuid()`                            |
| `user_id`         | `UUID`         | `NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`               |
| `source_text`     | `TEXT`         | `NOT NULL CHECK (char_length(source_text) BETWEEN 1000 AND 10000)` |
| `llm_response`    | `JSONB`        | `NOT NULL`                                                         |
| `model_name`      | `VARCHAR(100)` | `NOT NULL`                                                         |
| `model_params`    | `JSONB`        | `DEFAULT '{}'::jsonb`                                              |
| `generated_count` | `INTEGER`      | `NOT NULL DEFAULT 0`                                               |
| `accepted_count`  | `INTEGER`      | `NOT NULL DEFAULT 0`                                               |
| `rejected_count`  | `INTEGER`      | `NOT NULL DEFAULT 0`                                               |
| `created_at`      | `TIMESTAMPTZ`  | `NOT NULL DEFAULT now()`                                           |

**Uwagi:**

- Przechowuje pełną historię generowania: tekst źródłowy, odpowiedź LLM, parametry modelu.
- Pozwala na obliczanie metryk sukcesu (% akceptacji fiszek AI).

---

### 1.4. `learning_sessions`

Reprezentuje sesję nauki użytkownika.

| Kolumna               | Typ danych    | Ograniczenia                                         |
| --------------------- | ------------- | ---------------------------------------------------- |
| `id`                  | `UUID`        | `PRIMARY KEY DEFAULT gen_random_uuid()`              |
| `user_id`             | `UUID`        | `NOT NULL REFERENCES profiles(id) ON DELETE CASCADE` |
| `started_at`          | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                             |
| `ended_at`            | `TIMESTAMPTZ` | `NULL`                                               |
| `flashcards_reviewed` | `INTEGER`     | `NOT NULL DEFAULT 0`                                 |

**Uwagi:**

- `ended_at` ustawiany po zakończeniu sesji nauki.
- `flashcards_reviewed` aktualizowany w trakcie sesji.

---

### 1.5. `flashcard_reviews`

Loguje każdą interakcję z fiszką podczas sesji nauki.

| Kolumna               | Typ danych    | Ograniczenia                                                  |
| --------------------- | ------------- | ------------------------------------------------------------- |
| `id`                  | `UUID`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                       |
| `flashcard_id`        | `UUID`        | `NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE`        |
| `learning_session_id` | `UUID`        | `NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE` |
| `reviewed_at`         | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                      |
| `rating`              | `SMALLINT`    | `NOT NULL CHECK (rating BETWEEN 1 AND 4)`                     |
| `previous_interval`   | `INTEGER`     | `NOT NULL`                                                    |
| `new_interval`        | `INTEGER`     | `NOT NULL`                                                    |

**Uwagi:**

- `rating` (1-4) odpowiada ocenom FSRS: 1=again, 2=hard, 3=good, 4=easy.
- Przechowuje historię zmian interwałów dla celów analitycznych.

---

## 2. Typy ENUM

```sql
CREATE TYPE flashcard_source AS ENUM ('ai', 'manual');
```

---

## 3. Relacje między tabelami

```
auth.users (Supabase managed)
    │
    │ 1:1
    ▼
profiles
    │
    ├── 1:N ──► flashcards
    │              │
    │              └── 1:N ──► flashcard_reviews
    │
    ├── 1:N ──► generation_sessions
    │              │
    │              └── 1:N (nullable) ◄── flashcards.generation_session_id
    │
    └── 1:N ──► learning_sessions
                   │
                   └── 1:N ◄── flashcard_reviews
```

### Kardynalność:

| Relacja                                   | Typ       |
| ----------------------------------------- | --------- |
| `auth.users` → `profiles`                 | 1:1       |
| `profiles` → `flashcards`                 | 1:N       |
| `profiles` → `generation_sessions`        | 1:N       |
| `profiles` → `learning_sessions`          | 1:N       |
| `generation_sessions` → `flashcards`      | 1:N (opt) |
| `learning_sessions` → `flashcard_reviews` | 1:N       |
| `flashcards` → `flashcard_reviews`        | 1:N       |

---

## 4. Indeksy

```sql
-- Optymalizacja zapytań dla fiszek użytkownika
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

-- Optymalizacja zapytań dla sesji nauki (fiszki do powtórki)
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);

-- Indeks złożony dla pobierania fiszek do nauki dla konkretnego użytkownika
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);

-- Optymalizacja zapytań dla sesji generowania
CREATE INDEX idx_generation_sessions_user_id ON generation_sessions(user_id);

-- Optymalizacja zapytań dla sesji nauki użytkownika
CREATE INDEX idx_learning_sessions_user_id ON learning_sessions(user_id);

-- Optymalizacja zapytań dla historii recenzji fiszki
CREATE INDEX idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);

-- Optymalizacja zapytań dla recenzji w ramach sesji nauki
CREATE INDEX idx_flashcard_reviews_learning_session_id ON flashcard_reviews(learning_session_id);
```

---

## 5. Zasady Row Level Security (RLS)

### 5.1. Włączenie RLS na wszystkich tabelach

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
```

### 5.2. Polityki dla tabeli `profiles`

```sql
-- Użytkownik może odczytywać tylko swój profil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Użytkownik może aktualizować tylko swój profil
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Profil tworzony automatycznie przez trigger (service_role)
CREATE POLICY "Service role can insert profiles"
    ON profiles FOR INSERT
    TO service_role
    WITH CHECK (true);
```

### 5.3. Polityki dla tabeli `flashcards`

```sql
-- Użytkownik może odczytywać tylko swoje fiszki
CREATE POLICY "Users can view own flashcards"
    ON flashcards FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Użytkownik może tworzyć fiszki tylko dla siebie
CREATE POLICY "Users can insert own flashcards"
    ON flashcards FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Użytkownik może aktualizować tylko swoje fiszki
CREATE POLICY "Users can update own flashcards"
    ON flashcards FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Użytkownik może usuwać tylko swoje fiszki
CREATE POLICY "Users can delete own flashcards"
    ON flashcards FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
```

### 5.4. Polityki dla tabeli `generation_sessions`

```sql
-- Użytkownik może odczytywać tylko swoje sesje generowania
CREATE POLICY "Users can view own generation sessions"
    ON generation_sessions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Użytkownik może tworzyć sesje tylko dla siebie
CREATE POLICY "Users can insert own generation sessions"
    ON generation_sessions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
```

### 5.5. Polityki dla tabeli `learning_sessions`

```sql
-- Użytkownik może odczytywać tylko swoje sesje nauki
CREATE POLICY "Users can view own learning sessions"
    ON learning_sessions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Użytkownik może tworzyć sesje nauki tylko dla siebie
CREATE POLICY "Users can insert own learning sessions"
    ON learning_sessions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Użytkownik może aktualizować tylko swoje sesje nauki
CREATE POLICY "Users can update own learning sessions"
    ON learning_sessions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

### 5.6. Polityki dla tabeli `flashcard_reviews`

```sql
-- Użytkownik może odczytywać recenzje tylko swoich fiszek
CREATE POLICY "Users can view own flashcard reviews"
    ON flashcard_reviews FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM flashcards
            WHERE flashcards.id = flashcard_reviews.flashcard_id
            AND flashcards.user_id = auth.uid()
        )
    );

-- Użytkownik może tworzyć recenzje tylko dla swoich fiszek
CREATE POLICY "Users can insert own flashcard reviews"
    ON flashcard_reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM flashcards
            WHERE flashcards.id = flashcard_reviews.flashcard_id
            AND flashcards.user_id = auth.uid()
        )
    );
```

---

## 6. Funkcje i Triggery

### 6.1. Automatyczna aktualizacja `updated_at`

```sql
-- Funkcja do aktualizacji znacznika czasu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla tabeli profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger dla tabeli flashcards
CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON flashcards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 6.2. Automatyczne tworzenie profilu przy rejestracji

```sql
-- Funkcja tworząca profil po rejestracji użytkownika
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabeli auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

---

## 7. Dodatkowe uwagi i decyzje projektowe

### 7.1. Zgodność z RODO

- Wszystkie klucze obce do `profiles` mają `ON DELETE CASCADE`, co zapewnia automatyczne usunięcie wszystkich danych użytkownika przy usunięciu konta.
- Kaskadowe usuwanie propaguje się przez: `profiles` → `flashcards` → `flashcard_reviews` oraz `profiles` → `generation_sessions` i `profiles` → `learning_sessions`.

### 7.2. Bezpieczeństwo

- RLS włączone na wszystkich tabelach publicznych.
- Polityki oparte na `auth.uid()` zapewniają izolację danych między użytkownikami.
- Tylko rola `authenticated` ma dostęp do danych.

### 7.3. Spaced Repetition

- Schemat przygotowany pod algorytmy typu SM-2 lub FSRS.
- `ease_factor` z domyślną wartością 2.50 i minimum 1.30.
- `rating` (1-4) kompatybilny z biblioteką ts-fsrs.
- Historia recenzji w `flashcard_reviews` pozwala na analizę postępów.

### 7.4. Wydajność

- Strategiczne indeksy na najczęstszych zapytaniach (fiszki użytkownika, sesja nauki).
- UUID jako klucze główne dla lepszej dystrybucji danych.
- JSONB dla elastycznych danych (preferencje, parametry modelu, odpowiedzi LLM).

### 7.5. Normalizacja

- Schemat spełnia 3NF (Third Normal Form).
- Brak redundancji danych – każda informacja przechowywana w jednym miejscu.
- Denormalizacja użyta tylko dla `flashcards_reviewed` w `learning_sessions` (licznik aktualizowany dla wydajności).

### 7.6. Decyzje MVP

- Brak soft delete – fiszki usuwane trwale (`DELETE`).
- Brak wersjonowania fiszek.
- Płaska struktura fiszek (bez zestawów/decks).
- Tylko zaakceptowane fiszki zapisywane w bazie.

### 7.7. Typy danych

- `TIMESTAMPTZ` dla wszystkich znaczników czasu (obsługa stref czasowych).
- `DATE` dla `next_review_date` (wystarczająca precyzja dla spaced repetition).
- `NUMERIC(4,2)` dla `ease_factor` (precyzja do 2 miejsc po przecinku).
- `TEXT` dla `front`, `back`, `source_text` (elastyczna długość).
