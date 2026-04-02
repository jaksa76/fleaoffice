import { Link } from 'react-router-dom';
import { Collection } from './Collection';

interface CollectionCardProps {
  collection: Collection;
  onDelete: (slug: string) => void;
}

export function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete "${collection.name}"?`)) {
      onDelete(collection.slug);
    }
  };

  return (
    <div className="document-card" data-slug={collection.slug}>
      <Link to={`/collection/${encodeURIComponent(collection.slug)}`} className="document-link">
        <h3>{collection.name}</h3>
        <span className="item-count">{collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}</span>
        <time>{new Date(collection.modified * 1000).toLocaleDateString()}</time>
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
