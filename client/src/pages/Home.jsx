import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import './Home.css';

function money(v) {
  if (v === null || v === undefined) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function pct(v, decimals = 0) {
  if (v === null || v === undefined) return '—';
  return `${Number(v).toFixed(decimals)}%`;
}

const STAGE_PROGRESS = [
  { label: 'KPI Setting',              pct: 100, done: true,   detail: 'Closed Jan 31' },
  { label: 'Employee Submission',       pct: 100, done: true,   detail: '233 / 233' },
  { label: 'Manager Approval',          pct: 97,  done: false,  detail: '187 / 193' },
  { label: 'Department Roll-up',        pct: 83,  done: false,  detail: '5 / 6 depts' },
  { label: 'Executive Approval',        pct: 50,  active: true, detail: 'In progress' },
  { label: 'Payout Lock',               pct: 0,   pending: true,detail: 'Mar 14' },
];

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
  const multiplier = dashboard?.pciMultiplier;

  const stats = [
    {
      label: 'Worksheets submitted',
      value: summary ? `${summary.submitted ?? 0}/${summary.total_worksheets ?? 0}` : '—',
      delta: summary?.submitted === summary?.total_worksheets ? '100% complete' : null,
      deltaGood: true,
    },
    {
      label: 'Avg KPI attainment',
      value: pct(summary?.avg_kpi_pct, 1),
      delta: 'Company target: 100%',
    },
    {
      label: 'PCI multiplier',
      value: multiplier ? pct(multiplier * 100, 0) : '—',
      delta: 'vs EBITDA target',
    },
    {
      label: 'Projected payout pool',
      value: money(summary?.projected_payout),
      delta: libraryCount ? `${libraryCount} KPIs in library` : null,
    },
  ];

  return (
    <div className="page-wrap">
      {error && <p className="error-banner">{error}</p>}

      {/* ── Hero banner ── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-hero-eyebrow">
            {cycle?.Name || 'FY2025 Annual KPI & Variable Pay Cycle'}
          </div>
          <div className="dash-hero-title">
            {loading ? 'Loading…' : cycle ? `${cycle.Year} Performance Cycle` : 'KPI Management'}
          </div>
          <div className="dash-hero-sub">Performance period · January 1 – December 31, 2025</div>
        </div>
        <div className="dash-hero-right">
          <div className="dash-hero-stat">
            <span className="dash-hero-num">
              {summary ? `${Math.round(((summary.submitted ?? 0) / Math.max(summary.total_worksheets ?? 1, 1)) * 100)}%` : '—'}
            </span>
            <span className="dash-hero-num-label">Worksheets submitted</span>
          </div>
          <div className="dash-hero-stat">
            <span className="dash-hero-num">{money(summary?.projected_payout)}</span>
            <span className="dash-hero-num-label">Projected payout pool</span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-grid" style={{ marginTop: 18 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.delta && (
              <div className="stat-note" style={s.deltaGood ? { color: '#16A34A' } : undefined}>
                {s.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main body grid ── */}
      <div className="dash-body" style={{ marginTop: 18 }}>
        {/* Cycle progress */}
        <div className="white-card">
          <div className="white-card-title">Cycle progress by stage</div>
          <div className="progress-list">
            {STAGE_PROGRESS.map((p) => (
              <div key={p.label} className="progress-row">
                <div className="progress-meta">
                  <span className="progress-label">
                    <span className={`progress-badge${p.done ? ' done' : p.active ? ' active' : p.pending ? ' pending' : ''}`}>
                      {p.done ? '✓' : p.active ? '▶' : '○'}
                    </span>
                    {p.label}
                  </span>
                  <span className="progress-detail">{p.detail}</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className={`progress-bar-fill${p.done ? ' done' : p.active ? ' active' : ''}`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="dash-right-col">
          {/* Action items */}
          <div className="white-card">
            <div className="white-card-title">Your action items</div>
            <div className="action-list">
              {pilotWorksheetId && (
                <Link to={`/worksheet/${pilotWorksheetId}`} className="action-item">
                  <span className="action-dot blue" />
                  <span>
                    <span className="action-title">View your KPI worksheet</span>
                    <span className="action-sub">Form HR-KPI-01 · FY2025</span>
                  </span>
                </Link>
              )}
              {user?.isManager && (
                <Link to="/manager" className="action-item">
                  <span className="action-dot amber" />
                  <span>
                    <span className="action-title">Review direct reports</span>
                    <span className="action-sub">Manager approval due Feb 14</span>
                  </span>
                </Link>
              )}
              {user?.isExecutive && (
                <Link to="/executive" className="action-item">
                  <span className="action-dot purple" />
                  <span>
                    <span className="action-title">Executive sign-off pending</span>
                    <span className="action-sub">Approve department roll-up</span>
                  </span>
                </Link>
              )}
              {!pilotWorksheetId && !user?.isManager && !user?.isExecutive && (
                <p className="muted" style={{ fontSize: 13 }}>No pending actions.</p>
              )}
            </div>
          </div>

          {/* Key dates */}
          <div className="white-card">
            <div className="white-card-title">Key dates · FY2025</div>
            <div className="dates-list">
              {[
                ['Jan 6',  'KPI Setting opens'],
                ['Jan 31', 'Employee submission due'],
                ['Feb 14', 'Manager approval due'],
                ['Feb 21', 'Roll-up & reporting'],
                ['Feb 28', 'Executive approval'],
                ['Mar 14', 'Payout finalized'],
              ].map(([date, label]) => (
                <div key={date} className="date-row">
                  <span className="date-chip">{date}</span>
                  <span className="date-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Department roll-up table ── */}
      {dashboard?.departments?.length > 0 && (
        <div className="white-card" style={{ marginTop: 18 }}>
          <div className="white-card-title">Department roll-up</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Headcount</th>
                  <th style={{ textAlign: 'center' }}>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Avg KPI %</th>
                  <th style={{ textAlign: 'right' }}>Projected Payout</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.departments.map((d) => (
                  <tr key={d.Code}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.Name}</td>
                    <td style={{ textAlign: 'center' }}>{d.headcount}</td>
                    <td style={{ textAlign: 'center' }}>{d.submitted}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{pct(d.avg_kpi_pct, 1)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--blue-900)' }}>{money(d.projected_payout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
