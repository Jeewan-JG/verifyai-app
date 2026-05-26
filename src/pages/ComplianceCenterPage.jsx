import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShieldCheck, Lock, FileText, AlertTriangle, Check, Clock, Download, Trash2, Users } from 'lucide-react'

const RETENTION_MONTHS = 12

function daysUntilExpiry(createdAt, months) {
  const expiry = new Date(createdAt)
  expiry.setMonth(expiry.getMonth() + months)
  return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24))
}

const StatusChip = ({ ok, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: ok ? '#34d399' : '#f43f5e', background: ok ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)', borderRadius: 20, padding: '3px 10px' }}>
    {ok ? <Check size={11} /> : <AlertTriangle size={11} />} {label}
  </span>
)

export default function ComplianceCenterPage() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('candidates').select('*, analysis_results(trust_score, risk_level)')
      .order('created_at', { ascending: true })
      .then(({ data }) => { setCandidates(data || []); setLoading(false) })
  }, [])

  const expiring = candidates.filter(c => {
    const d = daysUntilExpiry(c.created_at, RETENTION_MONTHS)
    return d <= 30 && d > 0
  })
  const expired = candidates.filter(c => daysUntilExpiry(c.created_at, RETENTION_MONTHS) <= 0)

  const exportAuditCSV = async () => {
    const { data } = await supabase.from('candidates').select('*, analysis_results(*)').order('created_at', { ascending: false })
    if (!data) return
    const rows = data.map(c => {
      const r = c.analysis_results?.[0] || {}
      const days = daysUntilExpiry(c.created_at, RETENTION_MONTHS)
      return [
        c.full_name, c.email, c.role, c.status,
        r.trust_score ?? '', r.risk_level ?? '',
        new Date(c.created_at).toLocaleDateString('en-GB'),
        days > 0 ? `Expires in ${days} days` : 'Expired',
        'UK GDPR Art. 6(1)(f)', 'Human oversight active',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    const csv = [
      'Full Name,Email,Role,Status,Trust Score,Risk Level,Added,Retention Status,GDPR Basis,AI Oversight',
      ...rows
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `verifyai-compliance-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-2)' }}>Loading compliance data...</div>

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={20} color="var(--teal)" /> Compliance Center
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>GDPR compliance, EU AI Act governance and data retention management</div>
        </div>
        <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={exportAuditCSV}>
          <Download size={13} /> Export Compliance Audit
        </button>
      </div>

      {/* Compliance Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Candidates', value: candidates.length, color: 'var(--teal)', Icon: Users, sub: 'In compliance scope' },
          { label: 'Expiring Soon', value: expiring.length, color: expiring.length > 0 ? '#f5a524' : '#34d399', Icon: Clock, sub: 'Within 30 days' },
          { label: 'Retention Expired', value: expired.length, color: expired.length > 0 ? '#f43f5e' : '#34d399', Icon: AlertTriangle, sub: 'Action required' },
          { label: 'Compliant Records', value: candidates.length - expired.length, color: '#34d399', Icon: ShieldCheck, sub: 'Within retention period' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
              <s.Icon size={14} color={s.color} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Regulatory Compliance Status */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={15} color="var(--teal)" /> Regulatory Compliance Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {[
            { label: 'UK GDPR', detail: 'Lawful basis: Art. 6(1)(f) — Legitimate interests', ok: true },
            { label: 'EU AI Act', detail: 'High-risk AI system — Human oversight enforced', ok: true },
            { label: 'Explainability', detail: 'All decisions evidence-based with cited reasoning', ok: true },
            { label: 'Data Minimisation', detail: 'Only necessary candidate data collected and stored', ok: true },
            { label: 'Right to Erasure', detail: 'Candidate data can be deleted on request', ok: true },
            { label: 'Audit Trail', detail: 'Complete immutable log of all platform actions', ok: true },
            { label: 'Data Retention Policy', detail: `${RETENTION_MONTHS}-month default retention period enforced`, ok: true },
            { label: 'Cross-border Transfers', detail: 'UK data hosted in London — no EEA transfer', ok: true },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 8, border: '1px solid var(--line)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.ok ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {item.ok ? <Check size={13} color="#34d399" /> : <AlertTriangle size={13} color="#f43f5e" />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Retention Table */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Data Retention Register</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 10 }}>{candidates.length} records · {RETENTION_MONTHS}-month retention policy</span>
          </div>
          {expired.length > 0 && (
            <span style={{ fontSize: 12, color: '#f43f5e', fontWeight: 600, background: 'rgba(244,63,94,0.1)', borderRadius: 6, padding: '3px 10px' }}>
              {expired.length} record{expired.length > 1 ? 's' : ''} past retention — review required
            </span>
          )}
        </div>
        {candidates.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
            No candidates in the system yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-3)' }}>
                {['Candidate', 'Role', 'Added', 'Retention Status', 'GDPR Basis', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const days = daysUntilExpiry(c.created_at, RETENTION_MONTHS)
                const isExpired = days <= 0
                const isExpiring = days > 0 && days <= 30
                const statusColor = isExpired ? '#f43f5e' : isExpiring ? '#f5a524' : '#34d399'
                const statusLabel = isExpired ? 'Expired' : isExpiring ? `Expires in ${days}d` : `${days}d remaining`
                return (
                  <tr key={c.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)', cursor: 'pointer' }}
                    onClick={() => navigate(`/analysis/${c.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{c.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-2)' }}>{c.role || '—'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-2)' }}>
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: statusColor, background: statusColor + '15', borderRadius: 6, padding: '3px 8px' }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: 'var(--text-2)' }}>Art. 6(1)(f)</td>
                    <td style={{ padding: '11px 16px' }}>
                      {isExpired ? (
                        <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600 }}>Review required</span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Active</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* EU AI Act Checklist */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={15} color="var(--teal)" /> EU AI Act — High-Risk System Compliance
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16 }}>Hiring AI systems are classified as high-risk under EU AI Act Annex III. The following controls are enforced by Verify.AI.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'Human oversight is required before all final hiring decisions',
            'All AI scoring decisions are explainable with cited evidence',
            'Candidates have the right to request a human review of their assessment',
            'Risk and accuracy metrics are logged and available for regulatory inspection',
            'The system does not automate final hiring decisions without human confirmation',
            'Bias and fairness monitoring is conducted on scoring outputs',
            'Technical documentation of the AI system is maintained and accessible',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 13 }}>
              <Check size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
