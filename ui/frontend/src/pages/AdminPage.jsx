import { useState } from 'react'
import { api } from '../services/api'

export default function AdminPage({ currentUser, users, onCreateUser, onDeleteUser, onCleanup }) {
  const [form, setForm] = useState({ username: '', password: '', role: 'guest' })
  const [message, setMessage] = useState('')
  const [showCleanupModal, setShowCleanupModal] = useState(false)
  const [cleanupPassword, setCleanupPassword] = useState('')
  const [cleanupError, setCleanupError] = useState('')

  const createUser = async () => {
    const payload = {
      ...form,
      username: form.username.trim(),
    }

    if (!payload.username) {
      setMessage('Username is required.')
      return
    }

    if (!payload.password || payload.password.length < 8) {
      setMessage('Password must be at least 8 characters long.')
      return
    }

    try {
      await onCreateUser(payload)
      setForm({ username: '', password: '', role: payload.role })
      setMessage('User created successfully.')
    } catch (error) {
      setMessage(error.message || 'Failed to create user.')
    }
  }

  const deleteUser = async (userId) => {
    try {
      await onDeleteUser(userId)
      setMessage('User deleted successfully.')
    } catch (error) {
      setMessage(error.message || 'Failed to delete user.')
    }
  }

  const confirmCleanup = async () => {
    setCleanupError('')
    if (!cleanupPassword) {
      setCleanupError('Password is required.')
      return
    }

    try {
      await api.login({ username: currentUser.username, password: cleanupPassword })
      // Verification successful, proceed to clean
      await onCleanup()
      setMessage('Logs cleaned successfully.')
      setShowCleanupModal(false)
      setCleanupPassword('')
    } catch (error) {
      setCleanupError('Incorrect password.')
    }
  }

  const cleanup = () => {
      setShowCleanupModal(true)
  }

  return (
    <div className="page fade-in">
      <div className="title-row">
        <h2>Admin Panel</h2>
        <span className="muted">Manage users and platform hygiene</span>
      </div>

      <div className="two-col">
        <div className="card hover-lift">
          <h3>👥 User Management</h3>
          <div className="form-grid">
            <label>Username <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            <label>Password <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label>Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="guest">guest</option>
                <option value="researcher">researcher</option>
                <option value="admin">admin</option>
              </select>
            </label>
          </div>
          <button className="primary-btn" onClick={createUser}>➕ Create User</button>
          {message && <p className="muted">{message}</p>}

          <table className="runs-table compact">
            <thead><tr><th>User</th><th>Role</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.username}</td>
                  <td><span className="verdict-badge low">{user.role}</span></td>
                  <td><button className="ghost-btn" onClick={() => deleteUser(user.user_id)}>🗑 Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card hover-lift">
          <h3>🧹 Log Hygiene</h3>
          <p>Admin-only cleanup action truncates all EBT event and run tables and resets counters.</p>
          <button className="danger-btn" onClick={cleanup}>⚠ Clean Logs</button>
        </div>
      </div>

      {showCleanupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠ Confirm Log Cleanup</h3>
            <p className="muted">This action is destructive. Please enter your password to proceed.</p>
            <input 
              type="password" 
              placeholder="Your password" 
              value={cleanupPassword}
              onChange={(e) => setCleanupPassword(e.target.value)}
            />
            {cleanupError && <p className="error-text">{cleanupError}</p>}
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => {
                setShowCleanupModal(false)
                setCleanupError('')
                setCleanupPassword('')
              }}>Cancel</button>
              <button className="danger-btn" onClick={confirmCleanup}>Confirm Clean Logs</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
