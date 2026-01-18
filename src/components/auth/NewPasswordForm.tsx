import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { FormField } from "./FormField";
import { useAuthForm } from "@/components/hooks/useAuthForm";
import { validatePassword, validateConfirmPassword } from "@/lib/validation/auth.validation";
import type { ErrorResponseDTO } from "@/types";
import type { UpdatePasswordInput } from "@/lib/schemas/auth.schema";

interface NewPasswordFormData {
  password: string;
  confirmPassword: string;
  [key: string]: string;
}

function validateNewPasswordForm(data: NewPasswordFormData) {
  return {
    password: validatePassword(data.password),
    confirmPassword: validateConfirmPassword(data.password, data.confirmPassword),
  };
}

export function NewPasswordForm() {
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  const { formData, errors, isLoading, handleChange, handleBlur, createSubmitHandler, setIsLoading } =
    useAuthForm<NewPasswordFormData>({
      initialValues: { password: "", confirmPassword: "" },
      validate: validateNewPasswordForm,
      validateField: (name, value, data) => {
        if (name === "password") return validatePassword(value);
        if (name === "confirmPassword") return validateConfirmPassword(data.password, value);
        return undefined;
      },
    });

  // Extract token from URL hash on mount
  React.useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (type === "recovery" && token) {
      setAccessToken(token);
    } else {
      setApiError("Brak tokenu resetującego lub token jest nieprawidłowy. Spróbuj zresetować hasło ponownie.");
    }
  }, []);

  const handleSubmit = createSubmitHandler(async (data) => {
    if (!accessToken) {
      setApiError("Brak tokenu autoryzacyjnego.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const payload: UpdatePasswordInput = {
        password: data.password,
        confirmPassword: data.confirmPassword,
      };

      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Wystąpił błąd podczas zmiany hasła");
    } finally {
      setIsLoading(false);
    }
  });

  if (isSuccess) {
    return (
      <Alert className="bg-green-50 text-green-900 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          Hasło zostało pomyślnie zmienione. Za chwilę nastąpi przekierowanie do strony logowania...
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

      <div className="space-y-4">
        <div className="space-y-2">
          <FormField label="Nowe hasło" error={errors.password}>
            <PasswordInput
              name="password"
              autoComplete="new-password"
              placeholder="Minimum 8 znaków"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            />
          </FormField>
          <PasswordStrengthIndicator password={formData.password} />
        </div>

        <FormField label="Potwierdź nowe hasło" error={errors.confirmPassword}>
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Powtórz hasło"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
          />
        </FormField>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !accessToken}>
        {isLoading ? "Zapisywanie..." : "Zmień hasło"}
      </Button>
    </form>
  );
}
