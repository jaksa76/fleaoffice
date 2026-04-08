export type FieldDraft =
  | { name: string; type: 'text' }
  | { name: string; type: 'number'; mode: 'integer' | 'decimal' }
  | { name: string; type: 'checkbox' }
  | { name: string; type: 'currency'; symbol: string };

export type Field = FieldDraft & { key: string };

/** Default value to store for a new field on existing items. */
export function fieldDefault(field: FieldDraft): unknown {
  if (field.type === 'checkbox') return false;
  if (field.type === 'number') return 0;
  if (field.type === 'currency') return 0;
  return '';
}

/** Parse a raw string edit value into the correct stored type for the field. */
export function parseFieldValue(raw: string, field: Field): unknown {
  if (field.type === 'number') {
    if (field.mode === 'integer') {
      const n = parseInt(raw, 10);
      return isNaN(n) ? 0 : n;
    } else {
      const n = parseFloat(raw);
      return isNaN(n) ? 0 : n;
    }
  }
  if (field.type === 'currency') {
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }
  return raw;
}

/** Return the HTML input type to use when editing a field value. */
export function fieldInputType(field: Field): string {
  switch (field.type) {
    case 'number':
    case 'currency': return 'number';
    default: return field.type;
  }
}

/** Return the step attribute for a numeric input, or undefined if not applicable. */
export function fieldInputStep(field: Field): string | undefined {
  switch (field.type) {
    case 'currency': return 'any';
    case 'number': return field.mode === 'decimal' ? 'any' : undefined;
    default: return undefined;
  }
}

/** Format a stored field value for display. */
export function formatFieldValue(value: unknown, field: Field): string {
  if (field.type === 'currency') {
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    const formatted = isNaN(n) ? '0.00' : n.toFixed(2);
    return `${field.symbol}${formatted}`;
  }
  return String(value ?? '');
}
