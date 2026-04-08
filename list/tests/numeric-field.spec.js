import { test, expect } from '@playwright/test';

const TEST_PREFIX = 'numeric-field-test-';

function nameToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

async function createCollectionViaApi(request, name, fields = [], items = []) {
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

async function createCollectionWithItem(request, name, fields = []) {
  return createCollectionViaApi(request, name, fields, [{ id: 'seed1', name: 'Seed Item' }]);
}

async function deleteCollectionViaApi(request, slug) {
  await request.delete(`/api/list/data/${slug}?recursive=true`).catch(() => {});
}

async function gotoCollectionView(page, slug) {
  await page.goto(`/list/#/collection/${slug}`);
  await page.waitForSelector('.item-list:not(:has(.loading))');
}

async function clickAddField(page) {
  await page.locator('.item-row button[title="Add field"]').first().click();
}

test.describe('List - Numeric Field', () => {
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

  test('should show a type selector in the add-field form', async ({ request, page }) => {
    const name = TEST_PREFIX + 'type-sel-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await expect(page.locator('.item-new-field-type')).toBeVisible();
    await expect(page.locator('.item-new-field-type')).toHaveValue('text');
  });

  test('should show numeric mode selector only when type is number', async ({ request, page }) => {
    const name = TEST_PREFIX + 'mode-sel-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await expect(page.locator('.item-new-field-mode')).not.toBeVisible();

    await page.locator('.item-new-field-type').selectOption('number');
    await expect(page.locator('.item-new-field-mode')).toBeVisible();
    await expect(page.locator('.item-new-field-mode')).toHaveValue('integer');
  });

  test('should persist integer number field in schema.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'schema-int-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-input').fill('Quantity');
    await page.locator('.item-new-field-type').selectOption('number');
    await page.locator('.item-new-field-input').press('Enter');

    await expect(page.locator('.item-new-field-form')).not.toBeVisible();

    const schema = await (await request.get(`/api/list/data/${slug}/schema.json`)).json();
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].name).toBe('Quantity');
    expect(schema.fields[0].type).toBe('number');
    expect(schema.fields[0].mode).toBe('integer');
  });

  test('should persist decimal number field in schema.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'schema-dec-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-input').fill('Price');
    await page.locator('.item-new-field-type').selectOption('number');
    await page.locator('.item-new-field-mode').selectOption('decimal');
    await page.locator('.item-new-field-input').press('Enter');

    const schema = await (await request.get(`/api/list/data/${slug}/schema.json`)).json();
    expect(schema.fields[0].type).toBe('number');
    expect(schema.fields[0].mode).toBe('decimal');
  });

  test('should set 0 as default value for number fields on existing items', async ({ request, page }) => {
    const name = TEST_PREFIX + 'default-' + Date.now();
    const slug = await createCollectionViaApi(request, name, [], [{ id: 'i1', name: 'Existing Item' }]);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-input').fill('Score');
    await page.locator('.item-new-field-type').selectOption('number');
    await page.locator('.item-new-field-input').press('Enter');
    await expect(page.locator('.item-new-field-form')).not.toBeVisible();

    const items = await (await request.get(`/api/list/data/${slug}/items.json`)).json();
    const schema = await (await request.get(`/api/list/data/${slug}/schema.json`)).json();
    expect(items[0][schema.fields[0].key]).toBe(0);
  });

  test('should render type=number input when editing a number field', async ({ request, page }) => {
    const name = TEST_PREFIX + 'input-type-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'qty', name: 'Quantity', type: 'number', mode: 'integer' }],
      [{ id: 'i1', name: 'Item A', qty: 5 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '5' }).click();

    await expect(page.locator('.item-field-edit')).toHaveAttribute('type', 'number');
  });

  test('should save integer field value as a number in items.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'save-int-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'qty', name: 'Quantity', type: 'number', mode: 'integer' }],
      [{ id: 'i1', name: 'Item A', qty: 1 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '1' }).click();
    await page.locator('.item-field-edit').fill('42');
    await page.locator('.item-field-edit').press('Enter');

    const items = await (await request.get(`/api/list/data/${slug}/items.json`)).json();
    expect(items[0].qty).toBe(42);
    expect(typeof items[0].qty).toBe('number');
  });

  test('should save decimal field value as a number in items.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'save-dec-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'price', name: 'Price', type: 'number', mode: 'decimal' }],
      [{ id: 'i1', name: 'Item A', price: 1.0 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '1' }).click();
    await page.locator('.item-field-edit').fill('9.99');
    await page.locator('.item-field-edit').press('Enter');

    const items = await (await request.get(`/api/list/data/${slug}/items.json`)).json();
    expect(items[0].price).toBeCloseTo(9.99);
    expect(typeof items[0].price).toBe('number');
  });

  test('should save 0 when a number field is cleared', async ({ request, page }) => {
    const name = TEST_PREFIX + 'clear-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'qty', name: 'Quantity', type: 'number', mode: 'integer' }],
      [{ id: 'i1', name: 'Item A', qty: 10 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '10' }).click();
    await page.locator('.item-field-edit').fill('');
    await page.locator('.item-field-edit').press('Enter');

    const items = await (await request.get(`/api/list/data/${slug}/items.json`)).json();
    expect(items[0].qty).toBe(0);
  });

  test('should still add a text field when type stays as text', async ({ request, page }) => {
    const name = TEST_PREFIX + 'text-regression-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-input').fill('Notes');
    await page.locator('.item-new-field-input').press('Enter');

    const schema = await (await request.get(`/api/list/data/${slug}/schema.json`)).json();
    expect(schema.fields[0].type).toBe('text');
    expect(schema.fields[0].mode).toBeUndefined();
  });
});
