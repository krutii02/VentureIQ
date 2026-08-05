import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Target, Globe, Hash, Users,
  Mail, MapPin, Edit3, Save, X, Plus, Trash2, Award,
  DollarSign, BarChart2, CheckCircle2, Star,
  AlertTriangle, ArrowRight, CheckCircle, Building2,
  Sparkles, TrendingUp, Link2
} from 'lucide-react';

import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import toast from 'react-hot-toast';

/* ── constants ────────────────────────────────────────────────── */
const INDUSTRIES = [
  'SaaS', 'FinTech', 'EdTech', 'Healthcare', 'CleanTech', 'AgriTech',
  'AI & Machine Learning', 'Cybersecurity', 'E-Commerce', 'Logistics',
  'Robotics', 'Blockchain', 'PropTech', 'B2B', 'Consumer', 'DeepTech', 'Other',
];
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Late Stage', 'Growth'];

/* ── helpers ──────────────────────────────────────────────────── */
const Section = ({ title, icon: Icon, children, accent = '#6366f1' }) => (
  <div className="card" style={{ marginBottom: 20 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
      paddingBottom: 14, borderBottom: '1px solid var(--clr-border)'
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: `${accent}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={18} color={accent} strokeWidth={2} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, editing, type = 'text', onChange, placeholder, multiline }) => {
  if (editing) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{
          fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5
        }}>{label}</label>
        {multiline ? (
          <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{
              width: '100%', background: 'var(--clr-bg-elevated)', border: '1px solid var(--clr-border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--clr-text)',
              fontSize: '0.88rem', resize: 'vertical', minHeight: 90, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box'
            }} />
        ) : (
          <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{
              width: '100%', background: 'var(--clr-bg-elevated)', border: '1px solid var(--clr-border)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--clr-text)',
              fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
            }} />
        )}
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4
      }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: value ? 'var(--clr-text)' : 'var(--clr-text-muted)', fontStyle: value ? 'normal' : 'italic', lineHeight: 1.55 }}>
        {value || 'Not set'}
      </div>
    </div>
  );
};

/* ── Step Progress Bar ───────────────────────────────────────── */
function StepBar({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 20,
          background: i < step ? '#10b981' : 'var(--clr-border)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

/* ── Tag Selector ─────────────────────────────────────────────── */
function TagSelector({ label, options, selected, onChange, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} onClick={() => {
              if (active) onChange(selected.filter(s => s !== opt));
              else onChange([...selected, opt]);
            }} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600,
              cursor: 'pointer', border: active ? `1px solid ${color}` : '1px solid var(--clr-border)',
              background: active ? `${color}18` : 'transparent',
              color: active ? color : 'var(--clr-text-muted)',
              transition: 'all 0.15s',
            }}>
              {active && '✓ '}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ONBOARDING SETUP WIZARD (shown when profile is incomplete)
══════════════════════════════════════════════════════════════ */
function SetupWizard({ initialData, onComplete, onUpdateUser }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:                 initialData.name || '',
    firm:                 initialData.firm || '',
    title:                initialData.title || '',
    location:             initialData.location || '',
    bio:                  initialData.bio || '',
    investment_thesis:    initialData.investment_thesis || '',
    min_ticket:           initialData.min_ticket || '',
    max_ticket:           initialData.max_ticket || '',
    preferred_stages:     initialData.preferred_stages
                            ? initialData.preferred_stages.split(',').map(s => s.trim()).filter(Boolean)
                            : [],
    preferred_industries: initialData.preferred_industries
                            ? initialData.preferred_industries.split(',').map(s => s.trim()).filter(Boolean)
                            : [],
    total_investments:    initialData.total_investments || '',
    successful_exits:     initialData.successful_exits || '',
    linkedin:             initialData.linkedin || '',
    website:              initialData.website || '',
    phone:                initialData.phone || '',
  });

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.firm.trim()) { toast.error('Firm / Fund name is required'); return; }
    if (!form.investment_thesis.trim()) { toast.error('Investment thesis is required'); return; }
    setSaving(true);
    try {
      await profileAPI.update({
        name: form.name,
        firm: form.firm,
        bio: form.bio,
        location: form.location,
        investment_thesis: form.investment_thesis,
        min_ticket: form.min_ticket,
        max_ticket: form.max_ticket,
        preferred_stages: form.preferred_stages.join(', '),
        preferred_industries: form.preferred_industries.join(', '),
        total_investments: parseInt(form.total_investments) || 0,
        successful_exits: parseInt(form.successful_exits) || 0,
        linkedin: form.linkedin,
        website: form.website,
        phone: form.phone,
      });
      // Update auth context so dashboard firm name refreshes immediately
      if (onUpdateUser) onUpdateUser({ firm: form.firm, name: form.name });
      toast.success('🎉 Investor profile created! You\'re now visible to founders.');
      onComplete();
    } catch (e) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'var(--clr-bg-elevated)', border: '1px solid var(--clr-border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--clr-text)',
    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <StepBar step={step} total={3} />

      {/* ── Step 1: Basic Info ── */}
      {step === 1 && (
        <motion.div className="card" style={{ padding: '32px 36px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Basic Information</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Step 1 of 3 — who are you?</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                Full Name
              </label>
              <input className="form-input" placeholder="e.g. Aryan Mehta" value={form.name} onChange={e => setF('name', e.target.value)} autoFocus />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Firm / Fund Name <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                <input className="form-input" placeholder="e.g. Apex Ventures" value={form.firm} onChange={e => setF('firm', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Your Title / Role
                </label>
                <input className="form-input" placeholder="e.g. Managing Partner" value={form.title} onChange={e => setF('title', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                Location
              </label>
              <input className="form-input" placeholder="e.g. Mumbai, India" value={form.location} onChange={e => setF('location', e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                Short Bio
              </label>
              <textarea className="form-input" placeholder="Briefly describe your background as an investor..." rows={3}
                value={form.bio} onChange={e => setF('bio', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
            </div>

            <button className="btn btn-primary" style={{ height: 46, marginTop: 8 }}
              onClick={() => {
                if (!form.firm.trim()) { toast.error('Firm / Fund name is required'); return; }
                setStep(2);
              }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Step 2: Investment Thesis ── */}
      {step === 2 && (
        <motion.div className="card" style={{ padding: '32px 36px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={18} color="#8b5cf6" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Investment Thesis</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Step 2 of 3 — what do you invest in?</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                Investment Thesis <span style={{ color: 'var(--clr-danger)' }}>*</span>
              </label>
              <textarea placeholder="Describe what you look for in startups, your focus areas, and investment philosophy..."
                rows={4} value={form.investment_thesis} onChange={e => setF('investment_thesis', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Min Ticket Size
                </label>
                <input style={inputStyle} placeholder="e.g. $100K" value={form.min_ticket} onChange={e => setF('min_ticket', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Max Ticket Size
                </label>
                <input style={inputStyle} placeholder="e.g. $2M" value={form.max_ticket} onChange={e => setF('max_ticket', e.target.value)} />
              </div>
            </div>

            <TagSelector
              label="Preferred Investment Stages"
              options={STAGES}
              selected={form.preferred_stages}
              onChange={v => setF('preferred_stages', v)}
              color="#10b981"
            />

            <TagSelector
              label="Focus Industries"
              options={INDUSTRIES}
              selected={form.preferred_industries}
              onChange={v => setF('preferred_industries', v)}
              color="#6366f1"
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, height: 44 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 44 }}
                onClick={() => {
                  if (!form.investment_thesis.trim()) { toast.error('Investment thesis is required'); return; }
                  setStep(3);
                }}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Track Record & Contact ── */}
      {step === 3 && (
        <motion.div className="card" style={{ padding: '32px 36px' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Track Record & Contact</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Step 3 of 3 — almost there!</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Total Investments Made
                </label>
                <input type="number" style={inputStyle} placeholder="e.g. 12" value={form.total_investments} onChange={e => setF('total_investments', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Successful Exits
                </label>
                <input type="number" style={inputStyle} placeholder="e.g. 3" value={form.successful_exits} onChange={e => setF('successful_exits', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                LinkedIn URL
              </label>
              <input style={inputStyle} placeholder="https://linkedin.com/in/yourprofile" value={form.linkedin} onChange={e => setF('linkedin', e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Website
                </label>
                <input style={inputStyle} placeholder="https://yourfirm.com" value={form.website} onChange={e => setF('website', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                  Phone
                </label>
                <input style={inputStyle} placeholder="+91 98765 00000" value={form.phone} onChange={e => setF('phone', e.target.value)} />
              </div>
            </div>

            {/* Summary preview */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', marginTop: 4 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#10b981', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Profile Summary
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>
                <strong>{form.name || 'Your name'}</strong> from <strong>{form.firm}</strong>{form.location ? ` · ${form.location}` : ''}<br />
                {form.preferred_industries.length > 0 && <span>Focus: {form.preferred_industries.slice(0, 3).join(', ')}</span>}
                {form.preferred_stages.length > 0 && <span> · Stages: {form.preferred_stages.join(', ')}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, height: 44 }} onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 2, height: 44, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : <><CheckCircle size={16} /> Complete Profile</>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function InvestorMyProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [draft, setDraft]             = useState({});
  const [setupMode, setSetupMode]     = useState(false);
  const [activeTab, setActiveTab]     = useState('overview');
  const [newTag, setNewTag]           = useState({ industries: '', stages: '' });

  // Extra UI-only (portfolio/exits not stored in API — keep local for now)
  const [investments, setInvestments] = useState([]);
  const [exits,       setExits]       = useState([]);
  const [expertise,   setExpertise]   = useState([]);
  const [newExpertise, setNewExpertise] = useState('');
  const [showAddInv, setShowAddInv]   = useState(false);
  const [newInv, setNewInv]           = useState({ company: '', sector: '', stage: 'Pre-Seed', amount: '', year: new Date().getFullYear(), status: 'Active', currentVal: '' });

  const isProfileComplete = (p) => !!(p && p.firm && p.investment_thesis);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await profileAPI.get();
      const d = res.data;
      const mapped = {
        name:                 d.name || user?.name || '',
        email:                d.email || user?.email || '',
        firm:                 d.firm || '',
        title:                '',   // not stored on backend, we use bio as proxy
        location:             d.location || '',
        phone:                d.phone || '',
        website:              d.website || '',
        linkedin:             d.linkedin || '',
        bio:                  d.bio || '',
        investment_thesis:    d.investment_thesis || '',
        min_ticket:           d.min_ticket || '',
        max_ticket:           d.max_ticket || '',
        preferred_industries: d.preferred_industries || '',
        preferred_stages:     d.preferred_stages || '',
        total_investments:    d.total_investments || 0,
        successful_exits:     d.successful_exits || 0,
      };
      setProfileData(mapped);
      setDraft(mapped);
      if (!isProfileComplete(mapped)) setSetupMode(true);
    } catch {
      // fallback to auth user data
      const fallback = {
        name: user?.name || '', email: user?.email || '', firm: '', title: '',
        location: '', phone: '', website: '', linkedin: '', bio: '',
        investment_thesis: '', min_ticket: '', max_ticket: '',
        preferred_industries: '', preferred_stages: '', total_investments: 0, successful_exits: 0,
      };
      setProfileData(fallback);
      setDraft(fallback);
      setSetupMode(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.update({
        name:                 draft.name,
        firm:                 draft.firm,
        bio:                  draft.bio,
        location:             draft.location,
        phone:                draft.phone,
        website:              draft.website,
        linkedin:             draft.linkedin,
        investment_thesis:    draft.investment_thesis,
        min_ticket:           draft.min_ticket,
        max_ticket:           draft.max_ticket,
        preferred_industries: draft.preferred_industries,
        preferred_stages:     draft.preferred_stages,
        total_investments:    parseInt(draft.total_investments) || 0,
        successful_exits:     parseInt(draft.successful_exits) || 0,
      });
      setProfileData({ ...draft });
      setEditing(false);
      // Update auth context so dashboard firm name updates immediately
      updateUser({ firm: draft.firm, name: draft.name });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const setDraftField = (key) => (val) => setDraft(prev => ({ ...prev, [key]: val }));

  const getTagArray = (field) =>
    (profileData?.[field] || '').split(',').map(s => s.trim()).filter(Boolean);

  const getDraftTagArray = (field) =>
    (draft?.[field] || '').split(',').map(s => s.trim()).filter(Boolean);

  const setDraftTags = (field, arr) => setDraft(prev => ({ ...prev, [field]: arr.join(', ') }));

  const inputStyle = {
    background: 'var(--clr-bg-elevated)', border: '1px solid var(--clr-border)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--clr-text)',
    fontSize: '0.82rem', outline: 'none',
  };

  const TABS = ['overview', 'portfolio', 'value-add'];

  const statCards = [
    { icon: '💼', label: 'Investments', value: profileData?.total_investments || 0, color: '#6366f1' },
    { icon: '✅', label: 'Exits', value: profileData?.successful_exits || 0, color: '#10b981' },
    { icon: '🎯', label: 'Focus Areas', value: getTagArray('preferred_industries').length || '—', color: '#8b5cf6' },
    { icon: '📋', label: 'Ticket Size', value: profileData?.min_ticket ? `${profileData.min_ticket}` : '—', color: '#f59e0b' },
  ];

  /* ── Loading ── */
  if (loading) {
    return (
      <DashboardLayout title="My Profile" subtitle="Loading...">
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
          <p>Loading your profile…</p>
        </div>
      </DashboardLayout>
    );
  }

  /* ── Setup Wizard (incomplete profile) ── */
  if (setupMode) {
    return (
      <DashboardLayout
        title="Complete Your Investor Profile"
        subtitle="Set up your profile to appear in founder searches and start receiving meeting requests"
      >
        {/* Onboarding Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px 20px', borderRadius: 'var(--r-lg)', marginBottom: 28,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.07))',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}
        >
          <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--clr-text)', marginBottom: 4 }}>
              Your investor profile is incomplete
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>
              Founders discover investors through the <strong>Investor Match</strong> page — you won't appear there until you complete your profile.
              This takes less than 2 minutes.
            </div>
          </div>
        </motion.div>

        <SetupWizard
          initialData={profileData || {}}
          onUpdateUser={updateUser}
          onComplete={() => {
            setSetupMode(false);
            load();
            // Navigate to dashboard so user sees the updated firm name right away
            navigate('/investor/dashboard');
          }}
        />
      </DashboardLayout>
    );
  }

  /* ── Full Profile View / Edit ── */
  return (
    <DashboardLayout title="My Investor Profile" subtitle="Your profile visible to founders on VentureIQ">

      {/* Completion Banner (if they skipped the wizard but profile got saved) */}
      {isProfileComplete(profileData) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            padding: '12px 18px', borderRadius: 'var(--r-md)', marginBottom: 20,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text)' }}>
            <strong style={{ color: '#10b981' }}>Profile complete!</strong> You're now visible to founders in the Investor Match section.
          </span>
        </motion.div>
      )}

      {/* ── Profile Header Banner ── */}
      <div className="card" style={{
        marginBottom: 20, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.07))',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(16,185,129,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 150, height: 150, borderRadius: '50%', background: 'rgba(99,102,241,0.04)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, flexShrink: 0,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
          }}>
            {(profileData?.name || user?.name || 'I').slice(0, 1).toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.4rem' }}>{profileData?.name || user?.name}</h2>
              <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>
                ✓ Verified Investor
              </span>
            </div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', marginTop: 2 }}>
              {profileData?.firm && <><strong style={{ color: '#10b981' }}>{profileData.firm}</strong>{profileData.location && ` · ${profileData.location}`}</>}
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { icon: Mail, text: profileData?.email || user?.email },
                { icon: MapPin, text: profileData?.location },
                { icon: Globe, text: profileData?.website },
              ].filter(i => i.text).map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                  <Icon size={13} /> <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!editing ? (
              <motion.button whileHover={{ scale: 1.04 }}
                onClick={() => { setDraft({ ...profileData }); setEditing(true); }}
                className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit3 size={14} /> Edit Profile
              </motion.button>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.04 }} onClick={handleSave} disabled={saving}
                  className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}>
                  <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} onClick={() => { setDraft({ ...profileData }); setEditing(false); }}
                  className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X size={14} /> Cancel
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {statCards.map((s, i) => (
          <motion.div key={i} className="stat-card" whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: 10 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--clr-bg-card)', borderRadius: 12, padding: 4, border: '1px solid var(--clr-border)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 18px', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', border: 'none', transition: 'all 0.2s', textTransform: 'capitalize',
            background: activeTab === tab ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
            color: activeTab === tab ? '#fff' : 'var(--clr-text-muted)',
          }}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            <Section title="About Me" icon={User} accent="#6366f1">
              <Field label="Full Name" value={editing ? draft.name : profileData?.name} editing={editing} onChange={setDraftField('name')} placeholder="Your full name" />
              <Field label="Firm / Fund" value={editing ? draft.firm : profileData?.firm} editing={editing} onChange={setDraftField('firm')} placeholder="Firm name" />
              <Field label="Location" value={editing ? draft.location : profileData?.location} editing={editing} onChange={setDraftField('location')} placeholder="City, Country" />
              <Field label="Bio" value={editing ? draft.bio : profileData?.bio} editing={editing} onChange={setDraftField('bio')} placeholder="Brief biography..." multiline />
            </Section>

            <Section title="Contact & Social" icon={Mail} accent="#10b981">
              <Field label="Email" value={profileData?.email || user?.email} />
              <Field label="Phone" value={editing ? draft.phone : profileData?.phone} editing={editing} onChange={setDraftField('phone')} placeholder="+91 98765 00000" />
              <Field label="Website" value={editing ? draft.website : profileData?.website} editing={editing} onChange={setDraftField('website')} placeholder="https://yourfirm.com" />
              <Field label="LinkedIn URL" value={editing ? draft.linkedin : profileData?.linkedin} editing={editing} onChange={setDraftField('linkedin')} placeholder="https://linkedin.com/in/..." />
            </Section>
          </div>

          <Section title="Investment Thesis" icon={Target} accent="#8b5cf6">
            <Field label="Thesis Statement" value={editing ? draft.investment_thesis : profileData?.investment_thesis} editing={editing} onChange={setDraftField('investment_thesis')} placeholder="Describe your investment focus..." multiline />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Min Ticket</label>
                {editing
                  ? <input value={draft.min_ticket} onChange={e => setDraftField('min_ticket')(e.target.value)} placeholder="$100K" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  : <div style={{ fontWeight: 700, color: '#10b981' }}>{profileData?.min_ticket || '—'}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Max Ticket</label>
                {editing
                  ? <input value={draft.max_ticket} onChange={e => setDraftField('max_ticket')(e.target.value)} placeholder="$5M" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  : <div style={{ fontWeight: 700, color: '#10b981' }}>{profileData?.max_ticket || '—'}</div>}
              </div>
            </div>

            {editing ? (
              <div style={{ marginTop: 16 }}>
                <TagSelector label="Preferred Stages" options={STAGES} selected={getDraftTagArray('preferred_stages')} onChange={arr => setDraftTags('preferred_stages', arr)} color="#10b981" />
                <TagSelector label="Focus Industries" options={INDUSTRIES} selected={getDraftTagArray('preferred_industries')} onChange={arr => setDraftTags('preferred_industries', arr)} color="#6366f1" />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                {[
                  { label: 'Investment Stages', items: getTagArray('preferred_stages'), color: '#10b981' },
                  { label: 'Focus Industries', items: getTagArray('preferred_industries'), color: '#6366f1' },
                ].map(({ label, items, color }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {items.length > 0 ? items.map(t => (
                        <span key={t} style={{ padding: '4px 12px', borderRadius: 20, background: `${color}14`, color, fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${color}28` }}>{t}</span>
                      )) : <span style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>Not set</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Track Record" icon={TrendingUp} accent="#f59e0b">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Field label="Total Investments" value={editing ? String(draft.total_investments) : String(profileData?.total_investments || 0)} editing={editing} onChange={v => setDraftField('total_investments')(v)} placeholder="12" />
              </div>
              <div>
                <Field label="Successful Exits" value={editing ? String(draft.successful_exits) : String(profileData?.successful_exits || 0)} editing={editing} onChange={v => setDraftField('successful_exits')(v)} placeholder="3" />
              </div>
            </div>
          </Section>
        </motion.div>
      )}

      {/* ══════════ PORTFOLIO (local only) ══════════ */}
      {activeTab === 'portfolio' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 18 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Portfolio Companies</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>Add companies you've invested in</p>
              </div>
              <button onClick={() => setShowAddInv(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}>
                <Plus size={14} /> Add Investment
              </button>
            </div>

            <AnimatePresence>
              {showAddInv && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 16, padding: 16, borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
                    <input value={newInv.company} onChange={e => setNewInv(p => ({ ...p, company: e.target.value }))} placeholder="Company *" style={inputStyle} />
                    <input value={newInv.sector} onChange={e => setNewInv(p => ({ ...p, sector: e.target.value }))} placeholder="Sector" style={inputStyle} />
                    <input value={newInv.amount} onChange={e => setNewInv(p => ({ ...p, amount: e.target.value }))} placeholder="Amount (e.g. $1M)" style={inputStyle} />
                    <input value={newInv.currentVal} onChange={e => setNewInv(p => ({ ...p, currentVal: e.target.value }))} placeholder="Current Valuation" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                      if (!newInv.company.trim()) return;
                      setInvestments(prev => [...prev, { ...newInv, id: Date.now(), logo: newInv.company.slice(0, 2).toUpperCase() }]);
                      setNewInv({ company: '', sector: '', stage: 'Pre-Seed', amount: '', year: new Date().getFullYear(), status: 'Active', currentVal: '' });
                      setShowAddInv(false);
                    }} className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}>
                      <CheckCircle2 size={13} /> Add
                    </button>
                    <button onClick={() => setShowAddInv(false)} className="btn btn-ghost btn-sm"><X size={13} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {investments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>💼</div>
                <p style={{ fontSize: '0.85rem' }}>No portfolio companies added yet</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead><tr><th>Company</th><th>Sector</th><th>Amount</th><th>Current Value</th><th /></tr></thead>
                  <tbody>
                    {investments.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>{inv.logo}</div>
                            {inv.company}
                          </div>
                        </td>
                        <td><span className="badge badge-info">{inv.sector || '—'}</span></td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{inv.amount || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{inv.currentVal || '—'}</td>
                        <td>
                          <button onClick={() => setInvestments(prev => prev.filter(i => i.id !== inv.id))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: 4 }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ══════════ VALUE-ADD ══════════ */}
      {activeTab === 'value-add' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Section title="Areas of Expertise" icon={Star} accent="#f59e0b">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {expertise.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, border: '1px solid rgba(245,158,11,0.2)' }}>
                  ★ {e}
                  <button onClick={() => setExpertise(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: 0, display: 'flex' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newExpertise} onChange={e => setNewExpertise(e.target.value)}
                placeholder="Add an area of expertise..."
                onKeyDown={e => { if (e.key === 'Enter' && newExpertise.trim()) { setExpertise(prev => [...prev, newExpertise.trim()]); setNewExpertise(''); } }}
                style={{ flex: 1, ...inputStyle }} />
              <button onClick={() => { if (newExpertise.trim()) { setExpertise(prev => [...prev, newExpertise.trim()]); setNewExpertise(''); } }}
                className="btn btn-ghost btn-sm"><Plus size={14} /></button>
            </div>
          </Section>

          <Section title="What I Look For in Founders" icon={Award} accent="#8b5cf6">
            {[
              { icon: '🎯', title: 'Mission-driven', desc: 'Founders solving genuine problems, not chasing trends.' },
              { icon: '🧪', title: 'Domain Expertise', desc: 'Deep understanding of the industry they are disrupting.' },
              { icon: '🚀', title: 'Execution Speed', desc: 'Ability to move fast and adapt based on market signals.' },
              { icon: '👥', title: 'Team Composition', desc: 'Balanced founding team covering product, tech, and GTM.' },
              { icon: '📐', title: 'Capital Efficiency', desc: 'Smart about burn rate and path to profitability.' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--clr-border)' : 'none' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </Section>
        </motion.div>
      )}

    </DashboardLayout>
  );
}
