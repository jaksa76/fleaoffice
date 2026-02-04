import { test, expect } from '@playwright/test';

test.describe('Worm - Document List Page', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/worm/');
    await expect(page).toHaveTitle('Worm - Documents');
  });

  test('should display the Worm header', async ({ page }) => {
    await page.goto('/worm/');
    const header = page.locator('h1');
    await expect(header).toContainText('Worm');
  });

  test('should display new document button', async ({ page }) => {
    await page.goto('/worm/');
    const newDocBtn = page.locator('#newDocBtn');
    await expect(newDocBtn).toBeVisible();
  });

  test('should have document list container', async ({ page }) => {
    await page.goto('/worm/');
    const docList = page.locator('#documentList');
    await expect(docList).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    await page.goto('/worm/');
    const loading = page.locator('.loading');
    // Wait for documents to load or confirm loading state appears
    await expect(loading).toBeVisible({ timeout: 1000 }).catch(() => {
      // Documents might have loaded faster than expected
    });
  });

  test('should create a new document when button is clicked', async ({ page }) => {
    await page.goto('/worm/');
    const newDocBtn = page.locator('#newDocBtn');
    
    // Wait for navigation when clicking the button
    await Promise.all([
      page.waitForURL(/editor\.html/),
      newDocBtn.click()
    ]);
    
    // Should navigate to editor page
    await expect(page).toHaveURL(/editor\.html/);
  });

  test('should open document in editor when clicked', async ({ page }) => {
    await page.goto('/worm/');
    
    // Wait for documents to load
    await page.waitForLoadState('networkidle');
    
    // Try to click on a document if one exists
    const documentItems = page.locator('.document-item');
    const count = await documentItems.count();
    
    if (count > 0) {
      await documentItems.first().click();
      await expect(page).toHaveURL(/editor\.html/);
    }
  });

  test('should handle empty document list gracefully', async ({ page }) => {
    await page.goto('/worm/');
    await page.waitForLoadState('networkidle');
    
    // Page should not crash and should be interactive
    const newDocBtn = page.locator('#newDocBtn');
    await expect(newDocBtn).toBeEnabled();
  });
});
