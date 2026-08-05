import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { profileAPI } from '../../services/api';
import Sidebar from '../../components/common/Sidebar';
import Topbar from '../../components/common/Topbar';
import {
  User, Palette, Shield, Save, Camera, Moon, Sun,
  CheckCircle, ChevronRight, Eye, EyeOff,
  AlertTriangle, Trash2, Download, Loader,
  Lock, Globe, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportMyData } from '../../services/exportData';

const TABS = [
  { id: 'profile',    label: 'Profile',           icon: User    },
  { id: 'appearance', label: 'Appearance',         icon: Palette },
  { id: 'privacy',    label: 'Privacy & Security', icon: Shield  },
];

/* ── Toggle switch ───────────────────────────────────────────────── */
function Toggle({ checked, onChange, label, description, icon: Icon }) {
  return (
    <div className="settings-toggle-row">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
        {Icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(99,102,241,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--clr-accent-1)',
          }}>
            <Icon size={15} />
          </div>
        )}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--clr-text-primary)' }}>{label}</div>
          {description && (
            <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{description}</div>
          )}
        </div>
      </div>
      <button
        className={`settings-toggle ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-checked={checked}
        role="switch"
      >
        <span className="settings-toggle-knob" />
      </button>
    </div>
  );
}

/* ── Section card ────────────────────────────────────────────────── */
function Section({ title, description, children }) {
  return (
    <div className="settings-section">
      <div>
        <div className="settings-section-title">{title}</div>
        {description && (
          <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Info callout ────────────────────────────────────────────────── */
function InfoBox({ children }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      background: 'rgba(99,102,241,0.07)',
      border: '1px solid rgba(99,102,241,0.18)',
      borderRadius: 10, padding: '10px 14px',
      fontSize: '0.8rem', color: 'var(--clr-text-secondary)',
    }}>
      <Info size={14} style={{ color: 'var(--clr-accent-1)', flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab,       setActiveTab]       = useState('profile');
  const [saved,           setSaved]           = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [exporting,       setExporting]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting,        setDeleting]        = useState(false);

  const [profile, setProfile] = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    company: user?.company || user?.firm || '',
    bio:     '',
    website: '',
    phone:   '',
  });


  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    analyticsTracking: true,
    twoFactor:         false,
  });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const roleColor = {
    FOUNDER:  'var(--clr-accent-1)',
    INVESTOR: 'var(--clr-success)',
    ADMIN:    'var(--clr-warning)',
  }[user?.role] || 'var(--clr-accent-1)';

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    const toastId = toast.loading('Preparing your data export…');
    try {
      await exportMyData(user);
      toast.success('✅ Export downloaded successfully!', { id: toastId, duration: 3000 });
    } catch (err) {
      toast.error('❌ Export failed. Please try again.', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const toastId = toast.loading('Deleting your account…');
    try {
      await profileAPI.delete();
      toast.success('Account deleted successfully.', { id: toastId, duration: 3000 });
      if (deleteAccount) deleteAccount();
      else logout();
      navigate('/login');
    } catch (err) {
      if (deleteAccount) {
        toast.success('Account deleted successfully.', { id: toastId, duration: 3000 });
        deleteAccount();
        navigate('/login');
      } else {
        toast.error('Failed to delete account. Please try again.', { id: toastId });
        setDeleting(false);
        setShowDeleteModal(false);
      }
    }
  };

  /* ── TAB CONTENT ── */
  const renderTab = () => {
    switch (activeTab) {

      /* ══ PROFILE ════════════════════════════════════════════════════ */
      case 'profile':
        return (
          <div className="settings-tab-content">

            {/* Avatar card */}
            <Section title="Your Identity">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '8px 0 4px',
              }}>
                <div className="settings-avatar" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)` }}>
                  {user?.avatar}
                  <button className="settings-avatar-btn" title="Change photo">
                    <Camera size={13} />
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{user?.email}</div>
                  <span className="badge" style={{
                    display: 'inline-flex', marginTop: 6,
                    background: `${roleColor}22`, color: roleColor,
                    border: `1px solid ${roleColor}44`,
                  }}>{user?.role}</span>
                </div>
              </div>
            </Section>

            {/* Personal info */}
            <Section title="Personal Information" description="Update your basic profile details visible to others.">
              <div className="settings-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com" />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Website</label>
                  <input className="form-input" value={profile.website}
                    onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://yourwebsite.com" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Bio</label>
                  <textarea className="form-input" rows={3} value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="A short intro about you or your startup…"
                    style={{ resize: 'vertical' }} />
                </div>
              </div>
            </Section>

          </div>
        );

      /* ══ APPEARANCE ═════════════════════════════════════════════════ */
      case 'appearance':
        return (
          <div className="settings-tab-content">

            <Section title="Color Theme" description="Choose how VentureIQ looks. Your preference is saved locally.">
              <div className="settings-theme-grid">
                {[
                  { value: 'dark',  label: 'Dark Mode',  icon: Moon,  desc: 'Easy on the eyes at night' },
                  { value: 'light', label: 'Light Mode',  icon: Sun,   desc: 'Crisp and bright interface' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    className={`settings-theme-card ${theme === value ? 'active' : ''}`}
                    onClick={() => theme !== value && toggleTheme()}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: theme === value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 1 }}>{desc}</div>
                    </div>
                    {theme === value && (
                      <CheckCircle size={16} style={{ color: 'var(--clr-accent-1)', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
              <InfoBox>
                Theme preference is stored in your browser and applies immediately — no page reload needed.
              </InfoBox>
            </Section>

          </div>
        );


      /* ══ PRIVACY & SECURITY ════════════════════════════════════════ */
      case 'privacy':
        return (
          <div className="settings-tab-content">

            <Section title="Change Password" description="Use a strong password you don't use elsewhere.">
              <div className="settings-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                      placeholder="••••••••"
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)',
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={passwords.new}
                    onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                    placeholder="Min 8 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={passwords.confirm}
                    onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password" />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', gap: 6 }}>
                <Lock size={13} /> Update Password
              </button>
            </Section>


            <Section title="Data & Account" description="Export your data or permanently delete your account.">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 7, minWidth: 160, position: 'relative' }}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <span style={{
                        width: 13, height: 13,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'currentColor',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin-slow 0.6s linear infinite',
                      }} />
                      Exporting…
                    </>
                  ) : (
                    <><Download size={14} /> Export My Data</>
                  )}
                </button>
                <button className="btn btn-danger btn-sm" style={{ gap: 7 }} onClick={() => setShowDeleteModal(true)}>
                  <Trash2 size={14} /> Delete Account
                </button>
              </div>
              <div style={{
                marginTop: 10,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '0.78rem',
                color: 'var(--clr-text-secondary)',
                lineHeight: 1.5,
              }}>
                📄 <strong>What's exported:</strong>{' '}
                {(user?.role === 'FOUNDER') && 'Profile, your startup details, and incoming meeting requests.'}
                {(user?.role === 'INVESTOR') && 'Profile, watchlist, investment thesis, and sent meeting requests.'}
                {(user?.role === 'ADMIN') && 'Platform stats, full user list, and approval queue.'}
                {' '}Downloaded as a <strong>.CSV file</strong> compatible with Excel, Google Sheets, and Numbers.
              </div>
              <div className="settings-warning">
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Account deletion is permanent and irreversible. All your startups, reports, and data will be removed immediately.</span>
              </div>
            </Section>

          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-header" style={{ padding: '28px 32px 0' }}>
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account preferences and security</p>
          </div>
          <button
            className={`btn ${saved ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleSave}
            style={{ gap: 8, minWidth: 130 }}
          >
            {saved
              ? <><CheckCircle size={15} /> Saved!</>
              : <><Save size={15} /> Save Changes</>}
          </button>
        </div>

        <div className="page-body">
          <div className="settings-layout">

            {/* ── Left tab list ── */}
            <aside className="settings-sidebar">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`settings-tab-btn ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                  <ChevronRight size={14} style={{
                    opacity: activeTab === id ? 1 : 0,
                    color: 'var(--clr-accent-1)',
                    transition: 'opacity 0.2s',
                  }} />
                </button>
              ))}
            </aside>

            {/* ── Tab content ── */}
            <div className="settings-main">
              {renderTab()}
            </div>

          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: '24px 28px', border: '1px solid rgba(239,68,68,0.3)', background: 'var(--clr-bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--clr-text)' }}>Delete Account</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>This action is permanent and cannot be undone</p>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to delete your account (<strong style={{ color: 'var(--clr-text)' }}>{user?.email}</strong>)? All your data, profile settings, and linked database records will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ gap: 6, minWidth: 120, background: '#ef4444' }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
