import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import WorksheetView from './pages/Worksheet';

export default function AppRoutes({ user, token }) {
  return (
    <Routes>
      <Route path="/" element={<Home user={user} token={token} />} />
      <Route path="/worksheet/:id" element={<WorksheetView token={token} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
