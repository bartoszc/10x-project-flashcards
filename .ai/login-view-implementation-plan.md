# Plan implementacji widoku logowania

## 1. Przegląd

Widok logowania (`/login`) umożliwia istniejącym użytkownikom uwierzytelnienie w aplikacji 10x-cards. Jest to publiczna strona, która po pomyślnym zalogowaniu przekierowuje użytkownika do widoku generowania fiszek (`/generate`). Widok zawiera formularz z polami email i hasło, walidację client-side z natychmiastowym feedbackiem, obsługę błędów API oraz linki nawigacyjne do rejestracji i odzyskiwania hasła.

## 2. Routing widoku

- **Ścieżka**: `/login`
- **Plik**: `src/pages/login.astro`
- **Typ**: Strona publiczna
- **Przekierowanie**:
  - Zalogowani użytkownicy są automatycznie przekierowywani do `/generate`
  - Po pomyślnym logowaniu użytkownik jest przekierowywany do `/generate`

## 3. Struktura komponentów

```
login.astro (strona Astro)
└── Layout.astro
    └── LoginForm.tsx (React, client:load)
        ├── Input (email)
        ├── PasswordInput (hasło z toggle)
        │   └── Input
        │   └── Button (toggle visibility)
        ├── Button (submit)
        ├── Alert (komunikaty o błędach)
        └── Linki nawigacyjne
```

## 4. Szczegóły komponentów

### 4.1. Strona `login.astro`

- **Opis**: Strona Astro hostująca komponent React `LoginForm`. Sprawdza czy użytkownik jest już zalogowany i przekierowuje do `/generate` jeśli tak.
- **Główne elementy**:
  - `Layout` jako wrapper
  - Centrowany kontener z formularzem
  - Nagłówek strony z tytułem "Zaloguj się"
  - Komponent `LoginForm` z dyrektywą `client:load`
- **Obsługiwane interakcje**: Brak (logika w komponentach React)
- **Walidacja**: Sprawdzenie sesji po stronie serwera
- **Typy**: Brak specyficznych
- **Propsy**: Brak

### 4.2. Komponent `LoginForm`

- **Opis**: Główny formularz logowania z walidacją client-side, obsługą stanu ładowania i wyświetlaniem błędów. Zarządza całym procesem logowania.
- **Główne elementy**:
  - `<form>` z atrybutem `noValidate`
  - `Input` dla pola email z `type="email"`
  - `PasswordInput` dla pola hasło
  - `Button` typu submit z obsługą stanu ładowania
  - `Alert` do wyświetlania błędów API
  - Link do rejestracji (`/register`)
  - Link do odzyskiwania hasła (`/reset-password`)
- **Obsługiwane interakcje**:
  - `onSubmit` – walidacja i wysłanie żądania do API
  - `onChange` – aktualizacja wartości pól i walidacja inline
  - `onBlur` – walidacja pola po opuszczeniu
- **Obsługiwana walidacja**:
  - Email: wymagany, poprawny format (regex RFC 5322 simplified)
  - Hasło: wymagane, minimum 1 znak
- **Typy**:
  - `LoginFormData` – stan formularza
  - `LoginFormErrors` – błędy walidacji
  - `LoginCommand` – payload żądania API
  - `AuthResponseDTO` – odpowiedź sukcesu
  - `ErrorResponseDTO` – odpowiedź błędu
- **Propsy**: Brak (komponent samodzielny)

### 4.3. Komponent `PasswordInput`

- **Opis**: Pole hasła z przyciskiem do przełączania widoczności (pokaż/ukryj hasło). Zapewnia lepsze UX i dostępność.
- **Główne elementy**:
  - Wrapper `<div>` z pozycjonowaniem relative
  - `Input` z dynamicznym `type` ("password" | "text")
  - `Button` z ikoną oka (toggle visibility)
- **Obsługiwane interakcje**:
  - `onClick` na przycisku – przełączanie widoczności
  - Wszystkie zdarzenia standardowego Input
- **Obsługiwana walidacja**: Delegowana do rodzica
- **Typy**: Rozszerzenie propsów `Input`
- **Propsy**:
  - Wszystkie propsy komponentu `Input`
  - Opcjonalny callback `onVisibilityChange?: (visible: boolean) => void`

### 4.4. Komponent `Input` (Shadcn/ui)

- **Opis**: Bazowy komponent pola tekstowego z Shadcn/ui. Wymaga instalacji przez CLI.
- **Główne elementy**: `<input>` z odpowiednimi stylami Tailwind
- **Obsługiwane interakcje**: Standardowe zdarzenia HTML input
- **Walidacja**: Brak wbudowanej (delegowana do rodzica)
- **Typy**: `React.ComponentProps<"input">`
- **Propsy**: Standardowe propsy HTML input

### 4.5. Komponent `Alert` (Shadcn/ui)

- **Opis**: Komponent wyświetlający komunikaty o błędach z odpowiednimi stylami i ikonami.
- **Główne elementy**:
  - Container `<div>` z role="alert"
  - Ikona ostrzeżenia
  - Treść komunikatu
- **Obsługiwane interakcje**: Brak
- **Walidacja**: Brak
- **Typy**: Warianty: "default" | "destructive"
- **Propsy**:
  - `variant?: "default" | "destructive"`
  - `children: React.ReactNode`

## 5. Typy

### 5.1. Typy formularza (nowe, do utworzenia w `src/components/auth/types.ts`)

```typescript
/**
 * Stan formularza logowania.
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Błędy walidacji formularza logowania.
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Stan komponentu LoginForm.
 */
export interface LoginFormState {
  formData: LoginFormData;
  errors: LoginFormErrors;
  isLoading: boolean;
  apiError: string | null;
  showPassword: boolean;
}
```

### 5.2. Typy API (istniejące w `src/types.ts`)

```typescript
// Żądanie logowania (istniejący)
export interface LoginCommand {
  email: string;
  password: string;
}

// Odpowiedź sukcesu (istniejący)
export interface AuthResponseDTO {
  user: AuthUserDTO;
  session: SessionDTO;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  created_at: string;
}

export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Odpowiedź błędu (istniejący)
export interface ErrorResponseDTO {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetailsDTO;
  };
}
```

### 5.3. Typy walidacji (z `src/lib/schemas/auth.schema.ts`)

```typescript
// Schemat Zod dla logowania (istniejący)
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny komponentu `LoginForm`

Formularz używa lokalnego stanu React z `useState`:

```typescript
const [formData, setFormData] = useState<LoginFormData>({
  email: "",
  password: "",
});
const [errors, setErrors] = useState<LoginFormErrors>({});
const [isLoading, setIsLoading] = useState(false);
const [apiError, setApiError] = useState<string | null>(null);
const [showPassword, setShowPassword] = useState(false);
```

### 6.2. Custom hook (opcjonalny)

Nie jest wymagany dedykowany hook, ponieważ logika logowania jest prosta i zawarta w jednym komponencie. Jednak jeśli logika byłaby współdzielona, można utworzyć `useAuth` hook.

### 6.3. Przepływ stanu

1. Użytkownik wprowadza dane → aktualizacja `formData`
2. Walidacja inline przy `onBlur` → aktualizacja `errors`
3. Submit formularza → ustawienie `isLoading: true`
4. Wywołanie API → sukces (przekierowanie) lub błąd (ustawienie `apiError`)
5. Zakończenie → ustawienie `isLoading: false`

## 7. Integracja API

### 7.1. Endpoint

- **URL**: `POST /api/auth/login`
- **Content-Type**: `application/json`

### 7.2. Żądanie

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

### 7.3. Odpowiedzi

**Sukces (200 OK)**:

```typescript
interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

**Błąd walidacji (400 Bad Request)**:

```typescript
interface ErrorResponseDTO {
  error: {
    code: "VALIDATION_ERROR";
    message: "Invalid input data";
    details: {
      field: string;
      reason: string;
    };
  };
}
```

**Błędne dane logowania (401 Unauthorized)**:

```typescript
interface ErrorResponseDTO {
  error: {
    code: "UNAUTHORIZED";
    message: "Invalid credentials";
  };
}
```

### 7.4. Przykład implementacji wywołania API

```typescript
async function handleLogin(data: LoginFormData): Promise<void> {
  setIsLoading(true);
  setApiError(null);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ErrorResponseDTO = await response.json();
      throw new Error(errorData.error.message);
    }

    // Sukces - przekierowanie do /generate
    window.location.href = "/generate";
  } catch (error) {
    setApiError(error instanceof Error ? error.message : "Wystąpił błąd logowania");
  } finally {
    setIsLoading(false);
  }
}
```

## 8. Interakcje użytkownika

| Interakcja                     | Element         | Akcja      | Rezultat                            |
| ------------------------------ | --------------- | ---------- | ----------------------------------- |
| Wprowadzenie emaila            | Input email     | `onChange` | Aktualizacja `formData.email`       |
| Opuszczenie pola email         | Input email     | `onBlur`   | Walidacja formatu email             |
| Wprowadzenie hasła             | Input hasło     | `onChange` | Aktualizacja `formData.password`    |
| Kliknięcie ikony oka           | Button toggle   | `onClick`  | Przełączenie widoczności hasła      |
| Submit formularza              | Form / Button   | `onSubmit` | Walidacja + wywołanie API           |
| Enter w formularzu             | Form            | `onSubmit` | Walidacja + wywołanie API           |
| Tab między polami              | Pola formularza | Focus      | Nawigacja klawiaturą                |
| Kliknięcie "Zarejestruj się"   | Link            | Navigation | Przekierowanie do `/register`       |
| Kliknięcie "Zapomniałem hasła" | Link            | Navigation | Przekierowanie do `/reset-password` |

## 9. Warunki i walidacja

### 9.1. Walidacja client-side

| Pole  | Warunek         | Komunikat błędu            | Moment walidacji     |
| ----- | --------------- | -------------------------- | -------------------- |
| Email | Wymagane        | "Email jest wymagany"      | `onBlur`, `onSubmit` |
| Email | Poprawny format | "Niepoprawny format email" | `onBlur`, `onSubmit` |
| Hasło | Wymagane        | "Hasło jest wymagane"      | `onBlur`, `onSubmit` |

### 9.2. Wpływ walidacji na UI

- Pole z błędem otrzymuje klasę `aria-invalid="true"` i czerwoną ramkę
- Komunikat błędu wyświetlany pod polem z `aria-describedby`
- Przycisk submit jest disabled podczas `isLoading`
- Formularz nie jest wysyłany jeśli walidacja nie przejdzie

### 9.3. Implementacja walidacji

```typescript
function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return "Email jest wymagany";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Niepoprawny format email";
  }
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Hasło jest wymagane";
  }
  return undefined;
}

function validateForm(data: LoginFormData): LoginFormErrors {
  return {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
  };
}
```

## 10. Obsługa błędów

### 10.1. Błędy walidacji client-side

- Wyświetlane inline pod odpowiednimi polami
- Czerwona ramka wokół pola z błędem
- Użycie `aria-describedby` dla dostępności

### 10.2. Błędy API

| Kod HTTP      | Kod błędu        | Sposób obsługi       | Komunikat dla użytkownika                          |
| ------------- | ---------------- | -------------------- | -------------------------------------------------- |
| 400           | VALIDATION_ERROR | Wyświetlenie w Alert | "Niepoprawne dane logowania"                       |
| 401           | UNAUTHORIZED     | Wyświetlenie w Alert | "Nieprawidłowy email lub hasło"                    |
| 500           | INTERNAL_ERROR   | Wyświetlenie w Alert | "Wystąpił błąd serwera. Spróbuj ponownie później." |
| Network Error | -                | Wyświetlenie w Alert | "Brak połączenia z serwerem"                       |

### 10.3. Bezpieczeństwo komunikatów

- Błędne dane logowania NIE ujawniają, które pole jest niepoprawne (zgodnie z US-002)
- Generyczny komunikat: "Nieprawidłowy email lub hasło"

### 10.4. Przykład komponentu Alert

```tsx
{
  apiError && (
    <Alert variant="destructive" role="alert" aria-live="assertive">
      <AlertDescription>{apiError}</AlertDescription>
    </Alert>
  );
}
```

## 11. Kroki implementacji

### Krok 1: Instalacja wymaganych komponentów Shadcn/ui

```bash
npx shadcn@latest add input
npx shadcn@latest add alert
npx shadcn@latest add label
```

### Krok 2: Utworzenie typów dla formularza

Utworzenie pliku `src/components/auth/types.ts` z definicjami typów `LoginFormData`, `LoginFormErrors` i `LoginFormState`.

### Krok 3: Utworzenie komponentu `PasswordInput`

Utworzenie pliku `src/components/auth/PasswordInput.tsx`:

- Input z type="password" lub "text"
- Przycisk do toggle widoczności
- Ikona oka (otwarte/zamknięte)
- Obsługa dostępności (aria-label)

### Krok 4: Utworzenie komponentu `LoginForm`

Utworzenie pliku `src/components/auth/LoginForm.tsx`:

- Stan formularza z useState
- Walidacja inline i przy submit
- Wywołanie API fetch do `/api/auth/login`
- Obsługa błędów i stanu ładowania
- Linki nawigacyjne

### Krok 5: Utworzenie strony `login.astro`

Utworzenie pliku `src/pages/login.astro`:

- Import Layout
- Sprawdzenie sesji (redirect jeśli zalogowany)
- Centrowany kontener z LoginForm
- Nagłówek "Zaloguj się"
- SEO meta tags

### Krok 6: Dodanie obsługi przekierowania dla zalogowanych

W pliku `src/middleware/index.ts` dodanie logiki:

- Sprawdzenie czy użytkownik jest zalogowany
- Przekierowanie z `/login` do `/generate` jeśli zalogowany

### Krok 7: Stylowanie i dostępność

- Dodanie odpowiednich klas Tailwind
- Ustawienie `aria-*` atrybutów
- Focus states dla nawigacji klawiaturą
- Responsywny layout (mobile-first)

### Krok 8: Testowanie

- Test walidacji formularza
- Test wywołań API (success/error)
- Test nawigacji klawiaturą
- Test responsywności
- Test dostępności (screen reader)

### Krok 9: Integracja z nawigacją

- Dodanie linku do logowania w głównym layoucie dla niezalogowanych użytkowników
- Weryfikacja przekierowań po logowaniu/wylogowaniu
