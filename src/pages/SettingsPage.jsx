import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { User, Shield, Bell, Database, ChevronRight, Save, Check, Cpu, ShieldCheck, Fingerprint } from 'lucide-react'

const Section = ({ title, description, Icon, children }) => (
  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
      {Icon && <Icon size={15} color="var(--teal)" />}
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>{description}</div>}
      </div>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
)

const Field = ({ label, hint, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{hint}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
)

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
      background: checked ? 'var(--teal)' : 'var(--bg-3)',
      position: 'relative', transition: 'background 0.2s',
    }}>
    <div style={{
      width: 16, height: 16, borderRadius: '50%', background: '#fff',
      position: 'absolute', top: 3, left: checked ? 21 : 3, transition: 'left 0.2s'
    }} />
  </button>
)

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({ name: '', company: 'Acme Talent', role: 'Lead Recruiter' })
  const [notifications, setNotifications] = useState({
    highRisk: true, analysisComplete: true, weeklyReport: false, emailAlerts: true,
  })
  const [retention, setRetention] = useState('12')
  const [gdpr, setGdpr] = useState({ autoDelete: false, anonymise: true })
  const [governance, setGovernance] = useState({ explainability: true, humanOversight: true, euAiAct: true, threshold: 'disabled' })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Settings</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Manage your workspace preferences</div>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleSave}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save changes</>}
        </button>
      </div>

      {/* Profile */}
      <Section title="Profile" description="Your account details" Icon={User}>
        <Field label="Full name" hint="Displayed in the sidebar and reports">
          <input className="input" style={{ width: 220 }} value={profile.name}
            placeholder="Your name" onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Company name" hint="Shown on generated reports">
          <input className="input" style={{ width: 220 }} value={profile.company}
            onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} />
        </Field>
        <Field label="Job title" hint="Optional">
          <input className="input" style={{ width: 220 }} value={profile.role}
            onChange={e => setProfile(p => ({ ...p, role: e.target.value }))} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Account plan</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Starter — up to 50 candidates/month</div>
          </div>
          <button className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            Upgrade plan <ChevronRight size={13} />
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" description="Choose what triggers an alert" Icon={Bell}>
        <Field label="High risk candidate detected" hint="Notify when a candidate scores below 40">
          <Toggle checked={notifications.highRisk} onChange={v => setNotifications(n => ({ ...n, highRisk: v }))} />
        </Field>
        <Field label="Analysis complete" hint="Notify when AI finishes scoring a CV">
          <Toggle checked={notifications.analysisComplete} onChange={v => setNotifications(n => ({ ...n, analysisComplete: v }))} />
        </Field>
        <Field label="Weekly summary report" hint="Email digest every Monday morning">
          <Toggle checked={notifications.weeklyReport} onChange={v => setNotifications(n => ({ ...n, weeklyReport: v }))} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Email alerts</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Send notifications to your account email</div>
          </div>
          <Toggle checked={notifications.emailAlerts} onChange={v => setNotifications(n => ({ ...n, emailAlerts: v }))} />
        </div>
      </Section>

      {/* GDPR / Data retention */}
      <Section title="Data & Privacy" description="UK GDPR compliance settings" Icon={Shield}>
        <Field label="Data retention period" hint="Candidate data is automatically flagged for deletion after this period">
          <select className="input" style={{ width: 180 }} value={retention} onChange={e => setRetention(e.target.value)}>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months (default)</option>
            <option value="24">24 months</option>
          </select>
        </Field>
        <Field label="Auto-delete expired records" hint="Permanently delete candidate data after retention period">
          <Toggle checked={gdpr.autoDelete} onChange={v => setGdpr(g => ({ ...g, autoDelete: v }))} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Anonymise instead of delete</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Replace PII with anonymised identifiers</div>
          </div>
          <Toggle checked={gdpr.anonymise} onChange={v => setGdpr(g => ({ ...g, anonymise: v }))} />
        </div>
      </Section>

      {/* AI Governance */}
      <Section title="AI Governance" description="EU AI Act compliance, explainability controls and human oversight settings" Icon={Cpu}>
        <Field label="Explainability mode" hint="Show evidence citations and reasoning for every trust score decision">
          <Toggle checked={governance.explainability} onChange={v => setGovernance(g => ({ ...g, explainability: v }))} />
        </Field>
        <Field label="Human oversight required" hint="Flag candidates for mandatory human review before final hiring decisions">
          <Toggle checked={governance.humanOversight} onChange={v => setGovernance(g => ({ ...g, humanOversight: v }))} />
        </Field>
        <Field label="EU AI Act compliance mode" hint="Enforce high-risk AI system requirements — hiring AI is explicitly covered">
          <Toggle checked={governance.euAiAct} onChange={v => setGovernance(g => ({ ...g, euAiAct: v }))} />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Auto-advance confidence threshold</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Minimum trust score to advance a candidate without manual review</div>
          </div>
          <select className="input" style={{ width: 210 }} value={governance.threshold} onChange={e => setGovernance(g => ({ ...g, threshold: e.target.value }))}>
            <option value="disabled">Disabled — always manual review</option>
            <option value="80">80+ (High confidence only)</option>
            <option value="70">70+ (Recommended)</option>
            <option value="60">60+ (Permissive)</option>
          </select>
        </div>
      </Section>

      {/* Trust Intelligence */}
      <Section title="Trust Intelligence" description="Verification sources and analysis configuration" Icon={Fingerprint}>
        <Field label="AI-generated content detection" hint="Detect GPT, Claude and LLM-written CVs automatically">
          <Toggle checked={true} onChange={() => {}} />
        </Field>
        <Field label="Behavioural consistency analysis" hint="Analyse language patterns and narrative coherence">
          <Toggle checked={true} onChange={() => {}} />
        </Field>
        <Field label="LinkedIn consistency check" hint="Cross-reference CV claims against LinkedIn profile (coming soon)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 6, padding: '2px 8px', border: '1px solid var(--line)' }}>Coming Soon</span>
          </div>
        </Field>
        <Field label="Identity verification" hint="Passport and government ID document checks (coming soon)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 6, padding: '2px 8px', border: '1px solid var(--line)' }}>Coming Soon</span>
          </div>
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Deepfake interview risk detection</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Monitor video interviews for AI-generated or deepfake content</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg-3)', borderRadius: 6, padding: '2px 8px', border: '1px solid var(--line)' }}>Coming Soon</span>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Data Management" description="Irreversible actions — proceed with caution" Icon={Database}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Export all data</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Download a CSV of all candidates and analysis results</div>
          </div>
          <button className="btn btn-sm" onClick={async () => {
            const { data } = await supabase.from('candidates').select('*, analysis_results(*)').order('created_at', { ascending: false })
            if (!data) return
            const rows = data.map(c => {
              const r = c.analysis_results?.[0] || {}
              return [
                c.full_name, c.email, c.role, c.location, c.status,
                r.trust_score ?? '', r.risk_level ?? '',
                r.timeline_consistency ?? '', r.skill_authenticity ?? '',
                r.ai_text_detection ?? '', r.certification_plausibility ?? '', r.narrative_coherence ?? '',
                new Date(c.created_at).toLocaleDateString('en-GB')
              ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
            })
            const csv = ['Full Name,Email,Role,Location,Status,Trust Score,Risk Level,Timeline,Skill Auth,AI Text,Certs,Narrative,Added', ...rows].join('\n')
            const a = document.createElement('a')
            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
            a.download = `verifyai-export-${new Date().toISOString().slice(0,10)}.csv`
            a.click()
          }}>Export CSV</button>
        </div>
      </Section>

    </div>
  )
}
