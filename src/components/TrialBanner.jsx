import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function TrialBanner() {
  const { isOnTrial, trialDaysLeft } = useAuth()
  const navigate = useNavigate()

  if (!isOnTrial) return null

  const urgent = trialDaysLeft <= 2
  const color = urgent ? '#f59e0b' : '#14b8a6'
  const bg = urgent ? 'rgba(245,158,11,0.08)' : 'rgba(20,184,166,0.07)'
  const border = urgent ? 'rgba(245,158,11,0.25)' : 'rgba(20,184,166,0.2)'

  return (
    <div style={{
      background: bg, borderBottom: `1px solid ${border}`,
      padding: '8px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        <span style={{ fontSize: 13, color, fontWeight: 600 }}>
          {trialDaysLeft === 0
            ? 'Your free trial expires today'
            : `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in your free trial`}
        </span>
        <span style={{ fontSize: 13, color: '#64748b' }}>— upgrade to keep access</span>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        style={{
          background: color, color: '#0b1220', border: 'none', borderRadius: 6,
          padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
        View plans
      </button>
    </div>
  )
}
