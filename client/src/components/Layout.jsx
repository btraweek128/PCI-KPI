import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children, user, pocMode = false, onLogout }) {
  const location = useLocation();

  const handleLogout = () => {
    if (onLogout) onLogout();
    else window.location.reload();
  };

  return (
    <div className="layout">
      {pocMode && (
        <div className="dev-banner">
          Dev mode — using local auth token (no portal sign-in).
          {user?.dbConnected === false && (
            <span> Database not connected — set DATABASE_URL on the API.</span>
          )}
        </div>
      )}
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-kpi">KPI</span>
            <span className="logo-sub">Variable Pay Workflow</span>
          </Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          </nav>
          <div className="user-menu">
            <span className="user-name">{user?.name || user?.email}</span>
            {user?.department && <span className="user-dept">{user.department}</span>}
            <button type="button" className="btn-text" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
