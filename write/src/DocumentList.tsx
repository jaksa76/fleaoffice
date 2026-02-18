import { useState, useEffect, useRef } from 'react';
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
  const [newDocTitle, setNewDocTitle] = useState<string | null>(null);
  const [newDocError, setNewDocError] = useState<string | null>(null);
  const newDocInputRef = useRef<HTMLInputElement>(null);
  const storage = useStorage();
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      setError(null);

      // List all files in root data directory (returns [] on 404)
      const entries = await storage.listDirectory('/');

      // Filter for .md files only
      const docs = entries
        .filter(entry => entry.type === 'file' && entry.name.endsWith('.md'))
        .map(entry => ({
          filename: entry.name,
          title: filenameToTitle(entry.name),
          modified: entry.mtime,
          size: entry.size
        }));

      // Sort by modification time (newest first)
      docs.sort((a, b) => b.modified - a.modified);

      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  function openNewDocForm() {
    setNewDocTitle('');
    setNewDocError(null);
    // Focus the input on the next frame after it renders
    requestAnimationFrame(() => newDocInputRef.current?.focus());
  }

  function closeNewDocForm() {
    setNewDocTitle(null);
    setNewDocError(null);
  }

  async function submitNewDocument() {
    const title = newDocTitle?.trim();
    if (!title) return;

    const filename = sanitizeFilename(title) + '.md';

    try {
      const entries = await storage.listDirectory('/');
      const exists = entries.some(e => e.name === filename);

      if (exists) {
        setNewDocError(`A document named "${title}" already exists.`);
        return;
      }

      await storage.saveFile(`/${filename}`, '', true);
      navigate(`/editor/${encodeURIComponent(filename)}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      setNewDocError('Failed to create document');
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
          <h1>write</h1>
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
          <h1>write</h1>
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
        <h1>write</h1>
        <button className="btn-icon" onClick={openNewDocForm} title="New document">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      {newDocTitle !== null && (
        <div className="new-doc-form">
          <input
            ref={newDocInputRef}
            type="text"
            className="new-doc-input"
            placeholder="Document title"
            autoComplete="off"
            value={newDocTitle}
            onChange={e => { setNewDocTitle(e.target.value); setNewDocError(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') submitNewDocument();
              if (e.key === 'Escape') closeNewDocForm();
            }}
          />
          {newDocError && <span className="form-error">{newDocError}</span>}
          <button className="btn-icon" onClick={closeNewDocForm} title="Cancel">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

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
