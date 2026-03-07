import { useNavigate } from 'react-router-dom'
import FilterChips from '../components/FilterChips'

export default function RunsPage({ runs, filters, setFilters, searchRuns }) {
  const navigate = useNavigate()

  return (
    <div className="page">
      <h2>Analysis Runs</h2>
      <FilterChips filters={filters} onChange={setFilters} onSearch={searchRuns} />
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Filename</th>
              <th>Timestamp</th>
              <th>Verdict</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.run_id} onClick={() => navigate(`/runs/${run.run_id}`)}>
                <td>{run.run_id}</td>
                <td>{run.filename}</td>
                <td>{new Date(run.start_time).toLocaleString()}</td>
                <td>{run.verdict || 'Unknown'}</td>
                <td>{run.risk_score ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
