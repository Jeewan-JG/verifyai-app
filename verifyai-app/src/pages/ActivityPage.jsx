import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Activity, Upload, BarChart2, RefreshCw, UserCheck, Filter } from 'lucide-react'

const EVENT_TYPES = {
  uploaded:  { label: 'Candidate Added to Trust Pipeline',      Icon: Upload,      color: 'var(--teal)' },
  reviewed:  { label: 'Trust Intelligence Report Generated',    Icon: BarChart2,   color: '#34d399'     },
  rerun:     { label: 'Trust Intelligence Re-run',              Icon: RefreshCw,   color: '#f5a524'     },
  pending:   { label: 'Candidate Profile Created',              Icon: UserCheck,   color: '#64748b'     },
}

export default function ActivityPage() {
  const navigate  = useNavigate()
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('candidates')
        .select('id, full_name, role, status, created_at, analysis_results(trust_score, risk_level, created_at)')
        .order('created_at', { ascending: false })

      // Build activity feed from candidates + their analysis results
      const feed = []
      for (const c of (data || [])) {
        feed.push({
          id:        `${c.id}-added`,
          type:      'pending',
          candidate: c.full_name,
          candidateId: c.id,
          detail:    c.role ? `Applied for ${c.role}` : 'Candidate profile created',
          time:      c.created_at,
        })
        if (c.analysis_results?.[0]) {
          const r = c.analysis_results[0]
          feed.push({
            id:        `${c.id}-analysed`,
            type:      'reviewed',
            candidate: c.full_name,
            candidateId: c.id,
            detail:    `Trust score: ${r.trust_score}/100 · ${r.risk_level} risk`,
            time:      r.created_at,
          })
        }
      }
      // Sort by time descending
      feed.sort((a, b) => new Date(b.time) - new Date(a.time))
      setEvents(feed)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-2)' }}>Loading activity...</div>

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Audit Log</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Complete, immutable record of all platform actions for compliance and AI governance</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={13} color="var(--text-3)" />
          <select className="input" style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All activity</option>
            <option value="pending">Candidates added</option>
            <option value="reviewed">Analysis complete</option>
          </select>
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={15} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Audit Trail</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)' }}>{filtered.length} events</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-2)' }}>
            <Activity size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Audit trail is empty</div>
            <div style={{ fontSize: 13 }}>All platform actions are logged here for compliance and governance</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((event, i) => {
              const config = EVENT_TYPES[event.type] || EVENT_TYPES.pending
              const { Icon } = config
              return (
                <div key={event.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--line)', cursor: 'pointer' }}
                  onClick={() => navigate(`/analysis/${event.candidateId}`)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: config.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Icon size={14} color={config.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      <span style={{ color: config.color }}>{config.label}</span>
                      {' — '}
                      <span>{event.candidate}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{event.detail}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{timeAgo(event.time)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
