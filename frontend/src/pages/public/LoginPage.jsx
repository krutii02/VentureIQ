import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, KeyRound, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const ROLES_LOGIN = [
  { value: 'FOUNDER',  label: 'Founder',  color: '#6366f1' },
  { value: 'INVESTOR', label: 'Investor', color: '#10b981' },
  { value: 'ADMIN',    label: 'Admin',    color: '#f59e0b' },
];

const ROLES_REGISTER = [
  { value: 'FOUNDER',  label: 'Founder',  color: '#6366f1' },
  { value: 'INVESTOR', label: 'Investor', color: '#10b981' },
];

/* ─── Forgot Password flow ─────────────────────────────────── */
function ForgotPasswordPanel({ onBack }) {
  // step: 'email' → 'reset' → 'done'
  const [step,        setStep]        = useState('email');
  const [email,       setEmail]       = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [err,         setErr]         = useState('');

  // Helper: look up offline (localStorage) accounts
  const findOfflineUser = (em) => {
    try {
      const demo = [
        { email: 'founder@ventureiq.com',  password: 'demo1234' },
        { email: 'investor@ventureiq.com', password: 'demo1234' },
        { email: 'admin@ventureiq.com',    password: 'demo1234' },
      ];
      const reg = JSON.parse(localStorage.getItem('ventureiq_registered_users') || '[]');
      return [...demo, ...reg].find(u => u.email.toLowerCase() === em.toLowerCase()) || null;
    } catch { return null; }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setErr('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) { setErr('Enter a valid email address.'); return; }
    setBusy(true);
    try {
      await authAPI.verifyEmail(trimmed);
      setEmail(trimmed);
      setStep('reset');
    } catch (apiErr) {
      // Offline fallback
      const offline = findOfflineUser(trimmed);
      if (offline) { setEmail(trimmed); setStep('reset'); }
      else setErr(apiErr.response?.data?.error || 'No account found with this email address.');
    }
    setBusy(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErr('');
    if (newPw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await authAPI.resetPassword(email, newPw);
      setStep('done');
    } catch (apiErr) {
      // Offline fallback — update localStorage users
      try {
        const reg = JSON.parse(localStorage.getItem('ventureiq_registered_users') || '[]');
        const idx = reg.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) {
          reg[idx].password = newPw;
          localStorage.setItem('ventureiq_registered_users', JSON.stringify(reg));
          setStep('done');
        } else {
          setErr(apiErr.response?.data?.error || 'Could not reset password. Please try again.');
        }
      } catch { setErr('Could not reset password. Please try again.'); }
    }
    setBusy(false);
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px 11px 38px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--clr-border)',
    borderRadius: 'var(--r-sm)', color: 'var(--clr-text-primary)',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', fontSize: '0.8rem', fontWeight: 600, padding: '0 0 22px', width: 'fit-content' }}
      >
        <ArrowLeft size={14} /> Back to login
      </button>

      {/* Icon */}
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <KeyRound size={22} color="var(--clr-accent-1)" />
      </div>

      {step === 'email' && (
        <>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>Forgot your password?</h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Enter the email address linked to your account and we'll verify it so you can set a new password.
          </p>
          <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErr(''); }}
                style={inputStyle}
                autoFocus
              />
            </div>
            {err && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 13px', fontSize: '0.82rem', color: 'var(--clr-danger)' }}>
                ⚠️ {err}
              </div>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary" style={{ height: 44, fontSize: '0.9rem', gap: 8 }}>
              {busy ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} /> Verifying…</>
              ) : (
                <>Verify Email <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </>
      )}

      {step === 'reset' && (
        <>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>Set new password</h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)', marginBottom: 4, lineHeight: 1.6 }}>
            Account verified for <strong style={{ color: 'var(--clr-text-primary)' }}>{email}</strong>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 24 }}>Choose a strong new password (min. 8 characters).</p>
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* New password */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setErr(''); }}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Password strength bar */}
              {newPw.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4].map(n => {
                      const strength = newPw.length < 8 ? 1 : newPw.length < 12 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 4 : 3;
                      const colors = ['#ef4444','#f59e0b','#10b981','#6366f1'];
                      return <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= strength ? colors[strength-1] : 'var(--clr-border)', transition: 'background 0.3s' }} />;
                    })}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', marginTop: 3 }}>
                    {newPw.length < 8 ? 'Too short' : newPw.length < 12 ? 'Fair' : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 'Strong' : 'Good'}
                  </div>
                </div>
              )}
            </div>
            {/* Confirm password */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setErr(''); }}
                  style={inputStyle}
                />
              </div>
              {confirmPw && newPw !== confirmPw && (
                <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>Passwords don't match</div>
              )}
              {confirmPw && newPw === confirmPw && newPw.length >= 8 && (
                <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} /> Passwords match</div>
              )}
            </div>
            {err && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 13px', fontSize: '0.82rem', color: 'var(--clr-danger)' }}>
                ⚠️ {err}
              </div>
            )}
            <button type="submit" disabled={busy || newPw !== confirmPw || newPw.length < 8} className="btn btn-primary" style={{ height: 44, fontSize: '0.9rem', gap: 8 }}>
              {busy ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} /> Updating…</>
              ) : (
                <>Update Password <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={28} color="#10b981" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>Password Updated!</h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Your password has been reset successfully.<br />You can now log in with your new password.
          </p>
          <button onClick={onBack} className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: '0.9rem' }}>
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Login Page ──────────────────────────────────────── */
export default function LoginPage() {
  const { login, register: registerUser, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [mode,         setMode]         = useState(() => {
    return location.state?.mode === 'signup' || location.pathname === '/register' ? 'signup' : 'login';
  });   // 'login' | 'signup' | 'forgot'
  const [selectedRole, setSelectedRole] = useState('FOUNDER');
  const [showPw,       setShowPw]       = useState(false);
  const [showCPw,      setShowCPw]      = useState(false);
  const [authErr,      setAuthErr]      = useState('');

  useEffect(() => {
    if (location.state?.mode === 'signup' || location.pathname === '/register') {
      setMode('signup');
    } else if (location.state?.mode === 'login') {
      setMode('login');
    }
  }, [location.state, location.pathname]);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();

  const switchMode = (m) => {
    setMode(m);
    setAuthErr('');
    setSelectedRole('FOUNDER');
    reset();
  };

  const onSubmit = async (data) => {
    setAuthErr('');
    try {
      if (mode === 'login') {
        const user = await login(data.email, data.password, selectedRole);
        const userRole = (user?.role || selectedRole || 'FOUNDER').toUpperCase();
        const routes = { FOUNDER: '/founder/dashboard', INVESTOR: '/investor/dashboard', ADMIN: '/admin/dashboard' };
        const defaultRoute = routes[userRole] || '/';
        const from = location.state?.from?.pathname;

        let targetRoute = defaultRoute;
        if (
          from &&
          from !== '/unauthorized' &&
          from !== '/login' &&
          from !== '/register' &&
          from !== '/'
        ) {
          if (userRole === 'FOUNDER' && from.startsWith('/founder')) {
            targetRoute = from;
          } else if (userRole === 'INVESTOR' && from.startsWith('/investor')) {
            targetRoute = from;
          } else if (userRole === 'ADMIN' && from.startsWith('/admin')) {
            targetRoute = from;
          }
        }

        window.location.href = targetRoute;
      } else {
        if (data.password !== data.confirmPassword) {
          setAuthErr('Passwords do not match.');
          return;
        }
        const user = await registerUser({ name: data.name, email: data.email, password: data.password, role: selectedRole });
        const userRole = (user?.role || selectedRole || 'FOUNDER').toUpperCase();
        const routes = { FOUNDER: '/founder/startup', INVESTOR: '/investor/my-profile' };
        window.location.href = routes[userRole] || '/';
      }
    } catch (e) {
      setAuthErr(e.message);
    }
  };

  const roles = mode === 'login' ? ROLES_LOGIN : ROLES_REGISTER;
  const roleColor = roles.find(r => r.value === selectedRole)?.color || '#6366f1';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--clr-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--clr-bg-card)',
        border: '1px solid var(--clr-border)',
        borderRadius: 'var(--r-xl)',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeInUp 0.4s ease forwards',
      }}>

        {/* Logo & Back to Home */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: 9, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '1rem',
              boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
            }}>V</div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.15rem', color: 'var(--clr-text-primary)' }}>
              Venture<span className="text-gradient">IQ</span>
            </span>
          </Link>

          <Link
            to="/"
            title="Back to Home"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 20,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--clr-border)',
              color: 'var(--clr-text-muted)',
              fontSize: '0.75rem', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#818cf8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--clr-text-muted)'; }}
          >
            <Home size={13} />
            <span>Home</span>
          </Link>
        </div>

        {/* ── Forgot Password Panel ── */}
        {mode === 'forgot' ? (
          <ForgotPasswordPanel onBack={() => switchMode('login')} />
        ) : (
          <>
            {/* Toggle Login / Sign Up */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--r-md)',
              padding: 4, marginBottom: 28, gap: 4,
            }}>
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  style={{
                    padding: '9px 0',
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    background: mode === m ? 'var(--grad-brand)' : 'transparent',
                    color: mode === m ? '#fff' : 'var(--clr-text-muted)',
                    boxShadow: mode === m ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Role selector */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                {mode === 'login' ? 'Sign in as' : 'Register as'}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setSelectedRole(r.value); setAuthErr(''); }}
                    style={{
                      flex: 1,
                      padding: '9px 6px',
                      borderRadius: 'var(--r-sm)',
                      border: `2px solid ${selectedRole === r.value ? r.color : 'var(--clr-border)'}`,
                      background: selectedRole === r.value ? `${r.color}18` : 'transparent',
                      color: selectedRole === r.value ? r.color : 'var(--clr-text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Name — sign up only */}
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-icon-wrap">
                    <User size={15} className="input-icon" />
                    <input
                      type="text"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="John Doe"
                      {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                    />
                  </div>
                  {errors.name && <span className="form-error">{errors.name.message}</span>}
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrap">
                  <Mail size={15} className="input-icon" />
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                    })}
                  />
                </div>
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-accent-1)', fontSize: '0.78rem', fontWeight: 600, padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                  <Lock size={15} className="input-icon" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    style={{ paddingRight: 40 }}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: mode === 'signup' ? 8 : 6, message: `Min ${mode === 'signup' ? 8 : 6} characters` },
                    })}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password.message}</span>}
              </div>

              {/* Confirm Password — sign up only */}
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-icon-wrap" style={{ position: 'relative' }}>
                    <Lock size={15} className="input-icon" />
                    <input
                      type={showCPw ? 'text' : 'password'}
                      className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="••••••••"
                      style={{ paddingRight: 40 }}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: v => v === watch('password') || 'Passwords do not match',
                      })}
                    />
                    <button type="button" onClick={() => setShowCPw(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
                </div>
              )}

              {/* Error banner */}
              {authErr && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--r-sm)', padding: '10px 14px',
                  fontSize: '0.82rem', color: 'var(--clr-danger)',
                  lineHeight: 1.5,
                }}>
                  ⚠️ {authErr}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', height: 46, fontSize: '0.95rem', marginTop: 2 }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin-slow 0.6s linear infinite', display: 'inline-block',
                    }} />
                    {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                  </span>
                ) : (
                  <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Account switch prompt */}
            <div style={{
              marginTop: 20, paddingTop: 18,
              borderTop: '1px solid var(--clr-border)',
              textAlign: 'center', fontSize: '0.85rem',
              color: 'var(--clr-text-muted)',
            }}>
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode('signup')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--clr-accent-1)', fontWeight: 600, fontSize: '0.85rem', padding: 0,
                  }}>Sign up</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--clr-accent-1)', fontWeight: 600, fontSize: '0.85rem', padding: 0,
                  }}>Log in</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
