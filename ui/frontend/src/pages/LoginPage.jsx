import React, { useState } from 'react'
import { Shield, Lock, User, KeyRound, FileCode, Cpu, Globe, Key, Settings } from 'lucide-react'
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
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Username
              <div style={{ position: 'relative' }}>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Username"
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
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Fill Credentials for testing */}
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

      {/* Right panel: Real project description & behavioral monitors overview */}
      <div className="login-right">
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <div
            style={{
              padding: '2rem',
              background: 'rgba(11, 17, 32, 0.75)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.75rem' }}>
              Behavior-Based Analysis
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 1.25rem' }}>
              Observe and evaluate untrusted program executions locally in an isolated sandbox across 5 distinct behavioral vectors:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.83rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#e2e8f0' }}>
                <FileCode size={15} color="#38bdf8" />
                <span>File System Modifications</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#e2e8f0' }}>
                <Cpu size={15} color="#a855f7" />
                <span>Process Hierarchy & Spawns</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#e2e8f0' }}>
                <Globe size={15} color="#06b6d4" />
                <span>Outbound Network Connections</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#e2e8f0' }}>
                <Key size={15} color="#f43f5e" />
                <span>Persistence Mechanisms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#e2e8f0' }}>
                <Settings size={15} color="#f59e0b" />
                <span>System Configuration Shifts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
