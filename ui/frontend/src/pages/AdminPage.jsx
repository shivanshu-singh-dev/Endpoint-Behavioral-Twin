import { useState } from 'react'

export default function AdminPage({ users, onCreateUser, onDeleteUser, onCleanup }) {
  const [form, setForm] = useState({ username: '', password: '', role: 'guest' })

  return (
    <div className="page">
      <h2>Admin Panel</h2>
      <div className="two-col">
        <div className="card">
          <h3>User Management</h3>
          <label>Username <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label>Password <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label>Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="guest">guest</option>
              <option value="researcher">researcher</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <button onClick={() => onCreateUser(form)}>Create User</button>
          <ul>
            {users.map((user) => (
              <li key={user.user_id}>
                {user.username} ({user.role})
                <button onClick={() => onDeleteUser(user.user_id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Log Hygiene</h3>
          <p>Admin-only cleanup action truncates all EBT event and run tables and resets counters.</p>
          <button className="danger" onClick={onCleanup}>Clean Logs</button>
        </div>
      </div>
    </div>
  )
}
