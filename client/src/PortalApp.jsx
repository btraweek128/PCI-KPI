import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AppRoutes from './AppRoutes';
import AuthCallback from './pages/AuthCallback';
import { apiFetch } from './api/client';
import { portalLoginUrl } from './auth/portal';
import './components/Layout.css';

function PortalShell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const profile = await apiFetch('/api/me');
        setUser(profile);
      } catch (err) {
        setError(err.message);
        window.location.href = portalLoginUrl();
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // redirect anyway
    }
    window.location.href = portalLoginUrl();
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading PCI KPI Management...</p>
      </div>
    );
  }

  if (error || !user) {
    return null;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <AppRoutes user={user} token={null} />
    </Layout>
  );
}

export default function PortalApp() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/*" element={<PortalShell />} />
    </Routes>
  );
}
