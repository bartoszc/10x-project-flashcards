import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Generate Page Object for AI flashcard generation tests.
 * Provides locators and actions for the generation form and suggestions.
 */
export class GeneratePage extends BasePage {
  // ==================== Locators ====================

  readonly sourceTextarea: Locator;
  readonly generateButton: Locator;
  readonly characterCounter: Locator;
  readonly suggestionsList: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);

    // Using accessible locators for resilient element selection
    this.sourceTextarea = page.getByLabel(/tekst źródłowy/i);
    this.generateButton = page.getByRole("button", { name: /generuj fiszki/i });
    this.characterCounter = page.getByText(/znaków/i);
    this.suggestionsList = page.locator('[data-testid="suggestions-list"]');
    this.loadingSpinner = page.locator(".animate-spin");
  }

  // ==================== Navigation ====================

  /**
   * Navigate to the generate page.
   */
  async navigate(): Promise<void> {
    await this.goto("/generate");
  }

  // ==================== Actions ====================

  /**
   * Enter source text for flashcard generation.
   */
  async enterSourceText(text: string): Promise<void> {
    await this.sourceTextarea.fill(text);
  }

  /**
   * Clear the source text textarea.
   */
  async clearSourceText(): Promise<void> {
    await this.sourceTextarea.clear();
  }

  /**
   * Click the generate button to start AI generation.
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Complete generation flow: enter text and click generate.
   */
  async generateFlashcards(text: string): Promise<void> {
    await this.enterSourceText(text);
    await this.clickGenerate();
  }

  // ==================== Assertions ====================

  /**
   * Assert that the generation form is visible.
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.sourceTextarea).toBeVisible();
    await expect(this.generateButton).toBeVisible();
  }

  /**
   * Assert that the generate button is disabled.
   */
  async expectGenerateDisabled(): Promise<void> {
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Assert that the generate button is enabled.
   */
  async expectGenerateEnabled(): Promise<void> {
    await expect(this.generateButton).toBeEnabled();
  }

  /**
   * Assert loading state is displayed.
   */
  async expectLoading(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible();
    await expect(this.generateButton).toHaveText(/generowanie/i);
  }

  /**
   * Assert that suggestions are displayed.
   */
  async expectSuggestionsVisible(): Promise<void> {
    await expect(this.suggestionsList).toBeVisible();
  }

  /**
   * Assert character count is displayed.
   */
  async expectCharacterCount(count: number): Promise<void> {
    await expect(this.characterCounter).toContainText(count.toString());
  }

  /**
   * Assert text validation error (too short or too long).
   */
  async expectTextValidationError(): Promise<void> {
    await this.expectGenerateDisabled();
  }

  /**
   * Get the number of displayed suggestions.
   */
  async getSuggestionCount(): Promise<number> {
    return this.suggestionsList.locator("[data-testid='suggestion-card']").count();
  }
}
