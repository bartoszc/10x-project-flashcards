import { expect, test } from "@playwright/test";

/**
 * Smoke test to verify the application is running.
 */
test.describe("Application Smoke Tests", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Verify page loaded successfully
    await expect(page).toHaveTitle(/10x/i);
  });

  test("should redirect unauthenticated user from protected route to login", async ({ page }) => {
    // Try to access a protected route
    await page.goto("/generate");

    // Should be redirected to login
    await expect(page).toHaveURL(/login/);
  });

  test("should display login form on login page", async ({ page }) => {
    await page.goto("/login");

    // Verify login form elements are visible
    await expect(page.getByRole("heading", { name: /zaloguj|login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/hasło|password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj|login/i })).toBeVisible();
  });

  test("should display register form on register page", async ({ page }) => {
    await page.goto("/register");

    // Verify register form elements are visible
    await expect(page.getByRole("heading", { name: /zarejestruj|register/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
