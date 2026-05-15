import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Mail, RefreshCw, FileText, MapPin, Calendar, Tag, Clock, ShieldCheck, ShieldAlert, AlertTriangle, Save, ExternalLink, Trash2 } from 'lucide-react'

const DIMS = [
  { key: 'timeline_consistency',       label: 'Timeline Consistency',       weight: '25%' },
  { key: 'skill_authenticity',         label: 'Skill Authenticity',         weight: '25%' },
  { key: 'ai_text_detection',          label: 'AI Text Detection',          weight: '20%' },
  { key: 'certification_plausibility', label: 'Certification Plausibility', weight: '15%' },
  { key: 'narrative_coherence',        label: 'Narrative Coherence',        weight: '15%' },
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

const ScoreDial = ({ score }) => {
  const color = scoreColor(score || 0)
  const r = 54, circ = 2 * Math.PI * r
  const dash = circ * ((score || 0) / 100)
  return (
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

  useEffect(() => {
    if (!candidateId) { setLoading(false); return }
    const load = async () => {
      const { data } = await supabase
        .from('candidates')
        .select('*, analysis_results(*)')
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
    showToast('Analysis started — results in ~15 seconds')
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/analysis/run/${candidateId}`, { method: 'POST' })
      setTimeout(async () => {
        const { data } = await supabase.from('candidates').select('*, analysis_results(*)').eq('id', candidateId).single()
        if (data) { setCandidate(data); setResult(data.analysis_results?.[0] || null) }
        showToast('Analysis complete')
        setRerunning(false)
      }, 15000)
    } catch {
      showToast('Could not reach the backend — is it running?')
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
    // Delete analysis results first, then the candidate
    await supabase.from('analysis_results').delete().eq('candidate_id', candidateId)
    await supabase.from('candidates').delete().eq('id', candidateId)
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
            {rerunning ? 'Running...' : 'Re-run Analysis'}
          </button>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={openReport} disabled={!result}>
            <FileText size={13} /> <ExternalLink size={11} /> Download report
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

      {/* Trust Score + breakdown */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 20 }}>AI Trust Score</div>
        {!result ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-2)' }}>
            <Clock size={36} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-3)' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Analysis pending</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Click Re-run Analysis to generate the AI Trust Score.</div>
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={runAnalysis} disabled={rerunning}>
              <RefreshCw size={13} /> {rerunning ? 'Running...' : 'Run Analysis Now'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <ScoreDial score={result.trust_score} />
              <RiskBadge level={result.risk_level} />
              {result.summary && <p style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center', maxWidth: 160 }}>{result.summary}</p>}
            </div>
            <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Score Breakdown</div>
              {DIMS.map(d => {
                const val = result[d.key]
                const color = scoreColor(val || 0)
                return (
                  <div key={d.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span>{d.label} <span style={{ color: 'var(--text-3)', fontSize: 11 }}>{d.weight}</span></span>
                      <span style={{ fontWeight: 600, color }}>{val ? `${val}/100` : '—'}</span>
                    </div>
                    <div style={{ height: 7, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${val || 0}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Fraud flags */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          Fraud Flags
          {flags.length > 0 && <span style={{ background: '#f43f5e22', color: '#f43f5e', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>{flags.length}</span>}
        </div>
        {flags.length === 0 ? (
          <div style={{ color: 'var(--text-2)', fontSize: 13, padding: '16px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {result
              ? <><ShieldCheck size={16} color="#34d399" /> No fraud flags detected</>
              : <><Clock size={16} color="var(--text-3)" /> Flags will appear after AI analysis runs</>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {flags.map((flag, i) => (
              <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 8, borderLeft: `3px solid ${flag.severity === 'high' ? '#f43f5e' : flag.severity === 'medium' ? '#f5a524' : '#34d399'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} color={flag.severity === 'high' ? '#f43f5e' : '#f5a524'} /> {flag.title}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: flag.severity === 'high' ? '#f43f5e' : flag.severity === 'medium' ? '#f5a524' : '#34d399', textTransform: 'capitalize' }}>{flag.severity}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{flag.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recruiter Notes */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Recruiter Notes</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add private notes about this candidate — interview feedback, follow-up actions, decision rationale..."
          style={{ width: '100%', minHeight: 100, background: 'var(--bg-3)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text)', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={saveNotes}>
            <Save size={13} /> {notesSaved ? 'Saved!' : 'Save notes'}
          </button>
        </div>
      </div>

    </div>
  )
}
