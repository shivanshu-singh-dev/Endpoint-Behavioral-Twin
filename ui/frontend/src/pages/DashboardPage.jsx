import { Doughnut } from 'react-chartjs-2'
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function DashboardPage({ data }) {
  const chartData = {
    labels: data.verdict_distribution.map((v) => v.verdict),
    datasets: [{
      data: data.verdict_distribution.map((v) => v.count),
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
    }],
  }

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <section className="stats-grid">
        <div className="card"><h3>Total Analyzed Files</h3><p>{data.total_runs}</p></div>
        <div className="card"><h3>Average Risk Score</h3><p>{data.avg_risk_score.toFixed(2)}</p></div>
        <div className="card"><h3>Recent Activity</h3><p>{data.recent_runs.length} recent runs shown</p></div>
      </section>
      <section className="two-col">
        <div className="card"><h3>Verdict Distribution</h3><Doughnut data={chartData} /></div>
        <div className="card"><h3>Recent Runs</h3>
          <ul>
            {data.recent_runs.map((run) => (
              <li key={run.run_id}>#{run.run_id} {run.filename} ({run.verdict || 'N/A'})</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
