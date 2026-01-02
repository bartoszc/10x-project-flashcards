import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import type { ErrorResponseDTO } from "@/types";
import type { UpdatePasswordInput } from "@/lib/schemas/auth.schema";

interface NewPasswordFormState {
  password: string;
  confirmPassword: string;
  errors: { password?: string; confirmPassword?: string };
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string | null;
  accessToken: string | null;
}

function validatePassword(password: string): string | undefined {
  if (password.length < 8) return "Hasło musi mieć minimum 8 znaków";
  if (password.length > 72) return "Hasło jest zbyt długie";
  return undefined;
}

export function NewPasswordForm() {
  const [state, setState] = React.useState<NewPasswordFormState>({
    password: "",
    confirmPassword: "",
    errors: {},
    isLoading: false,
    isSuccess: false,
    apiError: null,
    accessToken: null,
  });

  const passwordId = React.useId();
  const confirmPasswordId = React.useId();

  React.useEffect(() => {
    // Extract token from URL hash on mount
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (type === "recovery" && token) {
      setState((prev) => ({ ...prev, accessToken: token }));
    } else {
      // If no token, we can't reset password.
      // In a real app we might redirect or show error, but here we just show error.
      setState((prev) => ({
        ...prev,
        apiError: "Brak tokenu resetującego lub token jest nieprawidłowy. Spróbuj zresetować hasło ponownie.",
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      [name]: value,
      errors: { ...prev.errors, [name]: undefined },
      apiError: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(state.password);
    const confirmError = state.password !== state.confirmPassword ? "Hasła muszą być identyczne" : undefined;

    if (passwordError || confirmError) {
      setState((prev) => ({
        ...prev,
        errors: { password: passwordError, confirmPassword: confirmError },
      }));
      return;
    }

    if (!state.accessToken) {
        setState((prev) => ({...prev, apiError: "Brak tokenu autoryzacyjnego."}));
        return;
    }

    setState((prev) => ({ ...prev, isLoading: true, apiError: null }));

    try {
      const payload: UpdatePasswordInput = {
        password: state.password,
        confirmPassword: state.confirmPassword,
      };

      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.accessToken}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      setState((prev) => ({ ...prev, isSuccess: true }));
      
      // Optional: redirect to login after few seconds
      setTimeout(() => {
          window.location.href = "/login";
      }, 3000);

    } catch (error) {
      setState((prev) => ({
        ...prev,
        apiError:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas zmiany hasła",
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
          Hasło zostało pomyślnie zmienione. Za chwilę nastąpi przekierowanie do strony logowania...
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

      <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor={passwordId}>Nowe hasło</Label>
            <PasswordInput
                id={passwordId}
                name="password"
                autoComplete="new-password"
                placeholder="Minimum 8 znaków"
                value={state.password}
                onChange={handleChange}
                aria-invalid={state.errors.password ? "true" : undefined}
                disabled={state.isLoading}
            />
             {state.errors.password && (
            <p className="text-sm text-destructive">{state.errors.password}</p>
            )}
             <PasswordStrengthIndicator password={state.password} />
        </div>

        <div className="space-y-2">
            <Label htmlFor={confirmPasswordId}>Potwierdź nowe hasło</Label>
            <PasswordInput
                id={confirmPasswordId}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Powtórz hasło"
                value={state.confirmPassword}
                onChange={handleChange}
                aria-invalid={state.errors.confirmPassword ? "true" : undefined}
                disabled={state.isLoading}
            />
            {state.errors.confirmPassword && (
            <p className="text-sm text-destructive">{state.errors.confirmPassword}</p>
            )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={state.isLoading || !state.accessToken}>
        {state.isLoading ? "Zapisywanie..." : "Zmień hasło"}
      </Button>
    </form>
  );
}
