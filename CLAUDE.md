# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fleaoffice** is a modern, web-based personal productivity suite built for [Fleabox](https://github.com/nicholasgasior/fleabox), a self-hosted application hub that serves static web apps and stores per-user data as JSON files on the filesystem.

The suite consists of four apps, each in its own directory:

| App | Directory | Status | Description |
|-----|-----------|--------|-------------|
| **Write** | `write/` | Implemented | Markdown document editor |
| **Agenda** | `agenda/` | Placeholder | Calendar and event scheduler |
| **List** | `list/` | Placeholder | Task and todo list manager |
| **Show** | `show/` | Placeholder | Presentations and slideshows |

Each app is an independent React + Vite project that builds to `dist/<appname>/` and is served by Fleabox at `/<appname>/`.

## Development Commands

### Root-Level Commands

Run from the repository root (`/workspaces/fleaoffice/`):

- **Build all apps**: `npm run build`
  - Builds each app then copies all `dist/<app>/` directories into the root `dist/`

- **Build and run Fleabox**: `npm run fleabox`
  - Builds all apps and starts Fleabox in dev mode (no auth)
  - All apps available at `http://localhost:3000/<appname>/`

- **Run tests**: `npm test`
  - Currently delegates to `write/` only (the only app with tests)

- **Lint all apps**: `npm run lint`

- **Clean all build artifacts**: `npm run clean`
  - Removes `dist/` in each app directory and the root `dist/`

### Per-App Commands

Each app supports the same set of scripts. Run from the app directory:

```bash
cd write   # or agenda, list, show
```

- **Build**: `npm run build`
  - TypeScript compile + Vite bundle
  - Output goes to `dist/<appname>/`

- **Development server (hot-reload)**: `npm run dev`
  - Starts Vite dev server
  - App available at `http://localhost:5173/<appname>/`
  - **Note**: Requires Fleabox running separately for API access (`write` only)
  - Proxies `/api` requests to Fleabox on port 3000 (`write` only)

- **Production-like mode**: `npm run fleabox`
  - Builds and starts Fleabox in dev mode (no auth)
  - App available at `http://localhost:3000/<appname>/`

- **Tests** (write only): `npm test`
  - Builds before running
  - Uses Playwright for end-to-end tests

- **Clean**: `npm run clean`
  - Removes `dist/`, `test-results/`, `playwright-report/`, `test-results.json`

## Write App Architecture

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

1. **DocumentList.tsx** — Loads and displays all markdown documents. Handles document creation (with duplicate validation) and deletion (optimistic UI with error rollback). Gracefully handles 404 responses (treats as empty directory).

2. **DocumentCard.tsx** — Displays individual document metadata. Links to editor route. Delete button with confirmation.

3. **Editor.tsx** — Extracts filename from route params, loads document content on mount. Handles title changes (triggers file rename) and save logic (content-only or rename). Uses `useAutoSave` for debounced auto-save (2 second delay). Handles delete with confirmation and navigation.

4. **MilkdownEditor.tsx** — Wraps Milkdown editor using `@milkdown/react`. Uses `useEditor` hook for editor lifecycle. Configured with nord theme and commonmark preset. Exposes `onContentChange` callback.

5. **SaveStatus.tsx** — Floating status message component. Auto-hides after 2 seconds on success; persistent on error.

### Shared Types

- **`src/Document.ts`** — `Document` interface: `{ filename, title, modified, size }`
- **`src/DirectoryEntry.ts`** — `DirectoryEntry` interface: `{ name, type, size, mtime }`

### Storage Architecture

Documents are stored as `.md` files in the root of the user's data directory (`~/.local/share/fleabox/write/data/` in production).

**Centralized Storage Hook** (`src/storage.ts`):

The `useStorage()` hook provides a memoized storage interface:

- `storage.fetchJSON(path)` — GET, returns parsed JSON or `null` on 404
- `storage.saveJSON(path, data)` — PUT with `application/json`
- `storage.saveFile(path, content, isText)` — PUT for text or binary content
- `storage.uploadFile(path, file)` — PUT for binary file uploads
- `storage.delete(path, recursive?)` — DELETE request
- `storage.listDirectory(path)` — GET returning `DirectoryEntry[]`

**Shared Utilities** (`src/filename.ts`):
- `sanitizeFilename(title)` — Converts title to valid filename, limits to 200 chars
- `filenameToTitle(filename)` — Strips `.md` extension

**Auto-Save Hook** (`src/autoSave.ts`):
- `useAutoSave(content, isDirty, onSave, delay)` — Debounced save
- Default 2-second delay; cleans up on unmount

### File Naming

- Titles are sanitized using `sanitizeFilename()`: replaces invalid filename characters, limits to 200 chars
- Documents are stored as `<sanitized-title>.md`
- Images are stored as `<timestamp>-<filename>` in the root directory alongside documents

## Fleabox API Integration

### Endpoints

All write app requests are prefixed with `/api/write/data`:

- **GET** `/api/write/data/<path>` — Read file or list directory (returns `DirectoryEntry[]` for directories)
- **PUT** `/api/write/data/<path>` — Write file (creates parent dirs automatically, 10MB max)
- **DELETE** `/api/write/data/<path>?recursive=true` — Delete file or directory

### Authentication

- In development mode (`--dev`): No authentication required
- In production: Automatic token-based authentication via cookies

## Build System

**Vite Configuration** (per-app `vite.config.ts`):
- Base path: `/<appname>/`
- Output directory: `dist/<appname>/`
- Uses `@vitejs/plugin-react`
- `write` only: dev server on port 5173, proxies `/api` to localhost:3000

**Playwright Configuration** (`write/playwright.config.js`):
- Runs tests sequentially (workers: 1)
- Starts Fleabox dev server automatically: `fleabox --dev --apps-dir dist`
- Base URL: `http://localhost:3000`
- Retries on CI (2 retries), 30s timeout per test

## Testing Strategy (Write App)

Tests are located in `write/tests/`:
- `documents.spec.js` — Document list page functionality
- `editor.spec.js` — Editor page functionality
- `api.spec.js` — Direct API interaction tests
- `fleabox-api.spec.js` — Low-level Fleabox file operations (CRUD, directory listing)

Tests use Playwright's request API to create/delete test documents directly via the Fleabox API.

## Important Implementation Notes

1. **Hash-based routing**: Uses `HashRouter` instead of `BrowserRouter`. URLs use `#/` prefix (e.g., `/write/#/editor/Doc.md`).

2. **Centralized storage**: The `useStorage()` hook provides a single storage abstraction. No code duplication across components.

3. **Auto-save**: Editor auto-saves after 2 seconds of inactivity. Manual save available via button or Ctrl+S.

4. **Title changes = Renames**: Changing a document's title saves to a new filename and deletes the old file.

5. **Images in root**: Uploaded images are stored alongside markdown files in the root data directory, not in a subfolder.

6. **No nested directories**: All documents and images are stored flat in the root directory.

7. **Optimistic UI**: Document deletion updates UI immediately before the API call, with error handling that reloads on failure.

8. **Milkdown React integration**: Uses official `@milkdown/react` with `useEditor` hook for editor lifecycle.

9. **404 handling**: `listDirectory` throws on 404 (non-existent directories); `fetchJSON` returns `null` on 404. Components handle both gracefully.

10. **Development workflow**: Use `npm run dev` for hot-reload development (requires Fleabox running separately), or `npm run fleabox` for production-like testing with API.
