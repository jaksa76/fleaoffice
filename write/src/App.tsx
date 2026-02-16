import { HashRouter, Routes, Route } from 'react-router-dom';
import { DocumentList } from './DocumentList';
import { Editor } from './Editor';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DocumentList />} />
        <Route path="/editor/:filename" element={<Editor />} />
      </Routes>
    </HashRouter>
  );
}
