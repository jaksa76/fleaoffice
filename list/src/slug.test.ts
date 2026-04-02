import { describe, it, expect } from 'vitest';
import { nameToSlug } from './slug';

describe('nameToSlug', () => {
  it('lowercases the name', () => {
    expect(nameToSlug('Book Library')).toBe('book-library');
  });

  it('replaces spaces with hyphens', () => {
    expect(nameToSlug('My Cool List')).toBe('my-cool-list');
  });

  it('replaces special characters with hyphens', () => {
    expect(nameToSlug('Budget 2024!')).toBe('budget-2024');
  });

  it('collapses multiple consecutive special chars into one hyphen', () => {
    expect(nameToSlug('hello   world')).toBe('hello-world');
    expect(nameToSlug('a--b')).toBe('a-b');
  });

  it('trims leading and trailing hyphens', () => {
    expect(nameToSlug('  hello  ')).toBe('hello');
    expect(nameToSlug('!hello!')).toBe('hello');
  });

  it('handles names with numbers', () => {
    expect(nameToSlug('Top 10 Movies')).toBe('top-10-movies');
  });

  it('handles already-slug-like names', () => {
    expect(nameToSlug('my-list')).toBe('my-list');
  });

  it('truncates to 100 characters', () => {
    const long = 'a'.repeat(150);
    expect(nameToSlug(long)).toHaveLength(100);
  });

  it('handles unicode by stripping non-ascii', () => {
    // Non-ascii chars become hyphens, which then get collapsed
    const result = nameToSlug('café');
    expect(result).toMatch(/^[a-z0-9-]+$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty string for all-special-char input', () => {
    expect(nameToSlug('!!!')).toBe('');
    expect(nameToSlug('   ')).toBe('');
  });
});
