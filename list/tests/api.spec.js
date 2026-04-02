import { test, expect } from '@playwright/test';

const TEST_PREFIX = 'api-test-';

function nameToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

test.describe('List - API Integration', () => {
  const createdSlugs = [];

  test.afterAll(async ({ request }) => {
    for (const slug of createdSlugs) {
      await request.delete(`/api/list/data/${slug}?recursive=true`).catch(() => {});
    }
  });

  test('should list root data directory', async ({ request }) => {
    const res = await request.get('/api/list/data/');
    // 200 (exists) or 404 (empty/not yet created) are both acceptable
    expect([200, 404]).toContain(res.status());
  });

  test('should create a collection schema', async ({ request }) => {
    const name = TEST_PREFIX + 'schema-' + Date.now();
    const slug = nameToSlug(name);
    createdSlugs.push(slug);

    const res = await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    expect(res.ok()).toBeTruthy();
  });

  test('should read back a created schema', async ({ request }) => {
    const name = TEST_PREFIX + 'read-' + Date.now();
    const slug = nameToSlug(name);
    createdSlugs.push(slug);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });

    const res = await request.get(`/api/list/data/${slug}/schema.json`);
    expect(res.ok()).toBeTruthy();
    const schema = await res.json();
    expect(schema.name).toBe(name);
    expect(schema.fields).toEqual([]);
  });

  test('should create and read items.json', async ({ request }) => {
    const name = TEST_PREFIX + 'items-' + Date.now();
    const slug = nameToSlug(name);
    createdSlugs.push(slug);

    const items = [{ id: '1', name: 'First item' }, { id: '2', name: 'Second item' }];

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(items)
    });

    const res = await request.get(`/api/list/data/${slug}/items.json`);
    expect(res.ok()).toBeTruthy();
    const saved = await res.json();
    expect(saved).toHaveLength(2);
    expect(saved[0].name).toBe('First item');
  });

  test('should list collections as directories', async ({ request }) => {
    const name = TEST_PREFIX + 'list-dir-' + Date.now();
    const slug = nameToSlug(name);
    createdSlugs.push(slug);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([])
    });

    const res = await request.get('/api/list/data/');
    expect(res.ok()).toBeTruthy();
    const entries = await res.json();
    const entry = entries.find(e => e.name === slug);
    expect(entry).toBeDefined();
    expect(entry.type).toBe('dir');
  });

  test('should delete a collection recursively', async ({ request }) => {
    const name = TEST_PREFIX + 'del-' + Date.now();
    const slug = nameToSlug(name);

    await request.put(`/api/list/data/${slug}/schema.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ name, fields: [] })
    });
    await request.put(`/api/list/data/${slug}/items.json`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify([])
    });

    const deleteRes = await request.delete(`/api/list/data/${slug}?recursive=true`);
    expect(deleteRes.ok()).toBeTruthy();

    const checkRes = await request.get(`/api/list/data/${slug}/schema.json`);
    expect(checkRes.status()).toBe(404);
  });

  test('should return 404 for non-existent collection', async ({ request }) => {
    const res = await request.get('/api/list/data/does-not-exist/schema.json');
    expect(res.status()).toBe(404);
  });
});
