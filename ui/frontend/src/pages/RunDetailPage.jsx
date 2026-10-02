import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import highcharts3d from 'highcharts/highcharts-3d'
import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  Download,
  Terminal,
  Activity,
  GitBranch,
  ListFilter,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Cpu,
  Globe,
  Lock,
  Settings,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Maximize2,
} from 'lucide-react'
import { api } from '../services/api'
import { soundManager } from '../utils/audio'
import { useToast } from '../components/Toast'

if (typeof highcharts3d === 'function' && !Highcharts.is3dEnabled) {
  highcharts3d(Highcharts)
  Highcharts.is3dEnabled = true
}

const categoryPalette = {
  file: '#38bdf8',
  process: '#a855f7',
  network: '#06b6d4',
  persistence: '#f43f5e',
  config: '#f59e0b',
}

const categoryIcons = {
  file: FileCode,
  process: Cpu,
  network: Globe,
  persistence: Lock,
  config: Settings,
}

const vizModes = [
  { id: 'distribution', label: 'Event Mix (3D Donut)' },
  { id: 'timeline', label: 'Velocity Timeline (Area)' },
  { id: 'intensity', label: 'Behavior Intensity (3D Column)' },
]

function getVerdictBadgeClass(verdict) {
  const norm = (verdict || '').toLowerCase()
  if (norm.includes('high')) return 'verdict-badge high'
  if (norm.includes('medium') || norm.includes('suspicious')) return 'verdict-badge medium'
  return 'verdict-badge low'
}

function renderTreeNode(node, depth = 0, isLast = true, path = []) {
  return (
    <div key={`${node.pid}-${depth}`} className="tree-node-wrapper">
      <div className="tree-node">
        {path.map((isParentLast, i) => (
          <span key={i} className="tree-line">
            {isParentLast ? '    ' : '│   '}
          </span>
        ))}
        {depth > 0 && <span className="tree-line">{isLast ? '└── ' : '├── '}</span>}
        <div className="tree-node-badge">
          <Cpu size={14} color="#a855f7" />
          <span className="node-name">{node.name}</span>
          <span className="node-pid">PID {node.pid}</span>
        </div>
      </div>
      {node.children?.map((child, idx) =>
        renderTreeNode(
          child,
          depth + 1,
          idx === node.children?.length - 1,
          [...path, depth === 0 ? true : isLast]
        )
      )}
    </div>
  )
}

function formatEventSummary(category, det) {
  if (!det) return ''
  switch (category) {
    case 'file':
      return `${det.event_type || 'access'} → ${det.dest_path || det.src_path || ''}`
    case 'process':
      return `Spawned ${det.process_name || ''} (PID: ${det.pid || '-'})`
    case 'network':
      return `Outbound socket ${det.remote_ip || 'unknown'}:${det.remote_port || '0'}`
    case 'persistence':
      return `Hooked mechanism: ${det.mechanism_type || 'Registry/Startup'}`
    case 'config':
      return `Modified config: ${det.config_type || 'Security Policy'}`
    default:
      return JSON.stringify(det)
  }
}

export default function RunDetailPage({ user, detail, timeline }) {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState('visualizations') // 'visualizations' | 'narrative' | 'process_tree' | 'timeline' | 'events'
  const [vizMode, setVizMode] = useState('distribution')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  const [eventSearch, setEventSearch] = useState('')

  const risk = detail.risk_score ?? 0
  const isClean = (detail.verdict || '').toLowerCase().includes('unlikely')

  const handleDownload = async (format) => {
    soundManager.playClick()
    try {
      await api.exportRun(detail.run_id, format)
      if (isClean) {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } })
      }
      addToast({
        type: 'success',
        title: 'Export Succeeded',
        message: `Saved run_${detail.run_id}_export.${format === 'json' ? 'json' : 'zip'}`,
      })
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Export Error',
        message: e.message || 'Failed to export run',
      })
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    soundManager.playBlip()
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Event telemetry data copied',
    })
  }

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(timeline.map((point) => point.category)))],
    [timeline]
  )

  const categoryCounts = useMemo(() => {
    const counts = {}
    ;(detail.events || []).forEach((event) => {
      counts[event.category] = (counts[event.category] || 0) + 1
    })
    return counts
  }, [detail.events])

  const filteredTimeline = useMemo(() => {
    if (selectedCategory === 'all') return timeline
    return timeline.filter((point) => point.category === selectedCategory)
  }, [timeline, selectedCategory])

  const timelineBuckets = useMemo(() => {
    const buckets = new Map()
    filteredTimeline.forEach((point) => {
      const key = Math.floor(point.offset_seconds)
      buckets.set(key, (buckets.get(key) || 0) + 1)
    })
    return Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])
  }, [filteredTimeline])

  // Chart 1: 3D Donut Distribution
  const distributionOptions = {
    chart: { type: 'pie', options3d: { enabled: true, alpha: 45 } },
    plotOptions: {
      pie: {
        innerSize: '50%',
        depth: 35,
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { color: '#f8fafc', textOutline: 'none', fontSize: '11px' },
        },
        showInLegend: true,
        colors: Object.keys(categoryCounts).map((key) => categoryPalette[key] || '#64748b'),
      },
    },
    series: [
      {
        name: 'Events',
        data: Object.keys(categoryCounts).map((key) => ({
          name: key,
          y: categoryCounts[key],
        })),
      },
    ],
  }

  // Chart 2: Velocity Timeline
  const timelineOptions = {
    chart: { type: 'areaspline', zooming: { type: 'x' } },
    xAxis: {
      categories: timelineBuckets.map(([second]) => `${second}s`),
      title: { text: 'Offset Seconds' },
    },
    yAxis: {
      title: { text: 'Event Frequency' },
    },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(56, 189, 248, 0.4)'],
            [1, 'rgba(56, 189, 248, 0.02)'],
          ],
        },
        lineColor:
          selectedCategory === 'all'
            ? '#38bdf8'
            : categoryPalette[selectedCategory] || '#38bdf8',
        lineWidth: 3,
        marker: { radius: 3 },
      },
    },
    series: [
      {
        name: selectedCategory === 'all' ? 'All Behavioral Events' : `${selectedCategory} events`,
        data: timelineBuckets.map(([, count]) => count),
      },
    ],
  }

  // Chart 3: Behavior Intensity 3D Column
  const intensityOptions = {
    chart: {
      type: 'column',
      options3d: { enabled: true, alpha: 12, beta: 18, depth: 40, viewDistance: 25 },
    },
    xAxis: { categories: Object.keys(categoryCounts) },
    plotOptions: {
      column: {
        depth: 25,
        colors: Object.keys(categoryCounts).map((key) => categoryPalette[key] || '#64748b'),
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          style: { color: '#f8fafc', textOutline: 'none' },
        },
      },
    },
    series: [
      {
        name: 'Event Volume',
        showInLegend: false,
        data: Object.keys(categoryCounts).map((key) => categoryCounts[key]),
      },
    ],
  }

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return (detail.events || []).filter((e) => {
      if (!eventSearch) return true
      const query = eventSearch.toLowerCase()
      return (
        e.category.toLowerCase().includes(query) ||
        JSON.stringify(e.detail).toLowerCase().includes(query) ||
        String(e.event_id).includes(query)
      )
    })
  }, [detail.events, eventSearch])

  return (
    <div className="page fade-in">
      {/* Back navigation & Run Title Row */}
      <div className="title-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="ghost-btn"
            onClick={() => {
              soundManager.playClick()
              navigate('/runs')
            }}
            style={{ padding: '0.5rem 0.75rem' }}
          >
            <ArrowLeft size={16} />
            <span>All Runs</span>
          </button>
          <div className="title-group">
            <h2>
              <span style={{ color: '#38bdf8' }}>Run #{detail.run_id}</span>
              <span style={{ color: 'var(--text-dim)', fontWeight: '400' }}>·</span>
              <span>{detail.filename}</span>
            </h2>
            <span className={getVerdictBadgeClass(detail.verdict)}>
              {detail.verdict || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Report Exports */}
        {user && ['admin', 'researcher'].includes(user.role?.toLowerCase()) && (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="ghost-btn" onClick={() => handleDownload('json')}>
              <Download size={14} />
              <span>JSON Telemetry</span>
            </button>
            <button className="primary-btn" onClick={() => handleDownload('csv')}>
              <Download size={14} />
              <span>CSV Bundle (ZIP)</span>
            </button>
          </div>
        )}
      </div>

      {/* Hero Stats */}
      <section className="stats-grid">
        <div className={`metric-card hover-lift ${risk >= 70 ? 'danger' : risk >= 40 ? 'warning' : 'success'}`}>
          <div className="metric-card-top">
            <span className="metric-card-title">Risk Score</span>
            <div className="metric-icon-wrap">
              {risk >= 70 ? <ShieldAlert size={18} /> : risk >= 40 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
            </div>
          </div>
          <h3>{risk} / 100</h3>
        </div>

        <div className="metric-card primary hover-lift">
          <div className="metric-card-top">
            <span className="metric-card-title">Analysis Confidence</span>
            <div className="metric-icon-wrap">
              <Activity size={18} />
            </div>
          </div>
          <h3>{detail.confidence || '95%'}</h3>
        </div>

        <div className="metric-card hover-lift">
          <div className="metric-card-top">
            <span className="metric-card-title">Behavior Events</span>
            <div className="metric-icon-wrap">
              <ListFilter size={18} />
            </div>
          </div>
          <h3>{detail.events?.length || 0}</h3>
        </div>

        <div className="metric-card hover-lift">
          <div className="metric-card-top">
            <span className="metric-card-title">Process Nodes</span>
            <div className="metric-icon-wrap">
              <Cpu size={18} />
            </div>
          </div>
          <h3>{detail.process_tree?.roots?.length || 1} Root</h3>
        </div>
      </section>

      {/* Risk Gauge Panel */}
      <section className="card hover-lift">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Behavioral Risk Gauge</h3>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              fontSize: '1.1rem',
              color: risk >= 70 ? '#fda4af' : risk >= 40 ? '#fde68a' : '#a7f3d0',
            }}
          >
            {risk} / 100
          </span>
        </div>
        <div className="risk-gauge-wrap">
          <progress
            className={`risk-gauge ${risk >= 70 ? 'danger' : risk >= 40 ? 'warning' : 'success'}`}
            max="100"
            value={risk}
          />
        </div>
      </section>

      {/* Investigation Workbench Tabs */}
      <div className="workbench-tabs">
        <button
          className={`workbench-tab ${activeTab === 'visualizations' ? 'active' : ''}`}
          onClick={() => {
            soundManager.playClick()
            setActiveTab('visualizations')
          }}
        >
          <Activity size={16} />
          <span>Visual Analytics</span>
        </button>
        <button
          className={`workbench-tab ${activeTab === 'narrative' ? 'active' : ''}`}
          onClick={() => {
            soundManager.playClick()
            setActiveTab('narrative')
          }}
        >
          <Terminal size={16} />
          <span>Explain Verdict & Narrative</span>
        </button>
        <button
          className={`workbench-tab ${activeTab === 'process_tree' ? 'active' : ''}`}
          onClick={() => {
            soundManager.playClick()
            setActiveTab('process_tree')
          }}
        >
          <GitBranch size={16} />
          <span>Process Tree</span>
        </button>
        <button
          className={`workbench-tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => {
            soundManager.playClick()
            setActiveTab('timeline')
          }}
        >
          <Clock size={16} />
          <span>Behavior Timeline ({timeline.length})</span>
        </button>
        <button
          className={`workbench-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => {
            soundManager.playClick()
            setActiveTab('events')
          }}
        >
          <ListFilter size={16} />
          <span>Raw Telemetry Logs ({detail.events?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: Visualizations */}
      {activeTab === 'visualizations' && (
        <section className="card hover-lift chart-panel fade-in">
          <div className="title-row chart-header">
            <h3>Visual Behavioral Analytics</h3>
            <div className="viz-controls">
              <div className="viz-tabs">
                {vizModes.map((mode) => (
                  <button
                    key={mode.id}
                    className={vizMode === mode.id ? 'viz-tab active' : 'viz-tab'}
                    onClick={() => {
                      soundManager.playClick()
                      setVizMode(mode.id)
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  soundManager.playClick()
                  setSelectedCategory(e.target.value)
                }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="viz-canvas fade-scale" key={`${vizMode}-${selectedCategory}`}>
            {vizMode === 'distribution' && (
              <HighchartsReact highcharts={Highcharts} options={distributionOptions} />
            )}
            {vizMode === 'timeline' && (
              <HighchartsReact highcharts={Highcharts} options={timelineOptions} />
            )}
            {vizMode === 'intensity' && (
              <HighchartsReact highcharts={Highcharts} options={intensityOptions} />
            )}
          </div>
        </section>
      )}

      {/* TAB 2: Narrative & Risk Breakdown */}
      {activeTab === 'narrative' && (
        <div className="two-col fade-in">
          <div className="card hover-lift">
            <h3>Explain Verdict</h3>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.7', color: '#e2e8f0' }}>
              {(detail.reasons || []).map((r, i) => (
                <li key={i} style={{ marginBottom: '0.4rem' }}>
                  {r}
                </li>
              ))}
            </ul>

            <h3 style={{ marginTop: '1.5rem' }}>Attack Narrative</h3>
            <div className="terminal-card">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                </div>
                <span>Behavioral Sequence</span>
              </div>
              <div className="terminal-body">
                {detail.attack_narrative || 'No attack sequence recorded.'}
              </div>
            </div>
          </div>

          <div className="card hover-lift">
            <h3>Risk Contribution by Category</h3>
            <p className="muted" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              Individual score contributions calculated against tuned rule weights
            </p>
            {(detail.risk_breakdown || []).map((item) => {
              const Icon = categoryIcons[item.category] || Activity
              return (
                <div
                  key={item.category}
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={16} color={categoryPalette[item.category] || '#38bdf8'} />
                      <strong style={{ textTransform: 'capitalize' }}>{item.category}</strong>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: item.score_contribution > 0 ? '#38bdf8' : 'var(--text-dim)',
                      }}
                    >
                      +{item.score_contribution} pts
                    </span>
                  </div>
                  <progress max="100" value={Math.min(item.score_contribution, 100)} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Process Tree */}
      {activeTab === 'process_tree' && (
        <section className="card hover-lift fade-in">
          <div className="title-row" style={{ marginBottom: '1rem' }}>
            <h3>Process Execution Hierarchy</h3>
            <span className="muted">Process parent-child relationship graph</span>
          </div>
          <div className="tree-box">
            {detail.process_tree?.roots?.map((root) => renderTreeNode(root))}
          </div>
        </section>
      )}

      {/* TAB 4: Timeline */}
      {activeTab === 'timeline' && (
        <section className="card hover-lift fade-in">
          <div className="title-row" style={{ marginBottom: '1.25rem' }}>
            <h3>Sequential Behavior Timeline</h3>
            <span className="muted">{timeline.length} chronological events detected</span>
          </div>
          <ul className="timeline-list">
            {timeline.map((t) => {
              const fullEvent = (detail.events || []).find((e) => e.event_id === t.event_id)
              const summary = formatEventSummary(t.category, fullEvent?.detail)
              const Icon = categoryIcons[t.category] || Activity

              return (
                <li key={t.event_id} className="timeline-item">
                  <span className="timeline-time">{t.offset_seconds.toFixed(2)}s</span>
                  <span
                    className="timeline-point"
                    style={{
                      background: categoryPalette[t.category] || '#38bdf8',
                      boxShadow: `0 0 0 4px var(--bg-card), 0 0 8px ${categoryPalette[t.category] || '#38bdf8'}`,
                    }}
                  />
                  <div className="timeline-content-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Icon size={16} color={categoryPalette[t.category] || '#38bdf8'} />
                      <strong style={{ textTransform: 'uppercase', fontSize: '0.82rem', letterSpacing: '0.5px' }}>
                        {t.category}
                      </strong>
                      <span style={{ color: 'var(--text-dim)' }}>|</span>
                      <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{summary}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      #{t.event_id}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* TAB 5: Raw Telemetry Logs */}
      {activeTab === 'events' && (
        <section className="card hover-lift fade-in">
          <div className="title-row" style={{ marginBottom: '1.25rem' }}>
            <h3>Raw Telemetry Events</h3>
            <input
              type="text"
              placeholder="Search event details, categories, PIDs..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              style={{ width: '280px', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            {filteredEvents.map((e, idx) => {
              const Icon = categoryIcons[e.category] || Activity
              const isCopied = copiedId === e.event_id

              return (
                <details key={e.event_id} className="event-details">
                  <summary>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Icon size={16} color={categoryPalette[e.category] || '#38bdf8'} />
                      <strong style={{ textTransform: 'uppercase', color: '#f8fafc' }}>
                        {e.category}
                      </strong>
                      <span style={{ color: 'var(--text-dim)' }}>·</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{ color: 'var(--text-dim)' }}>·</span>
                      <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        Event #{e.event_id}
                      </span>
                    </div>

                    <button
                      className="ghost-btn"
                      onClick={(evt) => {
                        evt.preventDefault()
                        evt.stopPropagation()
                        copyToClipboard(JSON.stringify(e.detail, null, 2), e.event_id)
                      }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {isCopied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </summary>
                  <pre>{JSON.stringify(e.detail, null, 2)}</pre>
                </details>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
