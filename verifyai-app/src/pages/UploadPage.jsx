import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, CheckCircle, Lock, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ACCEPTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']

export default function UploadPage() {
  const navigate  = useNavigate()
  const fileRef   = useRef()
  const [dragging, setDragging]   = useState(false)
  const [file, setFile]           = useState(null)
  const [form, setForm]           = useState({ full_name: '', email: '', role: '', location: '' })
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  // Read the CV and pre-fill empty form fields — does NOT run the fraud
  // analysis; that only happens when the user reviews details and submits.
  const autofillFromCv = async (f) => {
    setExtracting(true)
    setAutoFilled(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/extract`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: fd,
      })
      if (!res.ok) return
      const d = await res.json()
      let filled = false
      setForm(prev => {
        const next = {
          full_name: prev.full_name || d.full_name || '',
          email:     prev.email     || d.email     || '',
          role:      prev.role      || d.role      || '',
          location:  prev.location  || d.location  || '',
        }
        filled = JSON.stringify(next) !== JSON.stringify(prev)
        return next
      })
      if (filled) setAutoFilled(true)
    } catch {
      // Silent — the user can simply fill the fields manually
    } finally {
      setExtracting(false)
    }
  }

  const pickFile = (incoming) => {
    const f = Array.from(incoming).find(f => ACCEPTED.includes(f.type) && f.size <= 15 * 1024 * 1024)
    if (f) {
      setFile(f)
      setError(null)
      autofillFromCv(f)
    } else {
      setError('Please upload a PDF, DOCX or TXT file under 15MB.')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.full_name) { setError('Candidate name is required.'); return }
    if (!file) { setError('Please attach a CV file.'); return }

    setSaving(true)
    setError(null)

    try {
      // Get the current session token to authenticate the upload request
      const { data: { session } } = await supabase.auth.getSession()

      // Send everything directly to FastAPI — it handles DB + storage + analysis
      const fd = new FormData()
      fd.append('full_name', form.full_name)
      fd.append('email',     form.email)
      fd.append('role',      form.role)
      fd.append('location',  form.location)
      fd.append('file',      file)

      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Upload failed')
      }

      const data = await res.json()
      setSuccess(true)

      // Redirect to the new candidate's analysis page after 1.5s
      setTimeout(() => navigate(`/analysis/${data.candidate_id}`), 1500)

    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?')
    } finally {
      setSaving(false)
    }
  }

  if (success) return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <CheckCircle size={48} strokeWidth={1.5} color="#34d399" style={{ margin: '0 auto 16px', display: 'block' }} />
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Candidate added!</div>
      <div style={{ color: 'var(--text-2)', fontSize: 14 }}>Taking you to the Trust Intelligence report — analysis running now...</div>
    </div>
  )

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Candidate details */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Candidate Details</div>
            {extracting && (
              <span style={{ fontSize: 12, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, border: '2px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Reading CV to auto-fill details...
              </span>
            )}
            {!extracting && autoFilled && (
              <span style={{ fontSize: 12, color: 'var(--teal)', background: 'rgba(20,184,166,0.1)', borderRadius: 20, padding: '2px 10px' }}>
                ✓ Auto-filled from CV — check before running
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label>Full name *</label>
              <input className="input" placeholder="e.g. Daniel Johnson" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" placeholder="daniel@email.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="field">
              <label>Role applied for</label>
              <input className="input" placeholder="e.g. Senior Data Analyst" value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="field">
              <label>Location</label>
              <input className="input" placeholder="e.g. London, UK" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* File drop zone */}
        <div
          style={{
            background: dragging ? 'var(--teal-soft)' : file ? 'var(--bg-2)' : 'var(--bg-2)',
            border: `2px dashed ${dragging ? 'var(--teal)' : file ? 'var(--teal)' : 'var(--line)'}`,
            borderRadius: 12, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !file && fileRef.current.click()}
        >
          <input
            ref={fileRef} type="file" hidden
            accept=".pdf,.docx,.txt"
            onChange={e => pickFile(e.target.files)}
          />
          {file ? (
            <div>
              <FileText size={36} strokeWidth={1} color="var(--teal)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--teal)' }}>{file.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                {(file.size / 1024).toFixed(0)} KB — ready to upload
              </div>
              <button type="button" className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={e => { e.stopPropagation(); setFile(null); fileRef.current.click() }}>
                <X size={13} /> Change file
              </button>
            </div>
          ) : (
            <div>
              <Upload size={36} strokeWidth={1} color="var(--text-3)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Drag & drop CV file here</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
                PDF, DOCX or TXT · Max 15MB
              </div>
              <button type="button" className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Upload size={13} /> Browse files
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, padding: '10px 14px', background: 'rgba(244,63,94,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* GDPR notice */}
        <div style={{ fontSize: 12, color: 'var(--text-2)', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={13} style={{ flexShrink: 0 }} />
          Files are encrypted at rest · Processed under UK GDPR Art. 6(1)(f) · Compliant with EU AI Act human oversight requirements · Retained for 12 months
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? 'Uploading & running trust intelligence...' : '✓ Add Candidate & Run Trust Intelligence'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/candidates')}>Cancel</button>
        </div>

      </form>
    </div>
  )
}
