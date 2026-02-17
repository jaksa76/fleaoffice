import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStorage } from './storage';
import { useAutoSave } from './autoSave';
import { MilkdownEditor } from './MilkdownEditor';
import { SaveStatus } from './SaveStatus';
import { sanitizeFilename, filenameToTitle } from './filename';

export function Editor() {
  const { filename } = useParams<{ filename: string }>();
  const navigate = useNavigate();
  const storage = useStorage();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; isError: boolean }>({
    message: '',
    isError: false
  });
  const [loading, setLoading] = useState(true);

  const loadDocument = useCallback(async () => {
    if (!filename) return;

    try {
      setLoading(true);

      // Extract title from filename
      const docTitle = filenameToTitle(filename);
      setTitle(docTitle);

      // Load document content from root directory
      const text = await storage.fetchFile(`/${filename}`);
      setContent(text ?? '');
      setInitialContent(text ?? '');
    } catch (err) {
      console.error('Failed to load document:', err);
      setContent('');
      setInitialContent('');
    } finally {
      setLoading(false);
    }
  }, [filename, storage]);

  // Load document on mount
  useEffect(() => {
    if (!filename) {
      alert('No document specified');
      navigate('/');
      return;
    }

    loadDocument();
  }, [filename, navigate, loadDocument]);

  const handleContentChange = useCallback((markdown: string) => {
    setContent(markdown);
    setIsDirty(true);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const saveDocument = useCallback(async () => {
    if (!filename) return;

    try {
      const newTitle = title || 'Untitled';
      const newFilename = sanitizeFilename(newTitle) + '.md';

      // Check if title changed (rename needed)
      if (newFilename !== filename) {
        // Check for duplicates in root directory
        const entries = await storage.listDirectory('/');
        const exists = entries.some(e => e.name === newFilename);

        if (exists) {
          setSaveStatus({ message: 'Title already exists', isError: true });
          return;
        }

        // Rename: save to new filename, delete old (in root directory)
        await storage.saveFile(`/${newFilename}`, content, true);
        await storage.delete(`/${filename}`);

        // Update URL and navigate to new filename
        navigate(`/editor/${encodeURIComponent(newFilename)}`, { replace: true });
      } else {
        // Just save content (in root directory)
        await storage.saveFile(`/${filename}`, content, true);
      }

      setIsDirty(false);
      setSaveStatus({ message: 'Saved', isError: false });
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus({ message: 'Save failed', isError: true });
    }
  }, [filename, title, content, storage, navigate]);

  const handleDelete = async () => {
    if (!filename) return;

    if (confirm('Delete this document?')) {
      try {
        await storage.delete(`/${filename}`);
        navigate('/');
      } catch (err) {
        console.error('Delete failed:', err);
        setSaveStatus({ message: 'Delete failed', isError: true });
      }
    }
  };

  // Auto-save
  useAutoSave(content, isDirty, saveDocument, 2000);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveDocument]);

  if (loading) {
    return (
      <div className="editor-container">
        <div className="editor-toolbar">
          <Link to="/" className="btn-icon" title="Back to documents">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
        </div>
        <div className="editor">Loading document...</div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <Link to="/" className="btn-icon" title="Back to documents">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>

        <input
          type="text"
          className="doc-title"
          placeholder="Document title"
          autoComplete="off"
          value={title}
          onChange={handleTitleChange}
        />

        <div className="spacer"></div>

        <button className="btn-icon save-btn" onClick={saveDocument} title="Save document">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
        </button>

        <button className="btn-icon delete-btn" onClick={handleDelete} title="Delete document">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>

      <MilkdownEditor
        initialContent={initialContent}
        onContentChange={handleContentChange}
      />

      <SaveStatus message={saveStatus.message} isError={saveStatus.isError} />
    </div>
  );
}
