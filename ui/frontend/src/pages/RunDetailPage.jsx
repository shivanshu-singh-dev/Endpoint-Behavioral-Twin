import { useMemo, useState } from 'react'
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
)

const categoryPalette = {
  file: '#2563eb',
  process: '#7c3aed',
  network: '#0d9488',
  persistence: '#dc2626',
  config: '#ea580c',
}

const vizModes = [
  { id: 'distribution', label: 'Event Mix' },
  { id: 'timeline', label: 'Event Timeline' },
  { id: 'intensity', label: 'Behavior Heatmap' },
]

function renderTreeNode(node, depth = 0) {
  return (
    <div key={`${node.pid}-${depth}`} className="tree-node" style={{ marginLeft: depth * 18 }}>
      <span className="tree-dot" />
      <span>{node.name}</span>
      <small>PID {node.pid}</small>
      {node.children?.map((child) => renderTreeNode(child, depth + 1))}
    </div>
  )
}

function verdictClass(verdict) {
  const normalized = (verdict || '').toLowerCase()
  if (normalized.includes('high')) return 'verdict-badge high'
  if (normalized.includes('suspicious') || normalized.includes('medium')) return 'verdict-badge medium'
  return 'verdict-badge low'
}

export default function RunDetailPage({ detail, timeline }) {
  const risk = detail.risk_score ?? 0
  const [vizMode, setVizMode] = useState('distribution')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(timeline.map((point) => point.category)))],
    [timeline],
  )

  const categoryCounts = useMemo(() => {
    const counts = {}
    detail.events.forEach((event) => {
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

  const distributionData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.keys(categoryCounts).map((key) => categoryCounts[key]),
        backgroundColor: Object.keys(categoryCounts).map((key) => categoryPalette[key] || '#64748b'),
        borderWidth: 0,
      },
    ],
  }

  const timelineChartData = {
    labels: timelineBuckets.map(([second]) => `${second}s`),
    datasets: [
      {
        label: selectedCategory === 'all' ? 'All Events' : `${selectedCategory} events`,
        data: timelineBuckets.map(([, count]) => count),
        borderColor: selectedCategory === 'all' ? '#2563eb' : categoryPalette[selectedCategory] || '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.14)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  }

  const intensityData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        label: 'Behavior Intensity',
        data: Object.keys(categoryCounts).map((key) => categoryCounts[key]),
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderColor: '#2563eb',
        borderWidth: 2,
      },
    ],
  }

  return (
    <div className="page fade-in">
      <div className="title-row">
        <h2>Run #{detail.run_id} · {detail.filename}</h2>
        <span className={verdictClass(detail.verdict)}>{detail.verdict || 'Unknown'}</span>
      </div>

      <section className="stats-grid">
        <div className="metric-card hover-lift"><p>Risk Score</p><h3>{detail.risk_score ?? '-'}</h3></div>
        <div className="metric-card hover-lift"><p>Confidence</p><h3>{detail.confidence || '-'}</h3></div>
        <div className="metric-card hover-lift"><p>Total Events</p><h3>{detail.events.length}</h3></div>
      </section>

      <section className="card hover-lift">
        <h3>Risk Gauge</h3>
        <div className="risk-gauge-wrap">
          <progress className="risk-gauge" max="100" value={risk} />
          <span>{risk}/100</span>
        </div>
      </section>

      <section className="card hover-lift chart-panel">
        <div className="title-row chart-header">
          <h3>Scan Event Visualizations</h3>
          <div className="viz-controls">
            <div className="viz-tabs">
              {vizModes.map((mode) => (
                <button
                  key={mode.id}
                  className={vizMode === mode.id ? 'viz-tab active' : 'viz-tab'}
                  onClick={() => setVizMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="viz-canvas fade-scale" key={`${vizMode}-${selectedCategory}`}>
          {vizMode === 'distribution' && <Doughnut data={distributionData} />}
          {vizMode === 'timeline' && <Line data={timelineChartData} options={{ plugins: { legend: { display: true } } }} />}
          {vizMode === 'intensity' && (
            <div className="two-col">
              <div>
                <Radar data={intensityData} options={{ plugins: { legend: { display: false } } }} />
              </div>
              <div>
                <Bar data={intensityData} options={{ plugins: { legend: { display: false } } }} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="two-col">
        <div className="card hover-lift stagger-item">
          <h3>Explain Verdict</h3>
          <ul>{detail.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          <p>{detail.attack_narrative}</p>
        </div>
        <div className="card hover-lift stagger-item">
          <h3>Risk Score Breakdown</h3>
          {detail.risk_breakdown.map((item) => (
            <div className="break-row" key={item.category}>
              <span>{item.category}</span>
              <progress max="100" value={Math.min(item.score_contribution, 100)} />
              <strong>{item.score_contribution}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="two-col">
        <div className="card hover-lift stagger-item">
          <h3>Behavior Timeline</h3>
          <ul className="timeline-list">
            {timeline.map((t) => (
              <li key={t.event_id}>
                <span>{t.offset_seconds.toFixed(1)}s</span>
                <span className="timeline-point" />
                <span>{t.category}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card hover-lift stagger-item">
          <h3>Process Tree</h3>
          <div className="tree-box">{detail.process_tree.roots?.map((root) => renderTreeNode(root))}</div>
        </div>
      </section>

      <div className="card hover-lift">
        <h3>Behavior Events</h3>
        {detail.events.map((e, idx) => (
          <details key={e.event_id} className="event-details" style={{ animationDelay: `${idx * 30}ms` }}>
            <summary>
              <strong>{e.category}</strong> · {new Date(e.timestamp).toLocaleTimeString()} · Event #{e.event_id}
            </summary>
            <pre>{JSON.stringify(e.detail, null, 2)}</pre>
          </details>
        ))}
      </div>
    </div>
  )
}

