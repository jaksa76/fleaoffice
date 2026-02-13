# Write - Implementation Plan

## Overview
A lightweight Markdown-based document editor for Fleabox, similar to a notes app with basic formatting capabilities.

## Technologies

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - App logic (no framework needed for simplicity)
- **Milkdown** - WYSIWYG Markdown editor (built on ProseMirror)
- **@milkdown/core** - Core editor functionality
- **@milkdown/preset-commonmark** - CommonMark support (headings, bold, italic, lists)
- **@milkdown/plugin-history** - Undo/redo support
- **@milkdown/plugin-listener** - Content change listeners
- **@milkdown/plugin-upload** - Image upload handling

### Backend
- **Fleabox** - Storage and hosting platform
- **REST API** - Data operations (GET, PUT, DELETE)

### Data Format
- **Markdown (.md)** - Document content
- **JSON** - Document metadata and index
- **Images** - Stored alongside documents

## Architecture

### File Structure
```
/srv/fleabox/write/
├── index.html          # Main app page
├── editor.html         # Document editor page
├── style.css           # Application styles
├── app.js             # Main application logic
├── editor.js          # Editor-specific logic
├── package.json        # Dependencies (Milkdown packages)
└── node_modules/       # Installed packages (or use CDN)
```

### Data Structure
```
~/.local/share/fleabox/write/data/
├── index.json         # Document index/metadata
└── documents/
    ├── doc-1/
    │   ├── content.md
    │   └── images/
    │       └── image1.png
    ├── doc-2/
    │   ├── content.md
    │   └── images/
    └── ...
```

## Core Modules

### 1. Document Manager Module (`app.js`)
**Purpose**: Handle document listing and navigation

**Functions**:
- `loadDocumentIndex()` - Fetch index.json from Fleabox API
- `createDocument()` - Initialize new document structure
- `deleteDocument(id)` - Remove document folder
- `renderDocumentList()` - Display document previews on main page
- `extractPreview(markdown)` - Get title and first few lines

**API Calls**:
- `GET /api/write/data/index.json` - Load document list
- `PUT /api/write/data/index.json` - Update index
- `DELETE /api/write/data/documents/<doc-id>?recursive=true` - Delete document

### 2. Editor Module (`editor.js`)
**Purpose**: Handle document editing and saving

**Functions**:
- `initMilkdown()` - Initialize Milkdown editor with plugins
- `loadDocument(id)` - Fetch document content from Fleabox
- `saveDocument(id, content)` - Save document to Fleabox
- `uploadImage(file)` - Custom uploader for Milkdown upload plugin
- `updateMetadata(id, title, preview)` - Update document in index
- `getMarkdown()` - Extract markdown from Milkdown editor
- `setMarkdown(content)` - Load markdown into Milkdown editor

**Milkdown Setup**:
- Configure `rootCtx` to attach to DOM element
- Configure `defaultValueCtx` to set initial content
- Use `listenerCtx` for auto-save on content changes
- Configure `uploadConfig` with custom uploader function

**API Calls**:
- `GET /api/write/data/documents/<doc-id>/content.md` - Load document
- `PUT /api/write/data/documents/<doc-id>/content.md` - Save document
- `PUT /api/write/data/documents/<doc-id>/images/<filename>` - Upload images

### 3. Storage Interface
**Purpose**: Abstract Fleabox API calls

**Functions**:
- `fetchJSON(path)` - GET request wrapper
- `saveJSON(path, data)` - PUT request wrapper
- `deleteResource(path)` - DELETE request wrapper

## Data Models

### Document Index Entry
```json
{
  "id": "doc-1234567890",
  "title": "My Document",
  "preview": "First few lines of content...",
  "created": 1234567890,
  "modified": 1234567890
}
```

### Index File (index.json)
```json
{
  "documents": [
    { "id": "...", "title": "...", "preview": "...", ... },
    { "id": "...", "title": "...", "preview": "...", ... }
  ]
}
```

## Key Mechanisms

### 1. Document Indexing
- Maintain `index.json` with metadata for all documents
- Update index on create, save, and delete operations
- Use index for fast listing without loading all documents

### 2. Preview Generation
- Extract first heading as title (or use first line)
- Take first 100-150 characters for preview
- Strip Markdown syntax for clean preview text

### 3. Image Handling
- Store images in `documents/<doc-id>/images/` folder
- Milkdown's upload plugin handles drag-and-drop and paste
- Custom uploader function uploads to Fleabox and returns URL
- Update Markdown with relative paths: `![alt](images/filename.png)`
- Upload flow:
  1. User drops/pastes image → Milkdown triggers uploader
  2. Uploader saves to Fleabox API: `PUT /api/write/data/documents/<doc-id>/images/<filename>`
  3. Return relative path: `images/filename.png`
  4. Milkdown inserts image node into document

### 4. Auto-save (Optional Enhancement)
- Debounce save operations (e.g., 2 seconds after last edit)
- Show save status indicator

### 5. Document ID Generation
- Use timestamp-based IDs: `doc-${Date.now()}`
- Ensures uniqueness and chronological ordering

## User Flows

### Creating a Document
1. Click "New Document" on main page
2. Generate new document ID
3. Redirect to editor with empty document
4. First save creates document folder and adds to index

### Editing a Document
1. Click document card on main page
2. Load document content via API
3. Initialize Milkdown editor with content
4. Edit and save updates both content.md and index.json

### Deleting a Document
1. Click delete button on document card
2. Confirm deletion
3. Delete document folder recursively
4. Remove from index.json
