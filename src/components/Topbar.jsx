import { Menu, Search, Bell, Calendar, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Topbar({ title, subtitle, onMobileMenu, onSignOut }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal,  setSearchVal]  = useState('')
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [calOpen,    setCalOpen]    = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [bellAnim,   setBellAnim]   = useState(false)
  const [notifications, setNotifications] = useState([])

  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear,  setCalYear]  = useState(new Date().getFullYear())
  const [selDates, setSelDates] = useState([])

  const searchRef = useRef(null)
  const notifRef  = useRef(null)
  const calRef    = useRef(null)
  const filterRef = useRef(null)

  useEffect(() => {
    supabase.from('candidates')
      .select('id, full_name, created_at, analysis_results(trust_score, risk_level)')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data) setNotifications(data) })
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false)
      if (calRef.current    && !calRef.current.contains(e.target))    setCalOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeAll = () => { setNotifOpen(false); setCalOpen(false); setFilterOpen(false) }

  const handleBell = () => {
    setBellAnim(true)
    setTimeout(() => setBellAnim(false), 600)
    setNotifOpen(v => !v)
    setCalOpen(false); setFilterOpen(false)
  }

  const today = new Date()
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate()
  const firstWeekday = new Date(calYear, calMonth, 1).getDay()

  const toggleDay = (day) => {
    const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    setSelDates(p => p.includes(key) ? p.filter(d => d !== key) : [...p, key])
  }

  const [riskFilter,   setRiskFilter]   = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  return (
    <div className="topbar" style={{ position: 'relative', zIndex: 100 }}>
      <button className="mobile-menu-btn btn btn-icon btn-ghost" onClick={onMobileMenu}>
        <Menu size={16} />
      </button>
      <div className="topbar-title">{title}</div>
      {subtitle && <div className="topbar-sub">{subtitle}</div>}

      <div className="topbar-actions">

        {/* ── Search ── */}
        {searchOpen ? (
          <div style={{ display:'flex', alignItems:'center', background:'var(--bg-2)', border:'1px solid var(--teal)', borderRadius:8, padding:'5px 10px', gap:6, animation:'expandIn .15s ease', overflow:'hidden' }}>
            <Search size={13} color="var(--teal)" />
            <input
              ref={searchRef}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search candidates..."
              style={{ background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:13, width:180 }}
            />
            <button onClick={() => { setSearchOpen(false); setSearchVal('') }} style={{ color:'var(--text-3)', display:'flex', padding:2, borderRadius:4 }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            className="btn btn-sm btn-ghost btn-icon"
            style={{ transition:'transform .15s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.18)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            onClick={() => { setSearchOpen(true); closeAll() }}>
            <Search size={14} />
          </button>
        )}

        {/* ── Bell ── */}
        <div ref={notifRef} style={{ position:'relative' }}>
          <button
            className="btn btn-sm btn-ghost btn-icon"
            style={{ position:'relative', transition:'transform .15s' }}
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.18)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            onClick={handleBell}>
            <Bell size={14} className={bellAnim ? 'bell-shake' : ''} />
            {notifications.length > 0 && (
              <span className="notif-dot" style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:'var(--red)' }} />
            )}
          </button>

          {notifOpen && (
            <div className="topbar-dropdown" style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--bg-2)', border:'1px solid var(--line-2)', borderRadius:12, boxShadow:'0 20px 48px rgba(0,0,0,0.45)', width:310, zIndex:300, overflow:'hidden' }}>
              <div style={{ padding:'11px 14px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:600, fontSize:13 }}>Recent Activity</span>
                <span style={{ fontSize:11, color:'var(--text-3)' }}>{notifications.length} items</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding:24, textAlign:'center', color:'var(--text-3)', fontSize:13 }}>No activity yet</div>
              ) : notifications.map((n, i) => {
                const r = n.analysis_results?.[0]
                const riskColor = r?.risk_level === 'high' ? '#f43f5e' : r?.risk_level === 'medium' ? '#f5a524' : '#34d399'
                return (
                  <div key={n.id}
                    style={{ padding:'10px 14px', borderBottom: i < notifications.length - 1 ? '1px solid var(--line)' : 'none', display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', transition:'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#000', flexShrink:0 }}>
                      {n.full_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>{n.full_name}</div>
                      <div style={{ fontSize:11.5, color:'var(--text-3)', marginTop:2 }}>
                        {r ? <><span style={{ color:riskColor, fontWeight:600 }}>{r.trust_score}/100</span> · <span style={{ color:riskColor }}>{r.risk_level} risk</span></> : 'Analysis pending'}
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-4)', flexShrink:0, marginTop:2 }}>{getTimeAgo(n.created_at)}</div>
                  </div>
                )
              })}
              <div style={{ padding:'9px 14px', borderTop:'1px solid var(--line)', textAlign:'center' }}>
                <button style={{ fontSize:12, color:'var(--teal)', background:'none', border:'none', cursor:'pointer' }}>View all activity →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Calendar ── */}
        <div ref={calRef} style={{ position:'relative' }}>
          <button
            className="btn btn-sm btn-ghost"
            style={{ display:'flex', alignItems:'center', gap:6, transition:'all .15s', borderColor: calOpen ? 'var(--teal)' : 'transparent', color: calOpen ? 'var(--teal)' : undefined }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--teal)'; e.currentTarget.style.color='var(--teal)' }}
            onMouseLeave={e => { if (!calOpen) { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--text-2)' } }}
            onClick={() => { setCalOpen(v=>!v); setNotifOpen(false); setFilterOpen(false) }}>
            <Calendar size={12} />
            <span style={{ fontSize:12 }}>
              {selDates.length > 0 ? `${selDates.length} day${selDates.length > 1 ? 's' : ''} selected` : 'May 10 — May 16, 2026'}
            </span>
          </button>

          {calOpen && (
            <div className="topbar-dropdown" style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--bg-2)', border:'1px solid var(--line-2)', borderRadius:12, boxShadow:'0 20px 48px rgba(0,0,0,0.45)', width:272, zIndex:300, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <button
                  onClick={() => { if (calMonth===0) { setCalMonth(11); setCalYear(y=>y-1) } else setCalMonth(m=>m-1) }}
                  style={{ color:'var(--text-2)', padding:'3px 6px', borderRadius:6, display:'flex', cursor:'pointer', border:'1px solid transparent' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize:13, fontWeight:600 }}>{MONTHS[calMonth]} {calYear}</span>
                <button
                  onClick={() => { if (calMonth===11) { setCalMonth(0); setCalYear(y=>y+1) } else setCalMonth(m=>m+1) }}
                  style={{ color:'var(--text-2)', padding:'3px 6px', borderRadius:6, display:'flex', cursor:'pointer', border:'1px solid transparent' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-3)'}
                  onMouseLeave={e=>e.currentTarget.style.background='none'}>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign:'center', fontSize:10, color:'var(--text-4)', fontWeight:600, padding:'2px 0' }}>{d}</div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                {Array.from({ length: firstWeekday }).map((_,i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_,i) => {
                  const day = i + 1
                  const key = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const isSel   = selDates.includes(key)
                  const isToday = day===today.getDate() && calMonth===today.getMonth() && calYear===today.getFullYear()
                  return (
                    <button key={day} onClick={() => toggleDay(day)} style={{
                      width:'100%', aspectRatio:'1', borderRadius:6, fontSize:11.5, cursor:'pointer', transition:'all .1s',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background: isSel ? 'var(--teal)' : 'none',
                      color: isSel ? '#000' : isToday ? 'var(--teal)' : 'var(--text-2)',
                      fontWeight: isSel || isToday ? 700 : 400,
                      border: isToday && !isSel ? '1px solid var(--teal)' : '1px solid transparent',
                    }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='var(--bg-3)' }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='none' }}>
                      {day}
                    </button>
                  )
                })}
              </div>

              {selDates.length > 0 && (
                <button onClick={() => setSelDates([])} style={{ marginTop:10, width:'100%', padding:'6px', borderRadius:6, fontSize:12, color:'var(--text-3)', background:'var(--bg-3)', border:'1px solid var(--line-2)', cursor:'pointer' }}>
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <div ref={filterRef} style={{ position:'relative' }}>
          <button
            className={`btn btn-sm${filterOpen ? ' btn-primary' : ''}`}
            style={{ transition:'all .15s' }}
            onClick={() => { setFilterOpen(v=>!v); setNotifOpen(false); setCalOpen(false) }}>
            <Filter size={13} style={{ transition:'transform .25s', transform: filterOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            Filters
          </button>

          {filterOpen && (
            <div className="topbar-dropdown" style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--bg-2)', border:'1px solid var(--line-2)', borderRadius:12, boxShadow:'0 20px 48px rgba(0,0,0,0.45)', width:230, zIndex:300, overflow:'hidden' }}>
              <div style={{ padding:'11px 14px', borderBottom:'1px solid var(--line)', fontWeight:600, fontSize:13 }}>Filter candidates</div>

              {[
                { label:'Risk Level', opts:['All','High','Medium','Low'], val:riskFilter, set:setRiskFilter },
                { label:'Status',     opts:['All','Reviewed','Pending'],  val:statusFilter, set:setStatusFilter },
              ].map(g => (
                <div key={g.label} style={{ padding:'10px 14px', borderBottom:'1px solid var(--line)' }}>
                  <div style={{ fontSize:10.5, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7, fontWeight:600 }}>{g.label}</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {g.opts.map(opt => (
                      <button key={opt} onClick={() => g.set(opt)} style={{
                        padding:'4px 10px', borderRadius:6, fontSize:12, cursor:'pointer', transition:'all .1s',
                        background: g.val===opt ? 'var(--teal)' : 'var(--bg-3)',
                        color:      g.val===opt ? '#000' : 'var(--text-2)',
                        border:     g.val===opt ? '1px solid var(--teal)' : '1px solid var(--line-2)',
                      }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ padding:'10px 14px', display:'flex', gap:8 }}>
                <button onClick={() => { setRiskFilter('All'); setStatusFilter('All') }}
                  style={{ flex:1, padding:'6px', borderRadius:7, fontSize:12, background:'var(--bg-3)', border:'1px solid var(--line-2)', color:'var(--text-3)', cursor:'pointer' }}>
                  Reset
                </button>
                <button onClick={() => setFilterOpen(false)}
                  style={{ flex:1, padding:'6px', borderRadius:7, fontSize:12, background:'var(--teal)', border:'none', color:'#000', fontWeight:600, cursor:'pointer' }}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-sm btn-ghost" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  )
}
