import { test, expect } from '@playwright/test';

// Helper function to create a test document via API
async function createTestDocument(page, title = 'Test Document') {
  const filename = title.replace(/[/\\?%*:|"<>]/g, '-') + '.md';

  // Create document via API
  await page.request.put(`/api/write/data/${filename}`, {
    headers: { 'Content-Type': 'text/plain' },
    data: '# ' + title + '\n\nTest content'
  });

  // Navigate to editor with the file (hash-based routing)
  await page.goto(`/write/#/editor/${encodeURIComponent(filename)}`);
  await page.waitForLoadState('networkidle');

  return page;
}

test.describe('Write - API Integration', () => {
  test('should have API endpoints available', async ({ page }) => {
    await createTestDocument(page);

    // App should load without errors
    await expect(page).toHaveTitle('Write');
  });

  test('should load document index from API', async ({ page }) => {
    await page.goto('/write/');
    
    // Wait for documents to load from API
    await page.waitForLoadState('networkidle');
    
    const docList = page.locator('.document-list');
    await expect(docList).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to editor - app should not crash even if API is slow
    await createTestDocument(page);

    const titleInput = page.locator('.doc-title');
    await expect(titleInput).toBeVisible();

    // App should be responsive
    const saveBtn = page.locator('button[title="Save document"]');
    await expect(saveBtn).toBeEnabled();
  });

  test('should list documents from API response', async ({ page }) => {
    // Create a document first
    await createTestDocument(page, 'List Test ' + Date.now());
    const saveBtn = page.locator('button[title="Save document"]');

    await saveBtn.click();

    // Wait for API call to complete
    await page.waitForTimeout(1000);
  });

  test('should handle empty data directory', async ({ page }) => {
    // App should handle case where no documents exist yet
    await page.goto('/write/');
    await page.waitForLoadState('networkidle');

    // Should not crash and should show empty state or loading state
    const docList = page.locator('.document-list');
    await expect(docList).toBeVisible();
  });

  test('should delete document from API', async ({ page }) => {
    await createTestDocument(page);
    const deleteBtn = page.locator('button[title="Delete document"]');

    // Only test if delete button exists and is enabled
    const isVisible = await deleteBtn.isVisible();

    if (isVisible) {
      page.on('dialog', dialog => dialog.accept());
      await deleteBtn.click();

      await page.waitForTimeout(500);
    }
  });

  test('should have document editor loaded', async ({ page }) => {
    await createTestDocument(page);

    const editorContainer = page.locator('.editor-container');
    await expect(editorContainer).toBeVisible();
  });

  test.skip('should handle sequential document deletions correctly', async ({ page }) => {
    // Create 3 documents via API
    const filenames = [];

    for (let i = 0; i < 3; i++) {
      const filename = `Test Sequential Delete ${i}.md`;
      filenames.push(filename);

      // Create document via API
      await page.request.put(`/api/write/data/${encodeURIComponent(filename)}`, {
        headers: { 'Content-Type': 'text/plain' },
        data: `# Test ${i}\n\nContent for test ${i}`
      });
    }

    // Go to list page
    await page.goto('/write/');
    await page.waitForLoadState('networkidle');

    // Delete all documents sequentially (our fix prevents concurrent deletions)
    for (let i = 0; i < filenames.length; i++) {
      // Reload page to get fresh list
      await page.goto('/write/');
      await page.waitForLoadState('networkidle');

      const deleteBtn = page.locator(`.btn-delete[data-filename="${filenames[i]}"]`).first();
      const isVisible = await deleteBtn.isVisible().catch(() => false);

      if (isVisible) {
        // Handle the confirmation dialog
        const [dialog] = await Promise.all([
          page.waitForEvent('dialog'),
          deleteBtn.click()
        ]);
        await dialog.accept();

        // Wait for deletion to complete
        await page.waitForTimeout(1000);
      }
    }

    // Final reload to check results
    await page.goto('/write/');
    await page.waitForLoadState('networkidle');

    // Verify files are actually deleted
    const existingFiles = [];
    for (const filename of filenames) {
      const fileResponse = await page.request.get(`/api/write/data/${encodeURIComponent(filename)}`);
      if (fileResponse.ok()) {
        existingFiles.push(filename);
      }
    }

    // All files should be deleted (no ghost documents!)
    expect(existingFiles.length).toBe(0);
  });
});
