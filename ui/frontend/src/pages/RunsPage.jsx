import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FlaskConical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Download,
  Flame,
  ShieldCheck,
  AlertTriangle,
  FileCode,
} from 'lucide-react'
import FilterChips from '../components/FilterChips'
import { soundManager } from '../utils/audio'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

function getVerdictBadgeClass(verdict) {
  const norm = (verdict || '').toLowerCase()
  if (norm.includes('high')) return 'verdict-badge high'
  if (norm.includes('medium') || norm.includes('suspicious')) return 'verdict-badge medium'
  return 'verdict-badge low'
}

export default function RunsPage({ runs, filters, setFilters, searchRuns }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addToast } = useToast()

  const [sortField, setSortField] = useState('run_id')
  const [sortAsc, setSortAsc] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Sync URL search params on first mount if any
  useEffect(() => {
    const verdictParam = searchParams.get('verdict')
    const minScoreParam = searchParams.get('min_score')
    if (verdictParam || minScoreParam) {
      const override = { ...filters }
      if (verdictParam) override.verdict = verdictParam
      if (minScoreParam) override.min_score = minScoreParam
      setFilters(override)
      searchRuns(override)
    }
  }, [])

  const handleSort = (field) => {
    soundManager.playClick()
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(field === 'filename' || field === 'verdict')
    }
  }

  const sortedRuns = useMemo(() => {
    const list = [...runs]
    list.sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      if (sortField === 'start_time') {
        valA = new Date(valA).getTime()
        valB = new Date(valB).getTime()
      } else if (sortField === 'risk_score' || sortField === 'run_id') {
        valA = Number(valA || 0)
        valB = Number(valB || 0)
      } else {
        valA = String(valA || '').toLowerCase()
        valB = String(valB || '').toLowerCase()
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
    return list
  }, [runs, sortField, sortAsc])

  const totalPages = Math.ceil(sortedRuns.length / pageSize) || 1
  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedRuns.slice(start, start + pageSize)
  }, [sortedRuns, currentPage, pageSize])

  const handleExport = async (e, runId, format) => {
    e.stopPropagation()
    soundManager.playClick()
    try {
      await api.exportRun(runId, format)
      addToast({
        type: 'success',
        title: 'Report Downloaded',
        message: `Run #${runId} exported as ${format.toUpperCase()}`,
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Unable to download report',
      })
    }
  }

  return (
    <div className="page fade-in">
      <div className="title-row">
        <div className="title-group">
          <h2>
            <FlaskConical color="#38bdf8" size={26} />
            Analysis Runs Repository
          </h2>
          <span className="muted">
            Inspect, filter, and triage behavioral execution twins
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Total Matched: <strong>{runs.length}</strong>
          </span>
        </div>
      </div>

      <FilterChips filters={filters} onChange={setFilters} onSearch={searchRuns} />

      <div className="card hover-lift">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="ghost-btn"
              disabled={currentPage <= 1}
              onClick={() => {
                soundManager.playClick()
                setCurrentPage((p) => Math.max(p - 1, 1))
              }}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="ghost-btn"
              disabled={currentPage >= totalPages}
              onClick={() => {
                soundManager.playClick()
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              Next
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="runs-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('run_id')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Run ID</span>
                    {sortField === 'run_id' ? (
                      sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} opacity={0.4} />
                    )}
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('filename')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Target Artifact</span>
                    {sortField === 'filename' ? (
                      sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} opacity={0.4} />
                    )}
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('start_time')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Timestamp</span>
                    {sortField === 'start_time' ? (
                      sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} opacity={0.4} />
                    )}
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('verdict')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Verdict</span>
                    {sortField === 'verdict' ? (
                      sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} opacity={0.4} />
                    )}
                  </div>
                </th>
                <th className="sortable" onClick={() => handleSort('risk_score')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>Risk Score</span>
                    {sortField === 'risk_score' ? (
                      sortAsc ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ArrowUpDown size={13} opacity={0.4} />
                    )}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRuns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}
                  >
                    <FlaskConical size={36} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ margin: 0, fontWeight: '600' }}>No behavioral runs found</p>
                    <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Try adjusting or resetting your filter criteria
                    </p>
                    <button
                      className="primary-btn"
                      onClick={() => {
                        soundManager.playClick()
                        setFilters({})
                        searchRuns({})
                      }}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedRuns.map((run) => (
                  <tr
                    key={run.run_id}
                    onClick={() => {
                      soundManager.playClick()
                      navigate(`/runs/${run.run_id}`)
                    }}
                  >
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: '#38bdf8',
                          fontWeight: '700',
                        }}
                      >
                        #{run.run_id}
                      </span>
                    </td>
                    <td className="filename-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileCode size={16} color="#94a3b8" />
                        <span>{run.filename}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(run.start_time).toLocaleString()}
                    </td>
                    <td>
                      <span className={getVerdictBadgeClass(run.verdict)}>
                        {run.verdict || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="risk-inline">
                        <progress
                          className={
                            (run.risk_score ?? 0) >= 70
                              ? 'danger'
                              : (run.risk_score ?? 0) >= 40
                              ? 'warning'
                              : 'success'
                          }
                          max="100"
                          value={run.risk_score ?? 0}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '700',
                            color:
                              (run.risk_score ?? 0) >= 70
                                ? '#fda4af'
                                : (run.risk_score ?? 0) >= 40
                                ? '#fde68a'
                                : '#a7f3d0',
                          }}
                        >
                          {run.risk_score ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="ghost-btn"
                          title="Detailed Investigation"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            soundManager.playClick()
                            navigate(`/runs/${run.run_id}`)
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>Inspect</span>
                        </button>
                        <button
                          className="ghost-btn"
                          title="Export JSON"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                          onClick={(e) => handleExport(e, run.run_id, 'json')}
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
