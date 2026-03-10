import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import { api } from './services/api'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RunsPage from './pages/RunsPage'
import RunDetailPage from './pages/RunDetailPage'
import RuleSettingsPage from './pages/RuleSettingsPage'
import AdminPage from './pages/AdminPage'

function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RunDetailLoader({ cache, lineCache, setCache, setLineCache }) {
  const { id } = useParams()
  const runId = Number(id)

  useEffect(() => {
    if (!runId || cache[runId]) return
    Promise.all([api.runDetail(runId), api.runTimeline(runId)]).then(([detail, timeline]) => {
      setCache((prev) => ({ ...prev, [runId]: detail }))
      setLineCache((prev) => ({ ...prev, [runId]: timeline }))
    })
  }, [runId, cache, setCache, setLineCache])

  if (!cache[runId]) return <p>Loading run…</p>
  return <RunDetailPage detail={cache[runId]} timeline={lineCache[runId] || []} />
}

function AppRoutes({
  user,
  canTuneRules,
  dashboard,
  runs,
  filters,
  setFilters,
  searchRuns,
  rules,
  saveRules,
  users,
  adminActions,
  runDetail,
  timeline,
  setRunDetail,
  setTimeline,
}) {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage data={dashboard} />} />
      <Route path="/runs" element={<RunsPage runs={runs} filters={filters} setFilters={setFilters} searchRuns={searchRuns} />} />
      <Route path="/runs/:id" element={<RunDetailLoader cache={runDetail} lineCache={timeline} setCache={setRunDetail} setLineCache={setTimeline} />} />
      <Route path="/rules" element={canTuneRules ? <RuleSettingsPage rules={rules} onSave={saveRules} canEdit={canTuneRules} /> : <Navigate to="/" />} />
      <Route path="/admin" element={user.role === 'admin' ? <AdminPage users={users} {...adminActions} /> : <Navigate to="/" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState({ total_runs: 0, avg_risk_score: 0, verdict_distribution: [], recent_runs: [] })
  const [runs, setRuns] = useState([])
  const [filters, setFilters] = useState({})
  const [rules, setRules] = useState({ file_weight: 5, process_weight: 7, network_weight: 10, persistence_weight: 12, config_weight: 4 })
  const [users, setUsers] = useState([])
  const [runDetail, setRunDetail] = useState({})
  const [timeline, setTimeline] = useState({})
  const navigate = useNavigate()
  const location = useLocation()

  const normalizedRole = useMemo(() => user?.role?.toLowerCase?.() || '', [user])
  const canTuneRules = normalizedRole === 'admin' || normalizedRole === 'researcher'

  const hydrate = async () => {
    try {
      const me = await api.me()
      setUser(me)
      const role = me?.role?.toLowerCase?.() || ''
      const [dashData, runData] = await Promise.all([api.dashboard(), api.runs({})])
      setDashboard(dashData)
      setRuns(runData)
      if (role === 'admin' || role === 'researcher') setRules(await api.getRules())
      if (role === 'admin') setUsers(await api.users())
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    hydrate()
  }, [])

  const handleLogin = async (payload) => {
    try {
      const response = await api.login(payload)
      localStorage.setItem('ebt_token', response.access_token)
      setError('')
      await hydrate()
      navigate('/')
    } catch (e) {
      setError(e.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ebt_token')
    setUser(null)
    navigate('/login')
  }

  const searchRuns = async () => {
    const sanitized = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined))
    setRuns(await api.runs(sanitized))
  }

  const adminActions = {
    onCreateUser: async (payload) => {
      await api.createUser(payload)
      setUsers(await api.users())
    },
    onDeleteUser: async (id) => {
      await api.deleteUser(id)
      setUsers(await api.users())
    },
    onCleanup: async () => {
      await api.cleanup()
      setRuns([])
      setDashboard({ total_runs: 0, avg_risk_score: 0, verdict_distribution: [], recent_runs: [] })
      setRunDetail({})
      setTimeline({})
    },
  }

  if (!user && location.pathname !== '/login') {
    return <LoginPage onLogin={handleLogin} error={error} />
  }

  if (!user) return <LoginPage onLogin={handleLogin} error={error} />

  return (
    <Protected user={user}>
      <Layout
        user={user}
        canTuneRules={canTuneRules}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onLogout={handleLogout}
      >
        <AppRoutes
          user={user}
          canTuneRules={canTuneRules}
          dashboard={dashboard}
          runs={runs}
          filters={filters}
          setFilters={setFilters}
          searchRuns={searchRuns}
          rules={rules}
          saveRules={async (payload) => setRules(await api.saveRules(payload))}
          users={users}
          adminActions={adminActions}
          runDetail={runDetail}
          timeline={timeline}
          setRunDetail={setRunDetail}
          setTimeline={setTimeline}
        />
      </Layout>
    </Protected>
  )
}
