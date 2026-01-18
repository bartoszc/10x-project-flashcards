import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "./PasswordInput";
import { FormField } from "./FormField";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import { validateEmail, validatePasswordRequired, validateLoginForm } from "@/lib/validation/auth.validation";
import type { LoginFormData } from "./types";
import type { ErrorResponseDTO } from "@/types";

/**
 * Validates a single field on blur.
 */
function validateField(name: keyof LoginFormData, value: string): string | undefined {
  if (name === "email") return validateEmail(value);
  if (name === "password") return validatePasswordRequired(value);
  return undefined;
}

/**
 * LoginForm component handles user authentication.
 * Uses shared validators and useAuthForm hook for form management.
 */
export function LoginForm() {
  const { formData, errors, isLoading, handleChange, handleBlur, createSubmitHandler, setIsLoading } =
    useAuthForm<LoginFormData>({
      initialValues: { email: "", password: "" },
      validate: validateLoginForm,
      validateField: (name, value) => validateField(name, value),
    });

  /**
   * Handles form submission with API call.
   */
  const handleSubmit = createSubmitHandler(async (data) => {
    setIsLoading(true);

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

      toast.success("Zalogowano pomyślnie!");
      window.location.href = "/generate";
    } catch (error) {
      if (error instanceof Error) {
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

      <FormField label="Hasło" error={errors.password}>
        <PasswordInput
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
        />
      </FormField>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </Button>

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
