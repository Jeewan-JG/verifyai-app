import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FileText, Download, Search, Filter, BarChart2 } from 'lucide-react'

export default function ReportsPage() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('candidates')
        .select('*, analysis_results(*)')
        .eq('status', 'reviewed')
        .order('created_at', { ascending: false })
      setCandidates(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    return !q || c.full_name?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q)
  })

  const riskColor = (level) => level === 'low' ? '#34d399' : level === 'medium' ? '#f5a524' : level === 'high' ? '#f43f5e' : '#64748b'

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-2)' }}>Loading reports...</div>

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Reports</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Download and share candidate trust reports</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: 30, width: 220 }} placeholder="Search candidates..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Reviewed', value: candidates.length, accent: 'var(--teal)' },
          { label: 'Low Risk', value: candidates.filter(c => c.analysis_results?.[0]?.risk_level === 'low').length, accent: '#34d399' },
          { label: 'Medium Risk', value: candidates.filter(c => c.analysis_results?.[0]?.risk_level === 'medium').length, accent: '#f5a524' },
          { label: 'High Risk', value: candidates.filter(c => c.analysis_results?.[0]?.risk_level === 'high').length, accent: '#f43f5e' },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderTop: `3px solid ${card.accent}`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Reports table */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={15} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Analysed Candidates</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)' }}>{filtered.length} reports</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-2)' }}>
            <BarChart2 size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No reports yet</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Upload and analyse candidates to generate reports</div>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>Upload CV</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--line)' }}>
                {['Candidate', 'Role', 'Trust Score', 'Risk Level', 'Reviewed', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const result = c.analysis_results?.[0]
                const scoreColor = result?.trust_score >= 70 ? '#34d399' : result?.trust_score >= 40 ? '#f5a524' : '#f43f5e'
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                          {c.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{c.role || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {result?.trust_score
                        ? <span style={{ fontWeight: 700, color: scoreColor }}>{result.trust_score}/100</span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {result?.risk_level
                        ? <span style={{ background: riskColor(result.risk_level) + '22', color: riskColor(result.risk_level), borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{result.risk_level}</span>
                        : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Pending</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)' }}>
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                          onClick={() => navigate(`/analysis/${c.id}`)}>
                          <BarChart2 size={12} /> View
                        </button>
                        <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <Download size={12} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
