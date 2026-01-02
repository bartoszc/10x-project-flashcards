/**
 * Auth component types for login and registration forms.
 */

/**
 * Stan formularza logowania.
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Błędy walidacji formularza logowania.
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Stan komponentu LoginForm.
 */
export interface LoginFormState {
  formData: LoginFormData;
  errors: LoginFormErrors;
  isLoading: boolean;
  apiError: string | null;
  showPassword: boolean;
}

/**
 * Stan formularza rejestracji.
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Błędy walidacji formularza rejestracji.
 */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Stan komponentu RegisterForm.
 */
export interface RegisterFormState {
  formData: RegisterFormData;
  errors: RegisterFormErrors;
  isLoading: boolean;
  apiError: string | null;
  showPassword: boolean;
}

/**
 * Poziom siły hasła.
 */
export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Wymaganie hasła do wyświetlenia w PasswordStrengthIndicator.
 */
export interface PasswordRequirement {
  label: string;
  met: boolean;
}
