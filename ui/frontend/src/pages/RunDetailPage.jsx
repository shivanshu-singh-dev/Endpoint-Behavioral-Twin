function renderTreeNode(node, depth = 0) {
  return (
    <div key={`${node.pid}-${depth}`} style={{ marginLeft: depth * 16 }}>
      {node.name} (PID {node.pid})
      {node.children?.map((child) => renderTreeNode(child, depth + 1))}
    </div>
  )
}

export default function RunDetailPage({ detail, timeline }) {
  return (
    <div className="page">
      <h2>Run #{detail.run_id} · {detail.filename}</h2>
      <section className="stats-grid">
        <div className="card"><h3>Verdict</h3><p>{detail.verdict || 'Unknown'}</p></div>
        <div className="card"><h3>Risk Score</h3><p>{detail.risk_score ?? '-'}</p></div>
        <div className="card"><h3>Confidence</h3><p>{detail.confidence || '-'}</p></div>
      </section>

      <section className="two-col">
        <div className="card">
          <h3>Explain Verdict</h3>
          <ul>{detail.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          <p>{detail.attack_narrative}</p>
        </div>
        <div className="card">
          <h3>Risk Score Breakdown</h3>
          {detail.risk_breakdown.map((item) => (
            <p key={item.category}>{item.category} ▮ {item.score_contribution} ({item.count} events)</p>
          ))}
        </div>
      </section>

      <section className="two-col">
        <div className="card">
          <h3>Behavior Timeline</h3>
          <ul>
            {timeline.map((t) => <li key={t.event_id}>{t.offset_seconds.toFixed(1)}s · {t.category}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3>Process Tree</h3>
          {detail.process_tree.roots?.map((root) => renderTreeNode(root))}
        </div>
      </section>

      <div className="card">
        <h3>Behavior Events</h3>
        <ul>
          {detail.events.map((e) => (
            <li key={e.event_id}><strong>{e.category}</strong> @ {new Date(e.timestamp).toLocaleTimeString()} — {JSON.stringify(e.detail)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
