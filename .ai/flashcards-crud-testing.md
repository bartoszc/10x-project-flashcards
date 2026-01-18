# Flashcards API - Testy Manualne

Dokumentacja do testowania endpointów CRUD dla fiszek.

## Wymagania

- Aplikacja uruchomiona lokalnie (`npm run dev`)
- Zalogowany użytkownik (token sesji w cookies)

## Endpointy

### 1. GET /api/flashcards (Lista)

```bash
curl -X GET "http://localhost:4321/api/flashcards?page=1&limit=10" \
  -H "Cookie: sb-access-token=YOUR_ACCESS_TOKEN"
```

**Odpowiedź 200:**

```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 5, "total_pages": 1 }
}
```

---

### 2. POST /api/flashcards (Tworzenie)

```bash
curl -X POST "http://localhost:4321/api/flashcards" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_ACCESS_TOKEN" \
  -d '{"front": "What is TypeScript?", "back": "A typed superset of JavaScript"}'
```

**Odpowiedź 201:**

```json
{
  "id": "uuid",
  "front": "What is TypeScript?",
  "back": "A typed superset of JavaScript",
  "source": "manual",
  ...
}
```

**Błędy:**

- 400: Brak `front` lub `back`, tekst za długi
- 401: Brak autoryzacji

---

### 3. PUT /api/flashcards/:id (Aktualizacja)

```bash
curl -X PUT "http://localhost:4321/api/flashcards/YOUR_FLASHCARD_UUID" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_ACCESS_TOKEN" \
  -d '{"front": "Updated question?", "back": "Updated answer"}'
```

**Odpowiedź 200:** Zaktualizowana fiszka

**Błędy:**

- 400: Nieprawidłowy format UUID lub body
- 404: Fiszka nie istnieje lub należy do innego użytkownika

---

### 4. DELETE /api/flashcards/:id (Usuwanie)

```bash
curl -X DELETE "http://localhost:4321/api/flashcards/YOUR_FLASHCARD_UUID" \
  -H "Cookie: sb-access-token=YOUR_ACCESS_TOKEN"
```

**Odpowiedź 200:**

```json
{ "message": "Flashcard deleted successfully" }
```

**Błędy:**

- 404: Fiszka nie istnieje

---

## Scenariusze testowe

| Test                     | Endpoint | Oczekiwany wynik      |
| ------------------------ | -------- | --------------------- |
| Tworzenie fiszki         | POST     | 201, nowa fiszka      |
| Tworzenie bez `front`    | POST     | 400, VALIDATION_ERROR |
| Edycja istniejącej       | PUT      | 200, zaktualizowana   |
| Edycja nieistniejącej    | PUT      | 404, NOT_FOUND        |
| Usunięcie istniejącej    | DELETE   | 200, sukces           |
| Usunięcie nieistniejącej | DELETE   | 404, NOT_FOUND        |
| Wszystkie bez auth       | \*       | 401, UNAUTHORIZED     |
