import { describe, it, expect } from 'vitest';
import { fieldDefault, parseFieldValue } from './field';
import type { Field } from './field';

// ---------------------------------------------------------------------------
// fieldDefault
// ---------------------------------------------------------------------------

describe('fieldDefault', () => {
  it('returns empty string for text fields', () => {
    expect(fieldDefault({ name: 'Notes', type: 'text' })).toBe('');
  });

  it('returns false for checkbox fields', () => {
    expect(fieldDefault({ name: 'Done', type: 'checkbox' })).toBe(false);
  });

  it('returns 0 for integer number fields', () => {
    expect(fieldDefault({ name: 'Qty', type: 'number', mode: 'integer' })).toBe(0);
  });

  it('returns 0 for decimal number fields', () => {
    expect(fieldDefault({ name: 'Price', type: 'number', mode: 'decimal' })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseFieldValue — text fields (passthrough)
// ---------------------------------------------------------------------------

describe('parseFieldValue — text', () => {
  const field: Field = { key: 'notes', name: 'Notes', type: 'text' };

  it('returns the raw string unchanged', () => {
    expect(parseFieldValue('hello', field)).toBe('hello');
  });

  it('returns empty string unchanged', () => {
    expect(parseFieldValue('', field)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// parseFieldValue — checkbox fields (passthrough)
// ---------------------------------------------------------------------------

describe('parseFieldValue — checkbox', () => {
  const field: Field = { key: 'done', name: 'Done', type: 'checkbox' };

  it('returns the raw string unchanged', () => {
    expect(parseFieldValue('true', field)).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// parseFieldValue — integer number fields
// ---------------------------------------------------------------------------

describe('parseFieldValue — number (integer)', () => {
  const field: Field = { key: 'qty', name: 'Qty', type: 'number', mode: 'integer' };

  it('parses a whole number string to a number', () => {
    expect(parseFieldValue('42', field)).toBe(42);
  });

  it('truncates decimal input to integer', () => {
    expect(parseFieldValue('3.7', field)).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(parseFieldValue('', field)).toBe(0);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseFieldValue('abc', field)).toBe(0);
  });

  it('parses negative integers', () => {
    expect(parseFieldValue('-5', field)).toBe(-5);
  });

  it('returns a number type (not string)', () => {
    expect(typeof parseFieldValue('10', field)).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// parseFieldValue — decimal number fields
// ---------------------------------------------------------------------------

describe('parseFieldValue — number (decimal)', () => {
  const field: Field = { key: 'price', name: 'Price', type: 'number', mode: 'decimal' };

  it('parses a decimal string to a number', () => {
    expect(parseFieldValue('9.99', field)).toBeCloseTo(9.99);
  });

  it('parses a whole number string to a number', () => {
    expect(parseFieldValue('42', field)).toBe(42);
  });

  it('returns 0 for empty string', () => {
    expect(parseFieldValue('', field)).toBe(0);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseFieldValue('abc', field)).toBe(0);
  });

  it('parses negative decimals', () => {
    expect(parseFieldValue('-1.5', field)).toBeCloseTo(-1.5);
  });

  it('returns a number type (not string)', () => {
    expect(typeof parseFieldValue('3.14', field)).toBe('number');
  });
});
