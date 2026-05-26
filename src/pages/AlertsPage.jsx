import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertTriangle, ShieldAlert, Bell, CheckCircle, BarChart2 } from 'lucide-react'

export default function AlertsPage() {
  const navigate  = useNavigate()
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('candidates')
        .select('id, full_name, role, location, created_at, analysis_results(trust_score, risk_level, fraud_flags, summary)')
        .order('created_at', { ascending: false })

      // Build alerts from high/medium risk candidates and fraud flags
      const flagged = []
      for (const c of (data || [])) {
        const r = c.analysis_results?.[0]
        if (!r) continue

        // High risk candidate alert
        if (r.risk_level === 'high') {
          flagged.push({
            id:          `${c.id}-risk`,
            type:        'high',
            title:       'High Risk Candidate Detected',
            candidate:   c.full_name,
            candidateId: c.id,
            detail:      `Trust score ${r.trust_score}/100 — ${r.summary || 'Significant fraud indicators found'}`,
            time:        c.created_at,
          })
        }

        // Individual fraud flags
        const flags = r.fraud_flags || []
        for (const flag of flags.filter(f => f.severity === 'high' || f.severity === 'medium')) {
          flagged.push({
            id:          `${c.id}-${flag.title}`,
            type:        flag.severity,
            title:       flag.title,
            candidate:   c.full_name,
            candidateId: c.id,
            detail:      flag.description,
            time:        c.created_at,
          })
        }
      }

      flagged.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.type] - order[b.type]
      })

      setAlerts(flagged)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter)

  const severityConfig = {
    high:   { color: '#f43f5e', bg: '#f43f5e22', Icon: ShieldAlert,    label: 'High' },
    medium: { color: '#f5a524', bg: '#f5a52422', Icon: AlertTriangle,  label: 'Medium' },
    low:    { color: '#34d399', bg: '#34d39922', Icon: Bell,           label: 'Low' },
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-2)' }}>Loading alerts...</div>

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            Risk Signals
            {alerts.filter(a => a.type === 'high').length > 0 && (
              <span style={{ background: '#f43f5e22', color: '#f43f5e', borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                {alerts.filter(a => a.type === 'high').length} high
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Risk intelligence signals and trust anomalies across all candidates</div>
        </div>
        <select className="input" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All alerts</option>
          <option value="high">High severity</option>
          <option value="medium">Medium severity</option>
        </select>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'High Severity', count: alerts.filter(a => a.type === 'high').length, color: '#f43f5e' },
          { label: 'Medium Severity', count: alerts.filter(a => a.type === 'medium').length, color: '#f5a524' },
          { label: 'Total Alerts', count: alerts.length, color: 'var(--teal)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '14px 20px', minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Alerts list */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Active Risk Signals</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)' }}>{filtered.length} alerts</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-2)' }}>
            <CheckCircle size={32} strokeWidth={1} color="#34d399" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No risk signals</div>
            <div style={{ fontSize: 13 }}>
              {alerts.length === 0 ? 'No risk intelligence signals detected across all candidates' : 'No signals match the selected filter'}
            </div>
          </div>
        ) : (
          <div>
            {filtered.map((alert, i) => {
              const cfg = severityConfig[alert.type] || severityConfig.medium
              const { Icon } = cfg
              return (
                <div key={alert.id}
                  style={{ padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--line)', borderLeft: `3px solid ${cfg.color}`, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                  onClick={() => navigate(`/analysis/${alert.candidateId}`)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{alert.title}</div>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500, marginBottom: 3 }}>{alert.candidate}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{alert.detail}</div>
                  </div>
                  <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); navigate(`/analysis/${alert.candidateId}`) }}>
                    <BarChart2 size={12} /> Review
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
