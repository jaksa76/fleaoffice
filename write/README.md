# Write

A React-based markdown document editor for Fleabox.

## Project Structure

```
write/
├── src/                      # React source files
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app with routing
│   ├── DocumentList.tsx     # Document list page
│   ├── DocumentCard.tsx     # Document card component
│   ├── Editor.tsx           # Document editor page
│   ├── MilkdownEditor.tsx   # Milkdown editor wrapper
│   ├── SaveStatus.tsx       # Save status indicator
│   ├── storage.ts           # Centralized storage API
│   ├── autoSave.ts          # Auto-save hook
│   ├── filename.ts          # Filename utilities
│   ├── Document.ts          # Document type
│   ├── DirectoryEntry.ts    # Directory entry type
│   └── style.css            # Application styles
├── tests/                   # Playwright tests
├── dist/                    # Build output (gitignored)
│   └── write/               # Fleabox app structure
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

## Development

### Setup
```bash
npm install
```

### Build
Builds the React app to `dist/write/` for Fleabox:
```bash
npm run build
```

### Development Server (with hot-reload)
Start Vite dev server with live hot-reload:
```bash
npm run dev
```

The app will be available at: `http://localhost:5173/write/`

**Note:** You need to run fleabox separately for API access:
```bash
# In another terminal
fleabox --dev --apps-dir dist
```

### Production Mode
Build and run through Fleabox (no hot-reload):
```bash
npm run fleabox
```

The app will be available at: `http://localhost:3000/write/`

### Testing
Run all tests (automatically builds first):
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests in debug mode:
```bash
npm run test:debug
```

Run tests with visible browser:
```bash
npm run test:headed
```

### Clean
Remove all build artifacts and test results:
```bash
npm run clean
```

## Features

- **React SPA** with hash-based routing
- **Markdown editor** using Milkdown with WYSIWYG editing
- **Document list** with creation, deletion, and metadata
- **Auto-save** functionality (2-second debounce)
- **Title editing** with automatic file renaming
- **Image upload** support
- **Optimistic UI** updates for better responsiveness
- **Centralized storage** API (no code duplication)
- **Hot-reload** development with Vite

## Architecture

### React Single-Page Application
- Uses `HashRouter` for client-side routing (compatible with static file servers)
- Component-based architecture with React hooks
- Centralized storage abstraction via `useStorage` hook
- Auto-save via `useAutoSave` custom hook

### Routes
- `/` - Document list page
- `/editor/:filename` - Editor page for specific document

### Storage
Documents are stored as `.md` files in the user's Fleabox data directory:
- Dev: `~/.local/share/fleabox/write/data/`
- All file operations go through the centralized `useStorage` hook
- Handles 404s gracefully for empty directories

## Technology

- **Framework**: React 19 with TypeScript
- **Routing**: React Router 7 (hash-based)
- **Editor**: Milkdown 7 with @milkdown/react
- **Build Tool**: Vite 7
- **Storage**: Fleabox API (REST endpoints)
- **Testing**: Playwright
- **Styling**: CSS (custom styles)
