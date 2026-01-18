/**
 * Auth component types for login and registration forms.
 */

/**
 * Stan formularza logowania.
 * Index signature pozwala na użycie z generycznym hookiem useAuthForm.
 */
export interface LoginFormData {
  email: string;
  password: string;
  [key: string]: string;
}

/**
 * Błędy walidacji formularza logowania.
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
  [key: string]: string | undefined;
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
 * Index signature pozwala na użycie z generycznym hookiem useAuthForm.
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  [key: string]: string;
}

/**
 * Błędy walidacji formularza rejestracji.
 */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
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
