import { test, expect } from '@playwright/test';

const TEST_PREFIX = 'currency-field-test-';

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

test.describe('List - Currency Field', () => {
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

  test('should show currency option in the type selector', async ({ request, page }) => {
    const name = TEST_PREFIX + 'type-opt-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await expect(page.locator('.item-new-field-type option[value="currency"]')).toBeAttached();
  });

  test('should show symbol input only when type is currency', async ({ request, page }) => {
    const name = TEST_PREFIX + 'symbol-show-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await expect(page.locator('.item-new-field-symbol')).not.toBeVisible();

    await page.locator('.item-new-field-type').selectOption('currency');
    await expect(page.locator('.item-new-field-symbol')).toBeVisible();
    await expect(page.locator('.item-new-field-symbol')).toHaveValue('$');
  });

  test('should hide mode selector when type is currency', async ({ request, page }) => {
    const name = TEST_PREFIX + 'no-mode-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-type').selectOption('currency');
    await expect(page.locator('.item-new-field-mode')).not.toBeVisible();
  });

  test('should persist currency field with symbol in schema.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'schema-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-input').fill('Price');
    await page.locator('.item-new-field-type').selectOption('currency');
    await page.locator('.item-new-field-input').press('Enter');

    await expect(page.locator('.item-new-field-form')).not.toBeVisible();

    const schema = await (await request.get(`/api/list/data/${slug}/schema.json`)).json();
    expect(schema.fields).toHaveLength(1);
    expect(schema.fields[0].name).toBe('Price');
    expect(schema.fields[0].type).toBe('currency');
    expect(schema.fields[0].symbol).toBe('$');
  });

  test('should persist custom symbol in schema.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'custom-sym-' + Date.now();
    const slug = await createCollectionWithItem(request, name);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-input').fill('Cost');
    await page.locator('.item-new-field-type').selectOption('currency');
    await page.locator('.item-new-field-symbol').fill('€');
    await page.locator('.item-new-field-input').press('Enter');

    await expect(page.locator('.item-new-field-form')).not.toBeVisible();

    const schema = await (await request.get(`/api/list/data/${slug}/schema.json`)).json();
    expect(schema.fields[0].symbol).toBe('€');
  });

  test('should set 0 as default value for currency fields on existing items', async ({ request, page }) => {
    const name = TEST_PREFIX + 'default-' + Date.now();
    const slug = await createCollectionViaApi(request, name, [], [{ id: 'i1', name: 'Existing Item' }]);
    await gotoCollectionView(page, slug);
    await clickAddField(page);

    await page.locator('.item-new-field-input').fill('Price');
    await page.locator('.item-new-field-type').selectOption('currency');
    await page.locator('.item-new-field-input').press('Enter');

    await expect(page.locator('.item-new-field-form')).not.toBeVisible();

    const items = await (await request.get(`/api/list/data/${slug}/items.json`)).json();
    const schema = await (await request.get(`/api/list/data/${slug}/schema.json`)).json();
    expect(items[0][schema.fields[0].key]).toBe(0);
    expect(typeof items[0][schema.fields[0].key]).toBe('number');
  });

  test('should display currency value with symbol prefix', async ({ request, page }) => {
    const name = TEST_PREFIX + 'display-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'price', name: 'Price', type: 'currency', symbol: '$' }],
      [{ id: 'i1', name: 'Item A', price: 9.99 }]
    );
    await gotoCollectionView(page, slug);

    await expect(page.locator('.item-field-value', { hasText: '$9.99' })).toBeVisible();
  });

  test('should display correct symbol for non-dollar currency', async ({ request, page }) => {
    const name = TEST_PREFIX + 'euro-sym-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'cost', name: 'Cost', type: 'currency', symbol: '€' }],
      [{ id: 'i1', name: 'Item A', cost: 19.99 }]
    );
    await gotoCollectionView(page, slug);

    await expect(page.locator('.item-field-value', { hasText: '€19.99' })).toBeVisible();
  });

  test('should render type=number input when editing a currency field', async ({ request, page }) => {
    const name = TEST_PREFIX + 'input-type-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'price', name: 'Price', type: 'currency', symbol: '$' }],
      [{ id: 'i1', name: 'Item A', price: 9.99 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '$9.99' }).click();

    await expect(page.locator('.item-field-edit')).toHaveAttribute('type', 'number');
  });

  test('should populate edit input with raw number (no symbol)', async ({ request, page }) => {
    const name = TEST_PREFIX + 'edit-raw-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'price', name: 'Price', type: 'currency', symbol: '$' }],
      [{ id: 'i1', name: 'Item A', price: 9.99 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '$9.99' }).click();

    await expect(page.locator('.item-field-edit')).toHaveValue('9.99');
  });

  test('should save currency value as a number in items.json', async ({ request, page }) => {
    const name = TEST_PREFIX + 'save-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'price', name: 'Price', type: 'currency', symbol: '$' }],
      [{ id: 'i1', name: 'Item A', price: 0 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '$0.00' }).click();
    await page.locator('.item-field-edit').fill('24.99');
    await page.locator('.item-field-edit').press('Enter');

    const items = await (await request.get(`/api/list/data/${slug}/items.json`)).json();
    expect(items[0].price).toBeCloseTo(24.99);
    expect(typeof items[0].price).toBe('number');
  });

  test('should display updated value with symbol after edit', async ({ request, page }) => {
    const name = TEST_PREFIX + 'display-after-edit-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'price', name: 'Price', type: 'currency', symbol: '$' }],
      [{ id: 'i1', name: 'Item A', price: 0 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '$0.00' }).click();
    await page.locator('.item-field-edit').fill('42');
    await page.locator('.item-field-edit').press('Enter');

    await expect(page.locator('.item-field-value', { hasText: '$42.00' })).toBeVisible();
  });

  test('should save 0 when currency field is cleared', async ({ request, page }) => {
    const name = TEST_PREFIX + 'clear-' + Date.now();
    const slug = await createCollectionViaApi(request, name,
      [{ key: 'price', name: 'Price', type: 'currency', symbol: '$' }],
      [{ id: 'i1', name: 'Item A', price: 9.99 }]
    );
    await gotoCollectionView(page, slug);

    await page.locator('.item-field-value', { hasText: '$9.99' }).click();
    await page.locator('.item-field-edit').fill('');
    await page.locator('.item-field-edit').press('Enter');

    const items = await (await request.get(`/api/list/data/${slug}/items.json`)).json();
    expect(items[0].price).toBe(0);
  });
});
