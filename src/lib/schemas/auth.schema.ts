import { z } from "zod";

/**
 * Schema for user registration.
 * Validates email format and password strength requirements.
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email must be at most 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

/**
 * Schema for user login.
 * Basic validation - actual credentials are verified by Supabase.
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema for password reset request.
 */
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * Schema for updating password (after reset).
 */
export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
