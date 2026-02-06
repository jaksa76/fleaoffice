// ============================================================================
// Imports
// ============================================================================

import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { nord } from '@milkdown/theme-nord';

// ============================================================================
// Storage Interface (shared with app.js)
// ============================================================================

const storage = {
    async fetchJSON(path) {
        const response = await fetch(`/api/worm/data${path}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to fetch ${path}`);
        }
        return response.json();
    },

    async saveJSON(path, data) {
        const response = await fetch(`/api/worm/data${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Failed to save ${path}`);
        // Fleabox PUT returns empty response, not JSON
        return true;
    },

    async delete(path, recursive = false) {
        const url = recursive ? `${path}?recursive=true` : path;
        const response = await fetch(`/api/worm/data${url}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete ${path}`);
    },

    async saveFile(path, content, isText = false) {
        const response = await fetch(`/api/worm/data${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': isText ? 'text/plain' : 'application/octet-stream' },
            body: content
        });
        if (!response.ok) throw new Error(`Failed to save file ${path}`);
    },

    async uploadFile(path, file) {
        const response = await fetch(`/api/worm/data${path}`, {
            method: 'PUT',
            body: file
        });
        if (!response.ok) throw new Error(`Failed to upload file ${path}`);
    },

    async listDirectory(path) {
        const response = await fetch(`/api/worm/data${path}`);
        if (!response.ok) throw new Error(`Failed to list ${path}`);
        const entries = await response.json();
        // Returns: [{ name: "file.json", type: "file", size: 1234, mtime: 1234567890 }, ...]
        return entries;
    }
};

// ============================================================================
// Utility Functions
// ============================================================================

// Convert title to valid filename
function sanitizeFilename(title) {
    // Remove or replace invalid filename characters
    return title
        .replace(/[/\\?%*:|"<>]/g, '-')  // Replace invalid chars with dash
        .replace(/\s+/g, ' ')             // Normalize whitespace
        .trim()
        .substring(0, 200) || 'Untitled'; // Limit length, default if empty
}

// Extract title from filename
function filenameToTitle(filename) {
    return filename.replace(/\.md$/i, '');
}

// ============================================================================
// Milkdown Editor Setup
// ============================================================================

class EditorManager {
    constructor() {
        this.editor = null;
        this.filename = null;
        this.isDirty = false;
        this.saveTimeout = null;
    }

    async initialize() {
        // Get filename from URL (not ID anymore!)
        const params = new URLSearchParams(window.location.search);
        this.filename = params.get('file');

        if (!this.filename) {
            alert('No document specified');
            window.location.href = '/worm/';
            return;
        }

        // Extract title from filename
        const title = filenameToTitle(this.filename);
        document.getElementById('docTitle').value = title;

        // Load document content
        const initialContent = await this.loadDocumentContent();

        // Initialize Milkdown with content
        await this.initMilkdown(initialContent);

        // Setup event listeners
        this.setupListeners();
    }

    async initMilkdown(initialContent = '') {
        this.currentMarkdown = initialContent;
        
        const editor = await Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, document.getElementById('editor'));
                ctx.set(defaultValueCtx, initialContent);
            })
            .config(nord)
            .use(commonmark)
            .use(listener)
            .use((ctx) => {
                const listener = ctx.get(listenerCtx);
                listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
                    this.currentMarkdown = markdown;
                    this.isDirty = true;
                    this.scheduleAutoSave();
                });
            })
            .create();
        
        this.editor = editor;
        this.editorViewCtx = editorViewCtx;
    }

    async loadDocumentContent() {
        try {
            const response = await fetch(`/api/worm/data/${encodeURIComponent(this.filename)}`);
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            console.log('Failed to load document');
        }
        return '';
    }

    async getEditorContent() {
        return this.currentMarkdown || '';
    }

    async saveDocument() {
        try {
            const markdown = await this.getEditorContent();
            const newTitle = document.getElementById('docTitle').value || 'Untitled';
            const newFilename = sanitizeFilename(newTitle) + '.md';

            // Check if title changed (rename needed)
            if (newFilename !== this.filename) {
                // Check for duplicates
                const entries = await storage.listDirectory('/');
                const exists = entries.some(e => e.name === newFilename);

                if (exists && newFilename !== this.filename) {
                    this.showSaveStatus('Title already exists', true);
                    return;
                }

                // Rename: save to new filename, delete old
                await storage.saveFile(`/${newFilename}`, markdown, true);
                await storage.delete(`/${this.filename}`);

                // Update state and URL
                this.filename = newFilename;
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('file', newFilename);
                window.history.replaceState({}, '', newUrl);
            } else {
                // Just save content
                await storage.saveFile(`/${this.filename}`, markdown, true);
            }

            this.isDirty = false;
            this.showSaveStatus('Saved');
        } catch (error) {
            console.error('Save failed:', error);
            this.showSaveStatus('Save failed', true);
        }
    }

    scheduleAutoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            if (this.isDirty) {
                this.saveDocument();
            }
        }, 2000);
    }

    async handleImageUpload(files) {
        const { schema } = this.editor.ctx.get(window.Milkdown.editorViewCtx)?.state || {};
        if (!schema) return [];

        const nodes = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.includes('image')) continue;

            try {
                const url = await this.uploadImage(file);
                const imageNode = schema.nodes.image.createAndFill({
                    src: url,
                    alt: file.name
                });
                if (imageNode) nodes.push(imageNode);
            } catch (error) {
                console.error('Failed to upload image:', error);
            }
        }

        return nodes;
    }

    async uploadImage(file) {
        const filename = `${Date.now()}-${file.name}`;
        const path = `/${filename}`;  // Save to root with documents

        try {
            await storage.uploadFile(path, file);
            // Return path for markdown
            return `/api/worm/data/${filename}`;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    showSaveStatus(message, isError = false) {
        const statusEl = document.getElementById('saveStatus');
        statusEl.textContent = message;
        statusEl.className = `save-status ${isError ? 'error' : 'success'}`;

        if (!isError) {
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'save-status';
            }, 2000);
        }
    }

    setupListeners() {
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveDocument();
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            if (confirm('Delete this document?')) {
                this.deleteDocument();
            }
        });

        document.getElementById('docTitle').addEventListener('input', () => {
            this.isDirty = true;
            this.scheduleAutoSave();
        });

        // Save on Ctrl+S
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveDocument();
            }
        });
    }

    async deleteDocument() {
        try {
            // Delete the file from root
            await storage.delete(`/${this.filename}`);

            // Redirect to home
            window.location.href = '/worm/';
        } catch (error) {
            console.error('Delete failed:', error);
            this.showSaveStatus('Delete failed', true);
        }
    }
}

// ============================================================================
// Initialize
// ============================================================================

const editorManager = new EditorManager();

document.addEventListener('DOMContentLoaded', () => {
    editorManager.initialize();
});
