/**
 * Reusable form field component with label, error display, and ARIA support.
 */

import * as React from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  /** Label text */
  label: string;
  /** Error message (if any) */
  error?: string;
  /** Field input element */
  children: React.ReactElement<{
    id?: string;
    "aria-invalid"?: "true";
    "aria-describedby"?: string;
  }>;
  /** Optional additional className for wrapper */
  className?: string;
}

/**
 * FormField provides consistent layout and accessibility for form inputs.
 * Auto-generates IDs for label association and error description.
 */
export function FormField({ label, error, children, className = "" }: FormFieldProps) {
  const fieldId = React.useId();
  const errorId = `${fieldId}-error`;

  // Clone child element with accessibility props
  const enhancedChild = React.cloneElement(children, {
    id: fieldId,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? errorId : undefined,
  });

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <Label htmlFor={fieldId}>{label}</Label>
      {enhancedChild}
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
