import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FlaskConical,
  Sliders,
  Shield,
  Volume2,
  VolumeX,
  Menu,
  LogOut,
  Clock,
  User,
  Wrench,
} from 'lucide-react'
import { soundManager } from '../utils/audio'

export default function Layout({
  user,
  canTuneRules,
  sidebarCollapsed,
  onToggleSidebar,
  onLogout,
  children,
}) {
  const location = useLocation()
  const [soundOn, setSoundOn] = useState(soundManager.isEnabled())
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleSound = () => {
    const newState = soundManager.toggle()
    setSoundOn(newState)
  }

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/runs', label: 'Analysis Runs', icon: FlaskConical },
  ]

  const formattedUtc = time.toISOString().substring(11, 19) + ' UTC'
  const formattedLocal = time.toLocaleTimeString()

  return (
    <div className={`shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark" title="Endpoint Behavioral Twin">
            <Shield size={22} />
          </div>
          {!sidebarCollapsed && (
            <div className="brand-text">
              <h1>EBT</h1>
              <p>ENDPOINT BEHAVIORAL TWIN</p>
            </div>
          )}
        </div>

        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                className={`nav-item ${isActive ? 'active' : ''}`}
                to={item.to}
                onClick={() => soundManager.playClick()}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          {canTuneRules && (
            <Link
              className={`nav-item ${location.pathname === '/rules' ? 'active' : ''}`}
              to="/rules"
              onClick={() => soundManager.playClick()}
              title={sidebarCollapsed ? 'Rule Tuning' : ''}
            >
              <Sliders size={18} />
              {!sidebarCollapsed && <span>Rule Tuning</span>}
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
              to="/admin"
              onClick={() => soundManager.playClick()}
              title={sidebarCollapsed ? 'Admin' : ''}
            >
              <Wrench size={18} />
              {!sidebarCollapsed && <span>Admin</span>}
            </Link>
          )}
        </nav>
      </aside>

      <section className="content-wrap">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="ghost-btn"
              onClick={() => {
                soundManager.playClick()
                onToggleSidebar()
              }}
              title="Toggle Sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="soc-clock" title={`Local: ${formattedLocal} | UTC: ${formattedUtc}`}>
              <Clock size={15} color="#38bdf8" />
              <span>{formattedUtc}</span>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="ghost-btn"
              onClick={toggleSound}
              title={soundOn ? 'Sound On (Click to Mute)' : 'Sound Muted (Click to Enable)'}
            >
              {soundOn ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} />}
            </button>

            <div className="user-chip">
              <span className="avatar">
                {user?.username?.[0]?.toUpperCase() || <User size={14} />}
              </span>
              <div>
                <strong>{user?.username || 'User'}</strong>
                <small>{user?.role || 'Guest'}</small>
              </div>
            </div>

            <button
              className="ghost-btn"
              onClick={() => {
                soundManager.playClick()
                onLogout()
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="main-content">{children}</main>
      </section>
    </div>
  )
}
