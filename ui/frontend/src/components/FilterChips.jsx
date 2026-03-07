export default function FilterChips({ filters, onChange, onSearch }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="card">
      <h3>SOC Filters</h3>
      <div className="chip-grid">
        <label>Filename <input value={filters.filename || ''} onChange={(e) => update('filename', e.target.value)} /></label>
        <label>Verdict <input value={filters.verdict || ''} onChange={(e) => update('verdict', e.target.value)} /></label>
        <label>Min Score <input type="number" value={filters.min_score || ''} onChange={(e) => update('min_score', e.target.value)} /></label>
        <label>Remote IP <input value={filters.remote_ip || ''} onChange={(e) => update('remote_ip', e.target.value)} /></label>
        <label>Remote Port <input type="number" value={filters.remote_port || ''} onChange={(e) => update('remote_port', e.target.value)} /></label>
        <label>Process Name <input value={filters.process_name || ''} onChange={(e) => update('process_name', e.target.value)} /></label>
        <label>Date Range
          <select value={filters.date_range || ''} onChange={(e) => update('date_range', e.target.value)}>
            <option value="">Any</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
      </div>
      <div className="quick-row">
        <button onClick={() => onChange({ verdict: 'High Risk', min_score: '60', date_range: '7d' })}>High Risk (7d)</button>
        <button onClick={() => onChange({ verdict: 'Suspicious', date_range: '24h' })}>Suspicious (24h)</button>
        <button onClick={() => onChange({})}>Clear</button>
        <button onClick={onSearch}>Apply Filters</button>
      </div>
    </div>
  )
}

