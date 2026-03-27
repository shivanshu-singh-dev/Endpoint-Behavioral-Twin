import { useEffect, useState } from 'react'

export default function RuleSettingsPage({ rules, onSave, canEdit = false }) {
  const [form, setForm] = useState(rules)
  useEffect(() => setForm(rules), [rules])
  const update = (key, value) => setForm({ ...form, [key]: Number(value) })

  if (!canEdit) {
    return (
      <div className="page fade-in">
        <div className="card hover-lift">
          <h3>Rule tuning is restricted</h3>
          <p className="muted">Only admin and researcher roles can access and modify rule weights.</p>
        </div>
      </div>
    )
  }

  const setPreset = (preset) => {
    setForm(preset)
    onSave(preset)
  }

  return (
    <div className="page fade-in">
      <div className="title-row">
        <h2>Rule Weights & Thresholds</h2>
        <span className="muted">Admin and researcher controls</span>
      </div>

      <div className="card hover-lift" style={{ marginBottom: "1.5rem" }}>
        <h3>Default Tuning Presets</h3>
        <div className="quick-row">
          <button className="ghost-btn" onClick={() => setPreset({ file_weight: 4, process_weight: 5, network_weight: 5, persistence_weight: 12, config_weight: 2 })}>Ideal</button>
          <button className="ghost-btn" onClick={() => setPreset({ file_weight: 5, process_weight: 7, network_weight: 10, persistence_weight: 12, config_weight: 4 })}>Default</button>
          <button className="ghost-btn" onClick={() => setPreset({ file_weight: 5, process_weight: 5, network_weight: 5, persistence_weight: 20, config_weight: 5 })}>Persistence Focused</button>
          <button className="ghost-btn" onClick={() => setPreset({ file_weight: 5, process_weight: 5, network_weight: 5, persistence_weight: 5, config_weight: 20 })}>Config Focused</button>
          <button className="ghost-btn" onClick={() => setPreset({ file_weight: 5, process_weight: 5, network_weight: 20, persistence_weight: 5, config_weight: 5 })}>Network Focused</button>
          <button className="ghost-btn" onClick={() => setPreset({ file_weight: 7.5, process_weight: 7.5, network_weight: 7.5, persistence_weight: 7.5, config_weight: 7.5 })}>Balanced</button>
          <button className="ghost-btn" onClick={() => setPreset({ file_weight: 7, process_weight: 12, network_weight: 15, persistence_weight: 18, config_weight: 8 })}>Malware Ideal Tuning</button>
        </div>
      </div>

      <div className="card hover-lift form-grid">
        {Object.entries(form).map(([key, value]) => (
          <label key={key}>{key}
            <input type="number" value={value} onChange={(e) => update(key, e.target.value)} />
          </label>
        ))}
        <button className="primary-btn" onClick={() => onSave(form)}>Save Custom Tuning</button>
      </div>
    </div>
  )
}

