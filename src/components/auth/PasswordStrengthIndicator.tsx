import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PasswordStrength, PasswordRequirement } from "./types";

/**
 * Props for PasswordStrengthIndicator component.
 */
interface PasswordStrengthIndicatorProps {
  /** Current password to evaluate */
  password: string;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Evaluates password strength based on requirements.
 * Returns strength level and list of requirements with met status.
 */
function evaluatePassword(password: string): {
  strength: PasswordStrength;
  requirements: PasswordRequirement[];
} {
  const requirements: PasswordRequirement[] = [
    {
      label: "Minimum 8 znaków",
      met: password.length >= 8,
    },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const totalCount = requirements.length;

  let strength: PasswordStrength;
  if (metCount === 0 || password.length === 0) {
    strength = "weak";
  } else if (metCount < totalCount) {
    strength = "medium";
  } else {
    strength = "strong";
  }

  return { strength, requirements };
}

/**
 * Gets CSS classes for progress bar based on strength level.
 */
function getStrengthClasses(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "bg-destructive";
    case "medium":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
  }
}

/**
 * Gets progress bar width percentage based on strength.
 */
function getStrengthWidth(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "w-1/3";
    case "medium":
      return "w-2/3";
    case "strong":
      return "w-full";
  }
}

/**
 * Gets strength label in Polish.
 */
function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Słabe";
    case "medium":
      return "Średnie";
    case "strong":
      return "Silne";
  }
}

/**
 * Visual password strength indicator with progress bar and requirements list.
 * Shows real-time feedback on password requirements fulfillment.
 */
function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { strength, requirements } = React.useMemo(() => evaluatePassword(password), [password]);

  // Don't render if password is empty
  if (!password) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Siła hasła</span>
          <span
            className={cn(
              "font-medium",
              strength === "weak" && "text-destructive",
              strength === "medium" && "text-yellow-600",
              strength === "strong" && "text-green-600"
            )}
          >
            {getStrengthLabel(strength)}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              getStrengthClasses(strength),
              getStrengthWidth(strength)
            )}
            role="progressbar"
            aria-valuenow={strength === "weak" ? 33 : strength === "medium" ? 66 : 100}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Siła hasła: ${getStrengthLabel(strength)}`}
          />
        </div>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1" aria-label="Wymagania hasła">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={cn("flex items-center gap-2 text-xs", req.met ? "text-green-600" : "text-muted-foreground")}
          >
            {req.met ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { PasswordStrengthIndicator };
export type { PasswordStrengthIndicatorProps };
