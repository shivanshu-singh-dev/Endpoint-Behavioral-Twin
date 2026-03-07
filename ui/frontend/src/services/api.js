const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('ebt_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || 'Request failed')
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  dashboard: () => request('/dashboard'),
  runs: (params) => request(`/runs?${new URLSearchParams(params).toString()}`),
  runDetail: (runId) => request(`/runs/${runId}`),
  runTimeline: (runId) => request(`/runs/${runId}/timeline`),
  getRules: () => request('/settings/rules'),
  saveRules: (payload) => request('/settings/rules', { method: 'PUT', body: JSON.stringify(payload) }),
  users: () => request('/admin/users'),
  createUser: (payload) => request('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  cleanup: () => request('/admin/cleanup', { method: 'POST' }),
}
