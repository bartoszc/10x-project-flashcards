import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Login Page Object for authentication tests.
 * Provides locators and actions for the login form.
 */
export class LoginPage extends BasePage {
  // ==================== Locators ====================

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly resetPasswordLink: Locator;

  constructor(page: Page) {
    super(page);

    // Using accessible locators (role, label) for resilient element selection
    this.emailInput = page.getByLabel(/email/i);
    // Use input name attribute to avoid matching the show/hide button that has aria-label with "hasło"
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.getByRole("button", { name: /zaloguj|login/i });
    // Scope to main content to avoid matching header link
    this.registerLink = page.getByRole("main").getByRole("link", { name: /zarejestruj/i });
    this.resetPasswordLink = page.getByRole("link", { name: /zapomniałem/i });
  }

  // ==================== Navigation ====================

  /**
   * Navigate to the login page.
   */
  async navigate(): Promise<void> {
    await this.goto("/login");
  }

  // ==================== Actions ====================

  /**
   * Fill in the login form with provided credentials.
   */
  async fillForm(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the login form.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete login flow: fill form and submit.
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillForm(email, password);
    await this.submit();
  }

  /**
   * Navigate to registration page via link.
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Navigate to password reset page via link.
   */
  async goToResetPassword(): Promise<void> {
    await this.resetPasswordLink.click();
  }

  // ==================== Assertions ====================

  /**
   * Assert that the login form is visible.
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Assert that validation error is visible for a field.
   */
  async expectValidationError(fieldName: "email" | "password"): Promise<void> {
    const field = fieldName === "email" ? this.emailInput : this.passwordInput;
    await expect(field).toHaveAttribute("aria-invalid", "true");
  }

  /**
   * Assert that submit button is disabled.
   */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Assert that submit button shows loading state.
   */
  async expectLoading(): Promise<void> {
    await expect(this.submitButton).toHaveText(/logowanie/i);
  }

  /**
   * Assert successful login by checking redirect to generate page.
   */
  async expectLoginSuccess(): Promise<void> {
    await this.expectURL(/generate/);
    await this.expectSuccessToast(/zalogowano/i);
  }

  /**
   * Assert failed login with error message.
   */
  async expectLoginError(): Promise<void> {
    await this.expectErrorToast(/nieprawidłowy|błąd/i);
  }
}
