import { describe, expect, it } from "vitest";
import {
  validateEmail,
  validatePassword,
  validatePasswordRequired,
  validateConfirmPassword,
  validateLoginForm,
  validateRegisterForm,
  hasFormErrors,
} from "./auth.validation";

describe("Auth Validation", () => {
  describe("validateEmail", () => {
    it("should return error for empty email", () => {
      expect(validateEmail("")).toBe("Email jest wymagany");
      expect(validateEmail("   ")).toBe("Email jest wymagany");
    });

    it("should return error for invalid email format", () => {
      expect(validateEmail("invalid")).toBe("Niepoprawny format email");
      expect(validateEmail("test@")).toBe("Niepoprawny format email");
      expect(validateEmail("@example.com")).toBe("Niepoprawny format email");
    });

    it("should return error for email exceeding 255 characters", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(validateEmail(longEmail)).toBe("Email może mieć maksymalnie 255 znaków");
    });

    it("should return undefined for valid email", () => {
      expect(validateEmail("test@example.com")).toBeUndefined();
      expect(validateEmail("user.name+tag@domain.co")).toBeUndefined();
    });
  });

  describe("validatePasswordRequired", () => {
    it("should return error for empty password", () => {
      expect(validatePasswordRequired("")).toBe("Hasło jest wymagane");
    });

    it("should return undefined for any non-empty password", () => {
      expect(validatePasswordRequired("x")).toBeUndefined();
      expect(validatePasswordRequired("short")).toBeUndefined();
    });
  });

  describe("validatePassword", () => {
    it("should return error for empty password", () => {
      expect(validatePassword("")).toBe("Hasło jest wymagane");
    });

    it("should return error for password shorter than 8 characters", () => {
      expect(validatePassword("short")).toBe("Hasło musi mieć minimum 8 znaków");
      expect(validatePassword("1234567")).toBe("Hasło musi mieć minimum 8 znaków");
    });

    it("should return error for password longer than 72 characters", () => {
      expect(validatePassword("a".repeat(73))).toBe("Hasło może mieć maksymalnie 72 znaki");
    });

    it("should return undefined for valid password", () => {
      expect(validatePassword("password123")).toBeUndefined();
      expect(validatePassword("12345678")).toBeUndefined();
      expect(validatePassword("a".repeat(72))).toBeUndefined();
    });
  });

  describe("validateConfirmPassword", () => {
    it("should return error for empty confirm password", () => {
      expect(validateConfirmPassword("password123", "")).toBe("Potwierdzenie hasła jest wymagane");
    });

    it("should return error for non-matching passwords", () => {
      expect(validateConfirmPassword("password123", "different")).toBe("Hasła muszą być identyczne");
    });

    it("should return undefined for matching passwords", () => {
      expect(validateConfirmPassword("password123", "password123")).toBeUndefined();
    });
  });

  describe("validateLoginForm", () => {
    it("should return errors for invalid form", () => {
      const result = validateLoginForm({ email: "", password: "" });
      expect(result.email).toBe("Email jest wymagany");
      expect(result.password).toBe("Hasło jest wymagane");
    });

    it("should return no errors for valid form", () => {
      const result = validateLoginForm({ email: "test@example.com", password: "password123" });
      expect(result.email).toBeUndefined();
      expect(result.password).toBeUndefined();
    });
  });

  describe("validateRegisterForm", () => {
    it("should return errors for invalid form", () => {
      const result = validateRegisterForm({ email: "", password: "", confirmPassword: "" });
      expect(result.email).toBeDefined();
      expect(result.password).toBeDefined();
      expect(result.confirmPassword).toBeDefined();
    });

    it("should return no errors for valid form", () => {
      const result = validateRegisterForm({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.email).toBeUndefined();
      expect(result.password).toBeUndefined();
      expect(result.confirmPassword).toBeUndefined();
    });
  });

  describe("hasFormErrors", () => {
    it("should return true when errors exist", () => {
      expect(hasFormErrors({ email: "Error", password: undefined })).toBe(true);
    });

    it("should return false when no errors", () => {
      expect(hasFormErrors({ email: undefined, password: undefined })).toBe(false);
      expect(hasFormErrors({})).toBe(false);
    });
  });
});
