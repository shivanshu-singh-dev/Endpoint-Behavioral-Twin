import React, { useState } from 'react'
import {
  Users,
  UserPlus,
  Trash2,
  AlertOctagon,
  Shield,
  KeyRound,
  CheckCircle2,
  Lock,
  Wrench,
} from 'lucide-react'
import { api } from '../services/api'
import { soundManager } from '../utils/audio'
import { useToast } from '../components/Toast'

export default function AdminPage({
  currentUser,
  users,
  onCreateUser,
  onDeleteUser,
  onCleanup,
}) {
  const { addToast } = useToast()
  const [form, setForm] = useState({ username: '', password: '', role: 'guest' })
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupPassword, setCleanupPassword] = useState('')
  const [cleanupError, setCleanupError] = useState('')
  const [loading, setLoading] = useState(false)

  const createUser = async () => {
    soundManager.playClick()
    const payload = {
      ...form,
      username: form.username.trim(),
    }

    if (!payload.username) {
      addToast({ type: 'warning', title: 'Invalid Form', message: 'Username is required.' })
      return
    }

    if (!payload.password || payload.password.length < 8) {
      addToast({
        type: 'warning',
        title: 'Weak Password',
        message: 'Password must be at least 8 characters long.',
      })
      return
    }

    try {
      setLoading(true)
      await onCreateUser(payload)
      setForm({ username: '', password: '', role: payload.role })
      addToast({
        type: 'success',
        title: 'User Created',
        message: `Account created for ${payload.username} (${payload.role})`,
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'User Creation Error',
        message: error.message || 'Failed to create user.',
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId, username) => {
    soundManager.playClick()
    if (!window.confirm(`Are you sure you want to delete user account "${username}"?`)) {
      return
    }

    try {
      await onDeleteUser(userId)
      addToast({
        type: 'success',
        title: 'User Removed',
        message: `Account ${username} was permanently deleted.`,
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete user.',
      })
    }
  }

  const confirmCleanup = async () => {
    soundManager.playClick()
    setCleanupError('')
    if (!cleanupPassword) {
      setCleanupError('Password is required.')
      return
    }

    try {
      setLoading(true)
      await api.login({ username: currentUser.username, password: cleanupPassword })
      await onCleanup()
      addToast({
        type: 'success',
        title: 'Platform Sanitized',
        message: 'All behavioral logs and run records have been cleared.',
      })
      setShowCleanupModal(false)
      setCleanupPassword('')
    } catch (error) {
      setCleanupError('Incorrect administrator password verification.')
      soundManager.playAlert()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page fade-in">
      <div className="title-row">
        <div className="title-group">
          <h2>
            <Wrench color="#38bdf8" size={26} />
            Security Administration Center
          </h2>
          <span className="muted">
            Manage SOC analyst accounts and maintain behavioral telemetry hygiene
          </span>
        </div>
      </div>

      <div className="two-col">
        {/* User Management */}
        <div className="card hover-lift">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Users size={20} color="#38bdf8" />
            <h3 style={{ margin: 0 }}>Analyst Access Control</h3>
          </div>

          <div className="form-grid">
            <label>
              Username
              <input
                placeholder="analyst_jane"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </label>

            <label>
              Password (Min. 8 characters)
              <input
                type="password"
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <label>
              System Role & Access Tier
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="guest">Guest (Read-only Analysis View)</option>
                <option value="researcher">Researcher (Rule Tuning & Investigation)</option>
                <option value="admin">Administrator (Full Platform Control)</option>
              </select>
            </label>
          </div>

          <button
            className="primary-btn"
            onClick={createUser}
            disabled={loading}
            style={{ marginTop: '1.25rem', width: '100%' }}
          >
            <UserPlus size={16} />
            <span>{loading ? 'Creating...' : 'Create Analyst Account'}</span>
          </button>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Active Accounts ({users.length})</h3>
          <div className="table-responsive">
            <table className="runs-table compact">
              <thead>
                <tr>
                  <th>Analyst</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <strong>{u.username}</strong>
                    </td>
                    <td>
                      <span
                        className={
                          u.role === 'admin'
                            ? 'verdict-badge high'
                            : u.role === 'researcher'
                            ? 'verdict-badge medium'
                            : 'verdict-badge low'
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.username !== currentUser?.username ? (
                        <button
                          className="ghost-btn"
                          onClick={() => deleteUser(u.user_id, u.username)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#fda4af' }}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Current Session</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Telemetry Hygiene */}
        <div className="card hover-lift" style={{ borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <AlertOctagon size={20} color="#f43f5e" />
            <h3 style={{ margin: 0 }}>Telemetry Hygiene & Purge</h3>
          </div>

          <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
            Admin-only destructive operation. Truncates all EBT behavioral event logs, process graphs,
            and execution twins to baseline state.
          </p>

          <div
            style={{
              padding: '1rem',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '8px',
              margin: '1.5rem 0',
            }}
          >
            <strong style={{ color: '#fda4af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={15} /> Protected SOC Action
            </strong>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Requires administrator password confirmation before data truncation.
            </p>
          </div>

          <button
            className="danger-btn"
            onClick={() => {
              soundManager.playClick()
              setShowCleanupModal(true)
            }}
            style={{ padding: '0.8rem 1.25rem' }}
          >
            <AlertOctagon size={16} />
            <span>Purge All Behavioral Logs</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCleanupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <AlertOctagon size={22} color="#f43f5e" />
              <h3>Confirm Destructive Cleanup</h3>
            </div>
            <p className="muted" style={{ lineHeight: '1.5', marginBottom: '1.25rem' }}>
              This will permanently delete all runs and telemetry events in the database. Enter your password
              to confirm authorization.
            </p>

            <label>
              Administrator Password
              <input
                type="password"
                placeholder="Enter your password"
                value={cleanupPassword}
                onChange={(e) => setCleanupPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmCleanup()}
                autoFocus
              />
            </label>

            {cleanupError && <p className="error-text">{cleanupError}</p>}

            <div className="modal-actions">
              <button
                className="ghost-btn"
                onClick={() => {
                  soundManager.playClick()
                  setShowCleanupModal(false)
                  setCleanupError('')
                  setCleanupPassword('')
                }}
              >
                Cancel
              </button>
              <button
                className="danger-btn"
                onClick={confirmCleanup}
                disabled={loading}
              >
                {loading ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
