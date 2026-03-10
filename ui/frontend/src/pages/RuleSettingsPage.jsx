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

  return (
    <div className="page fade-in">
      <div className="title-row">
        <h2>Rule Weights & Thresholds</h2>
        <span className="muted">Admin and researcher controls</span>
      </div>
      <div className="card hover-lift form-grid">
        {Object.entries(form).map(([key, value]) => (
          <label key={key}>{key}
            <input type="number" value={value} onChange={(e) => update(key, e.target.value)} />
          </label>
        ))}
        <button className="primary-btn" onClick={() => onSave(form)}>Save</button>
      </div>
    </div>
  )
}

