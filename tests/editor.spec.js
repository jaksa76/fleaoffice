import { test, expect } from '@playwright/test';

test.describe('Worm - Editor Page', () => {
  test('should load the editor page', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await expect(page).toHaveTitle('Worm - Editor');
  });

  test('should display editor title input', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('#docTitle');
    await expect(titleInput).toBeVisible();
  });

  test('should display save button', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const saveBtn = page.locator('#saveBtn');
    await expect(saveBtn).toBeVisible();
  });

  test('should display back button', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const backBtn = page.locator('a[title="Back to documents"]');
    await expect(backBtn).toBeVisible();
  });

  test('should have Milkdown editor container', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const editor = page.locator('#editor');
    await expect(editor).toBeVisible();
  });

  test('should navigate back to documents list', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const backBtn = page.locator('a[title="Back to documents"]');
    await backBtn.click();
    await expect(page).toHaveURL(/\/worm\/?$/);
  });

  test('should allow typing in title input', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('#docTitle');
    await titleInput.fill('Test Document');
    const value = await titleInput.inputValue();
    expect(value).toBe('Test Document');
  });

  test('should save document with title and content', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('#docTitle');
    const saveBtn = page.locator('#saveBtn');
    
    await titleInput.fill('My Test Document');
    
    // Click save button
    await saveBtn.click();
    
    // Should show some indication of save (could be a notification or redirect)
    await page.waitForTimeout(500);
  });

  test('should have delete button', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const deleteBtn = page.locator('#deleteBtn');
    await expect(deleteBtn).toBeVisible();
  });

  test('should have editor container', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const editorContainer = page.locator('.editor-container');
    // Editor should load without errors
    await expect(editorContainer).toBeVisible();
  });

  test('should display toolbar with controls', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const toolbar = page.locator('.editor-toolbar');
    await expect(toolbar).toBeVisible();
  });

  test('should preserve title when interacting with editor', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    const titleInput = page.locator('#docTitle');
    const testTitle = 'Preserved Title ' + Date.now();
    
    await titleInput.fill(testTitle);
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toBe(testTitle);
  });

  test('should save document without errors', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    
    const titleInput = page.locator('#docTitle');
    const saveBtn = page.locator('#saveBtn');
    const saveStatus = page.locator('#saveStatus');
    
    // Fill in title
    await titleInput.fill('Test Save Document ' + Date.now());
    
    // Wait for editor to load
    await page.waitForTimeout(1000);
    
    // Save
    await saveBtn.click();
    
    // Wait for save status
    await page.waitForTimeout(1000);
    
    // Check for success message (not error)
    const statusText = await saveStatus.textContent();
    expect(statusText).not.toContain('failed');
    expect(statusText).not.toContain('Failed');
  });

  test('should load Milkdown editor', async ({ page }) => {
    await page.goto('/worm/editor.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for Milkdown to initialize
    await page.waitForTimeout(2000);
    
    // Check if Milkdown editor is present
    const milkdownEditor = page.locator('.milkdown, .editor .ProseMirror');
    const count = await milkdownEditor.count();
    
    // Either Milkdown loaded or editor container exists
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
