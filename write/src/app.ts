// ============================================================================
// Storage Interface - Abstracts Fleabox API
// ============================================================================

interface DirectoryEntry {
    name: string;
    type: 'file' | 'directory';
    size: number;
    mtime: number;
}

const storage = {
    async fetchJSON(path: string): Promise<any> {
        const response = await fetch(`/api/write/data${path}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to fetch ${path}`);
        }
        return response.json();
    },

    async saveJSON(path: string, data: any): Promise<boolean> {
        const response = await fetch(`/api/write/data${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Failed to save ${path}`);
        // Fleabox PUT returns empty response, not JSON
        return true;
    },

    async delete(path: string, recursive = false): Promise<void> {
        const url = recursive ? `${path}?recursive=true` : path;
        const response = await fetch(`/api/write/data${url}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete ${path}`);
    },

    async saveFile(path: string, content: string | Blob, isText = false): Promise<void> {
        const response = await fetch(`/api/write/data${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': isText ? 'text/plain' : 'application/octet-stream' },
            body: content
        });
        if (!response.ok) throw new Error(`Failed to save file ${path}`);
    },

    async listDirectory(path: string): Promise<DirectoryEntry[]> {
        const response = await fetch(`/api/write/data${path}`);
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
function sanitizeFilename(title: string): string {
    // Remove or replace invalid filename characters
    return title
        .replace(/[/\\?%*:|"<>]/g, '-')  // Replace invalid chars with dash
        .replace(/\s+/g, ' ')             // Normalize whitespace
        .trim()
        .substring(0, 200) || 'Untitled'; // Limit length, default if empty
}

// Extract title from filename
function filenameToTitle(filename: string): string {
    return filename.replace(/\.md$/i, '');
}

// ============================================================================
// Document Manager
// ============================================================================

interface Document {
    filename: string;
    title: string;
    modified: number;
    size: number;
}

class DocumentManager {
    documents: Document[];

    constructor() {
        this.documents = [];
    }

    async loadDocuments(): Promise<Document[]> {
        // List all files in root data directory
        const entries = await storage.listDirectory('/');

        // Filter for .md files only
        const documents = entries
            .filter(entry => entry.type === 'file' && entry.name.endsWith('.md'))
            .map(entry => ({
                filename: entry.name,
                title: filenameToTitle(entry.name),
                modified: entry.mtime,
                size: entry.size
            }));

        // Sort by modification time (newest first)
        documents.sort((a, b) => b.modified - a.modified);

        this.documents = documents;
        return documents;
    }

    async checkDuplicateTitle(title: string): Promise<boolean> {
        const filename = sanitizeFilename(title) + '.md';
        const entries = await storage.listDirectory('/');
        return entries.some(e => e.name === filename);
    }

    async deleteDocument(filename: string): Promise<void> {
        await storage.delete(`/${filename}`);
    }
}

// ============================================================================
// Application State & UI
// ============================================================================

const docManager = new DocumentManager();
let currentDocuments: Document[] = [];
let deletionInProgress = false;

async function initializePage(): Promise<void> {
    try {
        await docManager.loadDocuments();
        currentDocuments = [...docManager.documents];
        renderDocumentList();
    } catch (error) {
        console.error('Failed to load documents:', error);
        showError('Failed to load documents');
    }

    document.getElementById('newDocBtn')!.addEventListener('click', createNewDocument);
}

function renderDocumentList(): void {
    const list = document.getElementById('documentList')!;

    if (currentDocuments.length === 0) {
        list.innerHTML = '<div class="empty-state">No documents yet. Create one to get started.</div>';
        return;
    }

    list.innerHTML = currentDocuments.map(doc => `
        <div class="document-card" data-filename="${escapeHtml(doc.filename)}">
            <a href="/write/editor.html?file=${encodeURIComponent(doc.filename)}" class="document-link">
                <h3>${escapeHtml(doc.title)}</h3>
                <time>${new Date(doc.modified * 1000).toLocaleDateString()}</time>
            </a>
            <button class="btn-delete" data-filename="${escapeHtml(doc.filename)}" title="Delete">
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Add delete handlers
    list.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const filename = (btn as HTMLElement).dataset.filename!;
            const title = filenameToTitle(filename);
            if (confirm(`Delete "${title}"?`)) {
                await deleteDocument(filename);
            }
        });
    });
}

async function createNewDocument(): Promise<void> {
    // Prompt for title
    const title = prompt('Document title:');
    if (!title) return; // User cancelled

    const filename = sanitizeFilename(title) + '.md';

    try {
        // Check for duplicates
        const exists = await docManager.checkDuplicateTitle(title);
        if (exists) {
            alert(`A document with the title "${title}" already exists. Please choose a different title.`);
            return createNewDocument(); // Ask again
        }

        // Create empty document in root
        await storage.saveFile(`/${filename}`, '', true);

        // Navigate to editor
        window.location.href = `/write/editor.html?file=${encodeURIComponent(filename)}`;
    } catch (error) {
        console.error('Failed to create document:', error);
        alert('Failed to create document');
    }
}

async function deleteDocument(filename: string): Promise<void> {
    // Prevent concurrent deletions to avoid race conditions
    if (deletionInProgress) {
        return;
    }

    try {
        deletionInProgress = true;

        // Optimistically update UI
        currentDocuments = currentDocuments.filter(d => d.filename !== filename);
        renderDocumentList();

        // Delete file
        await docManager.deleteDocument(filename);
    } catch (error) {
        console.error('Failed to delete document:', error);
        // Reload to show actual state
        await docManager.loadDocuments();
        currentDocuments = [...docManager.documents];
        renderDocumentList();
        showError('Failed to delete document');
    } finally {
        deletionInProgress = false;
    }
}

function showError(message: string): void {
    const list = document.getElementById('documentList')!;
    list.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePage);
