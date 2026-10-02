import React, { useEffect, useState, useMemo } from 'react'
import {
  Sliders,
  Save,
  RotateCcw,
  Sparkles,
  Shield,
  Lock,
  Globe,
  FileCode,
  Cpu,
  Settings,
  Flame,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { soundManager } from '../utils/audio'
import { useToast } from '../components/Toast'

const categoryMeta = {
  file_weight: { label: 'File System Weight', icon: FileCode, color: '#38bdf8', desc: 'Sensitivity to file creations, modifications, and suspicious encryptions' },
  process_weight: { label: 'Process Execution Weight', icon: Cpu, color: '#a855f7', desc: 'Sensitivity to process spawns, shell injections, and privilege escalations' },
  network_weight: { label: 'Network Indicator Weight', icon: Globe, color: '#06b6d4', desc: 'Sensitivity to outbound C2 beacons, suspicious ports, and data exfiltration' },
  persistence_weight: { label: 'Persistence Hook Weight', icon: Lock, color: '#f43f5e', desc: 'Sensitivity to startup registry keys, scheduled tasks, and daemon services' },
  config_weight: { label: 'System Config Weight', icon: Settings, color: '#f59e0b', desc: 'Sensitivity to security policy downgrades and registry tampering' },
}

const presets = [
  {
    name: 'Ideal SOC Balance',
    icon: Shield,
    rules: { file_weight: 4, process_weight: 5, network_weight: 5, persistence_weight: 12, config_weight: 2 },
  },
  {
    name: 'Default Baseline',
    icon: Settings,
    rules: { file_weight: 5, process_weight: 7, network_weight: 10, persistence_weight: 12, config_weight: 4 },
  },
  {
    name: 'Ransomware / Persistence Focus',
    icon: Lock,
    rules: { file_weight: 5, process_weight: 5, network_weight: 5, persistence_weight: 20, config_weight: 5 },
  },
  {
    name: 'C2 Network Sentinel',
    icon: Globe,
    rules: { file_weight: 5, process_weight: 5, network_weight: 20, persistence_weight: 5, config_weight: 5 },
  },
  {
    name: 'Aggressive Threat Hunter',
    icon: Flame,
    rules: { file_weight: 7, process_weight: 12, network_weight: 15, persistence_weight: 18, config_weight: 8 },
  },
]

export default function RuleSettingsPage({ rules, onSave, canEdit = false }) {
  const [form, setForm] = useState(rules || {})
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (rules) setForm(rules)
  }, [rules])

  const update = (key, value) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0))
    setForm((prev) => ({ ...prev, [key]: num }))
  }

  const setPreset = (presetRules) => {
    soundManager.playClick()
    setForm(presetRules)
    onSave(presetRules)
    addToast({
      type: 'info',
      title: 'Tuning Preset Loaded',
      message: 'Rule weights updated to preset values',
    })
  }

  const handleSave = async () => {
    soundManager.playClick()
    setSaving(true)
    try {
      await onSave(form)
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } })
      addToast({
        type: 'success',
        title: 'Rules Applied',
        message: 'Custom tuning configuration saved successfully to behavioral engine',
      })
    } catch (e) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: e.message || 'Unable to update rules',
      })
    } finally {
      setSaving(false)
    }
  }

  // Calculate percentage share of each weight for the visual balance bar
  const totalWeight = useMemo(() => {
    return Object.values(form).reduce((sum, v) => sum + (Number(v) || 0), 0) || 1
  }, [form])

  if (!canEdit) {
    return (
      <div className="page fade-in">
        <div className="card hover-lift">
          <h3>Rule Tuning Restricted</h3>
          <p className="muted">
            Only Administrator and Security Researcher roles have access to modify behavioral scoring weights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="title-row">
        <div className="title-group">
          <h2>
            <Sliders color="#38bdf8" size={26} />
            Behavioral Rule Weights & Scoring
          </h2>
          <span className="muted">
            Fine-tune risk evaluation weights and behavioral sensitivity
          </span>
        </div>
        <button
          className="primary-btn"
          disabled={saving}
          onClick={handleSave}
          style={{ minWidth: '160px' }}
        >
          <Save size={16} />
          <span>{saving ? 'Applying...' : 'Save Tuning'}</span>
        </button>
      </div>

      {/* Preset Cards */}
      <div className="card hover-lift">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Sparkles size={18} color="#38bdf8" />
          <h3 style={{ margin: 0 }}>Quick Tuning Profiles</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {presets.map((preset) => {
            const Icon = preset.icon
            return (
              <button
                key={preset.name}
                className="ghost-btn"
                onClick={() => setPreset(preset.rules)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1rem',
                  justifyContent: 'flex-start',
                }}
              >
                <Icon size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem' }}>{preset.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Relative Weight Balance Bar */}
      <div className="card hover-lift">
        <h3>Weight Distribution Ratio</h3>
        <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
          Visual representation of how each behavioral vector contributes to the total risk score
        </p>
        <div
          style={{
            height: '24px',
            borderRadius: '99px',
            overflow: 'hidden',
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            marginBottom: '1rem',
          }}
        >
          {Object.entries(form).map(([key, val]) => {
            const pct = Math.round(((Number(val) || 0) / totalWeight) * 100)
            const meta = categoryMeta[key] || { color: '#64748b' }
            if (pct <= 0) return null
            return (
              <div
                key={key}
                title={`${meta.label}: ${pct}%`}
                style={{
                  width: `${pct}%`,
                  background: meta.color,
                  transition: 'width 0.3s ease',
                }}
              />
            )
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          {Object.entries(form).map(([key, val]) => {
            const pct = Math.round(((Number(val) || 0) / totalWeight) * 100)
            const meta = categoryMeta[key] || { label: key, color: '#64748b' }
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: meta.color }} />
                <span style={{ color: 'var(--text-muted)' }}>{meta.label}:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{pct}%</strong>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sliders & Inputs */}
      <div className="card hover-lift">
        <h3>Vector Sensitivity Tuners</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
          {Object.entries(form).map(([key, value]) => {
            const meta = categoryMeta[key] || {
              label: key,
              icon: Settings,
              color: '#38bdf8',
              desc: 'Behavioral weight',
            }
            const Icon = meta.icon

            return (
              <div
                key={key}
                style={{
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Icon size={18} color={meta.color} />
                    <strong style={{ fontSize: '0.95rem' }}>{meta.label}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => update(key, e.target.value)}
                      style={{
                        width: '70px',
                        textAlign: 'center',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                      }}
                    />
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>pts</span>
                  </div>
                </div>

                <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {meta.desc}
                </p>

                <input
                  type="range"
                  min="0"
                  max="50"
                  value={value}
                  onChange={(e) => update(key, e.target.value)}
                  style={{ accentColor: meta.color }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
