import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import './Home.css';

function formatMoney(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatStage(stage) {
  if (!stage) return '—';
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Home({ user, token }) {
  const [dashboard, setDashboard] = useState(null);
  const [libraryCount, setLibraryCount] = useState(null);
  const [pilotWorksheetId, setPilotWorksheetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const active = await apiFetch('/api/cycles/active', { token });
        if (active?.Id) {
          const dash = await apiFetch(`/api/cycles/${active.Id}/dashboard`, { token });
          setDashboard(dash);
        }
        const library = await apiFetch('/api/kpi-library', { token });
        setLibraryCount(library.length);
        const mine = await apiFetch('/api/worksheets/mine', { token }).catch(() => []);
        if (mine.length > 0) setPilotWorksheetId(mine[0].id);
        else {
          const any = await apiFetch('/api/worksheets/1', { token }).catch(() => null);
          if (any?.id) setPilotWorksheetId(any.id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  const cycle = dashboard?.cycle;
  const summary = dashboard?.summary;

  return (
    <div className="home">
      <section className="hero">
        <p className="hero-eyebrow">Performance Cycle</p>
        <h1>Welcome, {user?.name?.split(' ')[0] || 'there'}</h1>
        <p className="hero-sub">
          {cycle?.Name || 'PCI KPI Management'} — Variable Pay Workflow
        </p>
      </section>

      {loading && <p className="muted">Loading cycle data…</p>}
      {error && <p className="error-banner">{error}</p>}

      <section className="card-grid">
        <article className="card">
          <h2>Signed in</h2>
          <dl className="profile-list">
            <div><dt>Name</dt><dd>{user?.name}</dd></div>
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
            <div><dt>Department</dt><dd>{user?.department || '—'}</dd></div>
            <div><dt>Role</dt><dd>
              {[user?.isHrAdmin && 'HR Admin', user?.isExecutive && 'Executive', user?.isManager && 'Manager', !user?.isHrAdmin && !user?.isExecutive && !user?.isManager && 'Employee'].filter(Boolean).join(', ') || 'Employee'}
            </dd></div>
          </dl>
        </article>

        {cycle && (
          <article className="card card-accent">
            <h2>{cycle.Year} Cycle</h2>
            <dl className="profile-list">
              <div><dt>Stage</dt><dd>{formatStage(cycle.WorkflowStage)}</dd></div>
              <div><dt>Worksheets submitted</dt><dd>{summary?.submitted ?? 0} / {summary?.total_worksheets ?? 0}</dd></div>
              <div><dt>Avg KPI attainment</dt><dd>{summary?.avg_kpi_pct ?? '—'}%</dd></div>
              <div><dt>PCI multiplier</dt><dd>{dashboard?.pciMultiplier ? `${(dashboard.pciMultiplier * 100).toFixed(0)}%` : '—'}</dd></div>
              <div><dt>Projected payout</dt><dd>{formatMoney(summary?.projected_payout)}</dd></div>
            </dl>
          </article>
        )}

        <article className="card">
          <h2>KPI library</h2>
          <p className="muted">{libraryCount ?? '—'} company KPI templates available for manager selection.</p>
          <p className="muted">Measure types: Higher Is Better, Lower Is Better, Milestone by Date.</p>
        </article>

        {dashboard?.departments?.length > 0 && (
          <article className="card card-wide">
            <h2>Department roll-up (pilot)</h2>
            <div className="rollup-table-wrap">
              <table className="rollup-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Headcount</th>
                    <th>Submitted</th>
                    <th>Avg KPI %</th>
                    <th>Projected payout</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.departments.map((d) => (
                    <tr key={d.Code}>
                      <td>{d.Name}</td>
                      <td>{d.headcount}</td>
                      <td>{d.submitted}</td>
                      <td>{d.avg_kpi_pct ?? '—'}</td>
                      <td>{formatMoney(d.projected_payout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}

        {pilotWorksheetId && (
          <article className="card">
            <h2>Pilot worksheet</h2>
            <p className="muted">Sample worksheet (Form HR-KPI-01) loaded from pilot seed data.</p>
            <p><Link to={`/worksheet/${pilotWorksheetId}`}>View pilot worksheet →</Link></p>
          </article>
        )}
      </section>
    </div>
  );
}
