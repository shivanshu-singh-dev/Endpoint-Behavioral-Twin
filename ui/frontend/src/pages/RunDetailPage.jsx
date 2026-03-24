import { useMemo, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import highcharts3d from 'highcharts/highcharts-3d'

if (typeof highcharts3d === 'function' && !Highcharts.is3dEnabled) {
  highcharts3d(Highcharts)
  Highcharts.is3dEnabled = true
}

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

function renderTreeNode(node, depth = 0, isLast = true, path = []) {
  return (
    <div key={`${node.pid}-${depth}`} className="tree-node-wrapper">
      <div className="tree-node">
        {path.map((isParentLast, i) => (
          <span key={i} className="tree-line">{isParentLast ? '    ' : '│   '}</span>
        ))}
        {depth > 0 && <span className="tree-line">{isLast ? '└── ' : '├── '}</span>}
        <span className="tree-dot" />
        <span className="node-name">{node.name}</span>
        <small>PID {node.pid}</small>
      </div>
      {node.children?.map((child, idx) => 
        renderTreeNode(child, depth + 1, idx === node.children?.length - 1, [...path, depth === 0 ? true : isLast])
      )}
    </div>
  )
}

function formatEventDetail(cat, det) {
  if (!det) return ''
  switch(cat) {
    case 'file': return `${det.event_type} ${det.dest_path || det.src_path || ''}`
    case 'process': return `${det.process_name || ''} (PID: ${det.pid})`
    case 'network': return `${det.remote_ip || 'unknown'}:${det.remote_port || '0'}`
    case 'persistence': return det.mechanism_type
    case 'config': return det.config_type
    default: return ''
  }
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

  const distributionOptions = {
    chart: { type: 'pie', options3d: { enabled: true, alpha: 45 } },
    plotOptions: {
      pie: {
        innerSize: '40%',
        depth: 45,
        dataLabels: { enabled: false },
        showInLegend: true,
        colors: Object.keys(categoryCounts).map((key) => categoryPalette[key] || '#64748b')
      }
    },
    series: [{
      name: 'Events',
      data: Object.keys(categoryCounts).map((key) => ({ name: key, y: categoryCounts[key] }))
    }]
  }

  const timelineOptions = {
    chart: { type: 'area', zooming: { type: 'x' } },
    xAxis: { categories: timelineBuckets.map(([second]) => `${second}s`) },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(37, 99, 235, 0.4)'],
            [1, 'rgba(37, 99, 235, 0.05)']
          ]
        },
        lineColor: selectedCategory === 'all' ? '#2563eb' : categoryPalette[selectedCategory] || '#2563eb',
        lineWidth: 2,
        marker: { radius: 3 }
      }
    },
    series: [{
      name: selectedCategory === 'all' ? 'All Events' : `${selectedCategory} events`,
      data: timelineBuckets.map(([, count]) => count)
    }]
  }

  const intensityOptions = {
    chart: { type: 'column', options3d: { enabled: true, alpha: 15, beta: 15, depth: 50, viewDistance: 25 } },
    xAxis: { categories: Object.keys(categoryCounts) },
    plotOptions: {
      column: {
        depth: 25,
        colors: Object.keys(categoryCounts).map((key) => categoryPalette[key] || '#64748b'),
        colorByPoint: true
      }
    },
    series: [{
      name: 'Behavior Intensity',
      data: Object.keys(categoryCounts).map((key) => categoryCounts[key])
    }]
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
          {vizMode === 'distribution' && <HighchartsReact highcharts={Highcharts} options={distributionOptions} />}
          {vizMode === 'timeline' && <HighchartsReact highcharts={Highcharts} options={timelineOptions} />}
          {vizMode === 'intensity' && <HighchartsReact highcharts={Highcharts} options={intensityOptions} />}
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
            {timeline.map((t) => {
              const fullEvent = detail.events.find(e => e.event_id === t.event_id)
              const extraDetail = formatEventDetail(t.category, fullEvent?.detail)
              
              return (
                <li key={t.event_id}>
                  <span>{t.offset_seconds.toFixed(1)}s</span>
                  <span className="timeline-point" />
                  <span>
                    <strong>{t.category}</strong>
                    {extraDetail && <span className="muted" style={{ marginLeft: '8px', fontSize: '0.8rem' }}>{extraDetail}</span>}
                  </span>
                </li>
              )
            })}
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

