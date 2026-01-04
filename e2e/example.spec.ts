import { test, expect } from '@playwright/test';

test.describe('Application', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Check that the main application elements are visible
    await expect(page.locator('textarea[placeholder*="prompt"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate/i })).toBeVisible();
  });

  test('should have theme toggle button', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.locator('button[aria-label*="Switch to"]');
    await expect(themeToggle).toBeVisible();
  });

  test('should toggle theme when clicking theme toggle', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.locator('button[aria-label*="Switch to"]');

    // Get initial aria-label
    const initialLabel = await themeToggle.getAttribute('aria-label');

    // Click to toggle
    await themeToggle.click();

    // Wait a bit for the theme to change
    await page.waitForTimeout(100);

    // Get new aria-label
    const newLabel = await themeToggle.getAttribute('aria-label');

    // Labels should be different
    expect(initialLabel).not.toBe(newLabel);
  });
});
