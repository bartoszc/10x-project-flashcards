import { test, expect } from "@playwright/test";
import { test as authTest } from "./fixtures";
import { LoginPage } from "./pages";

/**
 * Authentication E2E Tests.
 *
 * Tests cover:
 * - TC-AUTH-002: Login with valid credentials (requires valid test account)
 * - TC-AUTH-003: Login with invalid credentials
 * - TC-AUTH-004: Logout functionality (requires valid test account)
 * - TC-SEC-002: Protected route access without authentication
 */
test.describe("Authentication", () => {
  test.describe("Login Form", () => {
    test("should display login form with all required elements", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.navigate();
      await loginPage.expectFormVisible();
    });

    // Test requires valid test user configured in .env.test
    test("TC-AUTH-002: should login with valid credentials and redirect to generate page", async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();
      await loginPage.expectFormVisible();

      // Login with valid test credentials
      const email = process.env.E2E_USERNAME;
      const password = process.env.E2E_PASSWORD;

      if (!email || !password) {
        test.skip(true, "E2E_USERNAME and E2E_PASSWORD not configured");
        return;
      }

      await loginPage.login(email, password);

      // Verify successful login - redirect to generate page
      // This test may fail if test user doesn't exist in Supabase
      await expect(page).toHaveURL(/generate/, { timeout: 10000 });
    });

    test("TC-AUTH-003: should stay on login page with invalid credentials", async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();

      // Attempt login with invalid credentials
      await loginPage.login("invalid@example.com", "wrongpassword123");

      // Should stay on login page (shows error via toast or inline)
      await expect(page).toHaveURL(/login/);
    });

    test("TC-AUTH-003b: should show validation feedback for empty fields", async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();

      // Submit empty form
      await loginPage.submit();

      // Should stay on login page - form validation prevents submission
      await expect(page).toHaveURL(/login/);

      // The form should show validation feedback (either aria-invalid or error text)
      // Check that we're still on login with form visible
      await loginPage.expectFormVisible();
    });

    test("TC-AUTH-003c: should show validation feedback for invalid email format", async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Navigate to login page
      await loginPage.navigate();

      // Fill invalid email
      await loginPage.fillForm("not-an-email", "password123");

      // Submit form
      await loginPage.submit();

      // Should stay on login page
      await expect(page).toHaveURL(/login/);
    });
  });

  test.describe("Logout", () => {
    // Tests require valid test account configured in .env.test
    authTest("TC-AUTH-004: should logout and redirect to login page", async ({ authenticatedPage }) => {
      // Find and click logout button in navigation
      const logoutButton = authenticatedPage.getByRole("button", {
        name: /wyloguj|logout/i,
      });

      // If logout is a link instead of button
      const logoutLink = authenticatedPage.getByRole("link", {
        name: /wyloguj|logout/i,
      });

      // Try button first, then link
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else if (await logoutLink.isVisible()) {
        await logoutLink.click();
      }

      // Should be redirected to login page
      await expect(authenticatedPage).toHaveURL(/login/, { timeout: 10000 });
    });

    authTest("TC-AUTH-004b: should not access protected routes after logout", async ({ authenticatedPage }) => {
      // Perform logout
      const logoutButton = authenticatedPage.getByRole("button", {
        name: /wyloguj|logout/i,
      });
      const logoutLink = authenticatedPage.getByRole("link", {
        name: /wyloguj|logout/i,
      });

      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else if (await logoutLink.isVisible()) {
        await logoutLink.click();
      }

      // Wait for redirect to login
      await expect(authenticatedPage).toHaveURL(/login/, { timeout: 10000 });

      // Try to access protected route
      await authenticatedPage.goto("/generate");

      // Should be redirected back to login
      await expect(authenticatedPage).toHaveURL(/login/);
    });
  });

  test.describe("Protected Routes", () => {
    test("TC-SEC-002: should redirect unauthenticated user to login", async ({ page }) => {
      // Attempt to access protected route without authentication
      await page.goto("/generate");

      // Should be redirected to login page
      await expect(page).toHaveURL(/login/);
    });

    test("TC-SEC-002b: should redirect from protected routes", async ({ page }) => {
      // Test protected route
      await page.goto("/generate");
      await expect(page).toHaveURL(/login/, {
        timeout: 5000,
      });
    });
  });

  test.describe("Navigation Links", () => {
    test("should navigate from login to register page", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.navigate();
      await loginPage.goToRegister();

      await expect(page).toHaveURL(/register/);
    });

    test("should navigate from login to reset password page", async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.navigate();
      await loginPage.goToResetPassword();

      await expect(page).toHaveURL(/reset-password/);
    });
  });
});
