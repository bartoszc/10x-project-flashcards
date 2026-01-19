import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { FormField } from "./FormField";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRegisterForm,
} from "@/lib/validation/auth.validation";
import type { RegisterFormData } from "./types";
import type { ErrorResponseDTO } from "@/types";

/**
 * Validates a single field on blur.
 */
function validateField(name: keyof RegisterFormData, value: string, formData: RegisterFormData): string | undefined {
  if (name === "email") return validateEmail(value);
  if (name === "password") return validatePassword(value);
  if (name === "confirmPassword") return validateConfirmPassword(formData.password, value);
  return undefined;
}

/**
 * RegisterForm component handles user registration.
 * Uses shared validators and useAuthForm hook for form management.
 */
export function RegisterForm() {
  const { formData, errors, isLoading, handleChange, handleBlur, createSubmitHandler, setIsLoading } =
    useAuthForm<RegisterFormData>({
      initialValues: { email: "", password: "", confirmPassword: "" },
      validate: validateRegisterForm,
      validateField,
    });

  /**
   * Handles form submission with API call.
   */
  const handleSubmit = createSubmitHandler(async (data) => {
    setIsLoading(true);

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

        if (response.status === 409) {
          throw new Error("Ten adres email jest już zarejestrowany.");
        }

        throw new Error(errorData.error.message);
      }

      const result: { user: unknown; session?: unknown } = await response.json();

      if (!result.session) {
        toast.success(
          "Konto utworzone! Sprawdź swoją skrzynkę mailową, aby potwierdzić rejestrację via link aktywacyjny.",
          { duration: 5000 }
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        toast.success("Rejestracja pomyślna! Witamy w 10x Cards.");
        window.location.href = "/generate";
      }
    } catch (error) {
      if (error instanceof Error) {
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
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormField label="Email" error={errors.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="twoj@email.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
        />
      </FormField>

      <div className="space-y-2">
        <FormField label="Hasło" error={errors.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
          />
        </FormField>
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <FormField label="Potwierdź hasło" error={errors.confirmPassword}>
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Rejestracja..." : "Zarejestruj się"}
      </Button>

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
