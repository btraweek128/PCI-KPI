import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import './Home.css';

export default function Home({ user, token }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const config = await apiFetch('/health/config', { token });
        setHealth(config);
      } catch {
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  return (
    <div className="home">
      <section className="hero">
        <p className="hero-eyebrow">Performance Cycle</p>
        <h1>Welcome, {user?.name?.split(' ')[0] || 'there'}</h1>
        <p className="hero-sub">
          PCI KPI Management — Variable Pay Workflow. Phase 1 auth shell is live.
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Signed in</h2>
          <dl className="profile-list">
            <div>
              <dt>Name</dt>
              <dd>{user?.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{user?.department || '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user?.isAdmin ? 'Administrator' : 'Employee'}</dd>
            </div>
          </dl>
        </article>

        <article className="card">
          <h2>System status</h2>
          {loading ? (
            <p className="muted">Checking API…</p>
          ) : health ? (
            <dl className="profile-list">
              <div>
                <dt>Portal auth</dt>
                <dd>{health.portalAuthConfigured ? 'Configured' : 'Not configured'}</dd>
              </div>
              <div>
                <dt>App ID</dt>
                <dd>{health.portalAppId}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{user?.dbConnected === false ? 'Disconnected' : 'Connected'}</dd>
              </div>
            </dl>
          ) : (
            <p className="muted">Could not reach API health endpoint.</p>
          )}
        </article>

        <article className="card card-accent">
          <h2>Phase 2</h2>
          <p>
            KPI worksheets, manager review, department roll-up, and executive approval
            screens will be built next. See <code>docs/PHASE2_REQUIREMENTS.md</code> in the repo.
          </p>
        </article>
      </section>
    </div>
  );
}
