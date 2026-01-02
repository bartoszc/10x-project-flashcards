# Specyfikacja Systemu Autentykacji – 10x-cards

## Spis treści

1. [Przegląd systemu](#1-przegląd-systemu)
2. [Architektura interfejsu użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika backendowa](#3-logika-backendowa)
4. [System autentykacji Supabase](#4-system-autentykacji-supabase)
5. [Mapowanie user stories](#5-mapowanie-user-stories)
6. [Bezpieczeństwo i zgodność z RODO](#6-bezpieczeństwo-i-zgodność-z-rodo)

---

## 1. Przegląd systemu

System autentykacji dla 10x-cards realizuje wymagania z historyjek użytkownika **US-001, US-002, US-010, US-011, US-012** i wspiera wymagania bezpieczeństwa z **US-009**.

### 1.1. Zakres funkcjonalności

| Funkcjonalność     | User Story | Status                        |
| ------------------ | ---------- | ----------------------------- |
| Rejestracja konta  | US-001     | ✅ Zaimplementowane           |
| Logowanie          | US-002     | ✅ Zaimplementowane           |
| Wylogowanie        | US-010     | ✅ Zaimplementowane           |
| Odzyskiwanie hasła | US-011     | ⚠️ Do implementacji           |
| Usunięcie konta    | US-012     | ✅ Zaimplementowane (backend) |
| Bezpieczny dostęp  | US-009     | ✅ Zaimplementowane (RLS)     |

### 1.2. Stack technologiczny

- **Frontend**: Astro 5 (SSR) + React 19 (komponenty interaktywne)
- **Stylowanie**: Tailwind 4 + Shadcn/ui
- **Autentykacja**: Supabase Auth (JWT)
- **Baza danych**: PostgreSQL via Supabase
- **Walidacja**: Zod

---

## 2. Architektura interfejsu użytkownika

### 2.1. Struktura stron i ścieżek

#### Strony publiczne (auth mode)

| Ścieżka                | Plik                                  | Opis                                 |
| ---------------------- | ------------------------------------- | ------------------------------------ |
| `/login`               | `src/pages/login.astro`               | Strona logowania                     |
| `/register`            | `src/pages/register.astro`            | Strona rejestracji                   |
| `/auth/reset-password` | `src/pages/auth/reset-password.astro` | ⚠️ Formularz żądania resetu hasła    |
| `/auth/new-password`   | `src/pages/auth/new-password.astro`   | ⚠️ Formularz ustawienia nowego hasła |

#### Strony chronione (non-auth mode)

| Ścieżka       | Wymagana autoryzacja | Redirect gdy brak sesji |
| ------------- | -------------------- | ----------------------- |
| `/generate`   | ✅                   | → `/login`              |
| `/flashcards` | ✅                   | → `/login`              |
| `/learn`      | ✅                   | → `/login`              |
| `/profile`    | ✅                   | → `/login`              |

### 2.2. Komponenty React – formularze autentykacji

#### 2.2.1. LoginForm (`src/components/auth/LoginForm.tsx`)

**Odpowiedzialność**: Obsługa logowania użytkownika via API.

**Stan komponentu** (interfejs `LoginFormState`):

```typescript
interface LoginFormState {
  formData: { email: string; password: string };
  errors: { email?: string; password?: string };
  isLoading: boolean;
  apiError: string | null;
  showPassword: boolean;
}
```

**Walidacja client-side**:

- Email: format email (`zod.email()`)
- Hasło: wymagane, minimum 1 znak

**Obsługa błędów API**:
| Kod HTTP | Komunikat dla użytkownika |
|----------|---------------------------|
| 400 | Wyświetl szczegóły z `error.details.reason` |
| 401 | "Nieprawidłowy email lub hasło" (bez ujawniania które pole) |
| 500 | "Wystąpił błąd serwera. Spróbuj ponownie." |

**Przepływ akcji**:

1. Walidacja formularza (Zod)
2. Wywołanie `POST /api/auth/login`
3. Zapisanie tokenu w localStorage
4. Przekierowanie do `/generate`

#### 2.2.2. RegisterForm (`src/components/auth/RegisterForm.tsx`)

**Odpowiedzialność**: Obsługa rejestracji nowego użytkownika.

**Stan komponentu** (interfejs `RegisterFormState`):

```typescript
interface RegisterFormState {
  formData: { email: string; password: string; confirmPassword: string };
  errors: { email?: string; password?: string; confirmPassword?: string };
  isLoading: boolean;
  apiError: string | null;
  showPassword: boolean;
}
```

**Walidacja client-side**:

- Email: format email, max 255 znaków
- Hasło: minimum 8 znaków, max 72 znaki
- Potwierdzenie hasła: musi być identyczne z hasłem

**Komponenty zależne**:

- `PasswordStrengthIndicator` – wizualna ocena siły hasła
- `PasswordInput` – pole hasła z opcją show/hide

**Obsługa błędów API**:
| Kod HTTP | Komunikat dla użytkownika |
|----------|---------------------------|
| 400 | Błąd walidacji – wyświetl szczegóły |
| 409 | "Konto z tym adresem email już istnieje" + link do logowania |
| 500 | "Wystąpił błąd serwera. Spróbuj ponownie." |

**Przepływ akcji**:

1. Walidacja formularza (Zod, w tym zgodność haseł)
2. Wywołanie `POST /api/auth/register`
3. Automatyczne logowanie po rejestracji (token w odpowiedzi)
4. Przekierowanie do `/generate`

#### 2.2.3. ResetPasswordForm (`src/components/auth/ResetPasswordForm.tsx`) ⚠️ DO IMPLEMENTACJI

**Odpowiedzialność**: Wysyłanie żądania resetu hasła.

**Stan komponentu**:

```typescript
interface ResetPasswordFormState {
  email: string;
  errors: { email?: string };
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string | null;
}
```

**Walidacja client-side**:

- Email: format email

**Zachowanie bezpieczeństwa**:

- Zawsze wyświetla komunikat sukcesu "Link do resetu hasła został wysłany" niezależnie od tego, czy email istnieje w systemie
- Zapobiega enumeracji adresów email

**Przepływ akcji**:

1. Walidacja formatu email
2. Wywołanie `POST /api/auth/reset-password`
3. Wyświetlenie komunikatu sukcesu + link do logowania

#### 2.2.4. NewPasswordForm (`src/components/auth/NewPasswordForm.tsx`) ⚠️ DO IMPLEMENTACJI

**Odpowiedzialność**: Ustawienie nowego hasła po kliknięciu w link z emaila.

**Stan komponentu**:

```typescript
interface NewPasswordFormState {
  password: string;
  confirmPassword: string;
  errors: { password?: string; confirmPassword?: string };
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string | null;
}
```

**Walidacja client-side**:

- Hasło: minimum 8 znaków, max 72 znaki
- Potwierdzenie: identyczne z hasłem

**Komponenty zależne**:

- `PasswordStrengthIndicator` – ponowne użycie
- `PasswordInput` – ponowne użycie

**Przepływ akcji**:

1. Weryfikacja tokenu resetu (z URL via Supabase callback)
2. Walidacja formularza
3. Wywołanie `POST /api/auth/update-password`
4. Komunikat sukcesu + przekierowanie do `/login`

**Obsługa wygaśnięcia tokenu**:

- Kod 401 → przekierowanie do `/auth/reset-password` z komunikatem "Link wygasł"

### 2.3. Komponenty współdzielone

#### 2.3.1. PasswordInput (`src/components/auth/PasswordInput.tsx`)

Komponent pola hasła z przyciskiem show/hide.

**Props**:

```typescript
interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  showPassword: boolean;
  onToggleShow: () => void;
}
```

#### 2.3.2. PasswordStrengthIndicator (`src/components/auth/PasswordStrengthIndicator.tsx`)

Wizualna ocena siły hasła z listą wymagań.

**Wymagania hasła**:

- Minimum 8 znaków
- (opcjonalnie) wielka litera
- (opcjonalnie) cyfra
- (opcjonalnie) znak specjalny

**Poziomy siły** (`PasswordStrength`):

- `weak` – czerwony (< 8 znaków)
- `medium` – żółty (8+ znaków)
- `strong` – zielony (8+ znaków + wielka litera + cyfra)

### 2.4. Strony Astro

#### 2.4.1. Strona logowania (`src/pages/login.astro`)

**Odpowiedzialność**: Renderowanie strony z formularzem logowania.

```astro
---
import Layout from "../layouts/Layout.astro";
import Header from "../components/Header.astro";
import { LoginForm } from "../components/auth/LoginForm";
---

<Layout title="Zaloguj się | 10x Cards">
  <Header isLoggedIn={false} />
  <main class="container mx-auto max-w-md py-16 px-4">
    <h1>Zaloguj się</h1>
    <LoginForm client:load />
    <div class="mt-4 text-center">
      <a href="/register">Nie masz konta? Zarejestruj się</a>
      <a href="/auth/reset-password">Zapomniałeś hasła?</a>
    </div>
  </main>
</Layout>
```

**Dyrektywa `client:load`**: Formularz wymaga interaktywności (stan, walidacja, fetch API).

#### 2.4.2. Strona rejestracji (`src/pages/register.astro`)

Analogiczna struktura z `RegisterForm`.

#### 2.4.3. Strona resetu hasła (`src/pages/auth/reset-password.astro`) ⚠️ DO IMPLEMENTACJI

```astro
---
import Layout from "../../layouts/Layout.astro";
import Header from "../../components/Header.astro";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";
---

<Layout title="Odzyskaj hasło | 10x Cards">
  <Header isLoggedIn={false} />
  <main class="container mx-auto max-w-md py-16 px-4">
    <h1>Odzyskaj hasło</h1>
    <p>Podaj adres email powiązany z Twoim kontem.</p>
    <ResetPasswordForm client:load />
    <a href="/login">Wróć do logowania</a>
  </main>
</Layout>
```

#### 2.4.4. Strona nowego hasła (`src/pages/auth/new-password.astro`) ⚠️ DO IMPLEMENTACJI

Ta strona jest dostępna po kliknięciu w link z emaila resetującego. Supabase przekierowuje użytkownika z tokenem w URL.

```astro
---
import Layout from "../../layouts/Layout.astro";
import { NewPasswordForm } from "../../components/auth/NewPasswordForm";

// Supabase Auth callback obsługuje token automatycznie
// Token jest w URL hash (#access_token=...) lub query params
---

<Layout title="Ustaw nowe hasło | 10x Cards">
  <main class="container mx-auto max-w-md py-16 px-4">
    <h1>Ustaw nowe hasło</h1>
    <NewPasswordForm client:load />
  </main>
</Layout>
```

### 2.5. Komponent Header (`src/components/Header.astro`)

**Odpowiedzialność**: Nawigacja z warunkowym wyświetlaniem elementów auth/non-auth.

**Stan auth określany przez props `isLoggedIn`**:

- `isLoggedIn=true` → linki: Generuj fiszki, Moje fiszki, przycisk Wyloguj
- `isLoggedIn=false` → linki: Zaloguj się, Zarejestruj się

**Wylogowanie**:
Formularz `<form action="/api/auth/logout" method="POST">` – natywne wysłanie bez JavaScript.

### 2.6. Layouty

#### 2.6.1. Layout główny (`src/layouts/Layout.astro`)

Wspólny layout dla wszystkich stron – meta tagi, fonty, globalne style.

**Brak** server-side sprawdzania sesji – każda strona sama decyduje o nagłówku.

### 2.7. Walidacja i komunikaty błędów

#### Tabela komunikatów błędów

| Pole            | Warunek              | Komunikat                               |
| --------------- | -------------------- | --------------------------------------- |
| email           | Puste                | "Email jest wymagany"                   |
| email           | Nieprawidłowy format | "Nieprawidłowy format adresu email"     |
| email           | > 255 znaków         | "Email nie może przekraczać 255 znaków" |
| password        | Puste                | "Hasło jest wymagane"                   |
| password        | < 8 znaków           | "Hasło musi mieć minimum 8 znaków"      |
| password        | > 72 znaków          | "Hasło nie może przekraczać 72 znaków"  |
| confirmPassword | Niezgodne            | "Hasła muszą być identyczne"            |

### 2.8. Scenariusze użytkownika

#### Scenariusz 1: Rejestracja nowego użytkownika

1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (email, hasło, potwierdzenie hasła)
3. `PasswordStrengthIndicator` pokazuje siłę hasła w czasie rzeczywistym
4. Klik "Zarejestruj się" → walidacja client-side
5. Jeśli poprawne → `POST /api/auth/register`
6. Odpowiedź 201 → zapisanie tokenu, redirect do `/generate`
7. Błąd 409 → komunikat "Konto już istnieje" + link do logowania

#### Scenariusz 2: Logowanie istniejącego użytkownika

1. Użytkownik wchodzi na `/login`
2. Wypełnia email i hasło
3. Klik "Zaloguj się" → walidacja client-side
4. `POST /api/auth/login`
5. Odpowiedź 200 → zapisanie tokenu, redirect do `/generate`
6. Błąd 401 → komunikat "Nieprawidłowy email lub hasło"

#### Scenariusz 3: Odzyskiwanie hasła

1. Użytkownik klika "Zapomniałeś hasła?" na stronie logowania
2. Redirect do `/auth/reset-password`
3. Wpisuje email i klika "Wyślij link"
4. `POST /api/auth/reset-password`
5. **Zawsze** wyświetlany komunikat "Link został wysłany" (bezpieczeństwo)
6. Użytkownik otrzymuje email z linkiem (jeśli konto istnieje)
7. Klik w link → redirect do `/auth/new-password`
8. Ustawienie nowego hasła → przekierowanie do `/login`

#### Scenariusz 4: Wylogowanie

1. Zalogowany użytkownik klika "Wyloguj" w nagłówku
2. Formularz wysyła `POST /api/auth/logout`
3. Backend unieważnia sesję
4. Redirect do `/login` (lub `/`)
5. Token usunięty z localStorage

---

## 3. Logika backendowa

### 3.1. Struktura endpointów API

| Metoda | Endpoint                    | Opis                    | Status |
| ------ | --------------------------- | ----------------------- | ------ |
| POST   | `/api/auth/register`        | Rejestracja użytkownika | ✅     |
| POST   | `/api/auth/login`           | Logowanie użytkownika   | ✅     |
| POST   | `/api/auth/logout`          | Wylogowanie             | ✅     |
| DELETE | `/api/auth/account`         | Usunięcie konta         | ✅     |
| POST   | `/api/auth/reset-password`  | Żądanie resetu hasła    | ⚠️     |
| POST   | `/api/auth/update-password` | Ustawienie nowego hasła | ⚠️     |

### 3.2. Pliki endpointów

```
src/pages/api/auth/
├── register.ts     ✅ Zaimplementowany
├── login.ts        ✅ Zaimplementowany
├── logout.ts       ✅ Zaimplementowany
├── account.ts      ✅ Zaimplementowany (DELETE)
├── reset-password.ts  ⚠️ Do implementacji
└── update-password.ts ⚠️ Do implementacji
```

### 3.3. Schematy walidacji Zod

#### 3.3.1. Istniejące schematy (`src/lib/schemas/auth.schema.ts`)

```typescript
// Schema rejestracji
export const registerSchema = z.object({
  email: z.string().email("Invalid email format").max(255),
  password: z.string().min(8).max(72),
});

// Schema logowania
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
```

#### 3.3.2. Nowe schematy do dodania

```typescript
// Schema resetu hasła
export const resetPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});

// Schema aktualizacji hasła
export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Minimum 8 znaków").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });
```

### 3.4. Serwis AuthService (`src/lib/services/auth.service.ts`)

#### 3.4.1. Istniejące metody

| Metoda                            | Opis                                               |
| --------------------------------- | -------------------------------------------------- |
| `register(supabase, data)`        | Rejestracja via `supabase.auth.signUp()`           |
| `login(supabase, data)`           | Logowanie via `supabase.auth.signInWithPassword()` |
| `logout(supabase)`                | Wylogowanie via `supabase.auth.signOut()`          |
| `deleteAccount(supabase, userId)` | Usunięcie profilu + wylogowanie                    |

#### 3.4.2. Nowe metody do dodania

```typescript
/**
 * Wysyła email z linkiem do resetu hasła.
 */
static async resetPassword(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<{ message: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/new-password`,
  });

  // Nie ujawniamy czy email istnieje
  if (error) {
    console.error("[AuthService] Reset password error:", error.message);
  }

  return { message: "If this email exists, a password reset link has been sent" };
}

/**
 * Aktualizuje hasło użytkownika po resecie.
 */
static async updatePassword(
  supabase: SupabaseClient<Database>,
  password: string
): Promise<{ message: string }> {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    if (error.message.includes("weak_password")) {
      throw new AuthError("Password too weak", "VALIDATION_ERROR", 400);
    }
    throw new AuthError("Failed to update password", "INTERNAL_ERROR", 500);
  }

  return { message: "Password updated successfully" };
}
```

### 3.5. Klasa AuthError

Istniejąca klasa błędów z kodami:

```typescript
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHORIZED" | "CONFLICT" | "VALIDATION_ERROR" | "INTERNAL_ERROR",
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
```

### 3.6. Endpointy – kontrakt API

#### 3.6.1. POST `/api/auth/reset-password`

**Request**:

```json
{
  "email": "user@example.com"
}
```

**Response 200**:

```json
{
  "message": "If this email exists, a password reset link has been sent"
}
```

**Błędy**:

- 400: Nieprawidłowy format email
- 429: Rate limit (max 3 żądania/godz./email)

#### 3.6.2. POST `/api/auth/update-password`

**Headers**: Użytkownik musi być uwierzytelniony via token resetu (callback Supabase)

**Request**:

```json
{
  "password": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

**Response 200**:

```json
{
  "message": "Password updated successfully"
}
```

**Błędy**:

- 400: Hasło nie spełnia wymagań / hasła nie są zgodne
- 401: Nieprawidłowy lub wygasły token resetu

### 3.7. Modele danych (DTOs)

#### 3.7.1. Istniejące typy (`src/types.ts`)

```typescript
// Odpowiedź auth po login/register
interface AuthResponseDTO {
  user: AuthUserDTO;
  session: SessionDTO;
}

interface AuthUserDTO {
  id: string;
  email: string;
  created_at: string;
}

interface SessionDTO {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}
```

#### 3.7.2. Nowe typy do dodania

```typescript
// Żądanie resetu hasła
interface ResetPasswordCommand {
  email: string;
}

// Żądanie aktualizacji hasła
interface UpdatePasswordCommand {
  password: string;
  confirmPassword: string;
}

// Odpowiedź operacji reset/update
interface PasswordOperationResponseDTO {
  message: string;
}
```

### 3.8. Middleware (`src/middleware/index.ts`)

**Istniejąca implementacja**:

- Tworzy klienta Supabase dla każdego requestu
- Wyciąga Bearer token z nagłówka Authorization
- Ustawia token w konfiguracji klienta Supabase
- Udostępnia klienta przez `context.locals.supabase`

**Brak zmian** – middleware nie weryfikuje sesji, tylko przekazuje token do Supabase.

### 3.9. Renderowanie stron server-side

**Konfiguracja** (`astro.config.mjs`):

```javascript
export default defineConfig({
  output: "server", // SSR dla wszystkich stron
  adapter: node({ mode: "standalone" }),
});
```

**Konsekwencje dla auth**:

- Strony mogą sprawdzać sesję server-side przed renderowaniem
- Redirect dla chronionych stron realizowany w frontmatter Astro
- Możliwość przekazania `isLoggedIn` do `Header.astro`

### 3.10. Obsługa wyjątków

**Strategia**:

1. Walidacja Zod na początku handlera
2. Wywołanie metody AuthService
3. Łapanie `AuthError` → mapowanie na odpowiedni status HTTP
4. Łapanie `SyntaxError` → błąd parsowania JSON
5. Fallback → 500 INTERNAL_ERROR

**Przykładowa struktura**:

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validated = schema.safeParse(body);

    if (!validated.success) {
      return Response.json({ error: { code: "VALIDATION_ERROR", ... }}, { status: 400 });
    }

    const result = await AuthService.method(locals.supabase, validated.data);
    return Response.json(result, { status: 200 });

  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: { code: error.code, ... }}, { status: error.statusCode });
    }
    return Response.json({ error: { code: "INTERNAL_ERROR", ... }}, { status: 500 });
  }
};
```

---

## 4. System autentykacji Supabase

### 4.1. Architektura integracji

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ LoginForm   │    │ RegisterForm │    │ ResetForm     │  │
│  │ (React)     │    │ (React)      │    │ (React)       │  │
│  └──────┬──────┘    └──────┬───────┘    └───────┬───────┘  │
│         │                  │                     │          │
│         └───────────┬──────┴─────────────────────┘          │
│                     ▼                                       │
│         fetch() + Bearer token w localStorage               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼  HTTP Request
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Middleware (src/middleware/index.ts)                │   │
│  │ - Wyciąga Bearer token z Authorization header       │   │
│  │ - Tworzy SupabaseClient z tokenem                   │   │
│  │ - Ustawia context.locals.supabase                   │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ API Endpoints (src/pages/api/auth/*.ts)             │   │
│  │ - Walidacja Zod                                     │   │
│  │ - Wywołanie AuthService                             │   │
│  │ - Obsługa błędów                                    │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AuthService (src/lib/services/auth.service.ts)      │   │
│  │ - Wywołania Supabase Auth SDK                       │   │
│  │ - Mapowanie odpowiedzi na DTOs                      │   │
│  │ - Obsługa błędów Supabase → AuthError               │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼  Supabase SDK
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
│  ┌────────────────┐    ┌────────────────┐                  │
│  │  Auth Service  │    │  PostgreSQL    │                  │
│  │  - JWT         │    │  - profiles    │                  │
│  │  - Sessions    │    │  - flashcards  │                  │
│  │  - Email       │    │  - RLS         │                  │
│  └────────────────┘    └────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2. Metody Supabase Auth wykorzystywane w systemie

| Metoda SDK                              | Endpoint API                     | Opis                      |
| --------------------------------------- | -------------------------------- | ------------------------- |
| `supabase.auth.signUp()`                | POST `/api/auth/register`        | Tworzenie konta           |
| `supabase.auth.signInWithPassword()`    | POST `/api/auth/login`           | Logowanie                 |
| `supabase.auth.signOut()`               | POST `/api/auth/logout`          | Wylogowanie               |
| `supabase.auth.resetPasswordForEmail()` | POST `/api/auth/reset-password`  | Wysłanie emaila z linkiem |
| `supabase.auth.updateUser()`            | POST `/api/auth/update-password` | Aktualizacja hasła        |
| `supabase.auth.getUser()`               | (wewnętrzne)                     | Weryfikacja sesji         |

### 4.3. Przepływ tokenów JWT

1. **Rejestracja/Logowanie**:
   - Supabase zwraca `access_token` i `refresh_token`
   - Frontend zapisuje tokeny w localStorage
   - `access_token` wygasa po 1 godzinie

2. **Autoryzowane żądania**:
   - Frontend dodaje `Authorization: Bearer <access_token>` do nagłówków
   - Middleware wyciąga token i konfiguruje klienta Supabase
   - Supabase automatycznie weryfikuje JWT

3. **Refresh tokenu**:
   - Przed wygaśnięciem frontend może użyć `refresh_token`
   - Supabase SDK obsługuje to automatycznie

### 4.4. Konfiguracja Supabase dla resetu hasła

**Wymagane ustawienia w Supabase Dashboard**:

1. **Site URL**: URL produkcyjnej aplikacji
2. **Redirect URLs**: Dozwolone adresy callback
   - `https://example.com/auth/new-password`
   - `http://localhost:3000/auth/new-password` (dev)
3. **Email Templates**: Dostosowanie szablonu emaila resetu

**Przekazanie redirectTo w kodzie**:

```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${import.meta.env.SITE_URL}/auth/new-password`,
});
```

### 4.5. Obsługa callbacku Supabase Auth

Po kliknięciu linku w emailu, Supabase przekierowuje na `/auth/new-password` z tokenem w URL:

```
https://example.com/auth/new-password#access_token=xxx&refresh_token=yyy&type=recovery
```

**Obsługa w React**:

```typescript
// NewPasswordForm.tsx
useEffect(() => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const type = hashParams.get("type");

  if (type === "recovery" && accessToken) {
    // Ustaw sesję w kliencie Supabase
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: hashParams.get("refresh_token") || "",
    });
  }
}, []);
```

---

## 5. Mapowanie user stories

### US-001: Rejestracja konta

| Kryterium akceptacji              | Realizacja                                  |
| --------------------------------- | ------------------------------------------- |
| Strona `/auth/register`           | ✅ `src/pages/register.astro`               |
| Pola: email, hasło, potwierdzenie | ✅ `RegisterForm.tsx`                       |
| Min. 8 znaków hasła               | ✅ Zod schema + `PasswordStrengthIndicator` |
| Aktywacja po wypełnieniu          | ✅ Supabase Auth signUp                     |
| Auto-logowanie po rejestracji     | ✅ Token w odpowiedzi                       |
| Komunikaty o błędach              | ✅ Inline errors + apiError state           |
| Brak OAuth                        | ✅ Nie zaimplementowano                     |
| Link do logowania                 | ✅ W szablonie strony                       |

### US-002: Logowanie do aplikacji

| Kryterium akceptacji          | Realizacja                            |
| ----------------------------- | ------------------------------------- |
| Strona `/auth/login`          | ✅ `src/pages/login.astro`            |
| Pola: email, hasło            | ✅ `LoginForm.tsx`                    |
| Przekierowanie do `/generate` | ✅ Po sukcesie                        |
| Ogólny komunikat błędu        | ✅ "Nieprawidłowy email lub hasło"    |
| Bezpieczne przechowywanie     | ✅ JWT w localStorage                 |
| Link do rejestracji           | ✅ W szablonie strony                 |
| Link do odzyskiwania hasła    | ⚠️ Do dodania                         |
| Przycisk logowania w nagłówku | ✅ `Header.astro` dla niezalogowanych |

### US-010: Wylogowanie z systemu

| Kryterium akceptacji                 | Realizacja                |
| ------------------------------------ | ------------------------- |
| Przycisk w prawym górnym rogu        | ✅ `Header.astro`         |
| Zakończenie sesji                    | ✅ `AuthService.logout()` |
| Przekierowanie na stronę główną      | ✅ Po wylogowaniu         |
| Brak dostępu bez ponownego logowania | ✅ Token usunięty         |

### US-011: Odzyskiwanie hasła

| Kryterium akceptacji           | Realizacja                             |
| ------------------------------ | -------------------------------------- |
| Link "Zapomniałeś hasła?"      | ⚠️ Do dodania w `LoginForm`            |
| Strona `/auth/reset-password`  | ⚠️ Do implementacji                    |
| Formularz z emailem            | ⚠️ `ResetPasswordForm.tsx`             |
| Wysłanie linku resetu          | ⚠️ `AuthService.resetPassword()`       |
| Bezpieczny komunikat           | ⚠️ Zawsze "Link został wysłany"        |
| Link ważny 1 godzinę           | ✅ Konfiguracja Supabase               |
| Strona ustawienia hasła        | ⚠️ `src/pages/auth/new-password.astro` |
| Wymagania jak przy rejestracji | ⚠️ Te same schematy Zod                |
| Logowanie po resecie           | ⚠️ Redirect do `/login`                |

### US-012: Usunięcie konta

| Kryterium akceptacji        | Realizacja                                 |
| --------------------------- | ------------------------------------------ |
| Opcja w profilu             | ⚠️ Strona `/profile` do implementacji      |
| Potwierdzenie decyzji       | ⚠️ `DeleteAccountDialog` do implementacji  |
| Usunięcie wszystkich danych | ✅ `AuthService.deleteAccount()` (CASCADE) |
| Informacja o usunięciu      | ✅ Response message                        |
| Wylogowanie i redirect      | ✅ Po usunięciu                            |
| Nieodwracalność             | ✅ Brak opcji przywrócenia                 |

---

## 6. Bezpieczeństwo i zgodność z RODO

### 6.1. Zabezpieczenia implementacyjne

| Aspekt        | Mechanizm                                |
| ------------- | ---------------------------------------- |
| Hasła         | Hashowane przez Supabase Auth (bcrypt)   |
| Tokeny        | JWT z krótkim czasem życia (1h)          |
| Komunikacja   | HTTPS (wymagane przez Supabase)          |
| Sesje         | Server-side invalidation                 |
| CORS          | Konfiguracja Supabase                    |
| SQL Injection | Supabase SDK (parametryzowane zapytania) |
| XSS           | Escape w React + Content Security Policy |

### 6.2. Row Level Security (RLS)

Wszystkie tabele mają włączone RLS z politykami:

- `profiles`: tylko właściciel widzi/edytuje swój profil
- `flashcards`: tylko właściciel ma dostęp
- `generation_sessions`: tylko właściciel ma dostęp
- `learning_sessions`: tylko właściciel ma dostęp

### 6.3. Zgodność z RODO

| Wymóg                        | Realizacja                                       |
| ---------------------------- | ------------------------------------------------ |
| Prawo do wglądu              | Dostęp do własnych danych via API                |
| Prawo do usunięcia           | `DELETE /api/auth/account` kasuje wszystkie dane |
| Minimalizacja danych         | Tylko email + hasło wymagane                     |
| Bezpieczeństwo przetwarzania | Supabase SOC 2 Type II                           |

### 6.4. Rate limiting

**Zalecana konfiguracja** (do implementacji w middleware lub Supabase):

- Login: max 5 prób / 15 min / IP
- Rejestracja: max 3 prób / godzinę / IP
- Reset hasła: max 3 żądania / godzinę / email

---

## Podsumowanie

Niniejsza specyfikacja opisuje kompletną architekturę systemu autentykacji dla aplikacji 10x-cards. Główne elementy wymagające implementacji to:

1. **Strony i komponenty resetu hasła**:
   - `src/pages/auth/reset-password.astro`
   - `src/pages/auth/new-password.astro`
   - `src/components/auth/ResetPasswordForm.tsx`
   - `src/components/auth/NewPasswordForm.tsx`

2. **Endpointy API resetu hasła**:
   - `src/pages/api/auth/reset-password.ts`
   - `src/pages/api/auth/update-password.ts`

3. **Rozszerzenia AuthService**:
   - Metoda `resetPassword()`
   - Metoda `updatePassword()`

4. **Schematy Zod**:
   - `resetPasswordSchema`
   - `updatePasswordSchema`

5. **Strona profilu z usunięciem konta**:
   - `src/pages/profile.astro`
   - `DeleteAccountDialog` komponent

Pozostałe elementy (login, rejestracja, logout) są już w pełni zaimplementowane zgodnie z wymaganiami.
