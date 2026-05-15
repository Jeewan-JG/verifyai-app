import { Menu, Search, Bell, Calendar, Filter } from 'lucide-react'

export default function Topbar({ title, subtitle, onMobileMenu, onSignOut }) {
  return (
    <div className="topbar">
      <button className="mobile-menu-btn btn btn-icon btn-ghost" onClick={onMobileMenu}>
        <Menu size={16} />
      </button>
      <div className="topbar-title">{title}</div>
      {subtitle && <div className="topbar-sub">{subtitle}</div>}
      <div className="topbar-actions">
        <button className="btn btn-sm btn-ghost btn-icon"><Search size={14} /></button>
        <button className="btn btn-sm btn-ghost btn-icon" style={{ position: 'relative' }}>
          <Bell size={14} />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
        </button>
        <button className="btn btn-sm btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={12} /> May 10 — May 16, 2026
        </button>
        <button className="btn btn-sm">
          <Filter size={14} /> Filters
        </button>
        <button className="btn btn-sm btn-ghost" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  )
}
