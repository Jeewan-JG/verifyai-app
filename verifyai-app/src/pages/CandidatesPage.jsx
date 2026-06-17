import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, Upload, Users, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'

const RiskBadge = ({ level }) => {
  if (!level) return <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Pending</span>
  const colours = { low: '#34d399', medium: '#f5a524', high: '#f43f5e' }
  return (
    <span style={{ background: colours[level] + '22', color: colours[level], borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
      {level}
    </span>
  )
}

const ScoreBar = ({ score }) => {
  if (!score) return <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
  const color = score >= 70 ? '#34d399' : score >= 40 ? '#f5a524' : '#f43f5e'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden', width: 80 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{score}</span>
    </div>
  )
}

// Mini calendar date-range picker component
function DateRangePicker({ from, to, onChange, onClear }) {
  const [open, setOpen]         = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [picking, setPicking]   = useState('from') // 'from' | 'to'
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate()
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay()

  const y = viewDate.getFullYear()
  const m = viewDate.getMonth()
  const totalDays = daysInMonth(y, m)
  const startOffset = firstDayOfMonth(y, m) // 0=Sun
  const weeks = Math.ceil((startOffset + totalDays) / 7)

  const prevMonth = () => setViewDate(new Date(y, m - 1, 1))
  const nextMonth = () => setViewDate(new Date(y, m + 1, 1))

  const handleDayClick = (day) => {
    const d = new Date(y, m, day)
    const iso = d.toISOString().slice(0, 10)
    if (picking === 'from') {
      onChange({ from: iso, to: to && iso > to ? iso : to })
      setPicking('to')
    } else {
      if (from && iso < from) {
        onChange({ from: iso, to: from })
      } else {
        onChange({ from, to: iso })
      }
      setPicking('from')
      setOpen(false)
    }
  }

  const inRange = (day) => {
    if (!from || !to) return false
    const d = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return d >= from && d <= to
  }
  const isFrom = (day) => from === `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const isTo   = (day) => to   === `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const label = from && to
    ? `${from} → ${to}`
    : from ? `From ${from}` : 'Filter by date'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 12, background: (from || to) ? 'rgba(20,184,166,0.12)' : undefined, borderColor: (from || to) ? 'var(--teal)' : undefined, color: (from || to) ? 'var(--teal)' : undefined }}
        onClick={() => setOpen(v => !v)}>
        <Calendar size={13} />
        <span style={{ fontSize: 12 }}>{label}</span>
        {(from || to) && (
          <span onMouseDown={e => { e.stopPropagation(); onClear(); setOpen(false) }}
            style={{ marginLeft: 2, display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: 0.7 }}>
            <X size={11} />
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.35)', minWidth: 260 }}>
          {/* Hint */}
          <div style={{ fontSize: 11, color: 'var(--teal)', marginBottom: 10, fontWeight: 600 }}>
            {picking === 'from' ? 'Select start date' : 'Select end date'}
          </div>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button className="btn btn-sm" style={{ padding: '2px 6px' }} onClick={prevMonth}><ChevronLeft size={13} /></button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{monthNames[m]} {y}</span>
            <button className="btn btn-sm" style={{ padding: '2px 6px' }} onClick={nextMonth}><ChevronRight size={13} /></button>
          </div>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: weeks * 7 }).map((_, i) => {
              const day = i - startOffset + 1
              const valid = day >= 1 && day <= totalDays
              const highlighted = valid && inRange(day)
              const selected = valid && (isFrom(day) || isTo(day))
              return (
                <div key={i}
                  onClick={() => valid && handleDayClick(day)}
                  style={{
                    textAlign: 'center', fontSize: 12, padding: '5px 2px', borderRadius: 6, cursor: valid ? 'pointer' : 'default',
                    color: !valid ? 'transparent' : selected ? '#000' : highlighted ? 'var(--teal)' : 'var(--text)',
                    background: selected ? 'var(--teal)' : highlighted ? 'rgba(20,184,166,0.15)' : 'transparent',
                    fontWeight: selected ? 700 : 400,
                  }}>
                  {valid ? day : ''}
                </div>
              )
            })}
          </div>
          {/* Quick presets */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Today',    fn: () => { const d = new Date().toISOString().slice(0,10); onChange({ from: d, to: d }); setOpen(false) }},
              { label: 'Last 7d',  fn: () => { const t = new Date(), f = new Date(t); f.setDate(f.getDate()-6); onChange({ from: f.toISOString().slice(0,10), to: t.toISOString().slice(0,10) }); setOpen(false) }},
              { label: 'Last 30d', fn: () => { const t = new Date(), f = new Date(t); f.setDate(f.getDate()-29); onChange({ from: f.toISOString().slice(0,10), to: t.toISOString().slice(0,10) }); setOpen(false) }},
              { label: 'This month', fn: () => { const n = new Date(); onChange({ from: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`, to: n.toISOString().slice(0,10) }); setOpen(false) }},
            ].map(p => (
              <button key={p.label} className="btn btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={p.fn}>{p.label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CandidatesPage() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sortBy, setSortBy]         = useState('newest')
  const [dateRange, setDateRange]   = useState({ from: '', to: '' })

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*, analysis_results(*)')
        .order('created_at', { ascending: false })
      if (!error) setCandidates(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = candidates
    .filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q || c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.role?.toLowerCase().includes(q)
      const risk = c.analysis_results?.[0]?.risk_level
      const matchRisk = riskFilter === 'all' || risk === riskFilter || (!risk && riskFilter === 'pending')
      const cDate = c.created_at?.slice(0, 10)
      const matchDate = (!dateRange.from || cDate >= dateRange.from) && (!dateRange.to || cDate <= dateRange.to)
      return matchSearch && matchRisk && matchDate
    })
    .sort((a, b) => {
      const aScore = a.analysis_results?.[0]?.trust_score
      const bScore = b.analysis_results?.[0]?.trust_score
      if (sortBy === 'score-asc')  return (aScore || 0) - (bScore || 0)
      if (sortBy === 'score-desc') return (bScore || 0) - (aScore || 0)
      if (sortBy === 'name')       return a.full_name?.localeCompare(b.full_name)
      return new Date(b.created_at) - new Date(a.created_at)
    })

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-2)' }}>Loading candidates...</div>

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Search by name, email or role..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="all">All risk levels</option>
          <option value="high">High risk</option>
          <option value="medium">Medium risk</option>
          <option value="low">Low risk</option>
          <option value="pending">Pending</option>
        </select>
        <select className="input" style={{ width: 160 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="score-asc">Score: Low to High</option>
          <option value="score-desc">Score: High to Low</option>
          <option value="name">Name A–Z</option>
        </select>
        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onChange={r => setDateRange(r)}
          onClear={() => setDateRange({ from: '', to: '' })}
        />
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/upload')}>
          <Upload size={14} /> Add Candidate
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-2)', flexWrap: 'wrap' }}>
        <span><b style={{ color: 'var(--text)' }}>{candidates.length}</b> in trust pipeline</span>
        <span><b style={{ color: '#f43f5e' }}>{candidates.filter(c => c.analysis_results?.[0]?.risk_level === 'high').length}</b> high risk</span>
        <span><b style={{ color: '#f5a524' }}>{candidates.filter(c => c.analysis_results?.[0]?.risk_level === 'medium').length}</b> medium risk</span>
        <span><b style={{ color: '#34d399' }}>{candidates.filter(c => c.analysis_results?.[0]?.risk_level === 'low').length}</b> verified</span>
        <span><b style={{ color: 'var(--text)' }}>{filtered.length}</b> showing</span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-2)' }}>
            <Users size={32} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {candidates.length === 0 ? 'No candidates in trust pipeline' : 'No results found'}
            </div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>
              {candidates.length === 0 ? 'Add your first candidate to begin trust intelligence analysis' : 'Try adjusting your search or filters'}
            </div>
            {candidates.length === 0 && (
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>Add Candidate</button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--line)' }}>
                {['Candidate', 'Role', 'Location', 'Trust Score', 'Risk', 'Status', 'Added'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const result  = c.analysis_results?.[0]
                const dateObj = new Date(c.created_at)
                const dateFmt = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeFmt = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                const date    = `${dateFmt}, ${timeFmt}`
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--line)', cursor: 'pointer' }}
                    onClick={() => navigate(`/analysis/${c.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                          {c.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{c.role || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-2)' }}>{c.location || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><ScoreBar score={result?.trust_score} /></td>
                    <td style={{ padding: '12px 16px' }}><RiskBadge level={result?.risk_level} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{c.status}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)' }}>{date}</td>
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
