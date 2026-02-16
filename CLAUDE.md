# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Write** is a markdown document editor application built for Fleabox, a self-hosted application hub that serves static web apps and stores per-user data as JSON files on the filesystem.

The application code lives in the `write/` directory.

## Development Commands

All commands should be run from the `write/` directory:

```bash
cd write
```

### Building and Running

- **Build the application**: `npm run build`
  - Uses Vite to bundle the app
  - Output goes to `dist/write/` (Fleabox app structure)

- **Development server (with hot-reload)**: `npm run dev`
  - Starts Vite dev server with hot module replacement
  - App available at `http://localhost:5173/write/`
  - **Note**: Requires fleabox running separately for API access
  - Proxies `/api` requests to fleabox on port 3000

- **Production mode**: `npm run fleabox`
  - Builds and starts Fleabox in development mode (no auth required)
  - App available at `http://localhost:3000/write/`
  - No hot-reload, but includes API server

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

### React Single-Page Application

The app is built with React and uses hash-based routing for compatibility with Fleabox's static file serving.

**Component Structure:**
```
App (main.tsx)
├── MilkdownProvider (@milkdown/react)
└── HashRouter (react-router-dom)
    ├── Route "/" → DocumentList
    │   ├── Header with "Write" title
    │   ├── New document button
    │   └── Document grid
    │       └── DocumentCard (for each document)
    │           ├── Title and metadata
    │           └── Delete button (optimistic UI)
    │
    └── Route "/editor/:filename" → Editor
        ├── EditorToolbar
        │   ├── Back button (Link to "/")
        │   ├── Title input (triggers rename)
        │   ├── Save button
        │   └── Delete button
        ├── MilkdownEditor component
        └── SaveStatus (floating status messages)
```

**Routing:**
- Document list: `/write/` or `/write/#/`
- Editor: `/write/#/editor/filename.md`
- Uses `HashRouter` for compatibility with static file servers (no server-side routing needed)

**Key Components:**

1. **DocumentList.tsx**
   - Loads and displays all markdown documents
   - Handles document creation (with duplicate validation)
   - Handles document deletion (optimistic UI with error rollback)
   - Gracefully handles 404 responses (treats as empty directory)

2. **DocumentCard.tsx**
   - Displays individual document metadata
   - Links to editor route
   - Delete button with confirmation

3. **Editor.tsx**
   - Extracts filename from route params
   - Loads document content on mount
   - Handles title changes (triggers file rename)
   - Implements save logic (content-only or rename)
   - Uses `useAutoSave` hook for debounced auto-save (2 second delay)
   - Handles delete with confirmation and navigation
   - Gracefully handles 404 responses during duplicate checks

4. **MilkdownEditor.tsx**
   - Wraps Milkdown editor using `@milkdown/react`
   - Uses `useEditor` hook for editor lifecycle
   - Configured with nord theme and commonmark preset
   - Exposes `onContentChange` callback for content updates

5. **SaveStatus.tsx**
   - Floating status message component
   - Auto-hides after 2 seconds on success
   - Persistent on error

### Storage Architecture

Documents are stored as `.md` files directly in the root of the user's data directory (`~/.local/share/fleabox/write/data/` in production).

**Centralized Storage Hook** (`src/storage.ts`):

The `useStorage()` hook provides a memoized storage interface:

- `storage.fetchJSON(path)` - GET request for JSON
- `storage.saveJSON(path, data)` - PUT request for JSON
- `storage.saveFile(path, content, isText)` - PUT request for files
- `storage.uploadFile(path, file)` - PUT request for binary uploads
- `storage.delete(path, recursive)` - DELETE request
- `storage.listDirectory(path)` - GET request returning `[{name, type, size, mtime}, ...]`

**Shared Utilities** (`src/filename.ts`):
- `sanitizeFilename(title)` - Converts title to valid filename
- `filenameToTitle(filename)` - Strips .md extension

**Auto-Save Hook** (`src/autoSave.ts`):
- `useAutoSave(content, isDirty, onSave, delay)` - Debounced save functionality
- Default 2-second delay
- Automatically cleans up on unmount

### File Naming

- Titles are sanitized using `sanitizeFilename()`: replaces invalid filename characters, limits to 200 chars
- Documents are stored as `<sanitized-title>.md`
- Images are stored as `<timestamp>-<filename>` in the root directory (alongside documents)

## Fleabox API Integration

### Endpoints

All requests are prefixed with `/api/write/data`:

- **GET** `/api/write/data/<path>` - Read file or list directory
- **PUT** `/api/write/data/<path>` - Write file (creates parent dirs automatically, 10MB max)
- **DELETE** `/api/write/data/<path>?recursive=true` - Delete file or directory

### Authentication

- In development mode (`--dev`): No authentication required
- In production: Automatic token-based authentication via cookies

## Build System

**Vite Configuration** (`vite.config.ts`):
- Base path: `/write/`
- Single-page React app configuration
- Uses `@vitejs/plugin-react` for React support
- Output directory: `dist/write/`
- Dev server on port 5173 with API proxy to port 3000
- Proxies `/api` requests to fleabox for development

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

1. **Hash-based routing**: Uses `HashRouter` instead of `BrowserRouter` for compatibility with static file servers. URLs use `#/` prefix (e.g., `/write/#/editor/Doc.md`).

2. **Centralized storage**: The `useStorage()` hook provides a single storage abstraction. No code duplication across components.

3. **Auto-save**: Editor auto-saves after 2 seconds of inactivity. Manual save available via button or Ctrl+S.

4. **Title changes = Renames**: Changing a document's title in the editor saves to a new filename and deletes the old file.

5. **Images in root**: Uploaded images are stored in the root data directory alongside markdown files, not in a separate folder.

6. **No nested directories**: All documents and images are stored flat in the root directory.

7. **Optimistic UI updates**: Document deletion updates UI immediately before API call completes, with error handling that reloads on failure.

8. **Milkdown React integration**: Uses official `@milkdown/react` package with `useEditor` hook for editor lifecycle management.

9. **404 handling**: Components gracefully handle 404 responses from the API (empty directories) by treating them as empty arrays rather than errors.

10. **Development workflow**: Use `npm run dev` for hot-reload development (requires fleabox running separately), or `npm run fleabox` for production-like testing.
