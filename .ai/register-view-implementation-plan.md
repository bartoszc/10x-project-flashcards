# Plan implementacji widoku rejestracji

## 1. Przegląd

Widok rejestracji (`/register`) umożliwia nowym użytkownikom utworzenie konta w aplikacji 10x-cards. Jest to publiczna strona zawierająca formularz z polami email, hasło i potwierdzenie hasła. Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do widoku generowania fiszek (`/generate`). Widok zawiera walidację client-side z natychmiastowym feedbackiem, wskaźnik siły hasła, obsługę błędów API (w tym błędu 409 - email już zarejestrowany) oraz link do strony logowania.

## 2. Routing widoku

- **Ścieżka**: `/register`
- **Plik**: `src/pages/register.astro`
- **Typ**: Strona publiczna
- **Przekierowanie**:
  - Zalogowani użytkownicy są automatycznie przekierowywani do `/generate`
  - Po pomyślnej rejestracji użytkownik jest przekierowywany do `/generate`

## 3. Struktura komponentów

```
register.astro (strona Astro)
└── Layout.astro
    └── RegisterForm.tsx (React, client:load)
        ├── Input (email)
        ├── PasswordInput (hasło)
        │   └── Input
        │   └── Button (toggle visibility)
        ├── PasswordInput (potwierdzenie hasła)
        ├── PasswordStrengthIndicator
        │   └── Progress bar
        │   └── Lista wymagań
        ├── Button (submit)
        ├── Alert (komunikaty o błędach)
        └── Link do logowania
```

## 4. Szczegóły komponentów

### 4.1. Strona `register.astro`

- **Opis**: Strona Astro hostująca komponent React `RegisterForm`. Sprawdza czy użytkownik jest już zalogowany i przekierowuje do `/generate` jeśli tak.
- **Główne elementy**:
  - `Layout` jako wrapper
  - Centrowany kontener z formularzem
  - Nagłówek strony z tytułem "Utwórz konto"
  - Komponent `RegisterForm` z dyrektywą `client:load`
- **Obsługiwane interakcje**: Brak (logika w komponentach React)
- **Walidacja**: Sprawdzenie sesji po stronie serwera
- **Typy**: Brak specyficznych
- **Propsy**: Brak

### 4.2. Komponent `RegisterForm`

- **Opis**: Główny formularz rejestracji z walidacją client-side, wskaźnikiem siły hasła, obsługą stanu ładowania i wyświetlaniem błędów. Zarządza całym procesem rejestracji.
- **Główne elementy**:
  - `<form>` z atrybutem `noValidate`
  - `Input` dla pola email z `type="email"`
  - `PasswordInput` dla pola hasło
  - `PasswordStrengthIndicator` pod polem hasła
  - `PasswordInput` dla potwierdzenia hasła
  - `Button` typu submit z obsługą stanu ładowania
  - `Alert` do wyświetlania błędów API
  - Link do logowania (`/login`)
- **Obsługiwane interakcje**:
  - `onSubmit` – walidacja i wysłanie żądania do API
  - `onChange` – aktualizacja wartości pól i walidacja inline
  - `onBlur` – walidacja pola po opuszczeniu
- **Obsługiwana walidacja**:
  - Email: wymagany, poprawny format (regex), maks. 255 znaków
  - Hasło: wymagane, min. 8 znaków, maks. 72 znaki
  - Potwierdzenie hasła: wymagane, musi być zgodne z hasłem
- **Typy**:
  - `RegisterFormData` – stan formularza
  - `RegisterFormErrors` – błędy walidacji
  - `RegisterCommand` – payload żądania API
  - `AuthResponseDTO` – odpowiedź sukcesu
  - `ErrorResponseDTO` – odpowiedź błędu
- **Propsy**: Brak (komponent samodzielny)

### 4.3. Komponent `PasswordInput`

- **Opis**: Pole hasła z przyciskiem do przełączania widoczności (pokaż/ukryj hasło). Komponent jest reużywalny i wspólny z widokiem logowania.
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

### 4.4. Komponent `PasswordStrengthIndicator`

- **Opis**: Wizualna ocena siły hasła z paskiem postępu i listą wymagań. Pokazuje użytkownikowi w czasie rzeczywistym, które wymagania hasła są spełnione.
- **Główne elementy**:
  - Pasek postępu (`<div>` z dynamiczną szerokością i kolorem)
  - Lista wymagań z ikonami checkmark/X:
    - Minimum 8 znaków
- **Obsługiwane interakcje**: Brak (komponent czysto prezentacyjny)
- **Obsługiwana walidacja**: Brak (tylko prezentacja stanu)
- **Typy**:
  - `PasswordStrength` – enum: 'weak' | 'medium' | 'strong'
  - `PasswordRequirement` – interfejs dla pojedynczego wymagania
- **Propsy**:
  - `password: string` – aktualne hasło do oceny
  - `className?: string` – opcjonalne dodatkowe klasy CSS

### 4.5. Komponenty Shadcn/ui

Wykorzystywane komponenty z biblioteki Shadcn/ui:

- `Input` – pola tekstowe formularza
- `Button` – przycisk submit i toggle visibility
- `Alert`, `AlertDescription` – wyświetlanie błędów API
- `Label` – etykiety pól formularza

## 5. Typy

### 5.1. Typy formularza (nowe, do utworzenia w `src/components/auth/types.ts`)

```typescript
/**
 * Stan formularza rejestracji.
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Błędy walidacji formularza rejestracji.
 */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Poziom siły hasła.
 */
export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Wymaganie hasła do wyświetlenia w PasswordStrengthIndicator.
 */
export interface PasswordRequirement {
  label: string;
  met: boolean;
}
```

### 5.2. Typy API (istniejące w `src/types.ts`)

```typescript
// Żądanie rejestracji (istniejący)
export interface RegisterCommand {
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
// Schemat Zod dla rejestracji (istniejący)
export const registerSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email must be at most 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny komponentu `RegisterForm`

Formularz używa lokalnego stanu React z `useState`:

```typescript
const [formData, setFormData] = useState<RegisterFormData>({
  email: "",
  password: "",
  confirmPassword: "",
});
const [errors, setErrors] = useState<RegisterFormErrors>({});
const [isLoading, setIsLoading] = useState(false);
const [apiError, setApiError] = useState<string | null>(null);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

### 6.2. Custom hook (opcjonalny)

Nie jest wymagany dedykowany hook, ponieważ logika rejestracji jest zawarta w jednym komponencie. Komponent `PasswordStrengthIndicator` otrzymuje hasło przez propsy i oblicza siłę wewnętrznie.

### 6.3. Przepływ stanu

1. Użytkownik wprowadza email → aktualizacja `formData.email`
2. Użytkownik wprowadza hasło → aktualizacja `formData.password` + aktualizacja `PasswordStrengthIndicator`
3. Użytkownik wprowadza potwierdzenie hasła → aktualizacja `formData.confirmPassword`
4. Walidacja inline przy `onBlur` → aktualizacja `errors`
5. Submit formularza → ustawienie `isLoading: true`
6. Wywołanie API → sukces (przekierowanie) lub błąd (ustawienie `apiError`)
7. Zakończenie → ustawienie `isLoading: false`

## 7. Integracja API

### 7.1. Endpoint

- **URL**: `POST /api/auth/register`
- **Content-Type**: `application/json`

### 7.2. Żądanie

```typescript
interface RegisterRequest {
  email: string;
  password: string;
}
```

> **Uwaga**: Pole `confirmPassword` jest używane tylko do walidacji client-side i nie jest wysyłane do API.

### 7.3. Odpowiedzi

**Sukces (201 Created)**:

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

**Email już zarejestrowany (409 Conflict)**:

```typescript
interface ErrorResponseDTO {
  error: {
    code: "CONFLICT";
    message: "Email already registered";
  };
}
```

### 7.4. Przykład implementacji wywołania API

```typescript
async function handleRegister(data: RegisterFormData): Promise<void> {
  setIsLoading(true);
  setApiError(null);

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    if (!response.ok) {
      const errorData: ErrorResponseDTO = await response.json();

      // Specjalna obsługa błędu 409
      if (response.status === 409) {
        throw new Error("Ten adres email jest już zarejestrowany. Przejdź do logowania.");
      }

      throw new Error(errorData.error.message);
    }

    // Sukces - przekierowanie do /generate
    window.location.href = "/generate";
  } catch (error) {
    setApiError(error instanceof Error ? error.message : "Wystąpił błąd rejestracji");
  } finally {
    setIsLoading(false);
  }
}
```

## 8. Interakcje użytkownika

| Interakcja                           | Element             | Akcja      | Rezultat                                                       |
| ------------------------------------ | ------------------- | ---------- | -------------------------------------------------------------- |
| Wprowadzenie emaila                  | Input email         | `onChange` | Aktualizacja `formData.email`                                  |
| Opuszczenie pola email               | Input email         | `onBlur`   | Walidacja formatu email                                        |
| Wprowadzenie hasła                   | Input hasło         | `onChange` | Aktualizacja `formData.password` + aktualizacja wskaźnika siły |
| Opuszczenie pola hasła               | Input hasło         | `onBlur`   | Walidacja długości hasła                                       |
| Kliknięcie ikony oka (hasło)         | Button toggle       | `onClick`  | Przełączenie widoczności hasła                                 |
| Wprowadzenie potwierdzenia           | Input potwierdzenie | `onChange` | Aktualizacja `formData.confirmPassword`                        |
| Opuszczenie pola potwierdzenia       | Input potwierdzenie | `onBlur`   | Walidacja zgodności haseł                                      |
| Kliknięcie ikony oka (potwierdzenie) | Button toggle       | `onClick`  | Przełączenie widoczności potwierdzenia                         |
| Submit formularza                    | Form / Button       | `onSubmit` | Walidacja + wywołanie API                                      |
| Enter w formularzu                   | Form                | `onSubmit` | Walidacja + wywołanie API                                      |
| Tab między polami                    | Pola formularza     | Focus      | Nawigacja klawiaturą                                           |
| Kliknięcie "Zaloguj się"             | Link                | Navigation | Przekierowanie do `/login`                                     |

## 9. Warunki i walidacja

### 9.1. Walidacja client-side

| Pole          | Warunek           | Komunikat błędu                          | Moment walidacji     |
| ------------- | ----------------- | ---------------------------------------- | -------------------- |
| Email         | Wymagane          | "Email jest wymagany"                    | `onBlur`, `onSubmit` |
| Email         | Poprawny format   | "Niepoprawny format email"               | `onBlur`, `onSubmit` |
| Email         | Maks. 255 znaków  | "Email może mieć maksymalnie 255 znaków" | `onBlur`, `onSubmit` |
| Hasło         | Wymagane          | "Hasło jest wymagane"                    | `onBlur`, `onSubmit` |
| Hasło         | Min. 8 znaków     | "Hasło musi mieć minimum 8 znaków"       | `onBlur`, `onSubmit` |
| Hasło         | Maks. 72 znaki    | "Hasło może mieć maksymalnie 72 znaki"   | `onBlur`, `onSubmit` |
| Potwierdzenie | Wymagane          | "Potwierdzenie hasła jest wymagane"      | `onBlur`, `onSubmit` |
| Potwierdzenie | Zgodność z hasłem | "Hasła muszą być identyczne"             | `onBlur`, `onSubmit` |

### 9.2. Wpływ walidacji na UI

- Pole z błędem otrzymuje klasę `aria-invalid="true"` i czerwoną ramkę
- Komunikat błędu wyświetlany pod polem z `aria-describedby`
- Przycisk submit jest disabled podczas `isLoading`
- Formularz nie jest wysyłany jeśli walidacja nie przejdzie
- `PasswordStrengthIndicator` pokazuje postęp w czasie rzeczywistym

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
  if (email.length > 255) {
    return "Email może mieć maksymalnie 255 znaków";
  }
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Hasło jest wymagane";
  }
  if (password.length < 8) {
    return "Hasło musi mieć minimum 8 znaków";
  }
  if (password.length > 72) {
    return "Hasło może mieć maksymalnie 72 znaki";
  }
  return undefined;
}

function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) {
    return "Potwierdzenie hasła jest wymagane";
  }
  if (password !== confirmPassword) {
    return "Hasła muszą być identyczne";
  }
  return undefined;
}

function validateForm(data: RegisterFormData): RegisterFormErrors {
  return {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
    confirmPassword: validateConfirmPassword(data.password, data.confirmPassword),
  };
}
```

## 10. Obsługa błędów

### 10.1. Błędy walidacji client-side

- Wyświetlane inline pod odpowiednimi polami
- Czerwona ramka wokół pola z błędem
- Użycie `aria-describedby` dla dostępności

### 10.2. Błędy API

| Kod HTTP      | Kod błędu        | Sposób obsługi              | Komunikat dla użytkownika                                       |
| ------------- | ---------------- | --------------------------- | --------------------------------------------------------------- |
| 400           | VALIDATION_ERROR | Wyświetlenie w Alert        | Szczegóły z `details.reason` lub "Niepoprawne dane rejestracji" |
| 409           | CONFLICT         | Wyświetlenie w Alert + link | "Ten adres email jest już zarejestrowany. [Zaloguj się]"        |
| 500           | INTERNAL_ERROR   | Wyświetlenie w Alert        | "Wystąpił błąd serwera. Spróbuj ponownie później."              |
| Network Error | -                | Wyświetlenie w Alert        | "Brak połączenia z serwerem"                                    |

### 10.3. Specjalna obsługa błędu 409

W przypadku błędu 409 (email już zarejestrowany):

- Wyświetlić Alert z komunikatem
- Dodać link do strony logowania w komunikacie błędu
- Opcjonalnie: ustawić focus na polu email

### 10.4. Przykład komponentu Alert z linkiem

```tsx
{
  apiError && (
    <Alert variant="destructive" role="alert" aria-live="assertive">
      <AlertDescription>
        {apiError}
        {apiError.includes("już zarejestrowany") && (
          <a href="/login" className="underline ml-1">
            Zaloguj się
          </a>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

## 11. Kroki implementacji

### Krok 1: Sprawdzenie wymaganych komponentów Shadcn/ui

Upewnienie się, że zainstalowane są komponenty:

- `input`
- `button`
- `alert`
- `label`

Jeśli brakuje któregoś:

```bash
npx shadcn@latest add [nazwa-komponentu]
```

### Krok 2: Rozszerzenie typów formularza

Rozszerzenie pliku `src/components/auth/types.ts` o typy:

- `RegisterFormData`
- `RegisterFormErrors`
- `PasswordStrength`
- `PasswordRequirement`

### Krok 3: Utworzenie komponentu `PasswordStrengthIndicator`

Utworzenie pliku `src/components/auth/PasswordStrengthIndicator.tsx`:

- Pasek postępu z dynamicznym kolorem (czerwony → żółty → zielony)
- Lista wymagań z ikonami checkmark/X
- Obliczanie siły hasła na podstawie wymagań

### Krok 4: Ponowne wykorzystanie komponentu `PasswordInput`

Wykorzystanie istniejącego (lub utworzenie jeśli nie istnieje) komponentu `src/components/auth/PasswordInput.tsx` z widoku logowania.

### Krok 5: Utworzenie komponentu `RegisterForm`

Utworzenie pliku `src/components/auth/RegisterForm.tsx`:

- Stan formularza z useState (3 pola + błędy + loading)
- Walidacja inline i przy submit
- Integracja z `PasswordStrengthIndicator`
- Wywołanie API fetch do `/api/auth/register`
- Obsługa błędów (w tym specjalna obsługa 409)
- Link do logowania

### Krok 6: Utworzenie strony `register.astro`

Utworzenie pliku `src/pages/register.astro`:

- Import Layout
- Sprawdzenie sesji (redirect jeśli zalogowany)
- Centrowany kontener z RegisterForm
- Nagłówek "Utwórz konto"
- SEO meta tags

### Krok 7: Aktualizacja middleware

W pliku `src/middleware/index.ts` dodanie logiki:

- Przekierowanie z `/register` do `/generate` jeśli użytkownik jest zalogowany

### Krok 8: Stylowanie i dostępność

- Dodanie odpowiednich klas Tailwind
- Ustawienie `aria-*` atrybutów dla wszystkich pól
- Focus states dla nawigacji klawiaturą
- Responsywny layout (mobile-first)
- Wyraźne oznaczenie wymagań hasła

### Krok 9: Testowanie manualne

Przypadki testowe:

1. Walidacja formularza:
   - Pusty email → błąd "Email jest wymagany"
   - Niepoprawny format email → błąd "Niepoprawny format email"
   - Hasło krótsze niż 8 znaków → błąd "Hasło musi mieć minimum 8 znaków"
   - Niezgodne hasła → błąd "Hasła muszą być identyczne"
2. Wskaźnik siły hasła:
   - Hasło < 8 znaków → wskaźnik "słabe"
   - Hasło >= 8 znaków → wskaźnik "silne"
3. Wywołania API:
   - Poprawne dane → sukces + przekierowanie do `/generate`
   - Email już zarejestrowany → Alert z błędem 409 + link do logowania
   - Błąd serwera → Alert z komunikatem o błędzie

4. Nawigacja klawiaturowa:
   - Tab przechodzi między polami
   - Enter wysyła formularz

5. Responsywność:
   - Poprawne wyświetlanie na mobile i desktop

### Krok 10: Integracja z nawigacją

- Weryfikacja linku do rejestracji w widoku logowania
- Weryfikacja przekierowań po rejestracji

## 12. Weryfikacja implementacji

### 12.1. Testy manualne

Poniższe testy należy wykonać w przeglądarce:

1. **Test walidacji email**:
   - Otwórz `/register`
   - Wpisz niepoprawny email (np. "test")
   - Opuść pole (kliknij poza nim)
   - **Oczekiwany rezultat**: Pojawia się komunikat "Niepoprawny format email"

2. **Test walidacji hasła**:
   - Wpisz hasło krótsze niż 8 znaków (np. "123")
   - Opuść pole
   - **Oczekiwany rezultat**: Pojawia się komunikat "Hasło musi mieć minimum 8 znaków"

3. **Test zgodności haseł**:
   - Wpisz hasło "password123"
   - Wpisz potwierdzenie "password124"
   - Opuść pole
   - **Oczekiwany rezultat**: Pojawia się komunikat "Hasła muszą być identyczne"

4. **Test wskaźnika siły hasła**:
   - Wpisz hasło "12345678"
   - **Oczekiwany rezultat**: Wskaźnik pokazuje "silne" (zielony pasek)

5. **Test pomyślnej rejestracji**:
   - Wpisz unikalny email (np. "test-[timestamp]@example.com")
   - Wpisz hasło "password123"
   - Powtórz hasło
   - Kliknij "Zarejestruj się"
   - **Oczekiwany rezultat**: Przekierowanie do `/generate`

6. **Test błędu 409**:
   - Wpisz już istniejący email
   - Wypełnij pozostałe pola poprawnie
   - Kliknij "Zarejestruj się"
   - **Oczekiwany rezultat**: Alert z komunikatem "Ten adres email jest już zarejestrowany" + link do logowania

7. **Test nawigacji**:
   - Kliknij link "Zaloguj się" pod formularzem
   - **Oczekiwany rezultat**: Przekierowanie do `/login`

8. **Test przekierowania zalogowanego użytkownika**:
   - Zaloguj się na konto
   - Przejdź ręcznie do `/register`
   - **Oczekiwany rezultat**: Automatyczne przekierowanie do `/generate`
