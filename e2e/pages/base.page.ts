import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Base Page Object providing common methods for all page objects.
 * Implements the Page Object Model pattern for maintainable E2E tests.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== Navigation ====================

  /**
   * Navigate to a specific path.
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for navigation to complete with network idle.
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get current URL path.
   */
  getPath(): string {
    return new URL(this.page.url()).pathname;
  }

  // ==================== Toast Messages ====================

  /**
   * Get toast notification locator.
   * Uses Sonner toast library selector.
   */
  getToast(): Locator {
    return this.page.locator('[data-sonner-toast]');
  }

  /**
   * Assert that a success toast is visible with expected message.
   */
  async expectSuccessToast(message: string | RegExp): Promise<void> {
    const toast = this.getToast().filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout: 5000 });
  }

  /**
   * Assert that an error toast is visible with expected message.
   */
  async expectErrorToast(message: string | RegExp): Promise<void> {
    const toast = this.getToast().filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout: 5000 });
  }

  // ==================== Common Assertions ====================

  /**
   * Assert that the page URL matches expected pattern.
   */
  async expectURL(urlPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
  }

  /**
   * Assert that the page title matches expected pattern.
   */
  async expectTitle(titlePattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(titlePattern);
  }

  // ==================== Element Helpers ====================

  /**
   * Get an element by its accessible role and name.
   */
  getByRole(
    role: Parameters<Page["getByRole"]>[0],
    options?: Parameters<Page["getByRole"]>[1]
  ): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get an element by its label text.
   */
  getByLabel(text: string | RegExp): Locator {
    return this.page.getByLabel(text);
  }

  /**
   * Get an element by its placeholder text.
   */
  getByPlaceholder(text: string | RegExp): Locator {
    return this.page.getByPlaceholder(text);
  }

  /**
   * Get an element by its text content.
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
