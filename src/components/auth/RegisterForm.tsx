import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import type { RegisterFormData, RegisterFormErrors } from "./types";
import type { ErrorResponseDTO } from "@/types";

/**
 * Validates email format and length.
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
  if (email.length > 255) {
    return "Email może mieć maksymalnie 255 znaków";
  }
  return undefined;
}

/**
 * Validates password field.
 * Returns error message if invalid, undefined if valid.
 */
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

/**
 * Validates password confirmation field.
 * Returns error message if invalid, undefined if valid.
 */
function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) {
    return "Potwierdzenie hasła jest wymagane";
  }
  if (password !== confirmPassword) {
    return "Hasła muszą być identyczne";
  }
  return undefined;
}

/**
 * Validates entire form and returns errors object.
 */
function validateForm(data: RegisterFormData): RegisterFormErrors {
  return {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
    confirmPassword: validateConfirmPassword(data.password, data.confirmPassword),
  };
}

/**
 * Checks if form has any validation errors.
 */
function hasErrors(errors: RegisterFormErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

/**
 * RegisterForm component handles user registration.
 * Provides email/password inputs with inline validation,
 * password strength indicator, API integration, loading states, and error handling.
 */
export function RegisterForm() {
  const [formData, setFormData] = React.useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = React.useState<RegisterFormErrors>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // Generate unique IDs for accessibility
  const emailId = React.useId();
  const passwordId = React.useId();
  const confirmPasswordId = React.useId();
  const emailErrorId = React.useId();
  const passwordErrorId = React.useId();
  const confirmPasswordErrorId = React.useId();

  /**
   * Updates form field value and clears field error.
   */
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear field error when user starts typing
      if (errors[name as keyof RegisterFormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  /**
   * Validates field on blur.
   */
  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let error: string | undefined;

      if (name === "email") {
        error = validateEmail(value);
      } else if (name === "password") {
        error = validatePassword(value);
      } else if (name === "confirmPassword") {
        error = validateConfirmPassword(formData.password, value);
      }

      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [formData.password]
  );

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
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const errorData: ErrorResponseDTO = await response.json();

          // Special handling for 409 (email already registered)
          if (response.status === 409) {
            throw new Error("Ten adres email jest już zarejestrowany.");
          }

          throw new Error(errorData.error.message);
        }

        const data: { user: any; session?: any } = await response.json();

        if (!data.session) {
          // Email confirmation required
          toast.success(
            "Konto utworzone! Sprawdź swoją skrzynkę mailową, aby potwierdzić rejestrację via link aktywacyjny.",
            { duration: 5000 }
          );
          // Optional: Add small delay before redirect to let user read toast
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        } else {
          // Session created immediately (auto-confirm or disabled email verify)
          toast.success("Rejestracja pomyślna! Witamy w 10x Cards.");
          window.location.href = "/generate";
        }
      } catch (error) {
        if (error instanceof Error) {
          // Map API errors to user-friendly messages
          if (error.message.includes("fetch")) {
            toast.error("Brak połączenia z serwerem");
          } else {
            toast.error(error.message || "Wystąpił błąd rejestracji");
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
          autoComplete="new-password"
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
        {/* Password Strength Indicator */}
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor={confirmPasswordId}>Potwierdź hasło</Label>
        <PasswordInput
          id={confirmPasswordId}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={errors.confirmPassword ? "true" : undefined}
          aria-describedby={errors.confirmPassword ? confirmPasswordErrorId : undefined}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p id={confirmPasswordErrorId} className="text-sm text-destructive">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Rejestracja..." : "Zarejestruj się"}
      </Button>

      {/* Navigation Link */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Masz już konto?{" "}
          <a href="/login" className="text-primary underline-offset-4 hover:underline">
            Zaloguj się
          </a>
        </p>
      </div>
    </form>
  );
}
