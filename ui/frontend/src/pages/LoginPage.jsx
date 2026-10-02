import React, { useState } from 'react'
import { Shield, Lock, User, Terminal, Sparkles, KeyRound, Radio } from 'lucide-react'
import { soundManager } from '../utils/audio'

export default function LoginPage({ onLogin, error }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    soundManager.playClick()
    setLoading(true)
    try {
      await onLogin(form)
    } finally {
      setLoading(false)
    }
  }

  const fillPreset = (u, p) => {
    soundManager.playClick()
    setForm({ username: u, password: p })
  }

  return (
    <div className="login-wrap">
      {/* Left panel: Login form */}
      <div className="login-left">
        <div className="login-card fade-scale">
          <div className="login-header">
            <div
              className="brand-mark"
              style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}
            >
              <Shield size={26} />
            </div>
            <h2>Endpoint Behavioral Twin</h2>
            <p>Security Operations Center Access</p>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Analyst Username
              <div style={{ position: 'relative' }}>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="analyst"
                  style={{ width: '100%', paddingLeft: '2.4rem' }}
                  required
                />
                <User
                  size={15}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </label>

            <label>
              Password
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  style={{ width: '100%', paddingLeft: '2.4rem' }}
                  required
                />
                <Lock
                  size={15}
                  color="#64748b"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </label>

            {error && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fda4af',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-btn login-btn"
              disabled={loading}
            >
              <KeyRound size={16} />
              <span>{loading ? 'Authenticating...' : 'Sign In To SOC'}</span>
            </button>
          </form>

          {/* Quick Fill Credentials for rapid testing */}
          <div className="role-preset-grid">
            <button
              type="button"
              className="role-preset-btn"
              onClick={() => fillPreset('admin', 'admin1234')}
            >
              Admin Demo
            </button>
            <button
              type="button"
              className="role-preset-btn"
              onClick={() => fillPreset('researcher', 'researcher1234')}
            >
              Researcher Demo
            </button>
            <button
              type="button"
              className="role-preset-btn"
              onClick={() => fillPreset('analyst', 'analyst1234')}
            >
              Analyst Demo
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: Futuristic Cyber Visuals & Telemetry Monitor */}
      <div className="login-right">
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <div
            style={{
              padding: '1.75rem',
              background: 'rgba(11, 17, 32, 0.75)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Terminal size={18} color="#38bdf8" />
              <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>
                LIVE TWIN TELEMETRY ENGINE
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Kernel Telemetry:</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>ONLINE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Process Tree Engine:</span>
                <span style={{ color: '#38bdf8', fontWeight: '600' }}>MONITORING</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Persistence Analyzer:</span>
                <span style={{ color: '#38bdf8', fontWeight: '600' }}>ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Encryption Protocol:</span>
                <span style={{ color: '#a855f7', fontWeight: '600' }}>TLS 1.3 / ZERO-TRUST</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#34d399',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span className="pulse-dot" />
              <span>SOC SENSORS SYNCHRONIZED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
