import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const DIMS = [
  { key: 'timeline_consistency',       label: 'Identity & Employment Consistency', weight: '25%' },
  { key: 'skill_authenticity',         label: 'Credential Authenticity',           weight: '25%' },
  { key: 'ai_text_detection',          label: 'AI-Generated Content Detection',    weight: '20%' },
  { key: 'certification_plausibility', label: 'Qualification Verification',        weight: '15%' },
  { key: 'narrative_coherence',        label: 'Behavioural Consistency',           weight: '15%' },
]

const scoreColor = (s) => s >= 70 ? '#16a34a' : s >= 40 ? '#d97706' : '#dc2626'
const riskColor  = (l) => l === 'low' ? '#16a34a' : l === 'medium' ? '#d97706' : '#dc2626'

export default function ReportPrintPage() {
  const { candidateId } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('candidates')
        .select('*, analysis_results(*)')
        .eq('id', candidateId)
        .single()
      if (data) {
        setCandidate(data)
        setResult(data.analysis_results?.[0] || null)
      }
      setLoading(false)
    }
    load()
  }, [candidateId])

  useEffect(() => {
    if (!loading && candidate) {
      setTimeout(() => window.print(), 600)
    }
  }, [loading, candidate])

  if (loading) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Preparing report...</div>
  if (!candidate) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Candidate not found.</div>

  const flags = result?.fraud_flags || []
  const date  = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; margin: 0; }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print" style={{ background: '#f1f5f9', padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 14, color: '#64748b' }}>Preview — click Print to save as PDF</span>
        <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          Print / Save as PDF
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #0d9488' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0d9488', letterSpacing: '-0.02em' }}>Verify.AI</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Trust Infrastructure for Modern Hiring</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 2 }}>Trust Intelligence Report</div>
            <div>Generated: {date}</div>
            <div>Report ID: {candidateId?.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        {/* Candidate info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{candidate.full_name}</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>{candidate.role || 'Role not specified'}</div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#64748b' }}>
              {candidate.email    && <span>{candidate.email}</span>}
              {candidate.location && <span>{candidate.location}</span>}
            </div>
          </div>
          {result && (
            <div style={{ textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 24px' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: scoreColor(result.trust_score), lineHeight: 1 }}>{result.trust_score}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>/ 100</div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: riskColor(result.risk_level), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {result.risk_level} risk
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {result?.summary && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', marginBottom: 28, fontSize: 13, lineHeight: 1.6, color: '#166534' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Summary</div>
            {result.summary}
          </div>
        )}

        {/* Score breakdown */}
        {result && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>Trust Signal Breakdown</div>
            {DIMS.map(d => {
              const val = result[d.key] || 0
              const color = scoreColor(val)
              return (
                <div key={d.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span>{d.label} <span style={{ color: '#94a3b8', fontSize: 11 }}>{d.weight}</span></span>
                    <span style={{ fontWeight: 700, color }}>{val}/100</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${val}%`, height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Fraud flags */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
            Risk Intelligence Signals {flags.length === 0 ? '— None Detected' : `(${flags.length})`}
          </div>
          {flags.length === 0 ? (
            <div style={{ fontSize: 13, color: '#16a34a', padding: '10px 0' }}>No risk signals detected. Candidate authenticity verified across all trust dimensions.</div>
          ) : (
            flags.map((flag, i) => (
              <div key={i} style={{ padding: '12px 14px', background: '#fafafa', borderLeft: `3px solid ${riskColor(flag.severity)}`, borderRadius: 6, marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: riskColor(flag.severity), marginBottom: 3 }}>{flag.title}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{flag.description}</div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
          <span>Verify.AI — Trust Infrastructure for Modern Hiring · getverifyai.com</span>
          <span>Confidential — authorised HR personnel only · Processed under UK GDPR Art. 6(1)(f)</span>
        </div>

      </div>
    </>
  )
}
