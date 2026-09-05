import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, publicAPI } from '../../services/api';
import GoogleAuthButton from '../../components/GoogleAuthButton';

/* ─── Mock Dashboard Preview for right panel ──────────────────── */
function DashboardPreview({ stats }) {
  const topStartups = stats?.top_startups || [
    { name: 'Loading...', stage: '—', score: '—' },
    { name: 'Loading...', stage: '—', score: '—' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 3, boxShadow: '0 32px 80px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
      <div style={{ background: 'rgba(15,20,35,0.85)', borderRadius: 14, padding: '16px', overflow: 'hidden' }}>
        {/* Mini top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
          {['#ef4444', '#f59e0b', '#10b981'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)', marginLeft: 8 }} />
        </div>
        {/* Chart */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600 }}>STARTUP GROWTH</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
            {[30, 45, 38, 60, 55, 75, 68, 85, 72, 95].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0', background: i === 9 ? 'linear-gradient(180deg,#6366f1,#8b5cf6)' : `rgba(99,102,241,${0.2 + i * 0.06})` }} />
            ))}
          </div>
        </div>
        {/* Real top startups */}
        {topStartups.slice(0, 2).map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.05)' : '' }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>{r.name?.[0] || '?'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)' }}>{r.stage}</div>
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', flexShrink: 0 }}>{r.score !== '—' ? `${r.score}/100` : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Right branded panel ─────────────────────────────────────── */
function RightPanel({ mode, stats }) {
  return (
    <div style={{ background: 'linear-gradient(145deg, #4338ca 0%, #5b21b6 40%, #2563eb 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-5%', right: '-10%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 28, maxWidth: 380 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 30, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginBottom: 20, backdropFilter: 'blur(8px)' }}>
          ✦ AI-Powered Venture Intelligence
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 14, letterSpacing: '-0.02em' }}>
          {mode === 'signup' ? 'Launch your startup to the right investors.' : 'Your venture dashboard awaits.'}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: stats ? 16 : 0 }}>
          {mode === 'signup'
            ? `Join ${stats?.members ?? '—'} members across ${stats?.industries ?? '—'} industries on VentureIQ.`
            : `${stats?.startups ?? '—'} startups. ${stats?.members ?? '—'} members. ${stats?.industries ?? '—'} industries. All in one platform.`}
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, animation: 'float 5s ease-in-out infinite' }}>
        <DashboardPreview stats={stats} />
      </div>
    </div>
  );
}

/* ─── Forgot Password flow ─────────────────────────────────────── */
function ForgotPasswordPanel({ onBack }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const findOfflineUser = (em) => {
    try {
      const demo = [
        { email: 'founder@ventureiq.com', password: 'demo1234' },
        { email: 'investor@ventureiq.com', password: 'demo1234' },
        { email: 'admin@ventureiq.com', password: 'demo1234' },
      ];
      const reg = JSON.parse(localStorage.getItem('ventureiq_registered_users') || '[]');
      return [...demo, ...reg].find(u => u.email.toLowerCase() === em.toLowerCase()) || null;
    } catch { return null; }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault(); setErr('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) { setErr('Enter a valid email address.'); return; }
    setBusy(true);
    try {
      await authAPI.verifyEmail(trimmed);
      setEmail(trimmed); setStep('reset');
    } catch (apiErr) {
      const offline = findOfflineUser(trimmed);
      if (offline) { setEmail(trimmed); setStep('reset'); }
      else setErr(apiErr.response?.data?.error || 'No account found with this email address.');
    }
    setBusy(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault(); setErr('');
    if (newPw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setErr('Passwords do not match.'); return; }
    setBusy(true);
    try {
      await authAPI.resetPassword(email, newPw); setStep('done');
    } catch (apiErr) {
      try {
        const reg = JSON.parse(localStorage.getItem('ventureiq_registered_users') || '[]');
        const idx = reg.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) { reg[idx].password = newPw; localStorage.setItem('ventureiq_registered_users', JSON.stringify(reg)); setStep('done'); }
        else setErr(apiErr.response?.data?.error || 'Could not reset password.');
      } catch { setErr('Could not reset password.'); }
    }
    setBusy(false);
  };

  const inputStyle = { width: '100%', padding: '11px 14px 11px 38px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--clr-border)', borderRadius: 'var(--r-sm)', color: 'var(--clr-text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', fontSize: '0.8rem', fontWeight: 600, padding: '0 0 22px', width: 'fit-content' }}>
        <ArrowLeft size={14} /> Back to login
      </button>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <KeyRound size={22} color="var(--clr-accent-1)" />
      </div>
      {step === 'email' && (<>
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>Forgot your password?</h2>
        <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)', marginBottom: 24, lineHeight: 1.6 }}>Enter the email linked to your account.</p>
        <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input type="email" placeholder="your@email.com" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} style={inputStyle} autoFocus />
          </div>
          {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 13px', fontSize: '0.82rem', color: 'var(--clr-danger)' }}>{err}</div>}
          <button type="submit" disabled={busy} className="btn btn-primary" style={{ height: 44, fontSize: '0.9rem' }}>
            {busy ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} /> Verifying...</> : <>Verify Email <ArrowRight size={15} /></>}
          </button>
        </form>
      </>)}
      {step === 'reset' && (<>
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>Set new password</h2>
        <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)', marginBottom: 24 }}>For <strong style={{ color: 'var(--clr-text-primary)' }}>{email}</strong></p>
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={newPw} onChange={e => { setNewPw(e.target.value); setErr(''); }} style={{ ...inputStyle, paddingRight: 42 }} autoFocus />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', display: 'flex', padding: 0 }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {newPw.length > 0 && (<div style={{ marginTop: -4 }}><div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>{[1, 2, 3, 4].map(n => { const s = newPw.length < 8 ? 1 : newPw.length < 12 ? 2 : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 4 : 3; const c = ['#ef4444', '#f59e0b', '#10b981', '#6366f1']; return <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= s ? c[s - 1] : 'var(--clr-border)', transition: 'background 0.3s' }} />; })} </div><div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>{newPw.length < 8 ? 'Too short' : newPw.length < 12 ? 'Fair' : /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 'Strong' : 'Good'}</div></div>)}
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input type="password" placeholder="Confirm password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setErr(''); }} style={inputStyle} />
          </div>
          {confirmPw && newPw !== confirmPw && <div style={{ fontSize: '0.72rem', color: '#ef4444' }}>Passwords don't match</div>}
          {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 13px', fontSize: '0.82rem', color: 'var(--clr-danger)' }}>{err}</div>}
          <button type="submit" disabled={busy || newPw !== confirmPw || newPw.length < 8} className="btn btn-primary" style={{ height: 44, fontSize: '0.9rem' }}>
            {busy ? 'Updating...' : <>Update Password <ArrowRight size={15} /></>}
          </button>
        </form>
      </>)}
      {step === 'done' && (
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <CheckCircle2 size={26} color="#10b981" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 8 }}>Password Updated!</h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)', lineHeight: 1.6, marginBottom: 22 }}>You can now log in with your new password.</p>
          <button onClick={onBack} className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: '0.9rem' }}>Back to Login</button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Login / Register Form Page ─────────────────────────── */
export default function LoginPage() {
  const { login, loginWithGoogle, register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedRole = (location.state?.role || 'FOUNDER').toUpperCase();
  const mode = (location.state?.mode === 'signup' || location.pathname.startsWith('/register/'))
    ? 'signup' : 'login';

  const ROLE_META = {
    FOUNDER: { color: '#6366f1', emoji: '\u{1F680}', label: 'Founder' },
    INVESTOR: { color: '#10b981', emoji: '\u{1F4BC}', label: 'Investor' },
    ADMIN: { color: '#f59e0b', emoji: '\u{1F6E1}', label: 'Admin' },
  };
  const roleMeta = ROLE_META[selectedRole] || ROLE_META.FOUNDER;

  const [showForgot, setShowForgot] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleErr, setGoogleErr] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    publicAPI.platformStats()
      .then(r => setStats(r.data))
      .catch(() => { });
  }, []);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setAuthErr('');
    try {
      if (mode === 'login') {
        const user = await login(data.email, data.password, selectedRole);
        const userRole = (user?.role || selectedRole).toUpperCase();
        const routes = { FOUNDER: '/founder/dashboard', INVESTOR: '/investor/dashboard', ADMIN: '/admin/dashboard' };
        const defaultRoute = routes[userRole] || '/';
        const from = location.state?.from?.pathname;
        let targetRoute = defaultRoute;
        if (from && from !== '/unauthorized' && from !== '/login' && from !== '/register' && from !== '/') {
          if (userRole === 'FOUNDER' && from.startsWith('/founder')) targetRoute = from;
          if (userRole === 'INVESTOR' && from.startsWith('/investor')) targetRoute = from;
          if (userRole === 'ADMIN' && from.startsWith('/admin')) targetRoute = from;
        }
        window.location.href = targetRoute;
      } else {
        if (data.password !== data.confirmPassword) { setAuthErr('Passwords do not match.'); return; }
        const user = await registerUser({ name: data.name, email: data.email, password: data.password, role: selectedRole });
        const userRole = (user?.role || selectedRole).toUpperCase();
        const routes = { FOUNDER: '/founder/startup', INVESTOR: '/investor/my-profile' };
        window.location.href = routes[userRole] || '/';
      }
    } catch (e) { setAuthErr(e.message); }
  };

  const handleGoogleCredential = async (credential) => {
    setGoogleErr(''); setGoogleLoading(true);
    try {
      const user = await loginWithGoogle(credential, selectedRole, mode);
      const userRole = (user?.role || 'FOUNDER').toUpperCase();
      const routes = { FOUNDER: '/founder/dashboard', INVESTOR: '/investor/dashboard', ADMIN: '/admin/dashboard' };
      window.location.href = routes[userRole] || '/';
    } catch (e) { setGoogleErr(e.message); setGoogleLoading(false); }
  };

  const backToRoles = () => {
    navigate(mode === 'login' ? '/login' : '/register', { state: { mode } });
    reset(); setAuthErr('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--clr-bg-primary)',
    }}>

      {/* ── LEFT: Form panel ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 52px',
        background: 'var(--clr-bg-card)',
        borderRight: '1px solid var(--clr-border)',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        {/* Top Header Row with Logo & Home Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '0.95rem', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>V</div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-text-primary)' }}>
              Venture<span className="text-gradient">IQ</span>
            </span>
          </Link>

          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--clr-border)',
            color: 'var(--clr-text-muted)',
            fontSize: '0.78rem', fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s ease'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
              e.currentTarget.style.color = '#818cf8';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'var(--clr-text-muted)';
              e.currentTarget.style.borderColor = 'var(--clr-border)';
            }}>
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Form content */}
        <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          {showForgot ? (
            <ForgotPasswordPanel onBack={() => setShowForgot(false)} />
          ) : (
            <>
              {/* Role badge + change */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 30, background: `${roleMeta.color}18`, border: `1.5px solid ${roleMeta.color}44`, fontSize: '0.78rem', fontWeight: 700, color: roleMeta.color }}>
                  {roleMeta.emoji} {mode === 'login' ? 'Logging in as' : 'Signing up as'} {roleMeta.label}
                </div>
                <button type="button" onClick={backToRoles}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', fontSize: '0.74rem', fontWeight: 600, padding: 0, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--clr-accent-1)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--clr-text-muted)'}>
                  <ArrowLeft size={12} /> Change
                </button>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontWeight: 900, fontSize: '1.7rem', letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--clr-text-primary)', lineHeight: 1.1 }}>
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                  {mode === 'login' ? 'Sign in to access your venture dashboard.' : 'Start your journey on VentureIQ today.'}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} autoComplete="off">
                {mode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-icon-wrap">
                      <User size={14} className="input-icon" />
                      <input type="text" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="John Doe"
                        {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })} />
                    </div>
                    {errors.name && <span className="form-error">{errors.name.message}</span>}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-icon-wrap">
                    <Mail size={14} className="input-icon" />
                    <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com"
                      autoComplete="off"
                      {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
                  </div>
                  {errors.email && <span className="form-error">{errors.email.message}</span>}
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    {mode === 'login' && <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-accent-1)', fontSize: '0.78rem', fontWeight: 600, padding: 0 }}>Forgot password?</button>}
                  </div>
                  <div className="input-icon-wrap" style={{ position: 'relative' }}>
                    <Lock size={14} className="input-icon" />
                    <input type={showPw ? 'text' : 'password'} className={`form-input ${errors.password ? 'error' : ''}`}
                      placeholder="••••••••" style={{ paddingRight: 40 }} autoComplete="new-password"
                      {...register('password', { required: 'Password is required', minLength: { value: mode === 'signup' ? 8 : 6, message: `Min ${mode === 'signup' ? 8 : 6} characters` } })} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password.message}</span>}
                </div>
                {mode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-icon-wrap" style={{ position: 'relative' }}>
                      <Lock size={14} className="input-icon" />
                      <input type={showCPw ? 'text' : 'password'} className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                        placeholder="••••••••" style={{ paddingRight: 40 }} autoComplete="new-password"
                        {...register('confirmPassword', { required: 'Required', validate: v => v === watch('password') || 'Passwords do not match' })} />
                      <button type="button" onClick={() => setShowCPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
                  </div>
                )}
                {authErr && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--clr-danger)', lineHeight: 1.5 }}>{authErr}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: 46, fontSize: '0.95rem', marginTop: 4 }}>
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} />{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                    : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>}
                </button>
                {selectedRole !== 'ADMIN' && (<>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--clr-border)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--clr-border)' }} />
                  </div>
                  <GoogleAuthButton onCredential={handleGoogleCredential} label={mode === 'login' ? 'Log in with Google' : 'Sign up with Google'} disabled={loading} />
                  {googleErr && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: 'var(--clr-danger)' }}>{googleErr}</div>}
                </>)}
              </form>

              <div style={{ marginTop: 22, textAlign: 'center', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                {mode === 'login'
                  ? <>Don't have an account?{' '}<Link to="/register" style={{ color: 'var(--clr-accent-1)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link></>
                  : <>Already have an account?{' '}<Link to="/login" style={{ color: 'var(--clr-accent-1)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link></>}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textAlign: 'center' }}>
          © 2026 VentureIQ · <Link to="/" style={{ color: 'var(--clr-text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </div>

      {/* ── RIGHT: Brand visual ── */}
      <RightPanel mode={mode} stats={stats} />
    </div>
  );
}
