import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ErrorResponseDTO } from "@/types";
import type { ResetPasswordInput } from "@/lib/schemas/auth.schema";

interface ResetPasswordFormState {
  email: string;
  error?: string;
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string | null;
}

/**
 * Validates email format.
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

export function ResetPasswordForm() {
  const [state, setState] = React.useState<ResetPasswordFormState>({
    email: "",
    isLoading: false,
    isSuccess: false,
    apiError: null,
  });

  const emailId = React.useId();
  const emailErrorId = React.useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setState((prev) => ({
      ...prev,
      email: value,
      error: undefined,
      apiError: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(state.email);
    if (emailError) {
      setState((prev) => ({ ...prev, error: emailError }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, apiError: null }));

    try {
      const payload: ResetPasswordInput = { email: state.email };
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      setState((prev) => ({ ...prev, isSuccess: true }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        apiError:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas wysyłania żądania",
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (state.isSuccess) {
    return (
      <Alert className="bg-green-50 text-green-900 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          Jeśli podany email istnieje w naszej bazie, wysłaliśmy na niego link do resetu hasła.
          Sprawdź swoją skrzynkę odbiorczą (oraz folder spam).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {state.apiError && (
        <Alert variant="destructive" aria-live="assertive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.apiError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={emailId}>Podaj swój adres email</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="twoj@email.com"
          value={state.email}
          onChange={handleChange}
          aria-invalid={state.error ? "true" : undefined}
          aria-describedby={state.error ? emailErrorId : undefined}
          disabled={state.isLoading}
        />
        {state.error && (
          <p id={emailErrorId} className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={state.isLoading}>
        {state.isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>
    </form>
  );
}
