import { test, expect } from '@playwright/test';

const TEST_PREFIX = 'field-edit-test-';

function nameToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

async function createCollection(request, name, fields, items) {
  const slug = nameToSlug(name);
  await request.put(`/api/list/data/${slug}/schema.json`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ name, fields })
  });
  await request.put(`/api/list/data/${slug}/items.json`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify(items)
  });
  return slug;
}

async function deleteCollectionViaApi(request, slug) {
  await request.delete(`/api/list/data/${slug}?recursive=true`).catch(() => {});
}

async function gotoCollectionView(page, slug) {
  await page.goto(`/list/#/collection/${slug}`);
  await page.waitForSelector('.item-list:not(:has(.loading))');
}

async function gotoItemDetail(page, slug, itemId) {
  await page.goto(`/list/#/collection/${slug}/item/${itemId}`);
  await page.waitForSelector('.item-detail:not(:has(.loading))');
}

test.describe('List - Edit Field Value', () => {
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

  test('should show field value as clickable text', async ({ request, page }) => {
    const name = TEST_PREFIX + 'click-' + Date.now();
    const slug = await createCollection(request, name,
      [{ key: 'priority', name: 'Priority', type: 'text' }],
      [{ id: 'i1', name: 'Task A', priority: 'High' }]
    );

    await gotoItemDetail(page, slug, 'i1');

    const value = page.locator('.item-field-value', { hasText: 'High' });
    await expect(value).toBeVisible();
    await expect(value).toHaveCSS('cursor', 'text');
  });

  test('should switch to input when field value is clicked', async ({ request, page }) => {
    const name = TEST_PREFIX + 'switch-' + Date.now();
    const slug = await createCollection(request, name,
      [{ key: 'priority', name: 'Priority', type: 'text' }],
      [{ id: 'i1', name: 'Task A', priority: 'High' }]
    );

    await gotoItemDetail(page, slug, 'i1');

    await page.locator('.item-field-value', { hasText: 'High' }).click();

    await expect(page.locator('.item-field-edit')).toBeVisible();
    await expect(page.locator('.item-field-edit')).toBeFocused();
    await expect(page.locator('.item-field-edit')).toHaveValue('High');
  });

  test('should save on Enter and show updated value', async ({ request, page }) => {
    const name = TEST_PREFIX + 'save-enter-' + Date.now();
    const slug = await createCollection(request, name,
      [{ key: 'priority', name: 'Priority', type: 'text' }],
      [{ id: 'i1', name: 'Task A', priority: 'High' }]
    );

    await gotoItemDetail(page, slug, 'i1');

    await page.locator('.item-field-value', { hasText: 'High' }).click();
    await page.locator('.item-field-edit').fill('Critical');
    await page.locator('.item-field-edit').press('Enter');

    await expect(page.locator('.item-field-value', { hasText: 'Critical' })).toBeVisible();
    await expect(page.locator('.item-field-edit')).not.toBeVisible();
  });

  test('should persist saved value via API', async ({ request, page }) => {
    const name = TEST_PREFIX + 'persist-' + Date.now();
    const slug = await createCollection(request, name,
      [{ key: 'priority', name: 'Priority', type: 'text' }],
      [{ id: 'i1', name: 'Task A', priority: 'High' }]
    );

    await gotoItemDetail(page, slug, 'i1');

    await page.locator('.item-field-value', { hasText: 'High' }).click();
    await page.locator('.item-field-edit').fill('Critical');

    const saved = page.waitForResponse(res =>
      res.url().includes('items.json') && res.request().method() === 'PUT'
    );
    await page.locator('.item-field-edit').press('Enter');
    await saved;

    const res = await request.get(`/api/list/data/${slug}/items.json`);
    const items = await res.json();
    expect(items[0].priority).toBe('Critical');
  });

  test('should save on blur', async ({ request, page }) => {
    const name = TEST_PREFIX + 'blur-' + Date.now();
    const slug = await createCollection(request, name,
      [{ key: 'priority', name: 'Priority', type: 'text' }],
      [{ id: 'i1', name: 'Task A', priority: 'High' }]
    );

    await gotoItemDetail(page, slug, 'i1');

    await page.locator('.item-field-value', { hasText: 'High' }).click();
    await page.locator('.item-field-edit').fill('Medium');
    await page.locator('.item-field-edit').blur();

    await expect(page.locator('.item-field-value', { hasText: 'Medium' })).toBeVisible();
  });

  test('should cancel edit on Escape without saving', async ({ request, page }) => {
    const name = TEST_PREFIX + 'escape-' + Date.now();
    const slug = await createCollection(request, name,
      [{ key: 'priority', name: 'Priority', type: 'text' }],
      [{ id: 'i1', name: 'Task A', priority: 'High' }]
    );

    await gotoItemDetail(page, slug, 'i1');

    await page.locator('.item-field-value', { hasText: 'High' }).click();
    await page.locator('.item-field-edit').fill('Critical');
    await page.locator('.item-field-edit').press('Escape');

    await expect(page.locator('.item-field-value', { hasText: 'High' })).toBeVisible();
    await expect(page.locator('.item-field-edit')).not.toBeVisible();

    const res = await request.get(`/api/list/data/${slug}/items.json`);
    const items = await res.json();
    expect(items[0].priority).toBe('High');
  });

  test('should only edit the clicked item when multiple items exist', async ({ request, page }) => {
    const name = TEST_PREFIX + 'multi-' + Date.now();
    const slug = await createCollection(request, name,
      [{ key: 'priority', name: 'Priority', type: 'text' }],
      [
        { id: 'i1', name: 'Task A', priority: 'High' },
        { id: 'i2', name: 'Task B', priority: 'Low' }
      ]
    );

    await gotoItemDetail(page, slug, 'i1');

    await page.locator('.item-field-value', { hasText: 'High' }).click();

    await expect(page.locator('.item-field-edit')).toHaveCount(1);
    await expect(page.locator('.item-field-edit')).toHaveValue('High');
  });
});
