const filterLabels = {
  run_id: 'Run ID',
  event_type: 'Event Type',
  filename: 'Filename',
  verdict: 'Verdict',
  min_score: 'Min Score',
  max_score: 'Max Score',
  remote_ip: 'Remote IP',
  remote_port: 'Remote Port',
  process_name: 'Process Name',
  date_range: 'Date Range',
}

export default function FilterChips({ filters, onChange, onSearch }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })
  const activeFilters = Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)

  return (
    <div className="card hover-lift">
      <h3>SOC Filters</h3>
      <div className="chip-grid">
        <label>Run ID <input type="number" value={filters.run_id || ''} onChange={(e) => update('run_id', e.target.value)} /></label>
        <label>Event Type
          <select value={filters.event_type || ''} onChange={(e) => update('event_type', e.target.value)}>
            <option value="">Any</option>
            <option value="file">File</option>
            <option value="process">Process</option>
            <option value="network">Network</option>
            <option value="persistence">Persistence</option>
            <option value="config">Config</option>
          </select>
        </label>
        <label>Filename <input value={filters.filename || ''} onChange={(e) => update('filename', e.target.value)} /></label>
        <label>Verdict
          <select value={filters.verdict || ''} onChange={(e) => update('verdict', e.target.value)}>
            <option value="">Any</option>
            <option value="High Risk">High Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="Unlikely">Unlikely</option>
          </select>
        </label>
        <label>Min Score <input type="number" value={filters.min_score || ''} onChange={(e) => update('min_score', e.target.value)} /></label>
        <label>Max Score <input type="number" value={filters.max_score || ''} onChange={(e) => update('max_score', e.target.value)} /></label>
        <label>Remote IP <input value={filters.remote_ip || ''} onChange={(e) => update('remote_ip', e.target.value)} /></label>
        <label>Remote Port <input type="number" value={filters.remote_port || ''} onChange={(e) => update('remote_port', e.target.value)} /></label>
        <label>Process Name <input value={filters.process_name || ''} onChange={(e) => update('process_name', e.target.value)} /></label>
        <label>Date Range
          <select value={filters.date_range || ''} onChange={(e) => update('date_range', e.target.value)}>
            <option value="">Any</option>
            <option value="5m">Last 5 mins</option>
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
      </div>

      <div className="active-chips">
        {activeFilters.map(([key, value]) => (
          <span key={key} className="filter-chip">{filterLabels[key] || key}: {value}</span>
        ))}
      </div>

      <div className="quick-row">
        <button className="ghost-btn" onClick={() => onSearch({ min_score: '70', date_range: '30d' })}>Critical Risk</button>
        <button className="ghost-btn" onClick={() => onSearch({ min_score: '40', max_score: '69', date_range: '7d' })}>Medium Risk</button>
        <button className="ghost-btn" onClick={() => onSearch({ date_range: '24h' })}>Last 24h</button>
        <button className="ghost-btn" onClick={() => onSearch({ min_score: '70' })}>All High Risk</button>
        <button className="ghost-btn" onClick={() => onSearch({})}>Clear Filters</button>
        <button className="primary-btn" onClick={() => onSearch()}>Apply Filters</button>
      </div>
    </div>
  )
}

