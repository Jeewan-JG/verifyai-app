import { useNavigate } from 'react-router-dom'
import { Fingerprint, ShieldCheck, BookOpen, Users, BarChart2, Globe, Code, Video, ArrowRight, Zap, Lock } from 'lucide-react'

const MODULES = [
  {
    name: 'Trust Intelligence',
    desc: 'Multi-layer CV analysis, AI-generated content detection, credential scoring and explainable trust reports across 5 signal dimensions.',
    Icon: Fingerprint,
    status: 'active',
    route: '/candidates',
    category: 'Core',
    features: ['CV Authenticity Analysis', 'AI Content Detection', 'Credential Scoring', 'Explainable Reports'],
  },
  {
    name: 'Compliance Center',
    desc: 'GDPR compliance dashboard, EU AI Act controls, data retention management and right-to-erasure workflows for audit-ready hiring.',
    Icon: ShieldCheck,
    status: 'active',
    route: '/compliance',
    category: 'Governance',
    features: ['UK GDPR Management', 'EU AI Act Controls', 'Data Retention Tracking', 'Right to Erasure'],
  },
  {
    name: 'Verification Ledger',
    desc: 'Immutable, timestamped audit trail of every hiring decision, analysis event and recruiter action. Exportable for legal and regulatory review.',
    Icon: BookOpen,
    status: 'active',
    route: '/activity',
    category: 'Governance',
    features: ['Immutable Audit Trail', 'Timestamped Events', 'Compliance Export', 'Decision History'],
  },
  {
    name: 'Candidate Trust Passport',
    desc: 'Portable, reusable verified candidate profiles. Once verified by Verify.AI, candidates carry their Trust Passport to every application.',
    Icon: Users,
    status: 'coming',
    category: 'Network',
    features: ['Portable Verification', 'Candidate-owned Profile', 'One-click Sharing', 'Cross-company Trust'],
  },
  {
    name: 'Recruiter Intelligence Hub',
    desc: 'Decision analytics, hiring bias detection, consistency metrics and recruiter accountability reporting for fair, defensible hiring.',
    Icon: BarChart2,
    status: 'coming',
    category: 'Intelligence',
    features: ['Decision Analytics', 'Bias Detection', 'Consistency Metrics', 'Accountability Reports'],
  },
  {
    name: 'Fraud Signal Exchange',
    desc: 'Anonymised cross-company fraud intelligence network. Every fraud pattern caught across all customers improves detection for everyone.',
    Icon: Globe,
    status: 'coming',
    category: 'Network',
    features: ['Network Intelligence', 'Anonymous Sharing', 'Pattern Recognition', 'Collective Defence'],
  },
  {
    name: 'Interview Integrity Monitor',
    desc: 'Real-time deepfake detection and AI coaching identification during video interviews. Verify the person, not just the CV.',
    Icon: Video,
    status: 'coming',
    category: 'Intelligence',
    features: ['Deepfake Detection', 'AI Coaching Flags', 'Live Monitoring', 'Interview Reports'],
  },
  {
    name: 'Trust API',
    desc: 'Full developer access to the verification stack. Embed trust intelligence into your ATS, HRIS or custom hiring workflow via REST API.',
    Icon: Code,
    status: 'coming',
    category: 'Platform',
    features: ['REST API', 'Webhook Events', 'ATS Integrations', 'SDK Libraries'],
  },
]

const CATEGORY_COLORS = {
  Core:         { color: 'var(--teal)',  bg: 'rgba(20,184,166,0.12)'  },
  Governance:   { color: '#34d399',      bg: 'rgba(52,211,153,0.12)'  },
  Network:      { color: '#a78bfa',      bg: 'rgba(167,139,250,0.12)' },
  Intelligence: { color: '#f5a524',      bg: 'rgba(245,165,36,0.12)'  },
  Platform:     { color: '#60a5fa',      bg: 'rgba(96,165,250,0.12)'  },
}

export default function PlatformPage() {
  const navigate = useNavigate()

  const activeModules = MODULES.filter(m => m.status === 'active')
  const comingModules = MODULES.filter(m => m.status === 'coming')

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.09) 0%, rgba(20,184,166,0.03) 100%)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 14, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
              Platform Modules
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 560, lineHeight: 1.6 }}>
              Verify.AI is building the trust infrastructure layer for modern hiring. Each module addresses a distinct dimension of candidate authenticity, recruiter accountability and hiring compliance.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', background: 'var(--bg-2)', borderRadius: 10, padding: '10px 18px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>{activeModules.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--bg-2)', borderRadius: 10, padding: '10px 18px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-2)' }}>{comingModules.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Coming Soon</div>
            </div>
          </div>
        </div>

        {/* Moat pillars */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {[
            { icon: Fingerprint, label: 'Candidate Authenticity' },
            { icon: ShieldCheck, label: 'Recruiter Accountability' },
            { icon: Zap,         label: 'Explainable AI' },
            { icon: Globe,       label: 'Fraud Intelligence Network' },
            { icon: Lock,        label: 'Hiring Compliance' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--teal)', fontWeight: 500, background: 'rgba(20,184,166,0.08)', borderRadius: 20, padding: '4px 12px', border: '1px solid rgba(20,184,166,0.2)' }}>
              <Icon size={11} /> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Active modules */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Active Modules</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {activeModules.map(mod => {
            const cat = CATEGORY_COLORS[mod.category] || CATEGORY_COLORS.Core
            return (
              <div key={mod.name}
                style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', transition: 'transform .18s, box-shadow .18s, border-color .18s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.25)'; e.currentTarget.style.borderColor = 'rgba(20,184,166,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--line)' }}
                onClick={() => navigate(mod.route)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <mod.Icon size={18} color={cat.color} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', borderRadius: 20, padding: '3px 10px' }}>● Active</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{mod.name}</span>
                    <span style={{ fontSize: 10, color: cat.color, background: cat.bg, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{mod.category}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>{mod.desc}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {mod.features.map(f => (
                    <span key={f} style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 4, padding: '2px 7px', border: '1px solid var(--line)' }}>{f}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--teal)', fontWeight: 600, marginTop: 'auto' }}>
                  Open module <ArrowRight size={12} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Coming soon modules */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Coming Soon — Roadmap</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {comingModules.map(mod => {
            const cat = CATEGORY_COLORS[mod.category] || CATEGORY_COLORS.Core
            return (
              <div key={mod.name}
                style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, opacity: 0.75 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <mod.Icon size={18} color="var(--text-3)" />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 20, padding: '3px 10px', border: '1px solid var(--line)' }}>Coming Soon</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-2)' }}>{mod.name}</span>
                    <span style={{ fontSize: 10, color: cat.color, background: cat.bg, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{mod.category}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{mod.desc}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {mod.features.map(f => (
                    <span key={f} style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 4, padding: '2px 7px', border: '1px solid var(--line)' }}>{f}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
