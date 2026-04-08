import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStorage } from './storage';
import { Item, generateId } from './Item';

interface Field {
  key: string;
  name: string;
  type: string;
}

interface Schema {
  name: string;
  fields: Field[];
}

export function CollectionView() {
  const { slug } = useParams<{ slug: string }>();
  const storage = useStorage();
  const [collectionName, setCollectionName] = useState<string>(slug ?? '');
  const [items, setItems] = useState<Item[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const [schema, loaded] = await Promise.all([
        storage.fetchJSON(`/${slug}/schema.json`) as Promise<Schema | null>,
        storage.fetchJSON(`/${slug}/items.json`) as Promise<Item[] | null>,
      ]);
      if (schema) setCollectionName(schema.name);
      setFields(Array.isArray(schema?.fields) ? schema.fields as Field[] : []);
      setItems(Array.isArray(loaded) ? loaded : []);
    } catch (err) {
      console.error('Failed to load collection:', err);
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, [slug, storage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openNewItemForm() {
    setNewItemName('');
    setAddError(null);
    requestAnimationFrame(() => newItemInputRef.current?.focus());
  }

  function closeNewItemForm() {
    setNewItemName(null);
    setAddError(null);
  }

  async function submitNewItem() {
    const name = newItemName?.trim();
    if (!name) return;

    const defaults: Record<string, unknown> = {};
    for (const f of fields) {
      defaults[f.key] = f.type === 'checkbox' ? false : f.type === 'number' ? null : '';
    }
    const newItem: Item = { id: generateId(), name, ...defaults };
    const updatedItems = [...items, newItem];

    try {
      await storage.saveJSON(`/${slug}/items.json`, updatedItems);
      setItems(updatedItems);
      closeNewItemForm();
    } catch (err) {
      console.error('Failed to add item:', err);
      setAddError('Failed to add item');
    }
  }


  function renderItems() {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (items.length === 0) return <div className="empty-state">No items yet. Add one to get started.</div>;
    return items.map((item) => (
      <Link
        key={item.id}
        to={`/collection/${slug}/item/${item.id}`}
        className="item-row-link"
      >
        <div className="item-row">
          <span className="item-name">{typeof item.name === 'string' ? item.name : 'Untitled'}</span>
          {fields.slice(0, 2).map(f => (
            <span key={f.key} className="item-preview-value">
              {String(item[f.key] ?? '')}
            </span>
          ))}
        </div>
      </Link>
    ));
  }

  return (
    <div className="container">
      <div className="header">
        <Link to="/" className="btn-icon btn-icon-left" title="Back">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1>{collectionName}</h1>
        <button className="btn-icon" onClick={openNewItemForm} title="New item">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      {newItemName !== null && (
        <div className="new-doc-form">
          <input
            ref={newItemInputRef}
            type="text"
            className="new-doc-input"
            placeholder="Item name"
            autoComplete="off"
            value={newItemName}
            onChange={e => { setNewItemName(e.target.value); setAddError(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') submitNewItem();
              if (e.key === 'Escape') closeNewItemForm();
            }}
          />
          {addError && <span className="form-error">{addError}</span>}
          <button className="btn-icon" onClick={closeNewItemForm} title="Cancel">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      <div className="item-list">
        {renderItems()}
      </div>
    </div>
  );
}
