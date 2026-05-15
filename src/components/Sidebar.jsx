import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Users, Upload, BarChart2,
  FileText, Activity, AlertTriangle, Settings, Search
} from 'lucide-react'

function useBadgeCounts() {
  const [counts, setCounts] = useState({ candidates: null, alerts: null })
  useEffect(() => {
    const load = async () => {
      const { data: cands } = await supabase.from('candidates').select('id')
      const { data: results } = await supabase.from('analysis_results').select('fraud_flags, risk_level')
      const alertCount = (results || []).reduce((acc, r) => {
        const flags = r.fraud_flags || []
        return acc + flags.filter(f => f.severity === 'high' || f.severity === 'medium').length
      }, 0)
      setCounts({
        candidates: cands?.length || null,
        alerts:     alertCount   || null,
      })
    }
    load()
  }, [])
  return counts
}

const ACCOUNT_NAV = [
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function Sidebar({ user, onSignOut }) {
  const counts  = useBadgeCounts()
  const navigate = useNavigate()
  const name    = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Recruiter'
  const email   = user?.email || 'recruiter@company.com'
  const picture = user?.user_metadata?.avatar_url || null
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const NAV = [
    { to: '/',           label: 'Dashboard',  Icon: LayoutDashboard, badge: null,                end: true },
    { to: '/candidates', label: 'Candidates', Icon: Users,           badge: counts.candidates          },
    { to: '/upload',     label: 'Upload CV',  Icon: Upload,          badge: null                       },
    { to: '/analysis',   label: 'Analysis',   Icon: BarChart2,       badge: null                       },
    { to: '/reports',    label: 'Reports',    Icon: FileText,        badge: null                       },
    { to: '/activity',   label: 'Activity',   Icon: Activity,        badge: null                       },
    { to: '/alerts',     label: 'Alerts',     Icon: AlertTriangle,   badge: counts.alerts              },
  ]

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-brand-name" style={{ fontSize: 17 }}>
          Verify<span style={{ color: 'var(--teal)' }}>.AI</span>
          <span className="sb-brand-tm">™</span>
        </div>
      </div>

      <div className="sb-search" onClick={() => navigate('/candidates')}>
        <Search size={14} />
        <span>Search candidates</span>
        <kbd>⌘K</kbd>
      </div>

      <div className="sb-section">Workspace</div>
      <nav className="sb-nav">
        {NAV.map(({ to, label, Icon, badge, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '')}>
            <span className="sb-icon"><Icon size={16} /></span>
            <span>{label}</span>
            {badge && <span className="sb-badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sb-section">Account</div>
      <nav className="sb-nav">
        {ACCOUNT_NAV.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => 'sb-item' + (isActive ? ' active' : '')}>
            <span className="sb-icon"><Icon size={16} /></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sb-spacer" />
      <div className="sb-user">
        {picture
          ? <img src={picture} className="sb-avatar" style={{ objectFit: 'cover' }} alt={name} referrerPolicy="no-referrer" />
          : <div className="sb-avatar">{initials}</div>}
        <div className="sb-user-meta">
          <div className="sb-user-name">{name}</div>
          <div className="sb-user-co" title={email}>Acme Talent · Lead</div>
        </div>
      </div>
    </aside>
  )
}
