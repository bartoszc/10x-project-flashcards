import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Register Page Object for user registration tests.
 * Provides locators and actions for the registration form.
 */
export class RegisterPage extends BasePage {
  // ==================== Locators ====================

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly passwordStrengthIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // Using accessible locators for resilient element selection
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/^hasło$/i);
    this.confirmPasswordInput = page.getByLabel(/potwierdź hasło|confirm/i);
    this.submitButton = page.getByRole("button", { name: /zarejestruj|register/i });
    this.loginLink = page.getByRole("link", { name: /zaloguj/i });
    this.passwordStrengthIndicator = page.getByText(/siła hasła|password strength/i);
  }

  // ==================== Navigation ====================

  /**
   * Navigate to the register page.
   */
  async navigate(): Promise<void> {
    await this.goto("/register");
  }

  // ==================== Actions ====================

  /**
   * Fill in the registration form with provided data.
   */
  async fillForm(email: string, password: string, confirmPassword: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Submit the registration form.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete registration flow: fill form and submit.
   */
  async register(email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.fillForm(email, password, confirmPassword ?? password);
    await this.submit();
  }

  /**
   * Navigate to login page via link.
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click();
  }

  // ==================== Assertions ====================

  /**
   * Assert that the registration form is visible.
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert that validation error is visible for a field.
   */
  async expectValidationError(field: "email" | "password" | "confirmPassword"): Promise<void> {
    const input =
      field === "email" ? this.emailInput : field === "password" ? this.passwordInput : this.confirmPasswordInput;
    await expect(input).toHaveAttribute("aria-invalid", "true");
  }

  /**
   * Assert that submit button is disabled.
   */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Assert password strength is displayed.
   */
  async expectPasswordStrength(): Promise<void> {
    await expect(this.passwordStrengthIndicator).toBeVisible();
  }
}
