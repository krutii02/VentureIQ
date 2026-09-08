import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, Upload, Globe, Building2, Save, Edit2, CheckCircle2,
  FileText, Trash2, ExternalLink, AlertCircle, ArrowRight, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useStartup } from '../../context/StartupContext';
import { startupsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

const INDUSTRIES = [
  'SaaS', 'FinTech', 'EdTech', 'Healthcare', 'CleanTech', 'AgriTech',
  'AI & Machine Learning', 'Cybersecurity', 'E-Commerce', 'Logistics',
  'Robotics', 'Blockchain', 'Other',
];
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Late Stage'];

/* ── Empty form skeleton ─────────────────────────────── */
const EMPTY_FORM = {
  name: '', industry: 'SaaS', stage: 'Seed',
  country: 'India', city: '', founded_year: new Date().getFullYear(),
  location: '', website: '', description: '',
  revenue: '', growth: '', team_size: '',
  valuation: '', active_users: '', tags: '',
  tech_stack: '', target_audience: '',
};

/* ── Small labelled input ────────────────────────────── */
function Field({ label, required, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span style={{ color: 'var(--clr-danger)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: '0.71rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

/* ── Step indicator ──────────────────────────────────── */
function StepBar({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 'var(--r-full)',
          background: i < step ? 'var(--clr-accent-1)' : 'var(--clr-border)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function StartupManagementPage() {
  const navigate = useNavigate();
  const { startup, updateStartup, loadStartup } = useStartup();

  /* ── Create mode (no existing startup) ── */
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [step, setStep] = useState(1);   // 1 = basics, 2 = metrics, 3 = story
  const [saving, setSaving] = useState(false);

  /* ── Edit mode (existing startup) ── */
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  /* ── Logo / Deck ── */
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('ventureiq_founder_logo') || null);
  const [pitchDeck, setPitchDeck] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ventureiq_founder_deck') || 'null'); } catch { return null; }
  });
  const logoRef = useRef(null);
  const deckRef = useRef(null);

  /* Sync edit form when startup loads */
  useEffect(() => {
    if (startup) {
      setEditForm({
        name: startup.name || '',
        industry: startup.industry || 'SaaS',
        stage: startup.stage || 'Seed',
        country: startup.country || 'India',
        city: startup.city || '',
        founded_year: startup.founded_year || new Date().getFullYear(),
        location: startup.location || startup.city || '',
        website: startup.website || '',
        description: startup.description || '',
        revenue: startup.revenue || '',
        growth: startup.growth || '',
        team_size: startup.team_size || startup.team || '',
        valuation: startup.valuation || '',
        active_users: startup.active_users || '',
        tags: startup.tags || '',
        tech_stack: startup.tech_stack || '',
        target_audience: startup.target_audience || '',
      });
    }
  }, [startup]);

  /* ─────────────────────────── LOGO UPLOAD ─────────────────────── */
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoUrl(ev.target.result);
      localStorage.setItem('ventureiq_founder_logo', ev.target.result);
      toast.success('Logo uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleDeckSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error('File must be under 25 MB'); return; }
    const info = {
      name: file.name, size: (file.size / 1048576).toFixed(1) + ' MB',
      type: file.type, uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setPitchDeck(info);
    localStorage.setItem('ventureiq_founder_deck', JSON.stringify(info));
    toast.success('Pitch deck uploaded!');
  };

  /* ─────────────────────────── CREATE FLOW ─────────────────────── */
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Startup name is required'); return; }
    if (!form.industry)    { toast.error('Industry is required'); return; }
    if (!form.stage)       { toast.error('Funding stage is required'); return; }
    setSaving(true);
    try {
      await startupsAPI.createMyStartup({
        ...form,
        team_size: Number(form.team_size) || 1,
        active_users: Number(form.active_users) || 0,
        founded_year: Number(form.founded_year) || new Date().getFullYear(),
      });
      await loadStartup();
      toast.success('🚀 Startup profile created!');
      navigate('/founder/dashboard');
    } catch (err) {
      // Backend may return { error: '...' } or a serializer dict { field: ['msg'] }
      const data = err?.response?.data;
      let msg = 'Failed to create startup. Please try again.';
      if (data) {
        if (typeof data.error === 'string') {
          msg = data.error;
        } else if (typeof data === 'object') {
          // Flatten all serializer field errors into one message
          const fieldErrors = Object.entries(data)
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join(' | ');
          if (fieldErrors) msg = fieldErrors;
        }
      } else if (err?.message) {
        msg = err.message.includes('401') || err.message.includes('Unauthorized')
          ? 'Session expired. Please log out and log back in.'
          : err.message;
      }
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────────────────── EDIT FLOW ──────────────────────── */
  const setE = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStartup({
        ...editForm,
        team_size: Number(editForm.team_size) || startup?.team_size || 1,
        active_users: Number(editForm.active_users) || startup?.active_users || 0,
        founded_year: Number(editForm.founded_year) || startup?.founded_year || 2022,
      });
      await loadStartup();
      setIsEditing(false);
      toast.success('Startup profile updated!');
    } catch (err) {
      const data = err?.response?.data;
      let msg = 'Failed to save changes. Please try again.';
      if (data) {
        if (typeof data.error === 'string') msg = data.error;
        else if (typeof data === 'object') {
          const fieldErrors = Object.entries(data)
            .map(([f, e]) => `${f}: ${Array.isArray(e) ? e.join(', ') : e}`)
            .join(' | ');
          if (fieldErrors) msg = fieldErrors;
        }
      }
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  /* ══════════════════════════════════════════════════════
     CREATE MODE — multi-step wizard
  ══════════════════════════════════════════════════════ */
  if (!startup) {
    return (
      <DashboardLayout title="Create Your Startup Profile" subtitle="Tell investors about your venture — all fields can be updated later">

        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Progress bar */}
          <StepBar step={step} total={3} />

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div className="card" style={{ padding: '32px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="var(--clr-accent-1)" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Basic Information</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Step 1 of 3 — required fields marked with *</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field label="Startup Name" required>
                  <input className="form-input" placeholder="e.g. Axiom AI, GreenBridge, NovaMed…"
                    value={form.name} onChange={e => setF('name', e.target.value)} autoFocus />
                </Field>

                <div className="grid-2">
                  <Field label="Industry" required>
                    <select className="form-select" value={form.industry} onChange={e => setF('industry', e.target.value)}>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Funding Stage" required>
                    <select className="form-select" value={form.stage} onChange={e => setF('stage', e.target.value)}>
                      {STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid-2">
                  <Field label="Country">
                    <input className="form-input" placeholder="India" value={form.country} onChange={e => setF('country', e.target.value)} />
                  </Field>
                  <Field label="City">
                    <input className="form-input" placeholder="Bengaluru, Mumbai…" value={form.city} onChange={e => setF('city', e.target.value)} />
                  </Field>
                </div>

                <div className="grid-2">
                  <Field label="Founded Year">
                    <input className="form-input" type="number" placeholder="2023" value={form.founded_year} onChange={e => setF('founded_year', e.target.value)} />
                  </Field>
                  <Field label="Website">
                    <input className="form-input" placeholder="https://yourstartup.com" value={form.website} onChange={e => setF('website', e.target.value)} />
                  </Field>
                </div>

                <button className="btn btn-primary" style={{ height: 46, marginTop: 8 }}
                  onClick={() => {
                    if (!form.name.trim()) { toast.error('Startup name is required'); return; }
                    setStep(2);
                  }}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Metrics ── */}
          {step === 2 && (
            <div className="card" style={{ padding: '32px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Key Metrics</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Step 2 of 3 — all optional, add what you know</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="grid-2">
                  <Field label="Monthly Revenue" hint="e.g. ₹41.75 L/month or leave blank">
                    <input className="form-input" placeholder="₹41.75 L/month" value={form.revenue} onChange={e => setF('revenue', e.target.value)} />
                  </Field>
                  <Field label="MoM Growth" hint="e.g. +18%">
                    <input className="form-input" placeholder="+18%" value={form.growth} onChange={e => setF('growth', e.target.value)} />
                  </Field>
                </div>

                <div className="grid-2">
                  <Field label="Team Size">
                    <input className="form-input" type="number" placeholder="10" value={form.team_size} onChange={e => setF('team_size', e.target.value)} />
                  </Field>
                  <Field label="Active Users">
                    <input className="form-input" type="number" placeholder="5000" value={form.active_users} onChange={e => setF('active_users', e.target.value)} />
                  </Field>
                </div>

                <div className="grid-2">
                  <Field label="Valuation" hint="e.g. $2.5M">
                    <input className="form-input" placeholder="$2.5M" value={form.valuation} onChange={e => setF('valuation', e.target.value)} />
                  </Field>
                  <Field label="Industry Tags" hint="comma-separated, e.g. AI, SaaS, B2B">
                    <input className="form-input" placeholder="AI, SaaS, B2B" value={form.tags} onChange={e => setF('tags', e.target.value)} />
                  </Field>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, height: 44 }} onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 2, height: 44 }} onClick={() => setStep(3)}>
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Story & Tech ── */}
          {step === 3 && (
            <div className="card" style={{ padding: '32px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="#8b5cf6" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Story & Technology</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Step 3 of 3 — help investors understand your vision</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Field label="Short Description">
                  <textarea className="form-input" rows={4} style={{ resize: 'none' }}
                    placeholder="Describe what your startup does and the problem you're solving…"
                    value={form.description} onChange={e => setF('description', e.target.value)} />
                </Field>

                <div className="grid-2">
                  <Field label="Tech Stack" hint="e.g. React, Python, AWS">
                    <input className="form-input" placeholder="React, Node.js, PostgreSQL…" value={form.tech_stack} onChange={e => setF('tech_stack', e.target.value)} />
                  </Field>
                  <Field label="Target Audience">
                    <input className="form-input" placeholder="SMBs, Enterprise, Consumers…" value={form.target_audience} onChange={e => setF('target_audience', e.target.value)} />
                  </Field>
                </div>

                {/* Summary preview */}
                <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--clr-accent-1)', marginBottom: 6 }}>Profile Summary</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>
                    <b>{form.name || '—'}</b> · {form.industry} · {form.stage}
                    {form.country && <span> · {form.city || form.country}</span>}
                    {form.revenue && <span> · Revenue: {form.revenue}</span>}
                    {form.team_size && <span> · Team: {form.team_size}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, height: 46 }} onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 2, height: 46, gap: 8 }}
                    onClick={handleCreate}
                    disabled={saving}
                  >
                    {saving
                      ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite', display: 'inline-block' }} /> Saving…</>
                      : <><Rocket size={16} /> Launch Startup Profile</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info banner */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
            <AlertCircle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            You can update all fields after creation. Once saved, your startup becomes visible to investors on the Discover page.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ══════════════════════════════════════════════════════
     EDIT MODE — existing startup profile
  ══════════════════════════════════════════════════════ */
  return (
    <DashboardLayout title="My Startup" subtitle="Manage your startup profile, branding, and pitch deck">

      {/* Top Banner */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)', borderColor: 'rgba(99,102,241,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: 64, height: 64, borderRadius: 'var(--r-md)', objectFit: 'cover', border: '2px solid var(--clr-accent-1)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '1.8rem' }}>
                {(startup.name || 'ST').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{startup.name}</h2>
                <span className="badge badge-purple">{startup.stage}</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-secondary)', marginTop: 2 }}>
                {startup.industry} {startup.city || startup.country ? `· ${startup.city || startup.country}` : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isEditing ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => { setIsEditing(false); }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : <><Save size={14} /> Save Profile</>}
                </button>
              </>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* ── Form ── */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Company Overview</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
              {isEditing ? 'Editing Mode' : 'Read-Only'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="grid-2">
              <Field label="Startup Name">
                {isEditing
                  ? <input className="form-input" value={editForm.name || ''} onChange={e => setE('name', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 600 }}>{startup.name}</div>}
              </Field>
              <Field label="Industry">
                {isEditing
                  ? <select className="form-select" value={editForm.industry || ''} onChange={e => setE('industry', e.target.value)}>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.industry}</div>}
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Funding Stage">
                {isEditing
                  ? <select className="form-select" value={editForm.stage || ''} onChange={e => setE('stage', e.target.value)}>
                      {STAGES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.stage}</div>}
              </Field>
              <Field label="Founded Year">
                {isEditing
                  ? <input className="form-input" type="number" value={editForm.founded_year || ''} onChange={e => setE('founded_year', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.founded_year}</div>}
              </Field>
            </div>

            <div className="grid-2">
              <Field label="City / Location">
                {isEditing
                  ? <input className="form-input" value={editForm.city || ''} onChange={e => setE('city', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.city || startup.country || '—'}</div>}
              </Field>
              <Field label="Website">
                {isEditing
                  ? <input className="form-input" placeholder="https://…" value={editForm.website || ''} onChange={e => setE('website', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {startup.website
                        ? <a href={startup.website} target="_blank" rel="noreferrer" style={{ color: 'var(--clr-accent-1)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {startup.website.replace('https://', '')} <ExternalLink size={12} />
                          </a>
                        : '—'}
                    </div>}
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Monthly Revenue">
                {isEditing
                  ? <input className="form-input" placeholder="₹41.75 L/month" value={editForm.revenue || ''} onChange={e => setE('revenue', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--clr-success)', fontWeight: 700 }}>{formatCurrency(startup.revenue) || '—'}</div>}
              </Field>
              <Field label="MoM Growth">
                {isEditing
                  ? <input className="form-input" placeholder="+18%" value={editForm.growth || ''} onChange={e => setE('growth', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.growth || '—'}</div>}
              </Field>
            </div>

            <div className="grid-2">
              <Field label="Team Size">
                {isEditing
                  ? <input className="form-input" type="number" value={editForm.team_size || ''} onChange={e => setE('team_size', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.team_size || startup.team || '—'} employees</div>}
              </Field>
              <Field label="Active Users">
                {isEditing
                  ? <input className="form-input" type="number" value={editForm.active_users || ''} onChange={e => setE('active_users', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{Number(startup.active_users || 0).toLocaleString()}</div>}
              </Field>
            </div>

            <Field label="Short Description">
              {isEditing
                ? <textarea className="form-input" rows={4} style={{ resize: 'none' }} value={editForm.description || ''} onChange={e => setE('description', e.target.value)} />
                : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)', height: 'auto', minHeight: 80, lineHeight: 1.6 }}>{startup.description || '—'}</div>}
            </Field>

            <div className="grid-2">
              <Field label="Tech Stack">
                {isEditing
                  ? <input className="form-input" value={editForm.tech_stack || ''} onChange={e => setE('tech_stack', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.tech_stack || '—'}</div>}
              </Field>
              <Field label="Tags">
                {isEditing
                  ? <input className="form-input" placeholder="AI, SaaS, B2B" value={editForm.tags || ''} onChange={e => setE('tags', e.target.value)} />
                  : <div className="form-input" style={{ background: 'rgba(255,255,255,0.02)' }}>{startup.tags || '—'}</div>}
              </Field>
            </div>

            {isEditing && (
              <button className="btn btn-primary" style={{ height: 44 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : <><Save size={15} /> Save All Changes</>}
              </button>
            )}
          </div>
        </div>

        {/* ── Media ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Logo */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Startup Logo</h3>
            <input type="file" ref={logoRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoSelect} />
            {logoUrl ? (
              <div style={{ textAlign: 'center' }}>
                <img src={logoUrl} alt="Logo" style={{ width: 90, height: 90, borderRadius: 'var(--r-md)', objectFit: 'cover', margin: '0 auto 14px', display: 'block', border: '2px solid var(--clr-accent-1)' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => logoRef.current?.click()}><Upload size={13} /> Change</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setLogoUrl(null); localStorage.removeItem('ventureiq_founder_logo'); toast.success('Logo removed'); }}><Trash2 size={13} /> Remove</button>
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--clr-border)', borderRadius: 'var(--r-lg)', padding: 24, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => logoRef.current?.click()}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--clr-accent-1)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--clr-border)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🖼️</div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Upload Company Logo</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--clr-accent-1)', marginTop: 4 }}>Click to browse</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>PNG, JPG, SVG · max 5 MB</p>
              </div>
            )}
          </div>

          {/* Pitch Deck */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Investor Pitch Deck</h3>
            <input type="file" ref={deckRef} accept=".pdf,.ppt,.pptx" style={{ display: 'none' }} onChange={handleDeckSelect} />
            {pitchDeck ? (
              <div style={{ padding: 14, background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pitchDeck.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>{pitchDeck.size} · {pitchDeck.uploadedAt}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => deckRef.current?.click()}><Upload size={13} /> Replace</button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setPitchDeck(null); localStorage.removeItem('ventureiq_founder_deck'); }}><Trash2 size={13} /></button>
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--clr-border)', borderRadius: 'var(--r-lg)', padding: 24, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => deckRef.current?.click()}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--clr-accent-1)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--clr-border)'}
              >
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📑</div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Upload Pitch Deck</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--clr-accent-1)', marginTop: 4 }}>PDF or PPTX</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>max 25 MB</p>
              </div>
            )}
          </div>

          {/* Quick tip */}
          <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', fontSize: '0.77rem', color: 'var(--clr-text-muted)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: '#10b981' }}>✓ Visible to Investors</span><br />
            Your startup profile is live on the Investor Discover page. Keep it updated to attract more interest.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
