import { HashRouter, Routes, Route } from 'react-router-dom';
import { CollectionList } from './CollectionList';
import { CollectionView } from './CollectionView';
import { ItemDetail } from './ItemDetail';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CollectionList />} />
        <Route path="/collection/:slug" element={<CollectionView />} />
        <Route path="/collection/:slug/item/:id" element={<ItemDetail />} />
      </Routes>
    </HashRouter>
  );
}
