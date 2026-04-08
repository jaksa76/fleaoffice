/**
 * Integration tests: how fieldDefault and parseFieldValue interact with
 * Field schemas and Item records — mirroring the data flows in CollectionView:
 *
 *  submitNewField  → fieldDefault applied to existing items
 *  submitNewItem   → fieldDefault applied to new item
 *  commitEdit      → parseFieldValue applied to updated item
 */

import { describe, it, expect } from 'vitest';
import { fieldDefault, parseFieldValue } from './field';
import type { Field } from './field';
import type { Item } from './Item';

// ---------------------------------------------------------------------------
// Simulated submitNewField: backfill existing items with field default
// ---------------------------------------------------------------------------

describe('adding a number field backfills existing items with 0', () => {
  const existingItems: Item[] = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta', notes: 'some text' },
  ];

  const newField: Field = { key: 'qty', name: 'Qty', type: 'number', mode: 'integer' };
  const defaultValue = fieldDefault(newField);
  const updatedItems = existingItems.map(item => ({ ...item, [newField.key]: defaultValue }));

  it('adds the field key to every item', () => {
    expect(updatedItems.every(i => 'qty' in i)).toBe(true);
  });

  it('sets the default to 0 (number, not string)', () => {
    expect(updatedItems[0].qty).toBe(0);
    expect(typeof updatedItems[0].qty).toBe('number');
  });

  it('preserves existing fields on items', () => {
    expect(updatedItems[1].notes).toBe('some text');
  });

  it('does not mutate the original items', () => {
    expect('qty' in existingItems[0]).toBe(false);
  });
});

describe('adding a text field backfills existing items with empty string', () => {
  const existingItems: Item[] = [{ id: 'a', name: 'Alpha', qty: 5 }];
  const newField: Field = { key: 'notes', name: 'Notes', type: 'text' };
  const updatedItems = existingItems.map(item => ({ ...item, [newField.key]: fieldDefault(newField) }));

  it('sets the default to empty string', () => {
    expect(updatedItems[0].notes).toBe('');
  });
});

describe('adding a checkbox field backfills existing items with false', () => {
  const existingItems: Item[] = [{ id: 'a', name: 'Alpha' }];
  const newField: Field = { key: 'done', name: 'Done', type: 'checkbox' };
  const updatedItems = existingItems.map(item => ({ ...item, [newField.key]: fieldDefault(newField) }));

  it('sets the default to false', () => {
    expect(updatedItems[0].done).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Simulated submitNewItem: apply field defaults when creating a new item
// ---------------------------------------------------------------------------

describe('new item gets correct defaults across a mixed-type schema', () => {
  const fields: Field[] = [
    { key: 'qty',   name: 'Qty',   type: 'number',   mode: 'integer' },
    { key: 'price', name: 'Price', type: 'number',   mode: 'decimal' },
    { key: 'done',  name: 'Done',  type: 'checkbox' },
    { key: 'notes', name: 'Notes', type: 'text' },
  ];

  const defaults: Record<string, unknown> = {};
  for (const f of fields) defaults[f.key] = fieldDefault(f);
  const newItem: Item = { id: 'x', name: 'New Item', ...defaults };

  it('integer field defaults to 0', () => {
    expect(newItem.qty).toBe(0);
    expect(typeof newItem.qty).toBe('number');
  });

  it('decimal field defaults to 0', () => {
    expect(newItem.price).toBe(0);
    expect(typeof newItem.price).toBe('number');
  });

  it('checkbox field defaults to false', () => {
    expect(newItem.done).toBe(false);
  });

  it('text field defaults to empty string', () => {
    expect(newItem.notes).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Simulated commitEdit: parse raw edit value and apply to item
// ---------------------------------------------------------------------------

describe('editing an integer field updates item with a number', () => {
  const item: Item = { id: 'a', name: 'Alpha', qty: 0 };
  const field: Field = { key: 'qty', name: 'Qty', type: 'number', mode: 'integer' };

  function applyEdit(items: Item[], itemId: string, fieldKey: string, raw: string): Item[] {
    const f = [field].find(f => f.key === fieldKey)!;
    return items.map(i => i.id === itemId ? { ...i, [fieldKey]: parseFieldValue(raw, f) } : i);
  }

  it('stores the parsed integer, not the raw string', () => {
    const updated = applyEdit([item], 'a', 'qty', '42');
    expect(updated[0].qty).toBe(42);
    expect(typeof updated[0].qty).toBe('number');
  });

  it('stores 0 when input is cleared', () => {
    const updated = applyEdit([item], 'a', 'qty', '');
    expect(updated[0].qty).toBe(0);
  });

  it('does not affect other items', () => {
    const items: Item[] = [item, { id: 'b', name: 'Beta', qty: 7 }];
    const updated = applyEdit(items, 'a', 'qty', '99');
    expect(updated[1].qty).toBe(7);
  });
});

describe('editing a decimal field updates item with a float', () => {
  const item: Item = { id: 'a', name: 'Alpha', price: 0 };
  const field: Field = { key: 'price', name: 'Price', type: 'number', mode: 'decimal' };

  it('stores the parsed float', () => {
    const updated = [item].map(i => ({ ...i, price: parseFieldValue('9.99', field) }));
    expect(updated[0].price).toBeCloseTo(9.99);
    expect(typeof updated[0].price).toBe('number');
  });
});

describe('editing a text field keeps value as string', () => {
  const item: Item = { id: 'a', name: 'Alpha', notes: '' };
  const field: Field = { key: 'notes', name: 'Notes', type: 'text' };

  it('stores the string as-is', () => {
    const updated = [item].map(i => ({ ...i, notes: parseFieldValue('hello world', field) }));
    expect(updated[0].notes).toBe('hello world');
  });
});

describe('adding a currency field backfills existing items with 0', () => {
  const existingItems: Item[] = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta', qty: 3 },
  ];

  const newField: Field = { key: 'price', name: 'Price', type: 'currency', symbol: '$' };
  const defaultValue = fieldDefault(newField);
  const updatedItems = existingItems.map(item => ({ ...item, [newField.key]: defaultValue }));

  it('adds the field key to every item', () => {
    expect(updatedItems.every(i => 'price' in i)).toBe(true);
  });

  it('sets the default to 0 (number, not string)', () => {
    expect(updatedItems[0].price).toBe(0);
    expect(typeof updatedItems[0].price).toBe('number');
  });

  it('preserves existing fields on items', () => {
    expect(updatedItems[1].qty).toBe(3);
  });
});

describe('editing a currency field stores a float', () => {
  const item: Item = { id: 'a', name: 'Alpha', price: 0 };
  const field: Field = { key: 'price', name: 'Price', type: 'currency', symbol: '$' };

  it('stores the parsed float', () => {
    const updated = [item].map(i => ({ ...i, price: parseFieldValue('19.99', field) }));
    expect(updated[0].price).toBeCloseTo(19.99);
    expect(typeof updated[0].price).toBe('number');
  });

  it('stores 0 when input is cleared', () => {
    const updated = [item].map(i => ({ ...i, price: parseFieldValue('', field) }));
    expect(updated[0].price).toBe(0);
  });
});

describe('new item gets correct defaults including currency field', () => {
  const fields: Field[] = [
    { key: 'qty',   name: 'Qty',   type: 'number',   mode: 'integer' },
    { key: 'price', name: 'Price', type: 'currency', symbol: '$' },
    { key: 'notes', name: 'Notes', type: 'text' },
  ];

  const defaults: Record<string, unknown> = {};
  for (const f of fields) defaults[f.key] = fieldDefault(f);
  const newItem: Item = { id: 'x', name: 'New Item', ...defaults };

  it('currency field defaults to 0', () => {
    expect(newItem.price).toBe(0);
    expect(typeof newItem.price).toBe('number');
  });
});
