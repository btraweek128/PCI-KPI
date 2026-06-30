import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import AppRoutes from './AppRoutes';
import { apiFetch } from './api/client';
import { devAuthToken } from './auth/devConfig';
import './components/Layout.css';

export default function DevApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = devAuthToken;

  useEffect(() => {
    async function load() {
      try {
        const profile = await apiFetch('/api/me', { token });
        setUser(profile);
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading PCI KPI Management...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen config-error">
        <h2>Could not connect to API</h2>
        <p>{error}</p>
        <p className="hint">
          Check that the API is running and <code>DEV_BYPASS_AUTH=true</code> is set.
          <br />
          Local: <code>npm run dev:api</code>
        </p>
      </div>
    );
  }

  return (
    <Layout user={user} pocMode onLogout={() => window.location.reload()}>
      <AppRoutes user={user} token={token} />
    </Layout>
  );
}
