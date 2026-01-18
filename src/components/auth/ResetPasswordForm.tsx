import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "./FormField";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import { validateEmail } from "@/lib/validation/auth.validation";
import type { ErrorResponseDTO } from "@/types";
import type { ResetPasswordInput } from "@/lib/schemas/auth.schema";

interface ResetPasswordFormData {
  email: string;
  [key: string]: string;
}

function validateResetForm(data: ResetPasswordFormData) {
  return { email: validateEmail(data.email) };
}

export function ResetPasswordForm() {
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const { formData, errors, isLoading, handleChange, handleBlur, createSubmitHandler, setIsLoading } =
    useAuthForm<ResetPasswordFormData>({
      initialValues: { email: "" },
      validate: validateResetForm,
      validateField: (name, value) => (name === "email" ? validateEmail(value) : undefined),
    });

  const handleSubmit = createSubmitHandler(async (data) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const payload: ResetPasswordInput = { email: data.email };
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      setIsSuccess(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Wystąpił błąd podczas wysyłania żądania");
    } finally {
      setIsLoading(false);
    }
  });

  if (isSuccess) {
    return (
      <Alert className="bg-green-50 text-green-900 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          Jeśli podany email istnieje w naszej bazie, wysłaliśmy na niego link do resetu hasła. Sprawdź swoją skrzynkę
          odbiorczą (oraz folder spam).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {apiError && (
        <Alert variant="destructive" aria-live="assertive">
          <AlertCircle className="size-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <FormField label="Podaj swój adres email" error={errors.email}>
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>
    </form>
  );
}
