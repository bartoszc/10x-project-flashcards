/**
 * Reusable hook for managing authentication form state.
 * Provides common functionality for handling form values, validation, and submission.
 */

import { useState, useCallback, useId } from "react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Form data type - object with string values */
export type FormDataType = Record<string, string>;

export interface UseAuthFormConfig<TData extends FormDataType> {
  /** Initial form values */
  initialValues: TData;
  /** Validation function returning errors object */
  validate: (data: TData) => Partial<Record<keyof TData, string>>;
  /** Optional: validate single field on blur */
  validateField?: (name: keyof TData, value: string, data: TData) => string | undefined;
}

export interface UseAuthFormReturn<TData extends Record<string, string>> {
  /** Current form data */
  formData: TData;
  /** Current validation errors */
  errors: Partial<Record<keyof TData, string>>;
  /** Loading state */
  isLoading: boolean;
  /** Handle input change */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle input blur (triggers field validation) */
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Create submit handler with provided async callback */
  createSubmitHandler: (onSubmit: (data: TData) => Promise<void>) => (e: React.FormEvent) => void;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
  /** Set error for specific field */
  setFieldError: (field: keyof TData, error: string | undefined) => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Generate unique ID for form field */
  generateFieldId: (fieldName: string) => string;
}

// ─────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────

export function useAuthForm<TData extends Record<string, string>>(
  config: UseAuthFormConfig<TData>
): UseAuthFormReturn<TData> {
  const { initialValues, validate, validateField } = config;

  const [formData, setFormData] = useState<TData>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Generate base ID for this form instance
  const baseId = useId();

  /**
   * Handles input change - updates value and clears field error.
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setErrors((prev) => {
      if (prev[name as keyof TData]) {
        return { ...prev, [name]: undefined };
      }
      return prev;
    });
  }, []);

  /**
   * Handles input blur - validates single field.
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      if (validateField) {
        const error = validateField(name as keyof TData, value, formData);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [formData, validateField]
  );

  /**
   * Creates a submit handler that validates and calls provided callback.
   */
  const createSubmitHandler = useCallback(
    (onSubmit: (data: TData) => Promise<void>) => {
      return async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const validationErrors = validate(formData);
        setErrors(validationErrors);

        // Check if any errors exist
        const hasErrors = Object.values(validationErrors).some((error) => error !== undefined);
        if (hasErrors) {
          return;
        }

        // Call the onSubmit callback - caller handles loading state and errors
        await onSubmit(formData);
      };
    },
    [formData, validate]
  );

  /**
   * Sets error for a specific field.
   */
  const setFieldError = useCallback((field: keyof TData, error: string | undefined) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  /**
   * Resets form to initial state.
   */
  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsLoading(false);
  }, [initialValues]);

  /**
   * Generates unique ID for form field (for accessibility).
   */
  const generateFieldId = useCallback((fieldName: string) => `${baseId}-${fieldName}`, [baseId]);

  return {
    formData,
    errors,
    isLoading,
    handleChange,
    handleBlur,
    createSubmitHandler,
    setIsLoading,
    setFieldError,
    reset,
    generateFieldId,
  };
}
