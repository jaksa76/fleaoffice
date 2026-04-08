import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStorage } from './storage';
import { Item } from './Item';
import { nameToSlug } from './slug';

interface Field {
  key: string;
  name: string;
  type: string;
}

interface Schema {
  name: string;
  fields: Field[];
}

export function ItemDetail() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const storage = useStorage();
  const [collectionName, setCollectionName] = useState<string>(slug ?? '');
  const [item, setItem] = useState<Item | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFieldForm, setNewFieldForm] = useState<{ name: string } | null>(null);
  const [addFieldError, setAddFieldError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ fieldKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const cancelEdit = useRef(false);
  const newFieldInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!slug || !id) return;
    try {
      setLoading(true);
      setError(null);
      const [schema, loaded] = await Promise.all([
        storage.fetchJSON(`/${slug}/schema.json`) as Promise<Schema | null>,
        storage.fetchJSON(`/${slug}/items.json`) as Promise<Item[] | null>,
      ]);
      if (schema) setCollectionName(schema.name);
      setFields(Array.isArray(schema?.fields) ? schema.fields as Field[] : []);
      const foundItem = Array.isArray(loaded) ? loaded.find(i => i.id === id) : null;
      if (!foundItem) {
        setError('Item not found');
        setItem(null);
      } else {
        setItem(foundItem);
      }
    } catch (err) {
      console.error('Failed to load item:', err);
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  }, [slug, id, storage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openNewFieldForm() {
    setNewFieldForm({ name: '' });
    setAddFieldError(null);
    requestAnimationFrame(() => newFieldInputRef.current?.focus());
  }

  async function submitNewField() {
    const name = newFieldForm?.name.trim();
    if (!name) return;

    const key = nameToSlug(name);
    if (fields.some(f => f.key === key)) {
      setAddFieldError('A field with this name already exists');
      return;
    }

    const newField: Field = { key, name, type: 'text' };
    const updatedFields = [...fields, newField];
    const defaultValue = '';

    try {
      await storage.saveJSON(`/${slug}/schema.json`, { name: collectionName, fields: updatedFields });
      const allItems = await storage.fetchJSON(`/${slug}/items.json`) as Item[] | null;
      const updatedItems = Array.isArray(allItems)
        ? allItems.map(i => ({ ...i, [newField.key]: defaultValue }))
        : [];
      await storage.saveJSON(`/${slug}/items.json`, updatedItems);

      setFields(updatedFields);
      if (item) {
        setItem({ ...item, [newField.key]: defaultValue });
      }
      setNewFieldForm(null);
      setAddFieldError(null);
    } catch (err) {
      console.error('Failed to add field:', err);
      setAddFieldError('Failed to add field');
    }
  }

  function startEdit(fieldKey: string, currentValue: unknown) {
    setEditingCell({ fieldKey });
    setEditValue(String(currentValue ?? ''));
    cancelEdit.current = false;
  }

  async function commitEdit(fieldKey: string) {
    if (cancelEdit.current) { cancelEdit.current = false; return; }
    setEditingCell(null);
    if (!item) return;

    const updatedItem = { ...item, [fieldKey]: editValue };
    setItem(updatedItem);

    try {
      const allItems = await storage.fetchJSON(`/${slug}/items.json`) as Item[] | null;
      const updatedItems = Array.isArray(allItems)
        ? allItems.map(i => i.id === item.id ? updatedItem : i)
        : [updatedItem];
      await storage.saveJSON(`/${slug}/items.json`, updatedItems);
    } catch (err) {
      console.error('Failed to save field value:', err);
      setItem(item);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!item) return <div className="empty-state">Item not found</div>;

  return (
    <div className="container">
      <div className="header">
        <Link to={`/collection/${slug}`} className="btn-icon btn-icon-left" title="Back">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1>{typeof item.name === 'string' ? item.name : 'Untitled'}</h1>
      </div>

      <div className="item-detail">
        {fields.map(f => {
          const isEditing = editingCell?.fieldKey === f.key;
          return (
            <div
              key={f.key}
              className={`item-field-row${isEditing ? '' : ' item-field-row-clickable'}`}
              onClick={isEditing ? undefined : () => startEdit(f.key, item[f.key])}
            >
              <span className="item-field-label">{f.name}</span>
              {isEditing ? (
                <input
                  type="text"
                  className="item-field-edit"
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(f.key)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.currentTarget.blur(); }
                    if (e.key === 'Escape') { cancelEdit.current = true; setEditingCell(null); }
                  }}
                />
              ) : (
                <span className="item-field-value">
                  {String(item[f.key] ?? '')}
                </span>
              )}
            </div>
          );
        })}
        {newFieldForm !== null ? (
          <div className="item-new-field-form">
            <input
              ref={newFieldInputRef}
              type="text"
              className="item-new-field-input"
              placeholder="Field name"
              autoComplete="off"
              value={newFieldForm.name}
              onChange={e => { setNewFieldForm({ name: e.target.value }); setAddFieldError(null); }}
              onKeyDown={e => {
                if (e.key === 'Enter') submitNewField();
                if (e.key === 'Escape') setNewFieldForm(null);
              }}
            />
            {addFieldError && <span className="form-error">{addFieldError}</span>}
            <button className="btn-icon btn-icon-small" onClick={() => setNewFieldForm(null)} title="Cancel">
              <svg className="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ) : (
          <button className="btn-add-field" onClick={openNewFieldForm} title="Add field">
            <svg className="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            add field
          </button>
        )}
      </div>
    </div>
  );
}
