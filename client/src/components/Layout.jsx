import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const NAV = [
  {
    to: '/',
    label: 'Cycle Dashboard',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    to: '/worksheet',
    label: 'KPI Worksheet',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="1" /><line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="9" x2="9" y2="21" />
      </svg>
    ),
  },
  {
    to: '/manager',
    label: 'Manager Review',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/rollup',
    label: 'Department Roll-up',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" />
      </svg>
    ),
  },
  {
    to: '/executive',
    label: 'Executive Approval',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
];

const STAGES = [
  { label: 'KPI Setting', done: true },
  { label: 'Employee Submission', done: true },
  { label: 'Manager Approval', done: true },
  { label: 'Department Roll-up', done: true },
  { label: 'Executive Approval', active: true },
  { label: 'Payout Lock', done: false },
];

const PAGE_TITLES = {
  '/':          ['Cycle Dashboard',       'FY2025 Annual KPI & Variable Pay'],
  '/worksheet': ['KPI Worksheet',         'Form HR-KPI-01'],
  '/manager':   ['Manager Review',        'Direct reports'],
  '/rollup':    ['Department Roll-up',    'FY2025'],
  '/executive': ['Executive Approval',    'CEO / CFO sign-off'],
};

export default function Layout({ children, user, pocMode = false, onLogout }) {
  const location = useLocation();

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const matchedKey = Object.keys(PAGE_TITLES)
    .filter((k) => k !== '/' && location.pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0] ?? '/';
  const [pageTitle, pageSub] = PAGE_TITLES[matchedKey] ?? ['KPI', ''];

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : (user?.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="layout">
      {pocMode && (
        <div className="dev-banner">
          Dev mode — using local auth token.
          {user?.dbConnected === false && <span> Database not connected — set DATABASE_URL.</span>}
        </div>
      )}

      <div className="layout-body">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="sidebar-logo-kpi">KPI</span>
            <span className="sidebar-logo-sub">Variable Pay Workflow</span>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Performance Cycle</div>
            <nav className="sidebar-nav">
              {NAV.map(({ to, label, icon }) => (
                <Link key={to} to={to} className={`sidebar-link${isActive(to) ? ' active' : ''}`}>
                  {icon}
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="sidebar-stages">
            <div className="sidebar-section-label">Workflow Stage</div>
            {STAGES.map((st, i) => (
              <div key={i} className="stage-row">
                <div className="stage-track">
                  <span className={`stage-dot${st.done ? ' done' : st.active ? ' active' : ''}`}>
                    {st.done ? '✓' : st.active ? '●' : '○'}
                  </span>
                  {i < STAGES.length - 1 && <span className={`stage-line${st.done ? ' done' : ''}`} />}
                </div>
                <span className={`stage-label${st.active ? ' active' : st.done ? ' done' : ''}`}>{st.label}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-footer">
            Variable Pay Program<br />
            <span>FY2025 · Reshape your tomorrow</span>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="layout-main">
          <header className="topbar">
            <div className="topbar-left">
              <h1 className="topbar-title">{pageTitle || 'Cycle Dashboard'}</h1>
              {pageSub && <span className="topbar-sub">{pageSub}</span>}
            </div>
            <div className="topbar-right">
              <div className="role-switcher">
                <span className="role-switcher-label">View as</span>
                <button className="role-btn active">Employee</button>
                <button className="role-btn">Manager</button>
                <button className="role-btn">Executive</button>
              </div>
              <div className="topbar-user">
                <div className="topbar-user-info">
                  <span className="topbar-user-name">{user?.name || user?.email}</span>
                  <span className="topbar-user-dept">{user?.department}</span>
                </div>
                <div className="topbar-avatar">{initials}</div>
              </div>
            </div>
          </header>

          <div className="main-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
