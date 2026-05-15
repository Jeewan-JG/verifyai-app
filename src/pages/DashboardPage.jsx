import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Users, AlertTriangle, ShieldAlert, Star, FileText, Upload, BarChart2, Trash2, CheckSquare, Square } from 'lucide-react'

const StatCard = ({ label, value, accent, Icon }) => (
  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: `3px solid ${accent || 'var(--teal)'}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      {Icon && <Icon size={16} color={accent || 'var(--teal)'} strokeWidth={1.5} />}
    </div>
    <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em' }}>{value}</div>
  </div>
)

const RiskBadge = ({ level }) => {
  const colours = { low: '#34d399', medium: '#f5a524', high: '#f43f5e' }
  return (
    <span style={{ background: colours[level] + '22', color: colours[level], borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
      {level}
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats]           = useState({ total: 0, high: 0, medium: 0, low: 0, avgScore: 0 })
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected]     = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*, analysis_results(*)')
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      const all = data || []
      setCandidates(all)
      const scores   = all.flatMap(c => c.analysis_results?.map(r => r.trust_score) || [])
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      setStats({
        total:    all.length,
        high:     all.filter(c => c.analysis_results?.[0]?.risk_level === 'high').length,
        medium:   all.filter(c => c.analysis_results?.[0]?.risk_level === 'medium').length,
        low:      all.filter(c => c.analysis_results?.[0]?.risk_level === 'low').length,
        avgScore,
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectAll = () =>
    setSelected(selected.length === candidates.length ? [] : candidates.map(c => c.id))

  const deleteSelected = async () => {
    setDeleting(true)
    try {
      for (const id of selected) {
        const { error: e1 } = await supabase.from('analysis_results').delete().eq('candidate_id', id)
        if (e1) { console.error('Delete analysis_results error:', e1); throw e1 }
        const { error: e2 } = await supabase.from('candidates').delete().eq('id', id)
        if (e2) { console.error('Delete candidates error:', e2); throw e2 }
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}\n\nPlease run the DELETE RLS policies in Supabase SQL Editor.`)
      setDeleting(false)
      return
    }
    setSelected([])
    setSelectMode(false)
    setConfirmDelete(false)
    setDeleting(false)
    load()
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-2)' }}>Loading dashboard...</div>

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f43f5e22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} color="#f43f5e" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Delete {selected.length} candidate{selected.length > 1 ? 's' : ''}?</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently delete the selected candidates and all their analysis results. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-sm" disabled={deleting}
                style={{ background: '#f43f5e', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={deleteSelected}>
                <Trash2 size={13} /> {deleting ? 'Deleting...' : 'Yes, delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="Candidates Screened" value={stats.total}            accent="var(--teal)" Icon={Users} />
        <StatCard label="High Risk"           value={stats.high}            accent="#f43f5e"     Icon={ShieldAlert} />
        <StatCard label="Medium Risk"         value={stats.medium}          accent="#f5a524"     Icon={AlertTriangle} />
        <StatCard label="Average Trust Score" value={stats.avgScore || '—'} accent="var(--teal)" Icon={Star} />
        <StatCard label="Low Risk"            value={stats.low}             accent="#34d399"     Icon={FileText} />
      </div>

      {/* Recent Candidates */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>

        {/* Header bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Recently Screened</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selectMode && selected.length > 0 && (
              <button className="btn btn-sm"
                style={{ background: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e44', display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => setConfirmDelete(true)}>
                <Trash2 size={12} /> Delete {selected.length} selected
              </button>
            )}
            {selectMode && (
              <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={selectAll}>
                {selected.length === candidates.length ? <CheckSquare size={13} /> : <Square size={13} />}
                {selected.length === candidates.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
            <button className="btn btn-sm"
              style={selectMode ? { color: '#f43f5e', borderColor: '#f43f5e44' } : {}}
              onClick={() => { setSelectMode(!selectMode); setSelected([]) }}>
              {selectMode ? 'Cancel' : <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Trash2 size={12} /> Select to delete</span>}
            </button>
            <button className="btn btn-sm" onClick={() => navigate('/candidates')}>View all →</button>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-2)' }}>
            <Users size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No candidates yet</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Upload your first CV to get started</div>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>Upload CV</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)' }}>
                {selectMode && <th style={{ padding: '10px 12px', width: 36 }} />}
                {['Candidate', 'Role', 'Trust Score', 'Risk', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map(c => {
                const result    = c.analysis_results?.[0]
                const isChecked = selected.includes(c.id)
                return (
                  <tr key={c.id}
                    style={{ borderTop: '1px solid var(--line)', cursor: 'pointer', background: isChecked ? 'var(--teal-soft, rgba(20,184,166,0.06))' : 'transparent' }}
                    onClick={() => selectMode ? toggleSelect(c.id) : navigate(`/analysis/${c.id}`)}
                    onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = 'var(--bg-3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isChecked ? 'var(--teal-soft, rgba(20,184,166,0.06))' : 'transparent' }}>
                    {selectMode && (
                      <td style={{ padding: '12px 12px' }} onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}>
                        {isChecked
                          ? <CheckSquare size={16} color="var(--teal)" />
                          : <Square size={16} color="var(--text-3)" />}
                      </td>
                    )}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                          {c.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{c.role || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{result?.trust_score ? `${result.trust_score}/100` : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {result?.risk_level ? <RiskBadge level={result.risk_level} /> : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Pending</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{c.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Upload size={16} color="var(--teal)" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Upload a CV</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Add candidates and run AI Trust Score analysis</div>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>Upload CV</button>
        </div>
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <BarChart2 size={16} color="var(--teal)" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>View Reports</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>Download and share candidate trust reports</div>
          <button className="btn btn-sm" onClick={() => navigate('/reports')}>View Reports</button>
        </div>
      </div>
    </div>
  )
}
