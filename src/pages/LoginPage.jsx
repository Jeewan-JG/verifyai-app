import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'

// Animated network graph
function NetworkGraph() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let id
    const loop = () => { setTick(t => t + 1); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  const cx = 260, cy = 210
  const nodes = [
    { id: 'core',      x: cx,       y: cy,       label: 'Verify.AI core', fraud: false, core: true },
    { id: 'edu',       x: cx - 20,  y: cy - 120, label: 'Education registry', fraud: false },
    { id: 'linkedin',  x: cx + 150, y: cy - 110, label: 'LinkedIn match',      fraud: false },
    { id: 'companies', x: cx - 160, y: cy - 90,  label: 'Companies House',     fraud: false },
    { id: 'fake',      x: cx - 195, y: cy + 10,  label: 'Fake employer',       fraud: true  },
    { id: 'aitext',    x: cx - 80,  y: cy + 100, label: 'AI text detector',    fraud: false },
    { id: 'ocr',       x: cx + 110, y: cy + 60,  label: 'Document OCR',        fraud: false },
    { id: 'date',      x: cx + 210, y: cy + 80,  label: 'Date mismatch',       fraud: true  },
    { id: 'ref',       x: cx - 130, y: cy + 150, label: 'Reference network',   fraud: false },
    { id: 'skills',    x: cx + 140, y: cy + 155, label: 'Skills graph',        fraud: false },
  ]

  const t = tick / 60 // time in seconds at 60fps

  // Animate each satellite node with sine wave float
  const animatedNodes = nodes.map((n, i) => {
    if (n.core) return n
    const floatY = Math.sin(t * 0.8 + i * 0.9) * 3.5
    const floatX = Math.cos(t * 0.5 + i * 1.1) * 2
    return { ...n, x: n.x + floatX, y: n.y + floatY }
  })

  const coreGlow = 22 + Math.sin(t * 1.2) * 6  // pulsing glow radius
  const coreOpacity = 0.15 + Math.sin(t * 1.2) * 0.08

  const edges = animatedNodes.filter(n => !n.core).map(n => ({
    x1: cx, y1: cy, x2: n.x, y2: n.y, fraud: n.fraud
  }))

  const dashOffset = (t * 12) % 8  // animated dash

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <svg viewBox="0 0 520 380" style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </radialGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Pulsing glow behind center */}
        <circle cx={cx} cy={cy} r={coreGlow + 20} fill="url(#glow)" filter="url(#blur)" opacity={coreOpacity * 2} />
        <circle cx={cx} cy={cy} r={coreGlow} fill="#14b8a6" fillOpacity={coreOpacity} />

        {/* Edges */}
        {edges.map((e, i) => (
          <line key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.fraud ? '#f87171' : '#14b8a6'}
            strokeWidth={1.2}
            strokeOpacity={e.fraud ? 0.55 : 0.35}
            strokeDasharray={e.fraud ? '4 4' : '6 3'}
            strokeDashoffset={e.fraud ? -dashOffset : dashOffset}
          />
        ))}

        {/* Node dots */}
        {animatedNodes.map((n, i) => {
          const pulse = n.core ? 0 : Math.sin(t * 1.1 + i * 0.7) * 1.2
          return (
          <g key={n.id}>
            {n.core && (
              <circle cx={n.x} cy={n.y}
                r={18 + Math.sin(t * 0.9) * 3}
                fill="#14b8a6" fillOpacity={0.08}
              />
            )}
            <circle
              cx={n.x} cy={n.y}
              r={(n.core ? 12 : n.fraud ? 7 : 6) + pulse}
              fill={n.core ? '#14b8a6' : n.fraud ? '#f87171' : '#14b8a6'}
              fillOpacity={n.core ? 1 : n.fraud ? 0.9 : 0.75}
            />
          </g>
        )})}


        {/* Node labels */}
        {animatedNodes.filter(n => !n.core).map(n => {
          const dx = n.x - cx, dy = n.y - cy
          const len = Math.sqrt(dx*dx + dy*dy)
          const ox = (dx / len) * 14, oy = (dy / len) * 14
          return (
            <g key={n.id + '_label'}>
              <rect
                x={n.x + ox - 2}
                y={n.y + oy - 11}
                width={n.label.length * 6.5 + 16}
                height={20}
                rx={4}
                fill="#1e293b"
                fillOpacity={0.95}
                transform={`translate(${n.x > cx ? 4 : -(n.label.length * 6.5 + 20)}, 0) translate(${-ox}, ${-oy})`}
              />
              <text
                x={n.x + ox}
                y={n.y + oy + 3}
                fontSize={10}
                fill={n.fraud ? '#f87171' : '#94a3b8'}
                fontFamily="monospace"
                transform={`translate(${n.x > cx ? 12 : -(n.label.length * 6.5 + 12)}, 0) translate(${-ox}, ${-oy})`}
              >
                • {n.label}
              </text>
            </g>
          )
        })}

        {/* Center label */}
        <text x={cx} y={cy + 28} textAnchor="middle" fontSize={10} fill="#14b8a6" fontFamily="monospace" fontWeight="600">
          Verify.AI core
        </text>
      </svg>

      {/* Stat line */}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: -8 }}>
        Every CV cross-checked across{' '}
        <span style={{ color: '#14b8a6', fontWeight: 700 }}>14 trusted data sources</span>
      </div>
    </div>
  )
}

// 3-step process cards
function StepCards() {
  const steps = [
    {
      num: '01', tag: 'INGEST',
      title: 'Upload CV',
      desc: 'Batch upload, ATS sync or live API stream.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
    },
    {
      num: '02', tag: 'ANALYSE',
      title: 'AI Analyses',
      desc: 'Cross-checked against 14 fraud signals in <5s.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      ),
    },
    {
      num: '03', tag: 'SCORE',
      title: 'Get Trust Score',
      desc: 'Calibrated 0–100 score with top risk signals.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
      {steps.map((s, i) => (
        <div key={i} className="step-card" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '14px 12px', position: 'relative' }}>
          <div style={{ fontSize: 10, color: '#14b8a6', fontFamily: 'monospace', fontWeight: 600, marginBottom: 10,
            background: 'rgba(20,184,166,0.1)', display: 'inline-block', padding: '2px 7px', borderRadius: 4 }}>
            {s.num} · {s.tag}
          </div>
          <div style={{ width: 36, height: 36, background: 'rgba(20,184,166,0.1)', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            {s.icon}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#f1f5f9' }}>{s.title}</div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{s.desc}</div>
          {i < 2 && (
            <div style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)',
              width: 20, height: 20, background: '#1e293b', border: '1px solid #334155', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, fontSize: 10, color: '#475569' }}>›</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail]       = useState('sarah.clayton@acmetalent.co.uk')
  const [password, setPassword] = useState('password123')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      {/* Left panel — branding */}
      <div className="login-left" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="login-mark">
            {/* Checkmark icon only — tight viewBox so it doesn't push height */}
            <svg width="48" height="56" viewBox="114 102 172 192" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(124 112)">
                <path d="M0 18 66 172 152 0" fill="none" stroke="#14b8a6" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="420" strokeDashoffset="420">
                  <animate attributeName="stroke-dashoffset" values="420;0;0;420" keyTimes="0;.36;.78;1" dur="3s" repeatCount="indefinite"/>
                </path>
                <path d="M34 112 68 146 123 76" fill="none" stroke="#e6edf2" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            {/* Verify.AI text + animated underline only */}
            <svg width="220" height="56" viewBox="325 38 632 168" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(330 154)">
                <text x="0" y="0" fill="#e6edf2" fontFamily="Inter, Arial, sans-serif" fontSize="110" fontWeight="780" letterSpacing="-7">
                  Verify<tspan fill="#14b8a6">.AI</tspan><tspan dx="9" dy="-58" fill="#7d8f9b" fontSize="26" letterSpacing="0">TM</tspan>
                </text>
                <rect x="6" y="42" width="610" height="2" fill="#1c3340"/>
                <rect x="6" y="42" width="0" height="2" fill="#14b8a6">
                  <animate attributeName="width" values="0;610;610;0" keyTimes="0;.42;.75;1" dur="3s" repeatCount="indefinite"/>
                </rect>
              </g>
            </svg>
          </div>
          <div className="login-headline" style={{ marginTop: 14 }}>
            Trust Intelligence<br />
            <span>for Modern Hiring</span>
          </div>
          <p className="login-tag">
            Stop wasting interviews on fake CVs. Verify.AI detects fraudulent
            applications before they reach your shortlist.
          </p>

          {/* Network graph */}
          <div style={{ marginTop: 20 }}>
            <NetworkGraph />
          </div>

          {/* 3-step cards */}
          <StepCards />
        </div>

        <div className="login-foot" style={{ marginTop: 24 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Enterprise-grade security · UK Data hosted in London · ISO 27001</span>
        </div>
      </div>

      {/* Right panel — login form (unchanged) */}
      <div className="login-right">
        <div className="login-card">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-sub">Sign in to your Verify.AI account</p>

          <form onSubmit={handleEmailLogin}>
            <div className="field">
              <label>Work email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label>
                Password
                <a href="#">Forgot password?</a>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="checkbox" style={{ marginTop: 12 }}>
              <input type="checkbox" defaultChecked id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>

            {error && (
              <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 10, padding: '8px 12px', background: 'rgba(244,63,94,0.1)', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 18, justifyContent: 'center' }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div className="divider-or">or continue with</div>

          <button className="sso-btn" style={{ background: '#fff', color: '#333', border: '1px solid #e2e8f0', marginTop: 0 }} onClick={signInWithGoogle}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.7 5.5 2.9 13.5l7.8 6C12.5 13.1 17.9 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
              <path fill="#FBBC05" d="M10.7 28.5c-.5-1.5-.8-3-.8-4.5s.3-3 .8-4.5l-7.8-6C1 16.4 0 20.1 0 24s1 7.6 2.9 10.5l7.8-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.1 0-11.3-4.1-13.2-9.5l-7.8 6C6.7 42.5 14.7 48 24 48z"/>
            </svg>
            Sign in with Google
          </button>
          <button className="sso-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#4285F4"><rect x="1" y="1" width="10" height="10"/><rect x="13" y="1" width="10" height="10"/><rect x="1" y="13" width="10" height="10"/><rect x="13" y="13" width="10" height="10"/></svg>
            Sign in with Microsoft
          </button>
          <button className="sso-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Sign in with SSO
          </button>

          <p className="legal">
            By signing in, you agree to our{' '}
            <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
            UK Data hosted in London.
          </p>
        </div>
      </div>
    </div>
  )
}
