import { Link, useLocation } from 'react-router-dom'

export default function Layout({ user, theme, onThemeToggle, onLogout, children }) {
  const location = useLocation()

  return (
    <div className={`app ${theme}`}>
      <aside className="sidebar">
        <h1>EBT Console</h1>
        <p className="role">{user.username} · {user.role}</p>
        <nav>
          <Link className={location.pathname === '/' ? 'active' : ''} to="/">Dashboard</Link>
          <Link className={location.pathname.startsWith('/runs') ? 'active' : ''} to="/runs">Runs</Link>
          {(user.role === 'researcher' || user.role === 'admin') && <Link className={location.pathname === '/rules' ? 'active' : ''} to="/rules">Rule Tuning</Link>}
          {user.role === 'admin' && <Link className={location.pathname === '/admin' ? 'active' : ''} to="/admin">Admin</Link>}
        </nav>
        <div className="actions">
          <button onClick={onThemeToggle}>Toggle Theme</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  )
}
