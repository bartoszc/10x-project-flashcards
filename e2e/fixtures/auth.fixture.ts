import { test as base, expect, type Page } from "@playwright/test";
import { LoginPage } from "../pages";

/**
 * Test credentials from environment variables.
 * Set in .env.test file.
 */
const TEST_USER = {
  email: process.env.E2E_USERNAME ?? "",
  password: process.env.E2E_PASSWORD ?? "",
};

/**
 * Extended test fixtures with authentication support.
 */
interface AuthFixtures {
  /** Authenticated page with logged-in user */
  authenticatedPage: Page;
  /** Test user credentials */
  testUser: typeof TEST_USER;
}

/**
 * Custom test instance with authentication fixtures.
 * Uses browser context to preserve auth state between tests.
 */

export const test = base.extend<AuthFixtures>({
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use) => {
    if (!TEST_USER.email || !TEST_USER.password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test file");
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(TEST_USER);
  },

  authenticatedPage: async ({ browser, testUser }, use) => {
    // Create a new context for isolation
    const context = await browser.newContext();
    const page = await context.newPage();

    // Perform login
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(testUser.email, testUser.password);

    // Wait for redirect to confirm login success
    await expect(page).toHaveURL(/generate/, { timeout: 10000 });

    // Provide authenticated page to tests
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    // Cleanup: close context after test
    await context.close();
  },
});

export { expect };
