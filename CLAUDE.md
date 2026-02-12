# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Worm** is a markdown document editor application built for Fleabox, a self-hosted application hub that serves static web apps and stores per-user data as JSON files on the filesystem.

The application code lives in the `write/` directory.

## Development Commands

All commands should be run from the `write/` directory:

```bash
cd write
```

### Building and Running

- **Build the application**: `npm run build`
  - Uses Vite to bundle the app
  - Output goes to `dist/worm/` (Fleabox app structure)

- **Run development server**: `npm run fleabox`
  - Builds and starts Fleabox in development mode (no auth required)
  - App available at `http://localhost:3000/worm/`

### Testing

- **Run all tests**: `npm test`
  - Automatically builds before running
  - Uses Playwright for end-to-end testing

- **Run tests with UI**: `npm run test:ui`
- **Debug mode**: `npm run test:debug`
- **Headed mode**: `npm run test:headed`

### Cleanup

- **Remove build artifacts**: `npm run clean`
  - Deletes dist/, test-results/, playwright-report/, and test-results.json

## Architecture

### Two-Page Application

1. **Document List (`src/index.html` + `src/app.js`)**
   - Shows all markdown documents
   - Create new documents
   - Delete existing documents
   - Each document card links to the editor

2. **Editor (`src/editor.html` + `src/editor.js`)**
   - Milkdown-based WYSIWYG markdown editor
   - Auto-save (2 second debounce)
   - Title editing (renames file)
   - Image upload support
   - Ctrl+S/Cmd+S manual save

### Storage Architecture

Documents are stored as `.md` files directly in the root of the user's data directory (`~/.local/share/fleabox/worm/data/` in production).

**Storage Interface**: Both `app.js` and `editor.js` include a `storage` object that abstracts the Fleabox API:

- `storage.fetchJSON(path)` - GET request for JSON
- `storage.saveJSON(path, data)` - PUT request for JSON
- `storage.saveFile(path, content, isText)` - PUT request for files
- `storage.uploadFile(path, file)` - PUT request for binary uploads
- `storage.delete(path, recursive)` - DELETE request
- `storage.listDirectory(path)` - GET request returning `[{name, type, size, mtime}, ...]`

**Important**: The storage abstraction is duplicated in both files. Changes to the API interface must be made in both `app.js` and `editor.js`.

### Document Management

**DocumentManager** (in `app.js`):
- `loadDocuments()` - Lists all `.md` files from root directory
- `checkDuplicateTitle(title)` - Validates unique titles before creation
- `deleteDocument(filename)` - Removes document file

**EditorManager** (in `editor.js`):
- `initialize()` - Sets up Milkdown editor with document content
- `saveDocument()` - Saves content and handles title changes (renames)
- `uploadImage(file)` - Uploads images to root directory
- `deleteDocument()` - Deletes current document and redirects to list

### File Naming

- Titles are sanitized using `sanitizeFilename()`: replaces invalid filename characters, limits to 200 chars
- Documents are stored as `<sanitized-title>.md`
- Images are stored as `<timestamp>-<filename>` in the root directory (alongside documents)

## Fleabox API Integration

### Endpoints

All requests are prefixed with `/api/worm/data`:

- **GET** `/api/worm/data/<path>` - Read file or list directory
- **PUT** `/api/worm/data/<path>` - Write file (creates parent dirs automatically, 10MB max)
- **DELETE** `/api/worm/data/<path>?recursive=true` - Delete file or directory

### Authentication

- In development mode (`--dev`): No authentication required
- In production: Automatic token-based authentication via cookies

## Build System

**Vite Configuration** (`vite.config.js`):
- Base path: `/worm/`
- Multi-page setup: `index.html` and `editor.html`
- Custom plugin moves HTML files from `dist/worm/src/` to `dist/worm/` and fixes asset paths

**Playwright Configuration** (`playwright.config.js`):
- Runs tests sequentially (workers: 1)
- Starts Fleabox dev server automatically: `fleabox --dev --apps-dir dist`
- Base URL: `http://localhost:3000`

## Testing Strategy

Tests are located in `tests/`:
- `documents.spec.js` - Document list page functionality
- `editor.spec.js` - Editor page functionality
- `api.spec.js` - Direct API interaction tests

Tests use Playwright's request API to create/delete test documents directly via the Fleabox API.

## Important Implementation Notes

1. **Duplicate storage code**: The `storage` object is duplicated in both `app.js` and `editor.js`. Keep them in sync when making changes.

2. **Auto-save**: Editor auto-saves after 2 seconds of inactivity. Manual save available via button or Ctrl+S.

3. **Title changes = Renames**: Changing a document's title in the editor saves to a new filename and deletes the old file.

4. **Images in root**: Uploaded images are stored in the root data directory alongside markdown files, not in a separate folder.

5. **No nested directories**: All documents and images are stored flat in the root directory.

6. **Optimistic UI updates**: Document deletion updates UI immediately before API call completes, with error handling that reloads on failure.
