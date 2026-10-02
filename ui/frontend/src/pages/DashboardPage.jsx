import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import highcharts3d from 'highcharts/highcharts-3d'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Flame,
  Search,
  ExternalLink,
  ChevronRight,
  FileCode,
} from 'lucide-react'
import { soundManager } from '../utils/audio'

if (typeof highcharts3d === 'function' && !Highcharts.is3dEnabled) {
  highcharts3d(Highcharts)
  Highcharts.is3dEnabled = true
}

// Global Highcharts theme
Highcharts.setOptions({
  chart: {
    backgroundColor: 'transparent',
    style: { fontFamily: 'inherit' },
  },
  title: { text: null },
  credits: { enabled: false },
  legend: {
    itemStyle: { color: '#94a3b8', fontSize: '12px', fontWeight: '500' },
    itemHoverStyle: { color: '#ffffff' },
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
    style: { color: '#f8fafc', fontSize: '12px' },
    shadow: true,
  },
  xAxis: {
    labels: { style: { color: '#94a3b8' } },
    lineColor: 'rgba(255, 255, 255, 0.1)',
    tickColor: 'rgba(255, 255, 255, 0.1)',
  },
  yAxis: {
    labels: { style: { color: '#94a3b8' } },
    title: { text: null },
    gridLineColor: 'rgba(255, 255, 255, 0.05)',
  },
})

function verdictCount(data, keyword) {
  return (data?.verdict_distribution || [])
    .filter((v) => (v.verdict || '').toLowerCase().includes(keyword))
    .reduce((sum, v) => sum + v.count, 0)
}

function getVerdictBadgeClass(verdict) {
  const norm = (verdict || '').toLowerCase()
  if (norm.includes('high')) return 'verdict-badge high'
  if (norm.includes('medium') || norm.includes('suspicious')) return 'verdict-badge medium'
  return 'verdict-badge low'
}

export default function DashboardPage({ data }) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVerdictFilter, setSelectedVerdictFilter] = useState('ALL')

  const highRisk = verdictCount(data, 'high')
  const mediumRisk = verdictCount(data, 'medium')
  const lowRisk = Math.max((data?.total_runs || 0) - highRisk - mediumRisk, 0)
  const totalRuns = data?.total_runs || 0
  const threatRate = totalRuns > 0 ? Math.round(((highRisk + mediumRisk) / totalRuns) * 100) : 0

  // Real summary based on actual run data
  const summaryPosture = useMemo(() => {
    if (highRisk > 0) {
      return {
        level: 'critical',
        title: 'High Risk Executions Detected',
        desc: `${highRisk} run${highRisk === 1 ? '' : 's'} exceeded the high-risk threshold. Review behavioral findings below.`,
        icon: ShieldAlert,
      }
    }
    if (mediumRisk > 0) {
      return {
        level: 'elevated',
        title: 'Suspicious Behavior Flagged',
        desc: `${mediumRisk} run${mediumRisk === 1 ? '' : 's'} flagged with medium-risk behavioral activity.`,
        icon: AlertTriangle,
      }
    }
    return {
      level: 'nominal',
      title: 'Nominal Execution Baseline',
      desc: totalRuns > 0
        ? `All ${totalRuns} recorded runs evaluated as benign / low risk.`
        : 'No execution runs recorded yet.',
      icon: ShieldCheck,
    }
  }, [highRisk, mediumRisk, totalRuns])

  const PostureIcon = summaryPosture.icon

  // 1. Verdict 3D Donut Options
  const verdictOptions = {
    chart: {
      type: 'pie',
      options3d: { enabled: true, alpha: 45 },
    },
    tooltip: {
      pointFormat: '<b>{point.name}</b>: {point.y} runs (<b>{point.percentage:.1f}%</b>)',
    },
    plotOptions: {
      pie: {
        innerSize: '55%',
        depth: 35,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { color: '#f8fafc', textOutline: 'none', fontSize: '11px' },
        },
        showInLegend: true,
        colors: ['#f43f5e', '#fbbf24', '#38bdf8', '#10b981', '#94a3b8'],
        point: {
          events: {
            click: function () {
              soundManager.playClick()
              navigate(`/runs?verdict=${encodeURIComponent(this.name)}`)
            },
          },
        },
      },
    },
    series: [
      {
        name: 'Verdict',
        data: (data?.verdict_distribution || []).map((v) => ({
          name: v.verdict,
          y: v.count,
        })),
      },
    ],
  }

  // 2. Risk Distribution 3D Column Options
  const riskOptions = {
    chart: {
      type: 'column',
      options3d: { enabled: true, alpha: 12, beta: 18, depth: 40, viewDistance: 25 },
    },
    tooltip: {
      pointFormat: '<b>{point.category}</b>: {point.y} runs',
    },
    plotOptions: {
      column: {
        depth: 25,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          style: { color: '#f8fafc', textOutline: 'none' },
        },
        colors: ['#10b981', '#fbbf24', '#f43f5e'],
        colorByPoint: true,
        point: {
          events: {
            click: function () {
              soundManager.playClick()
              const category = this.category
              let filterVerdict = ''
              if (category === 'High Risk') filterVerdict = 'High Risk'
              else if (category === 'Medium Risk') filterVerdict = 'Medium Risk'
              else filterVerdict = 'Unlikely'
              navigate(`/runs?verdict=${encodeURIComponent(filterVerdict)}`)
            },
          },
        },
      },
    },
    xAxis: {
      categories: ['Low / Clean', 'Medium Risk', 'High Risk'],
    },
    series: [
      {
        name: 'Runs',
        showInLegend: false,
        data: [lowRisk, mediumRisk, highRisk],
      },
    ],
  }

  // 3. Activity Timeline Area Chart
  const recentRuns = data?.recent_runs || []
  const activityOptions = {
    chart: {
      type: 'areaspline',
      zooming: { type: 'x' },
    },
    tooltip: {
      shared: true,
      formatter: function () {
        const run = recentRuns[this.points[0].point.index]
        return `<b>${run?.filename || 'Run'}</b><br/>
                Risk Score: <b style="color:#38bdf8">${this.y} / 100</b><br/>
                Verdict: <b>${run?.verdict || 'Unknown'}</b><br/>
                Time: ${new Date(run?.start_time).toLocaleString()}`
      },
    },
    xAxis: {
      categories: recentRuns.map((r) => new Date(r.start_time).toLocaleTimeString()),
    },
    yAxis: {
      max: 100,
      min: 0,
      title: { text: 'Risk Score' },
    },
    plotOptions: {
      areaspline: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(56, 189, 248, 0.45)'],
            [1, 'rgba(56, 189, 248, 0.02)'],
          ],
        },
        lineColor: '#38bdf8',
        lineWidth: 3,
        marker: {
          radius: 4,
          fillColor: '#0f172a',
          lineWidth: 2,
          lineColor: '#38bdf8',
        },
        cursor: 'pointer',
        point: {
          events: {
            click: function () {
              const run = recentRuns[this.index]
              if (run) {
                soundManager.playClick()
                navigate(`/runs/${run.run_id}`)
              }
            },
          },
        },
      },
    },
    series: [
      {
        name: 'Risk Score',
        showInLegend: false,
        data: recentRuns.map((r) => r.risk_score ?? 0),
      },
    ],
  }

  // Filtered recent runs list
  const filteredRecentRuns = useMemo(() => {
    return recentRuns.filter((run) => {
      const matchSearch =
        !searchTerm ||
        run.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(run.run_id).includes(searchTerm)
      const matchVerdict =
        selectedVerdictFilter === 'ALL' ||
        (run.verdict || '').toLowerCase().includes(selectedVerdictFilter.toLowerCase())
      return matchSearch && matchVerdict
    })
  }, [recentRuns, searchTerm, selectedVerdictFilter])

  return (
    <div className="page fade-in">
      <div className="title-row">
        <div className="title-group">
          <h2>
            <Activity color="#38bdf8" size={26} />
            Security Dashboard
          </h2>
          <span className="muted">Endpoint Behavioral Twin · Behavioral Analytics Overview</span>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            soundManager.playClick()
            navigate('/runs')
          }}
        >
          <span>View All Runs ({totalRuns})</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Real Threat Posture Summary Banner */}
      <section className={`threat-banner ${summaryPosture.level} fade-in`}>
        <div className="threat-banner-left">
          <div className="threat-icon-badge">
            <PostureIcon size={28} />
          </div>
          <div>
            <h3 className="threat-headline">{summaryPosture.title}</h3>
            <p className="threat-subtext">{summaryPosture.desc}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Threat Ratio
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
              {threatRate}%
            </div>
          </div>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <section className="stats-grid">
        <div
          className="metric-card primary hover-lift"
          onClick={() => navigate('/runs')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-card-title">Total Analyzed</span>
            <div className="metric-icon-wrap">
              <FileCode size={18} />
            </div>
          </div>
          <h3>{totalRuns}</h3>
        </div>

        <div
          className="metric-card danger hover-lift"
          onClick={() => navigate('/runs?verdict=High+Risk')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-card-title">High Risk</span>
            <div className="metric-icon-wrap">
              <Flame size={18} />
            </div>
          </div>
          <h3>{highRisk}</h3>
        </div>

        <div
          className="metric-card warning hover-lift"
          onClick={() => navigate('/runs?verdict=Medium+Risk')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-card-title">Medium Risk</span>
            <div className="metric-icon-wrap">
              <AlertTriangle size={18} />
            </div>
          </div>
          <h3>{mediumRisk}</h3>
        </div>

        <div
          className="metric-card success hover-lift"
          onClick={() => navigate('/runs?verdict=Unlikely')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-card-top">
            <span className="metric-card-title">Low Risk / Clean</span>
            <div className="metric-icon-wrap">
              <ShieldCheck size={18} />
            </div>
          </div>
          <h3>{lowRisk}</h3>
        </div>
      </section>

      {/* 3D Highcharts Analytics Grid */}
      <section className="three-col">
        <div className="card hover-lift">
          <h3>Verdict Distribution (3D)</h3>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
            Click slices to filter runs by verdict
          </p>
          <HighchartsReact highcharts={Highcharts} options={verdictOptions} />
        </div>

        <div className="card hover-lift">
          <h3>Risk Severity Profile</h3>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
            Threat breakdown across execution runs
          </p>
          <HighchartsReact highcharts={Highcharts} options={riskOptions} />
        </div>

        <div className="card hover-lift">
          <h3>Recent Run Activity & Risk</h3>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
            Timeline with interactive point inspection
          </p>
          <HighchartsReact highcharts={Highcharts} options={activityOptions} />
        </div>
      </section>

      {/* Recent Runs Triage Feed */}
      <section className="card hover-lift">
        <div className="title-row" style={{ marginBottom: '1rem' }}>
          <h3>Recent Runs</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '200px' }}>
              <input
                type="text"
                placeholder="Filter recent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', fontSize: '0.82rem' }}
              />
              <Search
                size={14}
                color="#64748b"
                style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <button
              className={`ghost-btn ${selectedVerdictFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedVerdictFilter('ALL')}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
            >
              All
            </button>
            <button
              className={`ghost-btn ${selectedVerdictFilter === 'high' ? 'active' : ''}`}
              onClick={() => setSelectedVerdictFilter('high')}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', color: '#fda4af' }}
            >
              High
            </button>
            <button
              className={`ghost-btn ${selectedVerdictFilter === 'medium' ? 'active' : ''}`}
              onClick={() => setSelectedVerdictFilter('medium')}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', color: '#fde68a' }}
            >
              Medium
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="runs-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Target Binary</th>
                <th>Execution Time</th>
                <th>Verdict</th>
                <th>Risk Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    No recent runs match your query.
                  </td>
                </tr>
              ) : (
                filteredRecentRuns.map((run) => (
                  <tr
                    key={run.run_id}
                    onClick={() => {
                      soundManager.playClick()
                      navigate(`/runs/${run.run_id}`)
                    }}
                  >
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: '600' }}>
                        #{run.run_id}
                      </span>
                    </td>
                    <td className="filename-cell">{run.filename}</td>
                    <td>{new Date(run.start_time).toLocaleString()}</td>
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
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                          {run.risk_score ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="ghost-btn"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          soundManager.playClick()
                          navigate(`/runs/${run.run_id}`)
                        }}
                      >
                        <ExternalLink size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
