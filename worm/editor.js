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
        return response.json();
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
    }
};

// ============================================================================
// Milkdown Editor Setup
// ============================================================================

class EditorManager {
    constructor() {
        this.editor = null;
        this.docId = null;
        this.index = { documents: [] };
        this.isDirty = false;
        this.saveTimeout = null;
    }

    async initialize() {
        // Get document ID from URL
        const params = new URLSearchParams(window.location.search);
        this.docId = params.get('id');

        if (!this.docId) {
            window.location.href = '/';
            return;
        }

        // Load index
        try {
            const index = await storage.fetchJSON('/index.json');
            this.index = index || { documents: [] };
        } catch (error) {
            console.error('Failed to load index:', error);
        }

        // Set title
        const doc = this.index.documents.find(d => d.id === this.docId);
        if (doc) {
            document.getElementById('docTitle').value = doc.title || '';
        }

        // Initialize Milkdown
        await this.initMilkdown();

        // Load document content
        await this.loadDocument();

        // Setup event listeners
        this.setupListeners();
    }

    async initMilkdown() {
        const { Editor, rootCtx, defaultValueCtx } = window.Milkdown;
        const { commonmark } = window.Milkdown.PresetCommonmark;
        const { history } = window.Milkdown.PluginHistory;
        const { listener, listenerCtx } = window.Milkdown.PluginListener;
        const { upload, uploadConfig } = window.Milkdown.PluginUpload;

        this.editor = await Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, document.getElementById('editor'));
                ctx.set(defaultValueCtx, '');
            })
            .use(commonmark)
            .use(history)
            .use(listener)
            .use(upload)
            .config((ctx) => {
                // Handle content changes
                ctx.get(listenerCtx).markdownUpdated(() => {
                    this.isDirty = true;
                    this.scheduleAutoSave();
                });

                // Configure image uploader
                ctx.update(uploadConfig.key, (prev) => ({
                    ...prev,
                    uploader: (files) => this.handleImageUpload(files)
                }));
            })
            .create();
    }

    async loadDocument() {
        try {
            const content = await storage.fetchJSON(`/documents/${this.docId}/content.md`);
            if (content) {
                // If stored as JSON with content property
                const markdown = typeof content === 'string' ? content : content.content || '';
                this.setEditorContent(markdown);
            }
        } catch (error) {
            console.log('No existing document, starting fresh');
        }
    }

    setEditorContent(markdown) {
        const { replaceAll } = window.Milkdown.Utils;
        this.editor.action(replaceAll(markdown));
        this.isDirty = false;
    }

    async getEditorContent() {
        const { getMarkdown } = window.Milkdown.Utils;
        return this.editor.action(getMarkdown());
    }

    async saveDocument() {
        try {
            const markdown = await this.getEditorContent();
            const title = document.getElementById('docTitle').value || 'Untitled';

            // Save markdown content
            await storage.saveFile(`/documents/${this.docId}/content.md`, markdown, true);

            // Update index
            let entry = this.index.documents.find(d => d.id === this.docId);
            if (!entry) {
                entry = {
                    id: this.docId,
                    created: Date.now(),
                    modified: Date.now(),
                    title: title,
                    preview: this.extractPreview(markdown)
                };
                this.index.documents.unshift(entry);
            } else {
                entry.title = title;
                entry.modified = Date.now();
                entry.preview = this.extractPreview(markdown);
            }

            await storage.saveJSON('/index.json', this.index);

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
        const path = `/documents/${this.docId}/images/${filename}`;

        try {
            await storage.uploadFile(path, file);
            return `images/${filename}`;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    extractPreview(markdown) {
        const lines = markdown.split('\n').filter(l => l.trim());
        let preview = '';

        for (const line of lines) {
            if (line.startsWith('#')) {
                preview = line.replace(/^#+\s/, '').trim();
                break;
            }
            if (line.trim()) {
                preview = line.trim();
                break;
            }
        }

        return preview.substring(0, 120);
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

        document.getElementById('docTitle').addEventListener('change', () => {
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
            // Remove from index
            const newIndex = {
                ...this.index,
                documents: this.index.documents.filter(d => d.id !== this.docId)
            };
            await storage.saveJSON('/index.json', newIndex);

            // Delete document folder
            await storage.delete(`/documents/${this.docId}`, true);

            // Redirect to home
            window.location.href = '/';
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
