import { useState, useEffect, useRef } from 'react';
import { useStorage } from './storage';
import { Collection } from './Collection';
import { CollectionCard } from './CollectionCard';
import { nameToSlug } from './slug';

export function CollectionList() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletionInProgress, setDeletionInProgress] = useState(false);
  const [newName, setNewName] = useState<string | null>(null);
  const [newNameError, setNewNameError] = useState<string | null>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const storage = useStorage();

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    try {
      setLoading(true);
      setError(null);

      const entries = await storage.listDirectory('/');
      const dirs = entries.filter(e => e.type === 'dir');

      const loaded = await Promise.all(
        dirs.map(async dir => {
          const schema = await storage.fetchJSON(`/${dir.name}/schema.json`) as { name: string } | null;
          const items = await storage.fetchJSON(`/${dir.name}/items.json`) as unknown[] | null;
          return {
            slug: dir.name,
            name: schema?.name ?? dir.name,
            itemCount: Array.isArray(items) ? items.length : 0,
            modified: dir.mtime
          } satisfies Collection;
        })
      );

      loaded.sort((a, b) => b.modified - a.modified);
      setCollections(loaded);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }

  function openNewForm() {
    setNewName('');
    setNewNameError(null);
    requestAnimationFrame(() => newNameInputRef.current?.focus());
  }

  function closeNewForm() {
    setNewName(null);
    setNewNameError(null);
  }

  async function submitNewCollection() {
    const name = newName?.trim();
    if (!name) return;

    const slug = nameToSlug(name);
    if (!slug) {
      setNewNameError('Name must contain at least one letter or number.');
      return;
    }

    try {
      const entries = await storage.listDirectory('/');
      const exists = entries.some(e => e.name === slug);

      if (exists) {
        setNewNameError(`A collection named "${name}" already exists.`);
        return;
      }

      await storage.saveJSON(`/${slug}/schema.json`, { name, fields: [] });
      await storage.saveJSON(`/${slug}/items.json`, []);
      await loadCollections();
      closeNewForm();
    } catch (err) {
      console.error('Failed to create collection:', err);
      setNewNameError('Failed to create collection');
    }
  }

  async function deleteCollection(slug: string) {
    if (deletionInProgress) return;

    try {
      setDeletionInProgress(true);
      setCollections(cols => cols.filter(c => c.slug !== slug));
      await storage.delete(`/${slug}`, true);
    } catch (err) {
      console.error('Failed to delete collection:', err);
      await loadCollections();
      setError('Failed to delete collection');
    } finally {
      setDeletionInProgress(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="header"><h1>list</h1></div>
        <div className="document-list">
          <div className="loading">Loading collections...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="header"><h1>list</h1></div>
        <div className="document-list">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>list</h1>
        <button className="btn-icon" onClick={openNewForm} title="New collection">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      {newName !== null && (
        <div className="new-doc-form">
          <input
            ref={newNameInputRef}
            type="text"
            className="new-doc-input"
            placeholder="Collection name"
            autoComplete="off"
            value={newName}
            onChange={e => { setNewName(e.target.value); setNewNameError(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') submitNewCollection();
              if (e.key === 'Escape') closeNewForm();
            }}
          />
          {newNameError && <span className="form-error">{newNameError}</span>}
          <button className="btn-icon" onClick={closeNewForm} title="Cancel">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      <div className="document-list">
        {collections.length === 0 ? (
          <div className="empty-state">No collections yet. Create one to get started.</div>
        ) : (
          collections.map(col => (
            <CollectionCard
              key={col.slug}
              collection={col}
              onDelete={deleteCollection}
            />
          ))
        )}
      </div>
    </div>
  );
}
