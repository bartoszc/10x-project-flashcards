# GET /api/flashcards - Dokumentacja testowa

## Przykładowe żądania CURL

### 1. Test bez autoryzacji (oczekiwany: 401)

```bash
curl -s -X GET "http://localhost:3000/api/flashcards" | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 2. Podstawowe zapytanie z autoryzacją

```bash
# Pobierz token
ACCESS_TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "testpassword123"}' | jq -r '.session.access_token')

# Pobierz fiszki
curl -s -X GET "http://localhost:3000/api/flashcards" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

---

### 3. Z paginacją

```bash
curl -s -X GET "http://localhost:3000/api/flashcards?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

---

### 4. Z filtrem source

```bash
# Tylko AI-generated
curl -s -X GET "http://localhost:3000/api/flashcards?source=ai" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Tylko manual
curl -s -X GET "http://localhost:3000/api/flashcards?source=manual" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

---

### 5. Z sortowaniem

```bash
curl -s -X GET "http://localhost:3000/api/flashcards?sort=next_review_date&order=asc" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

---

### 6. Test walidacji - limit > 100 (oczekiwany: 400)

```bash
curl -s -X GET "http://localhost:3000/api/flashcards?limit=500" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "field": "limit",
      "reason": "Number must be less than or equal to 100"
    }
  }
}
```

---

### 7. Test walidacji - nieprawidłowy source (oczekiwany: 400)

```bash
curl -s -X GET "http://localhost:3000/api/flashcards?source=invalid" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
```

**Oczekiwana odpowiedź:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "field": "source",
      "reason": "Invalid enum value. Expected 'ai' | 'manual', received 'invalid'"
    }
  }
}
```

---

## Kody błędów

| Kod | Opis             | Kiedy                         |
| --- | ---------------- | ----------------------------- |
| 200 | Sukces           | Lista fiszek z paginacją      |
| 400 | Błąd walidacji   | Nieprawidłowe parametry query |
| 401 | Brak autoryzacji | Brak lub nieprawidłowy token  |
| 500 | Błąd serwera     | Błąd bazy danych              |

---

## Wyniki testów ✅

| Test                            | Status |
| ------------------------------- | ------ |
| Brak autoryzacji → 401          | ✅     |
| Nieprawidłowy limit (500) → 400 | ✅     |
| Nieprawidłowy source → 400      | ✅     |
| Prawidłowe zapytanie → 200      | ✅     |
| Paginacja działa poprawnie      | ✅     |
| Filtr source=ai działa          | ✅     |
