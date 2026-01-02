import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import type { LoginFormData, LoginFormErrors } from "./types";
import type { ErrorResponseDTO } from "@/types";

/**
 * Validates email format.
 * Returns error message if invalid, undefined if valid.
 */
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

/**
 * Validates password field.
 * Returns error message if empty, undefined if valid.
 */
function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Hasło jest wymagane";
  }
  return undefined;
}

/**
 * Validates entire form and returns errors object.
 */
function validateForm(data: LoginFormData): LoginFormErrors {
  return {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
  };
}

/**
 * Checks if form has any validation errors.
 */
function hasErrors(errors: LoginFormErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

/**
 * LoginForm component handles user authentication.
 * Provides email/password inputs with inline validation,
 * API integration, loading states, and error handling.
 */
export function LoginForm() {
  const [formData, setFormData] = React.useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // Generate unique IDs for accessibility
  const emailId = React.useId();
  const passwordId = React.useId();
  const emailErrorId = React.useId();
  const passwordErrorId = React.useId();

  /**
   * Updates form field value and clears field error.
   */
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear field error when user starts typing
      if (errors[name as keyof LoginFormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  /**
   * Validates field on blur.
   */
  const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let error: string | undefined;

    if (name === "email") {
      error = validateEmail(value);
    } else if (name === "password") {
      error = validatePassword(value);
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  /**
   * Handles form submission with validation and API call.
   */
  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate all fields
      const validationErrors = validateForm(formData);
      setErrors(validationErrors);

      if (hasErrors(validationErrors)) {
        toast.error("Formularz zawiera błędy. Sprawdź poprawność danych.");
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData: ErrorResponseDTO = await response.json();
          throw new Error(errorData.error.message);
        }

        // Success - redirect to generate page
        toast.success("Zalogowano pomyślnie!");
        window.location.href = "/generate";
      } catch (error) {
        if (error instanceof Error) {
          // Map API errors to user-friendly messages
          if (error.message.includes("Invalid credentials")) {
            toast.error("Nieprawidłowy email lub hasło");
          } else if (error.message.includes("fetch")) {
            toast.error("Brak połączenia z serwerem");
          } else {
            toast.error(error.message || "Wystąpił błąd logowania");
          }
        } else {
          toast.error("Wystąpił nieoczekiwany błąd");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData]
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="twoj@email.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={errors.email ? emailErrorId : undefined}
          disabled={isLoading}
        />
        {errors.email && (
          <p id={emailErrorId} className="text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor={passwordId}>Hasło</Label>
        <PasswordInput
          id={passwordId}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={errors.password ? "true" : undefined}
          aria-describedby={errors.password ? passwordErrorId : undefined}
          disabled={isLoading}
        />
        {errors.password && (
          <p id={passwordErrorId} className="text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </Button>

      {/* Navigation Links */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>
          Nie masz konta?{" "}
          <a href="/register" className="text-primary underline-offset-4 hover:underline">
            Zarejestruj się
          </a>
        </p>
        <p>
          <a href="/auth/reset-password" className="text-primary underline-offset-4 hover:underline">
            Zapomniałem hasła
          </a>
        </p>
      </div>
    </form>
  );
}
