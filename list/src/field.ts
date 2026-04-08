export type FieldDraft =
  | { name: string; type: 'text' }
  | { name: string; type: 'number'; mode: 'integer' | 'decimal' }
  | { name: string; type: 'checkbox' };

export type Field = FieldDraft & { key: string };

/** Default value to store for a new field on existing items. */
export function fieldDefault(field: FieldDraft): unknown {
  if (field.type === 'checkbox') return false;
  if (field.type === 'number') return 0;
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
  return raw;
}
