# Manualne Scenariusze Testowe - Moduł Autoryzacji

Dokument opisuje kroki weryfikacji poprawności działania rejestracji, logowania oraz ochrony tras w aplikacji 10x-Cards.

## Wymagania Wstępne

- Aplikacja uruchomiona lokalnie (`npm run dev`).
- Dostęp do panelu Supabase (opcjonalnie, do weryfikacji użytkowników w bazie) lub skrzynki e-mail (np. InBucket, jeśli używany lokalnie, lub prawdziwy email).

---

## 1. Rejestracja (Registration)

### Scenariusz 1.1: Rejestracja nowego użytkownika (Happy Path - brak wymaganej weryfikacji email)

**Warunki**: Użytkownik nie istnieje w bazie. Supabase skonfigurowane bez wymuszania potwierdzenia emaila (lub auto-confirm).

1. Wejdź na stronę `/register`.
2. Wypełnij formularz poprawnym emailem (np. `newuser@example.com`) i hasłem (min. 8 znaków).
3. Kliknij "Zarejestruj się".
   **Oczekiwany rezultat**:

- [ ] Wyświetla się powiadomienie (Toast): "Rejestracja pomyślna!".
- [ ] Automatyczne przekierowanie na stronę `/generate`.
- [ ] Nagłówek zmienia się na stan zalogowany (widoczne "Wyloguj").

### Scenariusz 1.2: Rejestracja nowego użytkownika (Happy Path - wymagana weryfikacja email)

**Warunki**: Użytkownik nie istnieje. Supabase skonfigurowane z `Confirm Email`.

1. Wejdź na stronę `/register`.
2. Wypełnij formularz poprawnymi danymi.
3. Kliknij "Zarejestruj się".
   **Oczekiwany rezultat**:

- [ ] Wyświetla się powiadomienie (Toast): "Konto utworzone! Sprawdź swoją skrzynkę mailową...".
- [ ] Po 3 sekundach następuje przekierowanie na stronę `/login`.
- [ ] Użytkownik NIE jest zalogowany (Nagłówek pokazuje "Zaloguj się").

### Scenariusz 1.3: Walidacja formularza

1. Wejdź na stronę `/register`.
2. Spróbuj wysłać pusty formularz.
3. Wpisz e-mail bez `@`.
4. Wpisz hasło krótsze niż 8 znaków.
5. Wpisz różne hasła w polach "Hasło" i "Potwierdź hasło".
   **Oczekiwany rezultat**:

- [ ] Formularz nie jest wysyłany.
- [ ] Pojawiają się komunikaty błędów pod odpowiednimi polami (na czerwono).
- [ ] Wskaźnik siły hasła dynamicznie reaguje na wpisywanie.

### Scenariusz 1.4: Rejestracja na istniejący email

1. Wejdź na stronę `/register`.
2. Wpisz email, który już istnieje w bazie (np. z poprzedniego testu).
3. Kliknij "Zarejestruj się".
   **Oczekiwany rezultat**:

- [ ] Wyświetla się powiadomienie (Toast Error): "Ten adres email jest już zarejestrowany.".
- [ ] Użytkownik pozostaje na stronie rejestracji.

---

## 2. Logowanie (Login)

### Scenariusz 2.1: Poprawne logowanie

1. Wejdź na stronę `/login`.
2. Wpisz poprawne dane istniejącego użytkownika.
3. Kliknij "Zaloguj się".
   **Oczekiwany rezultat**:

- [ ] Wyświetla się powiadomienie (Toast): "Zalogowano pomyślnie!".
- [ ] Przekierowanie na stronę `/generate`.
- [ ] Nagłówek zmienia się na stan zalogowany.

### Scenariusz 2.2: Błędne dane logowania

1. Wejdź na stronę `/login`.
2. Wpisz poprawny email, ale błędne hasło.
3. Kliknij "Zaloguj się".
   **Oczekiwany rezultat**:

- [ ] Wyświetla się powiadomienie (Toast Error): "Nieprawidłowe dane logowania" (lub podobny komunikat bezpieczeństwa).
- [ ] Brak przekierowania.

---

## 3. Wylogowanie (Logout)

### Scenariusz 3.1: Wylogowanie z aplikacji

1. Będąc zalogowanym (np. na stronie `/generate`), kliknij przycisk "Wyloguj" w nagłówku.
   **Oczekiwany rezultat**:

- [ ] Przeładowanie strony/aplikacji.
- [ ] Przekierowanie na stronę `/login` (ponieważ `/generate` jest chronione) LUB pozostanie na stronie głównej (zależnie od tego, czy byliśmy na chronionej trasie).
- [ ] Nagłówek zmienia się na stan wylogowany ("Zaloguj się" / "Zarejestruj się").

---

## 4. Ochrona Tras i Middleware

### Scenariusz 4.1: Dostęp do chronionej trasy jako gość

1. Otwórz okno w trybie Incognito (lub wyloguj się).
2. Spróbuj wejść bezpośrednio na adres `/generate`.
   **Oczekiwany rezultat**:

- [ ] Automatyczne przekierowanie na stronę `/login`.

### Scenariusz 4.2: Dostęp do stron auth jako zalogowany użytkownik

1. Zaloguj się.
2. Spróbuj wejść ręcznie na adres `/login` lub `/register`.
   **Oczekiwany rezultat**:

- [ ] Automatyczne przekierowanie na stronę `/generate` (Dashboard).

### Scenariusz 4.3: Dostęp do nieistniejącej trasy

1. Spróbuj wejść na `/jakas-dziwna-sciezka`.
2. (Zależnie od implementacji 404, ale powinno być bezpieczne).
   **Oczekiwany rezultat**:

- [ ] Strona 404 lub przekierowanie (nie powinno wysypać aplikacji).

---

## 5. UI/UX (Spójność)

### Scenariusz 5.1: Wygląd na urządzeniach mobilnych

1. Zmień szerokość przeglądarki na wymiar mobilny.
2. Sprawdź, czy formularze Logowania/Rejestracji mieszczą się na ekranie.
3. Sprawdź, czy Nagłówek poprawnie się skaluje.
   **Oczekiwany rezultat**:

- [ ] Elementy są czytelne, nic nie wychodzi poza ekran.
- [ ] Shadcn Card ma odpowiednie marginesy.

### Scenariusz 5.2: Powiadomienia (Toasts)

1. Wywołaj błąd i sukces.
   **Oczekiwany rezultat**:

- [ ] Powiadomienia pojawiają się w prawym dolnym (lub górnym) rogu.
- [ ] Są czytelne i znikają po kilku sekundach.
