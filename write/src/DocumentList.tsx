import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorage } from './storage';
import { Document } from './Document';
import { DocumentCard } from './DocumentCard';
import { sanitizeFilename, filenameToTitle } from './filename';

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletionInProgress, setDeletionInProgress] = useState(false);
  const storage = useStorage();
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      setError(null);

      // List all files in root data directory
      const response = await fetch('/api/write/data/');
      
      // If directory doesn't exist (404), treat as empty
      if (response.status === 404) {
        setDocuments([]);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const entries = await response.json();

      // Filter for .md files only
      const docs = entries
        .filter((entry: any) => entry.type === 'file' && entry.name.endsWith('.md'))
        .map((entry: any) => ({
          filename: entry.name,
          title: filenameToTitle(entry.name),
          modified: entry.mtime,
          size: entry.size
        }));

      // Sort by modification time (newest first)
      docs.sort((a: Document, b: Document) => b.modified - a.modified);

      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function createNewDocument() {
    // Prompt for title
    const title = prompt('Document title:');
    if (!title) return; // User cancelled

    const filename = sanitizeFilename(title) + '.md';

    try {
      // Check for duplicates
      const response = await fetch('/api/write/data/');
      
      // If directory doesn't exist, no duplicates possible
      let exists = false;
      if (response.ok) {
        const entries = await response.json();
        exists = entries.some((e: any) => e.name === filename);
      }

      if (exists) {
        alert(`A document with the title "${title}" already exists. Please choose a different title.`);
        return createNewDocument(); // Ask again
      }

      // Create empty document in root directory
      await storage.saveFile(`/${filename}`, '', true);

      // Navigate to editor
      navigate(`/editor/${encodeURIComponent(filename)}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      alert('Failed to create document');
    }
  }

  async function deleteDocument(filename: string) {
    // Prevent concurrent deletions to avoid race conditions
    if (deletionInProgress) {
      return;
    }

    try {
      setDeletionInProgress(true);

      // Optimistically update UI
      setDocuments(docs => docs.filter(d => d.filename !== filename));

      // Delete file from root directory
      await storage.delete(`/${filename}`);
    } catch (err) {
      console.error('Failed to delete document:', err);
      // Reload to show actual state
      await loadDocuments();
      setError('Failed to delete document');
    } finally {
      setDeletionInProgress(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>Write</h1>
        </div>
        <div className="document-list">
          <div className="loading">Loading documents...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="header">
          <h1>Write</h1>
        </div>
        <div className="document-list">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Write</h1>
        <button className="btn-icon" onClick={createNewDocument} title="New document">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      <div className="document-list">
        {documents.length === 0 ? (
          <div className="empty-state">No documents yet. Create one to get started.</div>
        ) : (
          documents.map(doc => (
            <DocumentCard
              key={doc.filename}
              document={doc}
              onDelete={deleteDocument}
            />
          ))
        )}
      </div>
    </div>
  );
}
