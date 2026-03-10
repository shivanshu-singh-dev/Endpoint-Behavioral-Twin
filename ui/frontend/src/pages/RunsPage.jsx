import { useNavigate } from 'react-router-dom'
import FilterChips from '../components/FilterChips'

function verdictClass(verdict) {
  const normalized = (verdict || '').toLowerCase()
  if (normalized.includes('high')) return 'verdict-badge high'
  if (normalized.includes('suspicious') || normalized.includes('medium')) return 'verdict-badge medium'
  return 'verdict-badge low'
}

export default function RunsPage({ runs, filters, setFilters, searchRuns }) {
  const navigate = useNavigate()

  return (
    <div className="page fade-in">
      <div className="title-row">
        <h2>Analysis Runs</h2>
        <span className="muted">Filter by filename, process, network indicators, and score</span>
      </div>
      <FilterChips filters={filters} onChange={setFilters} onSearch={searchRuns} />

      <div className="card hover-lift">
        <table className="runs-table">
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
                <td>#{run.run_id}</td>
                <td className="filename-cell">{run.filename}</td>
                <td>{new Date(run.start_time).toLocaleString()}</td>
                <td><span className={verdictClass(run.verdict)}>{run.verdict || 'Unknown'}</span></td>
                <td>
                  <div className="risk-inline">
                    <progress max="100" value={run.risk_score ?? 0} />
                    <span>{run.risk_score ?? '-'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

