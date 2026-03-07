import { useState } from 'react'

export default function LoginPage({ onLogin, error }) {
  const [form, setForm] = useState({ username: '', password: '' })

  return (
    <div className="login">
      <div className="card login-card">
        <h2>Endpoint Behavioral Twin</h2>
        <p>Security Operations Console</p>
        <label>Username
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="error">{error}</p>}
        <button onClick={() => onLogin(form)}>Login</button>
      </div>
    </div>
  )
}
