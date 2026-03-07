import { useState } from 'react'

export default function RuleSettingsPage({ rules, onSave }) {
  const [form, setForm] = useState(rules)
  const update = (key, value) => setForm({ ...form, [key]: Number(value) })

  return (
    <div className="page">
      <h2>Rule Weights & Thresholds</h2>
      <div className="card form-grid">
        {Object.entries(form).map(([key, value]) => (
          <label key={key}>{key}
            <input type="number" value={value} onChange={(e) => update(key, e.target.value)} />
          </label>
        ))}
        <button onClick={() => onSave(form)}>Save</button>
      </div>
    </div>
  )
}
