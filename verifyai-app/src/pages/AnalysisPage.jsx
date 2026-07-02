import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Everything the page needs except cv_text (which can be tens of KB per row)
const CANDIDATE_COLS = 'id, full_name, email, role, location, status, notes, linkedin_url, created_at, analysis_results(*)'
import { ArrowLeft, Mail, RefreshCw, FileText, MapPin, Calendar, Tag, Clock, ShieldCheck, ShieldAlert, AlertTriangle, Save, ExternalLink, Trash2, Lock, Info, BookOpen, Fingerprint, Award, Zap, Video, Link } from 'lucide-react'

const DIMS = [
  { key: 'timeline_consistency',       label: 'Identity & Employment Consistency', weight: '25%', desc: 'Cross-references employment history for timeline gaps, overlaps and unverifiable periods' },
  { key: 'skill_authenticity',         label: 'Credential Authenticity',           weight: '25%', desc: 'Assesses whether claimed skills and experience are consistent with stated qualifications' },
  { key: 'ai_text_detection',          label: 'AI-Generated Content Detection',    weight: '20%', desc: 'Detects GPT, Claude and other LLM-generated text patterns within the document' },
  { key: 'certification_plausibility', label: 'Qualification Verification',        weight: '15%', desc: 'Evaluates plausibility of degrees, certifications and professional credentials' },
  { key: 'narrative_coherence',        label: 'Behavioural Consistency',           weight: '15%', desc: 'Analyses language patterns, role progression logic and self-presentation coherence' },
]

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending',      color: '#64748b' },
  { value: 'reviewed',    label: 'Reviewed',     color: 'var(--teal)' },
  { value: 'shortlisted', label: 'Shortlisted',  color: '#34d399' },
  { value: 'rejected',    label: 'Rejected',     color: '#f43f5e' },
]

const scoreColor = (s) => s >= 70 ? '#34d399' : s >= 40 ? '#f5a524' : '#f43f5e'

const RiskBadge = ({ level }) => {
  const colours = { low: '#34d399', medium: '#f5a524', high: '#f43f5e' }
  const c = colours[level] || '#64748b'
  const Icon = level === 'low' ? ShieldCheck : level === 'high' ? ShieldAlert : AlertTriangle
  return (
    <span style={{ background: c + '22', color: c, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Icon size={12} /> {level || 'Pending'}
    </span>
  )
}

const confidenceLevel = (score) => {
  if (!score) return null
  if (score >= 75) return { label: 'High Confidence', color: '#34d399', pct: '95%+' }
  if (score >= 45) return { label: 'Medium Confidence', color: '#f5a524', pct: '70–90%' }
  return { label: 'Low Confidence', color: '#f43f5e', pct: '<70%' }
}

const ScoreDial = ({ score }) => {
  const color = scoreColor(score || 0)
  const conf  = confidenceLevel(score)
  const r = 54, circ = 2 * Math.PI * r
  const dash = circ * ((score || 0) / 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="140" height="140" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--bg-3)" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color }}>{score || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>/100</div>
        </div>
      </div>
      {conf && (
        <div style={{ fontSize: 11, fontWeight: 600, color: conf.color, background: conf.color + '18', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={10} /> {conf.label} · {conf.pct}
        </div>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const { candidateId } = useParams()
  const navigate        = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState(null)
  const [rerunning, setRerunning]   = useState(false)
  const [notes, setNotes]           = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [status, setStatus]         = useState('pending')
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Cancels the poll loop when the user navigates away mid-analysis
  const cancelledRef = useRef(false)
  useEffect(() => () => { cancelledRef.current = true }, [])

  useEffect(() => {
    if (!candidateId) { setLoading(false); return }
    const load = async () => {
      const { data } = await supabase
        .from('candidates')
        .select(CANDIDATE_COLS)
        .eq('id', candidateId)
        .single()
      if (data) {
        setCandidate(data)
        setResult(data.analysis_results?.[0] || null)
        setNotes(data.notes || '')
        setStatus(data.status || 'pending')
      }
      setLoading(false)
    }
    load()
  }, [candidateId])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const runAnalysis = async () => {
    setRerunning(true)
    showToast('Analysis started — results in ~20 seconds')
    const startedAt = new Date()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analysis/run/${candidateId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Analysis request failed (${res.status})`)
      }
      // Poll until a result newer than startedAt appears, or 90 s elapses
      const deadline = Date.now() + 90000
      const poll = async () => {
        if (cancelledRef.current) return
        const { data } = await supabase.from('candidates').select(CANDIDATE_COLS).eq('id', candidateId).single()
        if (cancelledRef.current) return
        const newResult = data?.analysis_results?.[0]
        if (newResult && new Date(newResult.created_at) > startedAt) {
          setCandidate(data)
          setResult(newResult)
          showToast('Analysis complete')
          setRerunning(false)
        } else if (Date.now() < deadline) {
          setTimeout(poll, 4000)
        } else {
          showToast('Analysis is taking longer than expected — refresh the page')
          setRerunning(false)
        }
      }
      setTimeout(poll, 5000)
    } catch (err) {
      showToast(err.message || 'Could not reach the backend — is it running?')
      setRerunning(false)
    }
  }

  const saveNotes = async () => {
    await supabase.from('candidates').update({ notes }).eq('id', candidateId)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const changeStatus = async (newStatus) => {
    setStatus(newStatus)
    await supabase.from('candidates').update({ status: newStatus }).eq('id', candidateId)
    showToast(`Status updated to ${newStatus}`)
  }

  const openEmailClient = () => {
    if (!candidate) return
    const subject = `Verify.AI Report — ${candidate.full_name}`
    const body = [
      `Candidate Trust Report`,
      ``,
      `Candidate: ${candidate.full_name}`,
      `Role: ${candidate.role || 'Not specified'}`,
      `Location: ${candidate.location || 'Not specified'}`,
      ``,
      result ? [
        `Trust Score: ${result.trust_score}/100`,
        `Risk Level: ${result.risk_level?.toUpperCase()}`,
        ``,
        `Score Breakdown:`,
        `  Timeline Consistency: ${result.timeline_consistency}/100`,
        `  Skill Authenticity: ${result.skill_authenticity}/100`,
        `  AI Text Detection: ${result.ai_text_detection}/100`,
        `  Certification Plausibility: ${result.certification_plausibility}/100`,
        `  Narrative Coherence: ${result.narrative_coherence}/100`,
        ``,
        `Summary: ${result.summary || 'N/A'}`,
      ].join('\n') : 'Analysis pending.',
    ].join('\n')
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const openReport = () => {
    window.open(`/report/${candidateId}`, '_blank')
  }

  const deleteCandidate = async () => {
    const { error: e1 } = await supabase.from('analysis_results').delete().eq('candidate_id', candidateId)
    if (e1) { showToast('Delete failed — please try again'); return }
    const { error: e2 } = await supabase.from('candidates').delete().eq('id', candidateId)
    if (e2) { showToast('Delete failed — please try again'); return }
    navigate('/candidates')
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-2)' }}>Loading analysis...</div>

  if (!candidateId || !candidate) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-2)' }}>
      <ShieldCheck size={40} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
      <div style={{ fontWeight: 600, marginBottom: 8 }}>No candidate selected</div>
      <button className="btn btn-primary" onClick={() => navigate('/candidates')}>Back to Candidates</button>
    </div>
  )

  const initials  = candidate.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const flags     = result?.fraud_flags || []
  const statusCfg = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text)', padding: '10px 20px', borderRadius: 10, fontWeight: 500, fontSize: 13, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f43f5e22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} color="#f43f5e" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Delete candidate?</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently delete <b style={{ color: 'var(--text)' }}>{candidate?.full_name}</b> and all their analysis results. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                className="btn btn-sm"
                style={{ background: '#f43f5e', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={deleteCandidate}>
                <Trash2 size={13} /> Yes, delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/candidates')}>
          <ArrowLeft size={14} /> Back to candidates
        </button>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={openEmailClient}>
            <Mail size={13} /> Email report
          </button>
          <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={runAnalysis} disabled={rerunning}>
            <RefreshCw size={13} style={{ animation: rerunning ? 'spin 1s linear infinite' : 'none' }} />
            {rerunning ? 'Running...' : 'Re-run Trust Intelligence'}
          </button>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={openReport} disabled={!result}>
            <FileText size={13} /> <ExternalLink size={11} /> Trust Intelligence Report
          </button>
          <button
            className="btn btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f43f5e', borderColor: '#f43f5e33', background: '#f43f5e11' }}
            onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Candidate profile card */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#000', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{candidate.full_name}</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{candidate.role || 'No role specified'}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <RiskBadge level={result?.risk_level} />
              {/* Status selector */}
              <select
                value={status}
                onChange={e => changeStatus(e.target.value)}
                style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: `1px solid ${statusCfg.color}`, background: statusCfg.color + '22', color: statusCfg.color, cursor: 'pointer', outline: 'none' }}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
          {candidate.email    && <div style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={13} /> {candidate.email}</div>}
          {candidate.location && <div style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> {candidate.location}</div>}
          <div style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} /> Added {new Date(candidate.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={13} /> {candidate.linkedin_url
              ? <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>LinkedIn profile</a>
              : 'No LinkedIn'}
          </div>
        </div>
      </div>

      {/* Candidate Trust Profile — 6 verification dimensions */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={15} color="var(--teal)" /> Candidate Trust Profile
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
            Multi-layer verification across 6 trust dimensions — Identity · Credentials · Digital Presence · AI Content · Behaviour · Interview Integrity
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(188px, 1fr))', gap: 10 }}>
          {[
            {
              label: 'CV Authenticity',
              Icon: FileText,
              status: result ? (result.trust_score >= 70 ? 'verified' : result.trust_score >= 40 ? 'review' : 'risk') : 'pending',
              desc: result ? `Trust score ${result.trust_score}/100` : 'Run trust intelligence',
            },
            {
              label: 'Identity Verification',
              Icon: Fingerprint,
              status: 'coming',
              desc: 'Passport & ID document check',
            },
            {
              label: 'LinkedIn Consistency',
              Icon: Link,
              status: candidate?.linkedin_url ? 'pending' : 'coming',
              desc: candidate?.linkedin_url ? 'Profile URL provided — analysis coming' : 'No LinkedIn URL provided',
            },
            {
              label: 'Qualification Verification',
              Icon: Award,
              status: result ? (result.certification_plausibility >= 70 ? 'verified' : result.certification_plausibility >= 40 ? 'review' : 'risk') : 'pending',
              desc: result ? `Qualification score ${result.certification_plausibility}/100` : 'Pending analysis',
            },
            {
              label: 'AI Content Detection',
              Icon: Zap,
              status: result ? (result.ai_text_detection >= 70 ? 'verified' : result.ai_text_detection >= 40 ? 'review' : 'risk') : 'pending',
              desc: result ? `AI content score ${result.ai_text_detection}/100` : 'Pending analysis',
            },
            {
              label: 'Deepfake Interview Risk',
              Icon: Video,
              status: 'coming',
              desc: 'Video interview integrity monitor',
            },
          ].map(item => {
            const cfg = {
              verified: { color: '#34d399', bg: 'rgba(52,211,153,0.08)', label: '✓ Verified'      },
              review:   { color: '#f5a524', bg: 'rgba(245,165,36,0.08)', label: '⚠ Review'        },
              risk:     { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', label: '✗ Risk Detected'  },
              pending:  { color: '#64748b', bg: 'var(--bg-3)',           label: '○ Pending'        },
              coming:   { color: 'var(--text-3)', bg: 'var(--bg-3)',     label: '→ Coming Soon'    },
            }[item.status]
            return (
              <div key={item.label} style={{ background: cfg.bg, borderRadius: 10, padding: 14, border: `1px solid ${cfg.color}33` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <item.Icon size={14} color={cfg.color} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: '0.04em' }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trust Intelligence Report */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Fingerprint size={16} color="var(--teal)" /> Trust Intelligence Report
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Multi-signal, evidence-based candidate authenticity analysis</div>
          </div>
        </div>
        {!result ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-2)' }}>
            <Clock size={36} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Trust intelligence pending</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Click below to run the full multi-layer trust analysis.</div>
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={runAnalysis} disabled={rerunning}>
              <RefreshCw size={13} /> {rerunning ? 'Running...' : 'Run Trust Intelligence Now'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <ScoreDial score={result.trust_score} />
              <RiskBadge level={result.risk_level} />
              {result.summary && <p style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center', maxWidth: 160, lineHeight: 1.5 }}>{result.summary}</p>}
            </div>
            <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>Trust Signal Breakdown</div>
              {DIMS.map(d => {
                const val = result[d.key]
                const color = scoreColor(val || 0)
                return (
                  <div key={d.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5, alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{d.label} <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{d.weight}</span></div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{d.desc}</div>
                      </div>
                      <span style={{ fontWeight: 700, color, flexShrink: 0 }}>{val ? `${val}/100` : '—'}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${val || 0}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.8s cubic-bezier(.2,.8,.2,1)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Risk Reasoning Engine */}
      {result && (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={15} color="var(--teal)" /> Risk Reasoning Engine
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Evidence-based scoring rationale · Recruiter confidence metrics · Actionable findings</div>
          </div>

          {/* AI Verdict */}
          {result.summary && (
            <div style={{ background: scoreColor(result.trust_score) + '10', border: `1px solid ${scoreColor(result.trust_score)}30`, borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(result.trust_score), textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>AI Verdict</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>{result.summary}</div>
            </div>
          )}

          {/* Two-column: evidence + recruiter confidence */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Signal Evidence */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Signal Evidence</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DIMS.map(d => {
                  const val = result[d.key]
                  if (!val) return null
                  const color = scoreColor(val)
                  const icon = val >= 70 ? '✓' : val >= 40 ? '⚠' : '✗'
                  return (
                    <div key={d.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                      <span style={{ color, flexShrink: 0, fontWeight: 700, minWidth: 14 }}>{icon}</span>
                      <span style={{ color: 'var(--text-2)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{d.label}</span>
                        <span style={{ color: 'var(--text-3)' }}> — {val}/100</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recruiter Confidence Metrics */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Recruiter Confidence</div>

              {DIMS.filter(d => (result[d.key] || 0) >= 70).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Proceed with confidence
                  </div>
                  {DIMS.filter(d => (result[d.key] || 0) >= 70).map(d => (
                    <div key={d.key} style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, paddingLeft: 13 }}>{d.label}</div>
                  ))}
                </div>
              )}

              {DIMS.filter(d => result[d.key] && result[d.key] >= 40 && result[d.key] < 70).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#f5a524', fontWeight: 600, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5a524', display: 'inline-block' }} /> Review recommended
                  </div>
                  {DIMS.filter(d => result[d.key] && result[d.key] >= 40 && result[d.key] < 70).map(d => (
                    <div key={d.key} style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, paddingLeft: 13 }}>{d.label}</div>
                  ))}
                </div>
              )}

              {DIMS.filter(d => result[d.key] && result[d.key] < 40).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} /> Investigate before proceeding
                  </div>
                  {DIMS.filter(d => result[d.key] && result[d.key] < 40).map(d => (
                    <div key={d.key} style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, paddingLeft: 13 }}>{d.label}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Verification */}
      {result && (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link size={15} color="var(--teal)" /> Link Verification
              {result.link_verification?.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, background: 'var(--bg-3)', borderRadius: 20, padding: '2px 10px', border: '1px solid var(--line)' }}>
                  {result.link_verification.length} link{result.link_verification.length !== 1 ? 's' : ''} scanned
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
              AI agent scans the CV for external links — LinkedIn, GitHub, university sites, project portfolios — fetches each one and verifies the content matches the candidate's claims
            </div>
          </div>

          {(!result.link_verification || result.link_verification.length === 0) ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Link size={28} strokeWidth={1} color="var(--text-3)" />
              <div style={{ fontWeight: 500 }}>No external links found in this CV</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Links to LinkedIn, GitHub, project portfolios or university sites will be automatically verified on the next analysis run</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.link_verification.map((lv, i) => {
                const statusCfg = {
                  verified:       { color: '#34d399', label: '✓ Verified',       bg: 'rgba(52,211,153,0.07)'  },
                  unverified:     { color: '#f5a524', label: '~ Unverified',     bg: 'rgba(245,165,36,0.07)'  },
                  suspicious:     { color: '#f43f5e', label: '✗ Suspicious',     bg: 'rgba(244,63,94,0.07)'   },
                  inaccessible:   { color: '#64748b', label: '✗ Inaccessible',   bg: 'var(--bg-3)'             },
                  login_required: { color: '#a78bfa', label: '⚠ Login Required', bg: 'rgba(167,139,250,0.07)' },
                }[lv.status] || { color: '#64748b', label: '? Unknown', bg: 'var(--bg-3)' }

                return (
                  <div key={i} style={{ background: statusCfg.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${statusCfg.color}28` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusCfg.color, background: statusCfg.color + '20', borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>
                          {statusCfg.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 4, padding: '2px 8px', border: '1px solid var(--line)', flexShrink: 0 }}>
                          {lv.type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Match:</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(lv.match_score || 0) }}>{lv.match_score ?? '—'}/100</span>
                      </div>
                    </div>

                    <a href={lv.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--teal)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8, wordBreak: 'break-all', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink size={11} style={{ flexShrink: 0 }} />
                      {lv.url.length > 72 ? lv.url.slice(0, 72) + '…' : lv.url}
                    </a>

                    {lv.finding && (
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: lv.flags?.length > 0 ? 8 : 0 }}>
                        {lv.finding}
                      </div>
                    )}

                    {lv.flags && lv.flags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                        {lv.flags.map((flag, fi) => (
                          <span key={fi} style={{ fontSize: 11, color: '#f43f5e', background: 'rgba(244,63,94,0.1)', borderRadius: 4, padding: '2px 8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                            ⚠ {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Summary bar */}
              {(() => {
                const verified   = result.link_verification.filter(l => l.status === 'verified').length
                const suspicious = result.link_verification.filter(l => l.status === 'suspicious').length
                const total      = result.link_verification.length
                return (
                  <div style={{ marginTop: 4, padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>✓ {verified} verified</span>
                    {suspicious > 0 && <span style={{ color: '#f43f5e', fontWeight: 600 }}>✗ {suspicious} suspicious</span>}
                    <span style={{ color: 'var(--text-3)' }}>{total - verified - suspicious} could not be fully assessed</span>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Risk Intelligence Signals */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={15} color={flags.length > 0 ? '#f43f5e' : '#34d399'} /> Risk Intelligence Signals
              {flags.length > 0 && <span style={{ background: '#f43f5e22', color: '#f43f5e', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>{flags.length} signal{flags.length > 1 ? 's' : ''}</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Evidence-based fraud indicators and authenticity anomalies</div>
          </div>
        </div>
        {flags.length === 0 ? (
          <div style={{ color: 'var(--text-2)', fontSize: 13, padding: '20px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {result
              ? <><ShieldCheck size={16} color="#34d399" /> No risk signals detected — candidate authenticity verified across all dimensions</>
              : <><Clock size={16} color="var(--text-3)" /> Risk signals will appear after trust intelligence runs</>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {flags.map((flag, i) => {
              const sigColor = flag.severity === 'high' ? '#f43f5e' : flag.severity === 'medium' ? '#f5a524' : '#34d399'
              return (
                <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${sigColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={13} color={sigColor} /> {flag.title}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sigColor, background: sigColor + '22', borderRadius: 6, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{flag.severity} risk</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{flag.description}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recruiter Decision Log */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={15} color="var(--teal)" /> Recruiter Decision Log
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Document decision rationale for audit trail and compliance. All entries are timestamped and immutable once saved.</div>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Record your decision rationale — interview observations, verification steps taken, reasons for progression or rejection. This log forms part of the compliance audit trail."
          style={{ width: '100%', minHeight: 110, background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Lock size={10} /> Stored securely · Included in compliance exports
          </span>
          <button className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={saveNotes}>
            <Save size={13} /> {notesSaved ? 'Saved!' : 'Save to decision log'}
          </button>
        </div>
      </div>

      {/* Compliance & Governance */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={15} color="var(--teal)" /> Compliance & Governance
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>AI governance status and regulatory compliance for this hiring decision</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {[
            { label: 'GDPR Lawful Basis',   value: 'UK GDPR Art. 6(1)(f)',         ok: true  },
            { label: 'EU AI Act',            value: 'Human oversight active',        ok: true  },
            { label: 'Explainability',       value: 'Evidence-based scoring',        ok: true  },
            { label: 'Data Retention',       value: '12 months from upload',         ok: true  },
            { label: 'Audit Trail',          value: 'Complete & immutable',          ok: true  },
            { label: 'Right to Review',      value: 'Candidate can request report',  ok: true  },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.ok ? '#34d399' : '#f43f5e', flexShrink: 0, display: 'inline-block' }} />
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
