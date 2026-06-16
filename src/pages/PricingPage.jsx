import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const PLANS = [
  {
    name: 'Starter',
    tag: 'Most popular',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'Perfect for independent recruiters and small agencies.',
    features: [
      '50 CV analyses per month',
      'AI Trust Score + fraud flags',
      'Link verification agent',
      'PDF report export',
      'Email support',
    ],
    cta: 'Start Starter plan',
    highlight: true,
  },
  {
    name: 'Agency',
    tag: null,
    monthlyPrice: 199,
    annualPrice: 159,
    description: 'For growing agencies processing high volumes.',
    features: [
      '500 CV analyses per month',
      'Everything in Starter',
      'Team seats (up to 10)',
      'ATS integration (Bullhorn, Greenhouse)',
      'Compliance Center',
      'Priority support',
    ],
    cta: 'Start Agency plan',
    highlight: false,
  },
  {
    name: 'Enterprise',
    tag: null,
    monthlyPrice: null,
    annualPrice: null,
    description: 'Custom volumes, dedicated infrastructure, SLA.',
    features: [
      'Unlimited CV analyses',
      'Everything in Agency',
      'Custom AI model fine-tuning',
      'Dedicated account manager',
      'SSO / SAML',
      'Custom SLA & DPA',
    ],
    cta: 'Contact sales',
    highlight: false,
  },
]

export default function PricingPage({ trialExpired = false }) {
  const [annual, setAnnual] = useState(false)
  const navigate = useNavigate()
  const { trialDaysLeft, isOnTrial } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: '#0b1220', padding: '48px 24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
        {trialExpired && (
          <div style={{ display: 'inline-block', background: 'rgba(244,63,94,0.12)', color: '#f43f5e',
            border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            Your 7-day free trial has ended — choose a plan to continue
          </div>
        )}
        {isOnTrial && !trialExpired && (
          <div style={{ display: 'inline-block', background: 'rgba(20,184,166,0.1)', color: '#14b8a6',
            border: '1px solid rgba(20,184,166,0.25)', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your free trial
          </div>
        )}
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 0 28px' }}>
          Stop CV fraud before it reaches your shortlist. No hidden fees.
        </p>

        {/* Annual / Monthly toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#1e293b',
          border: '1px solid #334155', borderRadius: 30, padding: '6px 16px' }}>
          <span style={{ fontSize: 13, color: annual ? '#64748b' : '#f1f5f9', fontWeight: 600 }}>Monthly</span>
          <button onClick={() => setAnnual(v => !v)}
            style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative',
              background: annual ? '#14b8a6' : '#334155', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', top: 3, left: annual ? 21 : 3, width: 16, height: 16,
              borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
          <span style={{ fontSize: 13, color: annual ? '#f1f5f9' : '#64748b', fontWeight: 600 }}>
            Annual <span style={{ color: '#14b8a6' }}>save 20%</span>
          </span>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20, maxWidth: 980, margin: '0 auto' }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            background: plan.highlight ? 'linear-gradient(145deg, #0d2137 0%, #0f2a3f 100%)' : '#111827',
            border: plan.highlight ? '1px solid rgba(20,184,166,0.4)' : '1px solid #1e293b',
            borderRadius: 16, padding: 28, position: 'relative',
            boxShadow: plan.highlight ? '0 0 40px rgba(20,184,166,0.1)' : 'none',
          }}>
            {plan.tag && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: '#14b8a6', color: '#0b1220', fontSize: 11, fontWeight: 700,
                padding: '3px 12px', borderRadius: 20, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {plan.tag}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#14b8a6', fontFamily: 'monospace', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                {plan.name}
              </div>
              {plan.monthlyPrice ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: '#f1f5f9' }}>
                    £{annual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span style={{ fontSize: 14, color: '#64748b' }}>/mo</span>
                  {annual && (
                    <span style={{ fontSize: 12, color: '#14b8a6', marginLeft: 6 }}>billed annually</span>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9' }}>Custom</div>
              )}
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, lineHeight: 1.5 }}>
                {plan.description}
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#cbd5e1' }}>
                  <span style={{ color: '#14b8a6', marginTop: 1, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => plan.name === 'Enterprise' ? null : alert('Stripe payments coming soon — contact jeewang936@gmail.com to upgrade.')}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, transition: 'opacity 0.15s',
                background: plan.highlight ? '#14b8a6' : '#1e293b',
                color: plan.highlight ? '#0b1220' : '#f1f5f9',
                border: plan.highlight ? 'none' : '1px solid #334155',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <p style={{ fontSize: 13, color: '#475569' }}>
          All plans include UK data hosting · GDPR compliant · Cancel any time
        </p>
        {!trialExpired && (
          <button onClick={() => navigate(-1)}
            style={{ marginTop: 12, background: 'none', border: 'none', color: '#94a3b8',
              fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            ← Back to app
          </button>
        )}
      </div>
    </div>
  )
}
