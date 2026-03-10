import { useState } from 'react'

export default function AdminPage({ users, onCreateUser, onDeleteUser, onCleanup }) {
  const [form, setForm] = useState({ username: '', password: '', role: 'guest' })

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
          <button className="primary-btn" onClick={() => onCreateUser(form)}>➕ Create User</button>

          <table className="runs-table compact">
            <thead><tr><th>User</th><th>Role</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.username}</td>
                  <td><span className="verdict-badge low">{user.role}</span></td>
                  <td><button className="ghost-btn" onClick={() => onDeleteUser(user.user_id)}>🗑 Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card hover-lift">
          <h3>🧹 Log Hygiene</h3>
          <p>Admin-only cleanup action truncates all EBT event and run tables and resets counters.</p>
          <button className="danger-btn" onClick={onCleanup}>⚠ Clean Logs</button>
        </div>
      </div>
    </div>
  )
}

