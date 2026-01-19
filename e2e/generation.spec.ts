import { test, expect } from "@playwright/test";
import { GeneratePage } from "./pages";

/**
 * AI Flashcard Generation E2E Tests.
 *
 * IMPORTANT: These tests require a valid authenticated user.
 * The current test user credentials don't work with Supabase,
 * so these tests are skipped until valid credentials are configured.
 *
 * To enable these tests:
 * 1. Create a test user in Supabase
 * 2. Update E2E_USERNAME and E2E_PASSWORD in .env.test
 * 3. Remove the .skip from the describe block
 *
 * Tests cover:
 * - TC-GEN-002: Text validation (too short)
 * - TC-GEN-003: Text validation (too long)
 *
 * Note: TC-GEN-001 (actual AI generation) requires API mocking with MSW.
 */

// Generation tests require authenticated user configured in .env.test
test.describe("Flashcard Generation", () => {
  test.describe("Text Validation", () => {
    test("TC-GEN-002: should disable generate button when text is too short", async ({ page }) => {
      const generatePage = new GeneratePage(page);

      // This test assumes user is already logged in
      await generatePage.navigate();
      await generatePage.expectFormVisible();

      // Enter text that is too short (less than 1000 characters)
      const shortText = "A".repeat(500);
      await generatePage.enterSourceText(shortText);

      // Generate button should be disabled
      await generatePage.expectGenerateDisabled();
    });

    test("TC-GEN-003: should disable generate button when text is too long", async ({ page }) => {
      const generatePage = new GeneratePage(page);

      await generatePage.navigate();
      await generatePage.expectFormVisible();

      // Enter text that is too long (more than 10000 characters)
      const longText = "A".repeat(12000);
      await generatePage.enterSourceText(longText);

      // Generate button should be disabled
      await generatePage.expectGenerateDisabled();
    });

    test("should enable generate button when text length is valid", async ({ page }) => {
      const generatePage = new GeneratePage(page);

      await generatePage.navigate();
      await generatePage.expectFormVisible();

      // Enter valid text (between 1000 and 10000 characters)
      const validText = "A".repeat(1500);
      await generatePage.enterSourceText(validText);

      // Generate button should be enabled
      await generatePage.expectGenerateEnabled();
    });

    test("should update character counter as user types", async ({ page }) => {
      const generatePage = new GeneratePage(page);

      await generatePage.navigate();

      // Enter some text
      const text = "Test text for character counting";
      await generatePage.enterSourceText(text);

      // Character counter should show the correct count
      await generatePage.expectCharacterCount(text.length);
    });

    test("should clear text when textarea is cleared", async ({ page }) => {
      const generatePage = new GeneratePage(page);

      await generatePage.navigate();

      // Enter some text
      await generatePage.enterSourceText("Some test text");

      // Clear the textarea
      await generatePage.clearSourceText();

      // Textarea should be empty
      await expect(generatePage.sourceTextarea).toHaveValue("");

      // Generate button should be disabled (no text)
      await generatePage.expectGenerateDisabled();
    });
  });

  test.describe("Form State", () => {
    test("should show generate page with form elements", async ({ page }) => {
      const generatePage = new GeneratePage(page);

      await generatePage.navigate();

      // Verify all form elements are visible
      await generatePage.expectFormVisible();
      await expect(generatePage.sourceTextarea).toBeVisible();
      await expect(generatePage.generateButton).toBeVisible();
    });
  });
});
