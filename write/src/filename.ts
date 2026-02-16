// Convert title to valid filename
export function sanitizeFilename(title: string): string {
  // Remove or replace invalid filename characters
  return title
    .replace(/[/\\?%*:|"<>]/g, '-')  // Replace invalid chars with dash
    .replace(/\s+/g, ' ')             // Normalize whitespace
    .trim()
    .substring(0, 200) || 'Untitled'; // Limit length, default if empty
}

// Extract title from filename
export function filenameToTitle(filename: string): string {
  return filename.replace(/\.md$/i, '');
}
