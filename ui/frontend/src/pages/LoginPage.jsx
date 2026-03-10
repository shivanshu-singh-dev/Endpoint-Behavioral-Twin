import { useState } from 'react'

export default function LoginPage({ onLogin, error }) {
  const [form, setForm] = useState({ username: '', password: '' })

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-header">
          <h2>Endpoint Behavioral Twin</h2>
          <p>Security Operations Console</p>
        </div>

        <label>Username
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="analyst"
          />
        </label>

        <label>Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary-btn login-btn" onClick={() => onLogin(form)}>Sign In</button>
      </div>
    </div>
  )
}

