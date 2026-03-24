import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import highcharts3d from 'highcharts/highcharts-3d'

if (typeof highcharts3d === 'function' && !Highcharts.is3dEnabled) {
  highcharts3d(Highcharts)
  Highcharts.is3dEnabled = true
}

// Global Highcharts theme
Highcharts.setOptions({
  chart: { backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
  title: { text: null },
  credits: { enabled: false },
  legend: { itemStyle: { color: '#94a3b8' } },
  xAxis: { labels: { style: { color: '#94a3b8' } } },
  yAxis: { labels: { style: { color: '#94a3b8' } }, title: { text: null }, gridLineColor: 'rgba(255,255,255,0.05)' }
})

function verdictCount(data, keyword) {
  return data.verdict_distribution
    .filter((v) => (v.verdict || '').toLowerCase().includes(keyword))
    .reduce((sum, v) => sum + v.count, 0)
}

export default function DashboardPage({ data }) {
  const highRisk = verdictCount(data, 'high')
  const mediumRisk = verdictCount(data, 'medium')
  const lowRisk = Math.max(data.total_runs - highRisk - mediumRisk, 0)

  const verdictOptions = {
    chart: { type: 'pie', options3d: { enabled: true, alpha: 45 } },
    plotOptions: {
      pie: {
        innerSize: '40%',
        depth: 45,
        dataLabels: { enabled: false },
        showInLegend: true,
        colors: ['#ef4444', '#f59e0b', '#2563eb', '#10b981', '#94a3b8']
      }
    },
    series: [{
      name: 'Runs',
      data: data.verdict_distribution.map((v) => ({ name: v.verdict, y: v.count }))
    }]
  }

  const riskOptions = {
    chart: { type: 'column', options3d: { enabled: true, alpha: 15, beta: 15, depth: 50, viewDistance: 25 } },
    plotOptions: {
      column: {
        depth: 25,
        colors: ['#10b981', '#f59e0b', '#ef4444'],
        colorByPoint: true
      }
    },
    xAxis: { categories: ['Unlikely', 'Medium Risk', 'High Risk'] },
    series: [{
      name: 'Runs',
      data: [lowRisk, mediumRisk, highRisk]
    }]
  }

  const activityOptions = {
    chart: { type: 'area', zooming: { type: 'x' } },
    xAxis: { categories: data.recent_runs.map((run) => new Date(run.start_time).toLocaleTimeString()) },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(37, 99, 235, 0.4)'],
            [1, 'rgba(37, 99, 235, 0.05)']
          ]
        },
        lineColor: '#2563eb',
        lineWidth: 2,
        marker: { radius: 3 }
      }
    },
    series: [{
      name: 'Risk Score',
      data: data.recent_runs.map((run) => run.risk_score ?? 0)
    }]
  }

  return (
    <div className="page fade-in">
      <div className="title-row">
        <h2>Security Operations Dashboard</h2>
        <span className="muted">Behavior analytics overview</span>
      </div>

      <section className="stats-grid">
        <div className="metric-card hover-lift">
          <p>Total Runs</p>
          <h3>{data.total_runs}</h3>
        </div>
        <div className="metric-card hover-lift danger">
          <p>High Risk Runs</p>
          <h3>{highRisk}</h3>
        </div>
        <div className="metric-card hover-lift warning">
          <p>Medium Risk Runs</p>
          <h3>{mediumRisk}</h3>
        </div>
        <div className="metric-card hover-lift success">
          <p>Low Risk Runs</p>
          <h3>{lowRisk}</h3>
        </div>
      </section>

      <section className="three-col">
        <div className="card hover-lift">
          <h3>Verdict Distribution</h3>
          <HighchartsReact highcharts={Highcharts} options={verdictOptions} />
        </div>
        <div className="card hover-lift">
          <h3>Risk Score Distribution</h3>
          <HighchartsReact highcharts={Highcharts} options={riskOptions} />
        </div>
        <div className="card hover-lift">
          <h3>Recent Activity Timeline</h3>
          <HighchartsReact highcharts={Highcharts} options={activityOptions} />
        </div>
      </section>

      <section className="card hover-lift">
        <h3>Recent Runs</h3>
        <div className="simple-list">
          {data.recent_runs.map((run) => (
            <div key={run.run_id} className="simple-row">
              <span>#{run.run_id}</span>
              <span>{run.filename}</span>
              <span>{run.verdict || 'N/A'}</span>
              <span>{run.risk_score ?? '-'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

