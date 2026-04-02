import { Link } from 'react-router-dom';

export function CollectionView() {
  return (
    <div className="container">
      <div className="header">
        <Link to="/" className="btn-icon" title="Back">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1>list</h1>
      </div>
      <div className="empty-state">Collection view coming soon.</div>
    </div>
  );
}
