# Write Requirements

## Overview

A markdown document editor with WYSIWYG editing capabilities. Write provides a clean, distraction-free environment for creating and managing markdown documents with real-time preview and auto-save functionality.

## Document Management

- **Document List** — primary view; displays all markdown documents with title, last modified date, and file size
- **Quick Create** — create new documents with title validation (no duplicates allowed)
- **Delete** — remove documents with confirmation dialog
- **Document Card** — shows metadata and provides quick access to editor

## Editor

- **WYSIWYG Markdown Editing** — powered by Milkdown with nord theme
- **Title Editing** — inline title input; changing title renames the underlying file
- **Content Editing** — full markdown support via commonmark preset
  - Headings (h1-h6)
  - Bold, italic, strikethrough
  - Links and blockquotes
  - Ordered and unordered lists
  - Code blocks (inline and fenced)
  - Horizontal rules

## File Operations

- **Auto-Save** — automatically saves content after 2 seconds of inactivity
- **Manual Save** — save button and keyboard shortcut (Ctrl+S / Cmd+S)
- **File Rename** — changing document title creates new file and deletes old one
- **Duplicate Detection** — prevents creating or renaming to existing filenames

## Navigation

- **Hash-Based Routing** — compatible with static file serving
  - Document list: `/write/` or `/write/#/`
  - Editor: `/write/#/editor/filename.md`
- **Back Navigation** — return to document list from editor

## Save Status

- **Visual Feedback** — floating status indicator shows save state
  - "Saved" message (auto-hides after 2 seconds)
  - "Save failed" message (persistent until dismissed)
- **Dirty State Tracking** — editor knows when content has unsaved changes

## Data Storage

- All documents stored via Fleabox API at `/api/write/data/`
- Files stored flat in the root directory (no subdirectories)
- Document format: `<sanitized-title>.md`
  - Filenames derived from titles using sanitization (invalid characters replaced, max 200 chars)
  - File extension always `.md`
- Metadata derived from file listing API:
  - `name` — filename
  - `size` — file size in bytes
  - `mtime` — last modified timestamp

## UI

- Mobile-first, responsive layout
- Consistent with the rest of the Fleaoffice suite (minimal, clean)
- Nord theme for editor (dark blue color scheme)
- Toolbar with icon buttons (back, save, delete)
- Inline title editing in editor view
- Document grid layout on list page
- Loading states for async operations