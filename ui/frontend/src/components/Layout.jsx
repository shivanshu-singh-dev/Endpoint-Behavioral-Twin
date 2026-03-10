import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/runs', label: 'Runs', icon: '🧪' },
]

export default function Layout({ user, canTuneRules, sidebarCollapsed, onToggleSidebar, onLogout, children }) {
  const location = useLocation()

  return (
    <div className={`shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">🛡️</div>
          {!sidebarCollapsed && (
            <div>
              <h1>EBT SOC</h1>
              <p>Endpoint Behavioral Twin</p>
            </div>
          )}
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <Link key={item.to} className={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)) ? 'active' : ''} to={item.to}>
              <span>{item.icon}</span>
              {!sidebarCollapsed && item.label}
            </Link>
          ))}
          {canTuneRules && (
            <Link className={location.pathname === '/rules' ? 'active' : ''} to="/rules">
              <span>⚙️</span>
              {!sidebarCollapsed && 'Rule Tuning'}
            </Link>
          )}
          {user.role === 'admin' && (
            <Link className={location.pathname === '/admin' ? 'active' : ''} to="/admin">
              <span>🧰</span>
              {!sidebarCollapsed && 'Admin'}
            </Link>
          )}
        </nav>
      </aside>

      <section className="content-wrap">
        <header className="topbar">
          <button className="ghost-btn" onClick={onToggleSidebar}>☰</button>
          <div className="user-chip">
            <span className="avatar">{user.username[0]?.toUpperCase() || 'U'}</span>
            <div>
              <strong>{user.username}</strong>
              <small>{user.role}</small>
            </div>
          </div>
          <button className="primary-btn" onClick={onLogout}>Logout</button>
        </header>
        <main className="main-content">{children}</main>
      </section>
    </div>
  )
}

