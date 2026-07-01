import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AppRoutes from './AppRoutes';
import AuthCallback from './pages/AuthCallback';
import { apiFetch } from './api/client';
import { portalLoginUrl } from './auth/portal';
import { getSessionToken, clearSessionToken } from './auth/tokenStorage';
import './components/Layout.css';

function PortalShell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getSessionToken()) {
        window.location.href = portalLoginUrl();
        return;
      }
      try {
        const profile = await apiFetch('/api/me');
        setUser(profile);
      } catch {
        clearSessionToken();
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
    clearSessionToken();
    window.location.href = portalLoginUrl();
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading PCI KPI Management...</p>
      </div>
    );
  }

  if (!user) {
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
