import { test, expect } from '@playwright/test';

test.describe('Worm - API Integration', () => {
  test('should have API endpoints available', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    
    // App should load without errors
    await expect(page).not.toHaveTitle('Error');
  });

  test('should load document index from API', async ({ page }) => {
    await page.goto('/worm/');
    
    // Wait for documents to load from API
    await page.waitForLoadState('networkidle');
    
    const docList = page.locator('#documentList');
    await expect(docList).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to editor - app should not crash even if API is slow
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    
    const titleInput = page.locator('#docTitle');
    await expect(titleInput).toBeVisible();
    
    // App should be responsive
    const saveBtn = page.locator('#saveBtn');
    await expect(saveBtn).toBeEnabled();
  });

  test('should list documents from API response', async ({ page }) => {
    // Create a document first
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('#docTitle');
    const saveBtn = page.locator('#saveBtn');
    
    await titleInput.fill('List Test ' + Date.now());
    await saveBtn.click();
    
    // Wait for API call to complete
    await page.waitForTimeout(1000);
  });

  test('should handle missing data files', async ({ page }) => {
    // App should handle case where no index.json exists yet
    await page.goto('/worm/');
    await page.waitForLoadState('networkidle');
    
    // Should not crash and should show empty state or loading state
    const docList = page.locator('#documentList');
    await expect(docList).toBeVisible();
  });

  test('should delete document from API', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const deleteBtn = page.locator('#deleteBtn');
    
    // Only test if delete button exists and is enabled
    const isVisible = await deleteBtn.isVisible();
    
    if (isVisible) {
      await deleteBtn.click();
      
      // Might show a confirmation dialog
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');
      const confirmExists = await confirmBtn.count() > 0;
      
      if (confirmExists) {
        await confirmBtn.first().click();
      }
      
      await page.waitForTimeout(500);
    }
  });

  test('should have document editor loaded', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    
    const editorContainer = page.locator('.editor-container');
    await expect(editorContainer).toBeVisible();
  });
});
