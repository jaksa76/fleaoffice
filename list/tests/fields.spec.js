import { test, expect } from '@playwright/test';

const TEST_PREFIX = 'fields-test-';

function nameToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

async function createCollectionViaApi(request, name, fields = []) {
  const slug = nameToSlug(name);
  await request.put(`/api/list/data/${slug}/schema.json`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ name, fields })
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
  await page.waitForSelector('.item-list:not(:has(.loading))');
}

test.describe('List - Add Field', () => {
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

  test('should show add-field button in the header', async ({ request, page }) => {
    const name = TEST_PREFIX + 'headers-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    await expect(page.locator('button[title="Add field"]')).toBeVisible();
  });

  test('should open new-field form when add-field button is clicked', async ({ request, page }) => {
    const name = TEST_PREFIX + 'form-open-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);
    await page.locator('button[title="Add field"]').click();

    await expect(page.locator('.new-field-form')).toBeVisible();
    await expect(page.locator('.new-field-form input')).toBeFocused();
    await expect(page.locator('.new-field-form select')).toBeVisible();
  });

  test('should close new-field form on Escape', async ({ request, page }) => {
    const name = TEST_PREFIX + 'form-esc-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);
    await page.locator('button[title="Add field"]').click();
    await expect(page.locator('.new-field-form')).toBeVisible();

    await page.locator('.new-field-form input').press('Escape');
    await expect(page.locator('.new-field-form')).not.toBeVisible();
  });

  test('should add a text field and persist it in schema.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'add-text-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);
    await page.locator('button[title="Add field"]').click();

    await page.locator('.new-field-form input').fill('Priority');
    await page.locator('.new-field-form input').press('Enter');

    await expect(page.locator('.new-field-form')).not.toBeVisible();

    const res = await request.get(`/api/list/data/${slug}/schema.json`);
    const schema = await res.json();
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].name).toBe('Priority');
    expect(schema.fields[0].type).toBe('text');
  });

  test('should persist new field in schema.json with correct type', async ({ request, page }) => {
    const name = TEST_PREFIX + 'persist-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);
    await page.locator('button[title="Add field"]').click();

    await page.locator('.new-field-form input').fill('Due Date');
    await page.locator('.new-field-form select').selectOption('date');
    await page.locator('.new-field-form input').press('Enter');

    await expect(page.locator('.new-field-form')).not.toBeVisible();

    const res = await request.get(`/api/list/data/${slug}/schema.json`);
    expect(res.ok()).toBeTruthy();
    const schema = await res.json();
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].name).toBe('Due Date');
    expect(schema.fields[0].type).toBe('date');
    expect(schema.fields[0].key).toBeTruthy();
  });

  test('should add default values to existing items when a field is added', async ({ request, page }) => {
    const name = TEST_PREFIX + 'defaults-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([
        { id: 'item1', name: 'Existing Item' }
      ])
    });

    await gotoCollectionView(page, slug);
    await page.locator('button[title="Add field"]').click();

    await page.locator('.new-field-form input').fill('Status');
    await page.locator('.new-field-form input').press('Enter');

    await expect(page.locator('.new-field-form')).not.toBeVisible();

    const res = await request.get(`/api/list/data/${slug}/items.json`);
    const items = await res.json();
    expect(items).toHaveLength(1);
    const fieldKey = (await (await request.get(`/api/list/data/${slug}/schema.json`)).json()).fields[0].key;
    expect(Object.prototype.hasOwnProperty.call(items[0], fieldKey)).toBeTruthy();
    expect(items[0][fieldKey]).toBe('');
  });

  test('should add default false value to existing items when a checkbox field is added', async ({ request, page }) => {
    const name = TEST_PREFIX + 'checkbox-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([
        { id: 'item1', name: 'Task One' }
      ])
    });

    await gotoCollectionView(page, slug);
    await page.locator('button[title="Add field"]').click();

    await page.locator('.new-field-form input').fill('Done');
    await page.locator('.new-field-form select').selectOption('checkbox');
    await page.locator('.new-field-form input').press('Enter');

    await expect(page.locator('.new-field-form')).not.toBeVisible();

    const res = await request.get(`/api/list/data/${slug}/items.json`);
    const items = await res.json();
    const schemaRes = await request.get(`/api/list/data/${slug}/schema.json`);
    const schema = await schemaRes.json();
    const fieldKey = schema.fields[0].key;
    expect(items[0][fieldKey]).toBe(false);
  });

  test('should include field default value in new items after field is added', async ({ request, page }) => {
    const name = TEST_PREFIX + 'new-item-defaults-' + Date.now();
    const slug = await createCollectionViaApi(request, name);

    await gotoCollectionView(page, slug);

    // Add a field
    await page.locator('button[title="Add field"]').click();
    await page.locator('.new-field-form input').fill('Notes');
    await page.locator('.new-field-form input').press('Enter');
    await expect(page.locator('.new-field-form')).not.toBeVisible();

    // Now add a new item
    await page.locator('button[title="New item"]').click();
    await page.locator('input.new-doc-input').fill('New Task');
    await page.locator('input.new-doc-input').press('Enter');
    await expect(page.locator('.item-row', { hasText: 'New Task' })).toBeVisible();

    // Verify the item has the field key in API
    const itemsRes = await request.get(`/api/list/data/${slug}/items.json`);
    const items = await itemsRes.json();
    const schemaRes = await request.get(`/api/list/data/${slug}/schema.json`);
    const schema = await schemaRes.json();
    const fieldKey = schema.fields[0].key;
    expect(Object.prototype.hasOwnProperty.call(items[0], fieldKey)).toBeTruthy();
    expect(items[0][fieldKey]).toBe('');
  });

  test('should display field labels and values in item cards', async ({ request, page }) => {
    const name = TEST_PREFIX + 'load-fields-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        name,
        fields: [
          { key: 'priority', name: 'Priority', type: 'text' },
          { key: 'done', name: 'Done', type: 'checkbox' }
        ]
      })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([
        { id: 'i1', name: 'Task A', priority: 'High', done: false }
      ])
    });

    await gotoCollectionView(page, slug);

    await expect(page.locator('.item-field-label', { hasText: 'Priority' })).toBeVisible();
    await expect(page.locator('.item-field-label', { hasText: 'Done' })).toBeVisible();
  });

  test('should display field values in item cards', async ({ request, page }) => {
    const name = TEST_PREFIX + 'display-vals-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        name,
        fields: [{ key: 'priority', name: 'Priority', type: 'text' }]
      })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([
        { id: 'i1', name: 'Task A', priority: 'High' }
      ])
    });

    await gotoCollectionView(page, slug);

    await expect(page.locator('.item-field-value', { hasText: 'High' })).toBeVisible();
  });

  test('should reject duplicate field names', async ({ request, page }) => {
    const name = TEST_PREFIX + 'duplicate-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        name,
        fields: [{ key: 'priority', name: 'Priority', type: 'text' }]
      })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([])
    });

    await gotoCollectionView(page, slug);

    // Try to add a field with the same name
    await page.locator('button[title="Add field"]').click();
    await page.locator('.new-field-form input').fill('Priority');
    await page.locator('.new-field-form input').press('Enter');

    await expect(page.locator('.form-error')).toBeVisible();

    // Schema should still have only one field
    const res = await request.get(`/api/list/data/${slug}/schema.json`);
    const schema = await res.json();
    expect(schema.fields).toHaveLength(1);
  });
});
