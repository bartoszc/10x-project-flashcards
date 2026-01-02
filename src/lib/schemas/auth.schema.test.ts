import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema, resetPasswordSchema, updatePasswordSchema } from "@/lib/schemas/auth.schema";

describe("Auth Schemas", () => {
  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "password123",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const validData = {
        email: "newuser@example.com",
        password: "SecurePass123",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        email: "newuser@example.com",
        password: "short",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject password longer than 72 characters", () => {
      const invalidData = {
        email: "newuser@example.com",
        password: "a".repeat(73),
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should validate correct email", () => {
      const validData = {
        email: "user@example.com",
      };

      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
      };

      const result = resetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updatePasswordSchema", () => {
    it("should validate matching passwords", () => {
      const validData = {
        password: "NewSecurePass123",
        confirmPassword: "NewSecurePass123",
      };

      const result = updatePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject non-matching passwords", () => {
      const invalidData = {
        password: "NewSecurePass123",
        confirmPassword: "DifferentPass456",
      };

      const result = updatePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
