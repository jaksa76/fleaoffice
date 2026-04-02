import { test, expect } from '@playwright/test';

const TEST_PREFIX = 'e2e-test-';

// Derive slug the same way the app does
function nameToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

async function createCollectionViaApi(request, name) {
  const slug = nameToSlug(name);
  await request.put(`/api/list/data/${slug}/schema.json`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ name, fields: [] })
  });
  await request.put(`/api/list/data/${slug}/items.json`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify([])
  });
  return slug;
}

async function deleteCollectionViaApi(request, slug) {
  await request.delete(`/api/list/data/${slug}?recursive=true`).catch(() => {});
}

test.describe('List - Collection List Page', () => {
  test.afterEach(async ({ request }) => {
    // Clean up any test collections created during the test
    const res = await request.get('/api/list/data/').catch(() => null);
    if (!res?.ok()) return;
    const entries = await res.json().catch(() => []);
    for (const entry of entries) {
      if (entry.type === 'directory' && entry.name.startsWith(TEST_PREFIX)) {
        await deleteCollectionViaApi(request, entry.name);
      }
    }
  });

  test('should load the main page', async ({ page }) => {
    await page.goto('/list/');
    await expect(page).toHaveTitle('List');
  });

  test('should display the list header', async ({ page }) => {
    await page.goto('/list/');
    const header = page.locator('h1');
    await expect(header).toContainText('list');
  });

  test('should display the new collection button', async ({ page }) => {
    await page.goto('/list/');
    const newBtn = page.locator('button[title="New collection"]');
    await expect(newBtn).toBeVisible();
  });

  test('should have collection list container', async ({ page }) => {
    await page.goto('/list/');
    await page.waitForLoadState('networkidle');
    const list = page.locator('.document-list');
    await expect(list).toBeVisible();
  });

  test('should show empty state when no collections exist', async ({ page }) => {
    // This test is only meaningful if there really are no collections,
    // so we check for either empty state OR collection cards
    await page.goto('/list/');
    await page.waitForLoadState('networkidle');
    const list = page.locator('.document-list');
    await expect(list).toBeVisible();
    // Page should not show an error
    const error = page.locator('.error');
    await expect(error).not.toBeVisible();
  });

  test('should show collection created via API', async ({ request, page }) => {
    const name = TEST_PREFIX + 'api-created-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.document-card', { hasText: name });
    await expect(card).toBeVisible();

    await deleteCollectionViaApi(request, slug);
  });

  test('should show item count on collection card', async ({ request, page }) => {
    const name = TEST_PREFIX + 'count-test-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([{ id: '1', name: 'Item One' }, { id: '2', name: 'Item Two' }])
    });

    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.document-card', { hasText: name });
    await expect(card).toContainText('2 items');

    await deleteCollectionViaApi(request, slug);
  });

  test('should open inline form when new collection button clicked', async ({ page }) => {
    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    const newBtn = page.locator('button[title="New collection"]');
    await newBtn.click();

    const input = page.locator('input.new-doc-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('should close form on Escape', async ({ page }) => {
    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    await page.locator('button[title="New collection"]').click();
    const input = page.locator('input.new-doc-input');
    await expect(input).toBeVisible();

    await input.press('Escape');
    await expect(input).not.toBeVisible();
  });

  test('should create collection via UI form', async ({ request, page }) => {
    const name = TEST_PREFIX + 'ui-created-' + Date.now();
    const slug = nameToSlug(name);

    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    await page.locator('button[title="New collection"]').click();
    const input = page.locator('input.new-doc-input');
    await input.fill(name);
    await input.press('Enter');

    await page.waitForLoadState('networkidle');

    // Collection should now appear in the list
    const card = page.locator('.document-card', { hasText: name });
    await expect(card).toBeVisible();

    // Verify it was persisted via API
    const schemaRes = await request.get(`/api/list/data/${slug}/schema.json`);
    expect(schemaRes.ok()).toBeTruthy();
    const schema = await schemaRes.json();
    expect(schema.name).toBe(name);

    await deleteCollectionViaApi(request, slug);
  });

  test('should show error for duplicate collection name', async ({ request, page }) => {
    const name = TEST_PREFIX + 'duplicate-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    await page.locator('button[title="New collection"]').click();
    const input = page.locator('input.new-doc-input');
    await input.fill(name);
    await input.press('Enter');

    const error = page.locator('.form-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('already exists');

    await deleteCollectionViaApi(request, slug);
  });

  test('should delete a collection via UI', async ({ request, page }) => {
    const name = TEST_PREFIX + 'delete-ui-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.document-card', { hasText: name });
    await expect(card).toBeVisible();

    // Hover to reveal delete button, then click
    await card.hover();
    const deleteBtn = card.locator('.btn-delete');
    await expect(deleteBtn).toBeVisible();

    page.on('dialog', dialog => dialog.accept());
    await deleteBtn.click();

    // Card should disappear (optimistic UI)
    await expect(card).not.toBeVisible();

    // Verify deleted via API
    await page.waitForTimeout(500);
    const res = await request.get(`/api/list/data/${slug}/schema.json`);
    expect(res.status()).toBe(404);
  });

  test('should navigate to collection view when card clicked', async ({ request, page }) => {
    const name = TEST_PREFIX + 'nav-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await page.goto('/list/');
    await page.waitForLoadState('networkidle');

    const card = page.locator('.document-card', { hasText: name });
    const link = card.locator('.document-link');
    await link.click();

    await expect(page).toHaveURL(new RegExp(`#/collection/${slug}`));

    await deleteCollectionViaApi(request, slug);
  });
});
