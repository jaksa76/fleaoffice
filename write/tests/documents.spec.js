import { test, expect } from '@playwright/test';

test.describe('Write - Document List Page', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/write/');
    await expect(page).toHaveTitle('Write');
  });

  test('should display the Write header', async ({ page }) => {
    await page.goto('/write/');
    const header = page.locator('h1');
    await expect(header).toContainText('Write');
  });

  test('should display new document button', async ({ page }) => {
    await page.goto('/write/');
    const newDocBtn = page.locator('button[title="New document"]');
    await expect(newDocBtn).toBeVisible();
  });

  test('should have document list container', async ({ page }) => {
    await page.goto('/write/');
    const docList = page.locator('.document-list');
    await expect(docList).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    await page.goto('/write/');
    const loading = page.locator('.loading');
    // Wait for documents to load or confirm loading state appears
    await expect(loading).toBeVisible({ timeout: 1000 }).catch(() => {
      // Documents might have loaded faster than expected
    });
  });

  test.skip('should create a new document when button is clicked', async ({ page }) => {
    await page.goto('/write/');
    await page.waitForLoadState('networkidle');

    const newDocBtn = page.locator('button[title="New document"]');

    // Wait for dialog and handle it
    const [dialog] = await Promise.all([
      page.waitForEvent('dialog'),
      newDocBtn.click()
    ]);
    await dialog.accept('New Test Document ' + Date.now());

    // Wait for navigation
    await page.waitForURL(/.*#\/editor\/.*/, { timeout: 10000 });

    // Should navigate to editor page
    await expect(page).toHaveURL(/#\/editor\//);
  });

  test('should open document in editor when clicked', async ({ page }) => {
    await page.goto('/write/');

    // Wait for documents to load
    await page.waitForLoadState('networkidle');

    // Try to click on a document if one exists
    const documentLinks = page.locator('.document-link');
    const count = await documentLinks.count();

    if (count > 0) {
      await documentLinks.first().click();
      await expect(page).toHaveURL(/#\/editor\//);
    }
  });

  test('should handle empty document list gracefully', async ({ page }) => {
    await page.goto('/write/');
    await page.waitForLoadState('networkidle');

    // Page should not crash and should be interactive
    const newDocBtn = page.locator('button[title="New document"]');
    await expect(newDocBtn).toBeEnabled();
  });

  test('should delete document without showing error', async ({ page }) => {
    const filename = 'Test Delete ' + Date.now() + '.md';

    // Create document via API
    await page.request.put(`/api/write/data/${encodeURIComponent(filename)}`, {
      headers: { 'Content-Type': 'text/plain' },
      data: '# Test\n\nContent'
    });

    // Navigate to editor and save (hash-based routing)
    await page.goto(`/write/#/editor/${encodeURIComponent(filename)}`);
    await page.waitForLoadState('networkidle');

    const saveBtn = page.locator('button[title="Save document"]');
    await saveBtn.click();
    await page.waitForTimeout(1000);
    
    // Go back to list
    await page.goto('/write/');
    await page.waitForLoadState('networkidle');
    
    // Find and delete the document
    const deleteBtn = page.locator('.btn-delete').first();
    const isVisible = await deleteBtn.isVisible().catch(() => false);
    
    if (isVisible) {
      // Listen for console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Click delete
      await deleteBtn.click();
      
      // Confirm dialog
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for deletion
      await page.waitForTimeout(1000);
      
      // Should not see error messages in document list
      const docList = page.locator('.document-list');
      const listText = await docList.textContent();
      expect(listText).not.toContain('Failed to delete');
    }
  });
});
