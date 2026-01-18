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
    // Use data-slot attribute to target card title specifically
    await expect(page.locator('[data-slot="card-title"]')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    // Use input name attribute to target password input specifically
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /zaloguj/i })).toBeVisible();
  });

  test("should display register form on register page", async ({ page }) => {
    await page.goto("/register");

    // Verify register form elements are visible
    // Use data-slot attribute to target card title specifically
    await expect(page.locator('[data-slot="card-title"]')).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
