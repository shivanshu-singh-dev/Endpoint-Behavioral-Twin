import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement)

function verdictCount(data, keyword) {
  return data.verdict_distribution
    .filter((v) => (v.verdict || '').toLowerCase().includes(keyword))
    .reduce((sum, v) => sum + v.count, 0)
}

export default function DashboardPage({ data }) {
  const highRisk = verdictCount(data, 'high')
  const mediumRisk = verdictCount(data, 'suspicious') + verdictCount(data, 'medium')
  const lowRisk = Math.max(data.total_runs - highRisk - mediumRisk, 0)

  const verdictChartData = {
    labels: data.verdict_distribution.map((v) => v.verdict),
    datasets: [{
      data: data.verdict_distribution.map((v) => v.count),
      backgroundColor: ['#ef4444', '#f59e0b', '#2563eb', '#10b981', '#94a3b8'],
      borderWidth: 0,
    }],
  }

  const riskDistributionData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [{
      label: 'Runs',
      data: [lowRisk, mediumRisk, highRisk],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderRadius: 8,
    }],
  }

  const activityLineData = {
    labels: data.recent_runs.map((run) => new Date(run.start_time).toLocaleTimeString()),
    datasets: [{
      label: 'Risk Score',
      data: data.recent_runs.map((run) => run.risk_score ?? 0),
      fill: true,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.14)',
      tension: 0.32,
      pointRadius: 3,
    }],
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
          <Doughnut data={verdictChartData} />
        </div>
        <div className="card hover-lift">
          <h3>Risk Score Distribution</h3>
          <Bar data={riskDistributionData} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="card hover-lift">
          <h3>Recent Activity Timeline</h3>
          <Line data={activityLineData} options={{ plugins: { legend: { display: false } } }} />
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

