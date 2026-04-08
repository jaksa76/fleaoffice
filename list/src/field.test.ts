import { describe, it, expect } from 'vitest';
import { fieldDefault, parseFieldValue, formatFieldValue, fieldInputType, fieldInputStep } from './field';
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

  it('returns 0 for currency fields', () => {
    expect(fieldDefault({ name: 'Price', type: 'currency', symbol: '$' })).toBe(0);
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

// ---------------------------------------------------------------------------
// parseFieldValue — currency fields
// ---------------------------------------------------------------------------

describe('parseFieldValue — currency', () => {
  const field: Field = { key: 'price', name: 'Price', type: 'currency', symbol: '$' };

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

  it('parses negative values', () => {
    expect(parseFieldValue('-1.50', field)).toBeCloseTo(-1.5);
  });

  it('returns a number type (not string)', () => {
    expect(typeof parseFieldValue('9.99', field)).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// formatFieldValue
// ---------------------------------------------------------------------------

describe('formatFieldValue — currency', () => {
  const field: Field = { key: 'price', name: 'Price', type: 'currency', symbol: '$' };

  it('formats a number with symbol prefix and 2 decimal places', () => {
    expect(formatFieldValue(9.99, field)).toBe('$9.99');
  });

  it('formats zero as $0.00', () => {
    expect(formatFieldValue(0, field)).toBe('$0.00');
  });

  it('pads whole numbers to 2 decimal places', () => {
    expect(formatFieldValue(42, field)).toBe('$42.00');
  });

  it('uses the configured symbol', () => {
    const euro: Field = { key: 'price', name: 'Price', type: 'currency', symbol: '€' };
    expect(formatFieldValue(9.99, euro)).toBe('€9.99');
  });

  it('handles non-number stored value gracefully', () => {
    expect(formatFieldValue(null, field)).toBe('$0.00');
  });
});

describe('formatFieldValue — text passthrough', () => {
  const field: Field = { key: 'notes', name: 'Notes', type: 'text' };

  it('returns the string value unchanged', () => {
    expect(formatFieldValue('hello', field)).toBe('hello');
  });

  it('returns empty string for null', () => {
    expect(formatFieldValue(null, field)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// fieldInputType
// ---------------------------------------------------------------------------

describe('fieldInputType', () => {
  it('returns "text" for text fields', () => {
    expect(fieldInputType({ key: 'n', name: 'N', type: 'text' })).toBe('text');
  });

  it('returns "number" for integer number fields', () => {
    expect(fieldInputType({ key: 'n', name: 'N', type: 'number', mode: 'integer' })).toBe('number');
  });

  it('returns "number" for decimal number fields', () => {
    expect(fieldInputType({ key: 'n', name: 'N', type: 'number', mode: 'decimal' })).toBe('number');
  });

  it('returns "number" for currency fields', () => {
    expect(fieldInputType({ key: 'n', name: 'N', type: 'currency', symbol: '$' })).toBe('number');
  });

  it('returns "checkbox" for checkbox fields', () => {
    expect(fieldInputType({ key: 'n', name: 'N', type: 'checkbox' })).toBe('checkbox');
  });
});

// ---------------------------------------------------------------------------
// fieldInputStep
// ---------------------------------------------------------------------------

describe('fieldInputStep', () => {
  it('returns undefined for integer number fields', () => {
    expect(fieldInputStep({ key: 'n', name: 'N', type: 'number', mode: 'integer' })).toBeUndefined();
  });

  it('returns "any" for decimal number fields', () => {
    expect(fieldInputStep({ key: 'n', name: 'N', type: 'number', mode: 'decimal' })).toBe('any');
  });

  it('returns "any" for currency fields', () => {
    expect(fieldInputStep({ key: 'n', name: 'N', type: 'currency', symbol: '$' })).toBe('any');
  });

  it('returns undefined for text fields', () => {
    expect(fieldInputStep({ key: 'n', name: 'N', type: 'text' })).toBeUndefined();
  });
});
