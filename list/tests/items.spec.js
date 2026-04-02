import { test, expect } from '@playwright/test';

const TEST_PREFIX = 'items-test-';

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

async function gotoCollectionView(page, slug) {
  await page.goto(`/list/#/collection/${slug}`);
  // Wait for the item-list to render (indicates loading is complete)
  await page.waitForSelector('.item-list:not(:has(.loading))');
}

test.describe('List - Add Item', () => {
  test.afterEach(async ({ request }) => {
    const res = await request.get('/api/list/data/').catch(() => null);
    if (!res?.ok()) return;
    const entries = await res.json().catch(() => []);
    for (const entry of entries) {
      if (entry.type === 'dir' && entry.name.startsWith(TEST_PREFIX)) {
        await deleteCollectionViaApi(request, entry.name);
      }
    }
  });

  test('should show the new item button in collection view', async ({ request, page }) => {
    const name = TEST_PREFIX + 'btn-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await expect(page.locator('button[title="New item"]')).toBeVisible();

    await deleteCollectionViaApi(request, slug);
  });

  test('should show empty state when collection has no items', async ({ request, page }) => {
    const name = TEST_PREFIX + 'empty-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await expect(page.locator('.empty-state')).toBeVisible();

    await deleteCollectionViaApi(request, slug);
  });

  test('should open inline form when new item button clicked', async ({ request, page }) => {
    const name = TEST_PREFIX + 'form-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await page.locator('button[title="New item"]').click();

    const input = page.locator('input.new-doc-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    await deleteCollectionViaApi(request, slug);
  });

  test('should close form on Escape', async ({ request, page }) => {
    const name = TEST_PREFIX + 'esc-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await page.locator('button[title="New item"]').click();
    const input = page.locator('input.new-doc-input');
    await expect(input).toBeVisible();

    await input.press('Escape');
    await expect(input).not.toBeVisible();

    await deleteCollectionViaApi(request, slug);
  });

  test('should add a new item and display it in the list', async ({ request, page }) => {
    const name = TEST_PREFIX + 'add-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await page.locator('button[title="New item"]').click();
    await page.locator('input.new-doc-input').fill('My First Item');
    await page.locator('input.new-doc-input').press('Enter');

    await expect(page.locator('.item-row', { hasText: 'My First Item' })).toBeVisible();

    await deleteCollectionViaApi(request, slug);
  });

  test('should persist new item via API after adding', async ({ request, page }) => {
    const name = TEST_PREFIX + 'persist-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await page.locator('button[title="New item"]').click();
    await page.locator('input.new-doc-input').fill('Persisted Item');
    await page.locator('input.new-doc-input').press('Enter');

    await expect(page.locator('.item-row', { hasText: 'Persisted Item' })).toBeVisible();

    const res = await request.get(`/api/list/data/${slug}/items.json`);
    expect(res.ok()).toBeTruthy();
    const items = await res.json();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Persisted Item');
    expect(items[0].id).toBeTruthy();

    await deleteCollectionViaApi(request, slug);
  });

  test('should close form after item is added', async ({ request, page }) => {
    const name = TEST_PREFIX + 'close-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await page.locator('button[title="New item"]').click();
    await page.locator('input.new-doc-input').fill('New Item');
    await page.locator('input.new-doc-input').press('Enter');

    await expect(page.locator('.item-row', { hasText: 'New Item' })).toBeVisible();
    await expect(page.locator('input.new-doc-input')).not.toBeVisible();

    await deleteCollectionViaApi(request, slug);
  });

  test('should add multiple items in sequence', async ({ request, page }) => {
    const name = TEST_PREFIX + 'multi-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    for (const itemName of ['Alpha', 'Beta', 'Gamma']) {
      await page.locator('button[title="New item"]').click();
      await page.locator('input.new-doc-input').fill(itemName);
      await page.locator('input.new-doc-input').press('Enter');
      await expect(page.locator('.item-row', { hasText: itemName })).toBeVisible();
    }

    await expect(page.locator('.item-row')).toHaveCount(3);

    const res = await request.get(`/api/list/data/${slug}/items.json`);
    const items = await res.json();
    expect(items).toHaveLength(3);

    await deleteCollectionViaApi(request, slug);
  });

  test('should display items loaded from API on page load', async ({ request, page }) => {
    const name = TEST_PREFIX + 'load-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([
        { id: 'abc1', name: 'Existing Item One' },
        { id: 'abc2', name: 'Existing Item Two' }
      ])
    });

    await gotoCollectionView(page, slug);

    await expect(page.locator('.item-row', { hasText: 'Existing Item One' })).toBeVisible();
    await expect(page.locator('.item-row', { hasText: 'Existing Item Two' })).toBeVisible();

    await deleteCollectionViaApi(request, slug);
  });

  test('should show collection name in header', async ({ request, page }) => {
    const name = TEST_PREFIX + 'header-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await expect(page.locator('h1')).toContainText(name);

    await deleteCollectionViaApi(request, slug);
  });

  test('should navigate back to collection list', async ({ request, page }) => {
    const name = TEST_PREFIX + 'back-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await page.locator('a[title="Back"]').click();
    await expect(page).toHaveURL(/\/list\/#?\/?$/);

    await deleteCollectionViaApi(request, slug);
  });
});
