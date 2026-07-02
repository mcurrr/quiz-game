import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Board from './pages/Board';
import Admin from './pages/Admin';
import Join from './pages/Join';
import Play from './pages/Play';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Board />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/join" element={<Join />} />
        <Route path="/play" element={<Play />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
