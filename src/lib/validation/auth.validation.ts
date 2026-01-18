/**
 * Shared validation functions for authentication forms.
 * Uses Zod schemas as source of truth with localized Polish messages.
 */

import { registerSchema, loginSchema, updatePasswordSchema } from "@/lib/schemas/auth.schema";
import type { LoginFormData, LoginFormErrors, RegisterFormData, RegisterFormErrors } from "@/components/auth/types";

// ─────────────────────────────────────────────────────────────
// Single Field Validators
// ─────────────────────────────────────────────────────────────

/**
 * Validates email field.
 * @returns Error message in Polish if invalid, undefined if valid.
 */
export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return "Email jest wymagany";
  }

  // Use Zod schema for format validation
  const result = loginSchema.shape.email.safeParse(trimmed);
  if (!result.success) {
    return "Niepoprawny format email";
  }

  // Check max length from registerSchema
  if (trimmed.length > 255) {
    return "Email może mieć maksymalnie 255 znaków";
  }

  return undefined;
}

/**
 * Validates password field for login (just required check).
 * @returns Error message in Polish if invalid, undefined if valid.
 */
export function validatePasswordRequired(password: string): string | undefined {
  if (!password) {
    return "Hasło jest wymagane";
  }
  return undefined;
}

/**
 * Validates password field with strength requirements for registration/reset.
 * @returns Error message in Polish if invalid, undefined if valid.
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Hasło jest wymagane";
  }

  // Use Zod schema for length validation
  const result = registerSchema.shape.password.safeParse(password);
  if (!result.success) {
    const issue = result.error.issues[0];
    if (issue?.code === "too_small") {
      return "Hasło musi mieć minimum 8 znaków";
    }
    if (issue?.code === "too_big") {
      return "Hasło może mieć maksymalnie 72 znaki";
    }
  }

  return undefined;
}

/**
 * Validates password confirmation field.
 * @returns Error message in Polish if invalid, undefined if valid.
 */
export function validateConfirmPassword(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) {
    return "Potwierdzenie hasła jest wymagane";
  }

  // Use Zod refine for matching
  const result = updatePasswordSchema.safeParse({ password, confirmPassword });
  if (!result.success) {
    const confirmError = result.error.issues.find((i) => i.path.includes("confirmPassword"));
    if (confirmError) {
      return "Hasła muszą być identyczne";
    }
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Form Validators
// ─────────────────────────────────────────────────────────────

/**
 * Validates entire login form.
 */
export function validateLoginForm(data: LoginFormData): LoginFormErrors {
  return {
    email: validateEmail(data.email),
    password: validatePasswordRequired(data.password),
  };
}

/**
 * Validates entire registration form.
 */
export function validateRegisterForm(data: RegisterFormData): RegisterFormErrors {
  return {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
    confirmPassword: validateConfirmPassword(data.password, data.confirmPassword),
  };
}

/**
 * Checks if form errors object has any errors.
 */
export function hasFormErrors<T extends Record<string, string | undefined>>(errors: T): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}
