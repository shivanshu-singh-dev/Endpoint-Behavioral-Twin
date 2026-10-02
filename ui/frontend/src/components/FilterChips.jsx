import React, { useState } from 'react'
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  AlertTriangle,
  Clock,
  ShieldAlert,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { soundManager } from '../utils/audio'

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
  time_range: 'Time Range',
}

export default function FilterChips({ filters, onChange, onSearch }) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const update = (key, value) => {
    onChange({ ...filters, [key]: value })
  }

  const removeFilter = (key) => {
    soundManager.playClick()
    const next = { ...filters }
    delete next[key]
    onChange(next)
    onSearch(next)
  }

  const clearAll = () => {
    soundManager.playClick()
    onChange({})
    onSearch({})
  }

  const applyPreset = (preset) => {
    soundManager.playClick()
    onChange(preset)
    onSearch(preset)
  }

  const activeFilters = Object.entries(filters).filter(
    ([, value]) => value !== '' && value !== undefined
  )

  return (
    <div className="card hover-lift" style={{ marginBottom: '1.5rem' }}>
      <div className="title-row" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <SlidersHorizontal size={18} color="#38bdf8" />
          <h3 style={{ margin: 0 }}>Behavioral Filter Engine</h3>
        </div>
        <button
          className="ghost-btn"
          onClick={() => {
            soundManager.playClick()
            setShowAdvanced(!showAdvanced)
          }}
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        >
          {showAdvanced ? (
            <>
              <span>Hide Details</span>
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <span>Expand All Filters ({activeFilters.length} Active)</span>
              <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      {/* Primary search bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by target filename or hash (e.g. malware.exe, trojan)..."
            value={filters.filename || ''}
            onChange={(e) => update('filename', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
          <Search
            size={16}
            color="#64748b"
            style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <select
          value={filters.verdict || ''}
          onChange={(e) => {
            update('verdict', e.target.value)
            onSearch({ ...filters, verdict: e.target.value })
          }}
          style={{ minWidth: '160px' }}
        >
          <option value="">All Verdicts</option>
          <option value="High Risk">🚨 High Risk</option>
          <option value="Medium Risk">⚠️ Medium Risk</option>
          <option value="Unlikely">🛡️ Unlikely / Clean</option>
        </select>

        <button
          className="primary-btn"
          onClick={() => {
            soundManager.playClick()
            onSearch()
          }}
        >
          <Search size={16} />
          <span>Apply Query</span>
        </button>
      </div>

      {/* Advanced Filter Grid */}
      {showAdvanced && (
        <div className="chip-grid fade-in" style={{ paddingTop: '0.5rem' }}>
          <label>
            Run ID
            <input
              type="number"
              placeholder="e.g. 42"
              value={filters.run_id || ''}
              onChange={(e) => update('run_id', e.target.value)}
            />
          </label>

          <label>
            Event Category
            <select
              value={filters.event_type || ''}
              onChange={(e) => update('event_type', e.target.value)}
            >
              <option value="">Any Category</option>
              <option value="file">File System</option>
              <option value="process">Process Execution</option>
              <option value="network">Network Socket</option>
              <option value="persistence">Persistence Hook</option>
              <option value="config">System Config</option>
            </select>
          </label>

          <label>
            Min Risk Score (0-100)
            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 70"
              value={filters.min_score || ''}
              onChange={(e) => update('min_score', e.target.value)}
            />
          </label>

          <label>
            Max Risk Score (0-100)
            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 100"
              value={filters.max_score || ''}
              onChange={(e) => update('max_score', e.target.value)}
            />
          </label>

          <label>
            Process Name
            <input
              placeholder="e.g. powershell.exe"
              value={filters.process_name || ''}
              onChange={(e) => update('process_name', e.target.value)}
            />
          </label>

          <label>
            Remote IP
            <input
              placeholder="e.g. 192.168.1.1"
              value={filters.remote_ip || ''}
              onChange={(e) => update('remote_ip', e.target.value)}
            />
          </label>

          <label>
            Remote Port
            <input
              type="number"
              placeholder="e.g. 443"
              value={filters.remote_port || ''}
              onChange={(e) => update('remote_port', e.target.value)}
            />
          </label>

          <label>
            Time Window
            <select
              value={filters.time_range || ''}
              onChange={(e) => update('time_range', e.target.value)}
            >
              <option value="">All Historic Data</option>
              <option value="5m">Last 5 Minutes</option>
              <option value="1h">Last 1 Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </label>
        </div>
      )}

      {/* Active Chips Badges */}
      {activeFilters.length > 0 && (
        <div className="active-chips fade-in">
          <span style={{ fontSize: '0.8rem', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
            Active Filters:
          </span>
          {activeFilters.map(([key, value]) => (
            <span key={key} className="filter-chip">
              <span>
                {filterLabels[key] || key}: <strong>{value}</strong>
              </span>
              <X
                size={14}
                className="filter-chip-remove"
                onClick={() => removeFilter(key)}
                title="Remove filter"
              />
            </span>
          ))}
          <button
            className="ghost-btn"
            onClick={clearAll}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '99px' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Fast Preset Action Buttons */}
      <div className="quick-row">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
        <button
          className="ghost-btn"
          onClick={() => applyPreset({ min_score: '70' })}
          style={{ borderLeft: '3px solid #f43f5e' }}
        >
          <Flame size={14} color="#f43f5e" />
          <span>High Severity (≥70)</span>
        </button>
        <button
          className="ghost-btn"
          onClick={() => applyPreset({ min_score: '40', max_score: '69' })}
          style={{ borderLeft: '3px solid #fbbf24' }}
        >
          <AlertTriangle size={14} color="#fbbf24" />
          <span>Medium Risk (40-69)</span>
        </button>
        <button
          className="ghost-btn"
          onClick={() => applyPreset({ time_range: '24h' })}
        >
          <Clock size={14} color="#38bdf8" />
          <span>Last 24 Hours</span>
        </button>
        <button
          className="ghost-btn"
          onClick={() => applyPreset({ event_type: 'persistence' })}
        >
          <ShieldAlert size={14} color="#a855f7" />
          <span>Persistence Threats</span>
        </button>
        <button
          className="ghost-btn"
          onClick={clearAll}
        >
          <RotateCcw size={14} />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  )
}
