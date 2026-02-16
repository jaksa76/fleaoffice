import { Link } from 'react-router-dom';
import { Document } from './Document';
import { filenameToTitle } from './filename';

interface DocumentCardProps {
  document: Document;
  onDelete: (filename: string) => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const title = filenameToTitle(document.filename);
    if (confirm(`Delete "${title}"?`)) {
      onDelete(document.filename);
    }
  };

  return (
    <div className="document-card" data-filename={document.filename}>
      <Link to={`/editor/${encodeURIComponent(document.filename)}`} className="document-link">
        <h3>{document.title}</h3>
        <time>{new Date(document.modified * 1000).toLocaleDateString()}</time>
      </Link>
      <button className="btn-delete" onClick={handleDelete} title="Delete">
        <svg className="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  );
}
