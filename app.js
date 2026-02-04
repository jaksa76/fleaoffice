// ============================================================================
// Storage Interface - Abstracts Fleabox API
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
    }
};

// ============================================================================
// Document Manager
// ============================================================================

class DocumentManager {
    constructor() {
        this.index = { documents: [] };
    }

    async loadIndex() {
        const data = await storage.fetchJSON('/index.json');
        this.index = data || { documents: [] };
        return this.index;
    }

    async saveIndex() {
        await storage.saveJSON('/index.json', this.index);
    }

    createDocument() {
        const id = `doc-${Date.now()}`;
        return { id };
    }

    addToIndex(doc) {
        const entry = {
            id: doc.id,
            title: doc.title || 'Untitled',
            preview: doc.preview || '',
            created: Date.now(),
            modified: Date.now()
        };
        this.index.documents.unshift(entry);
    }

    async updateDocument(docId, title, markdown) {
        const entry = this.index.documents.find(d => d.id === docId);
        if (entry) {
            entry.title = title || 'Untitled';
            entry.modified = Date.now();
            entry.preview = this.extractPreview(markdown);
        }
        await this.saveIndex();
    }

    extractPreview(markdown) {
        // Extract first heading or first line as title preview
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
        
        // Limit to 120 characters
        return preview.substring(0, 120);
    }

    async deleteDocument(docId) {
        this.index.documents = this.index.documents.filter(d => d.id !== docId);
        await this.saveIndex();
        await storage.delete(`/documents/${docId}`, true);
    }

    getDocument(docId) {
        return this.index.documents.find(d => d.id === docId);
    }
}

// ============================================================================
// Application State & UI
// ============================================================================

const docManager = new DocumentManager();
let currentDocuments = [];

async function initializePage() {
    try {
        await docManager.loadIndex();
        currentDocuments = [...docManager.index.documents];
        renderDocumentList();
    } catch (error) {
        console.error('Failed to load documents:', error);
        showError('Failed to load documents');
    }

    document.getElementById('newDocBtn').addEventListener('click', createNewDocument);
}

function renderDocumentList() {
    const list = document.getElementById('documentList');
    
    if (currentDocuments.length === 0) {
        list.innerHTML = '<div class="empty-state">No documents yet. Create one to get started.</div>';
        return;
    }

    list.innerHTML = currentDocuments.map(doc => `
        <div class="document-card" data-id="${doc.id}">
            <a href="editor.html?id=${doc.id}" class="document-link">
                <h3>${escapeHtml(doc.title)}</h3>
                <p>${escapeHtml(doc.preview)}</p>
                <time>${new Date(doc.modified).toLocaleDateString()}</time>
            </a>
            <button class="btn-delete" data-id="${doc.id}" title="Delete">
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Add delete handlers
    list.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const docId = btn.dataset.id;
            if (confirm('Delete this document?')) {
                deleteDocument(docId);
            }
        });
    });
}

async function createNewDocument() {
    const doc = docManager.createDocument();
    docManager.addToIndex(doc);
    await docManager.saveIndex();
    window.location.href = `editor.html?id=${doc.id}`;
}

async function deleteDocument(docId) {
    try {
        await docManager.deleteDocument(docId);
        currentDocuments = currentDocuments.filter(d => d.id !== docId);
        renderDocumentList();
    } catch (error) {
        console.error('Failed to delete document:', error);
        showError('Failed to delete document');
    }
}

function showError(message) {
    const list = document.getElementById('documentList');
    list.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePage);
