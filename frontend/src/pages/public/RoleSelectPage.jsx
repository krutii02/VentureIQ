import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { publicAPI } from '../../services/api';

const ROLES_LOGIN = [
  { value: 'FOUNDER', emoji: '\u{1F680}', label: 'Founder', color: '#6366f1', gradient: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))', border: 'rgba(99,102,241,0.38)', desc: 'Pitch your startup, track meetings & grow with AI-powered insights.' },
  { value: 'INVESTOR', emoji: '\u{1F4BC}', label: 'Investor', color: '#10b981', gradient: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))', border: 'rgba(16,185,129,0.35)', desc: 'Discover high-potential startups & connect directly with founders.' },
  { value: 'ADMIN', emoji: '\u{1F6E1}', label: 'Admin', color: '#f59e0b', gradient: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(217,119,6,0.1))', border: 'rgba(245,158,11,0.35)', desc: 'Manage users, review approvals and oversee platform operations.' },
];
const ROLES_REGISTER = ROLES_LOGIN.slice(0, 2);

/* ─── Animated count-up hook ─────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

/* ─── Card components ────────────────────────────────────────── */
function TopStartupsCard({ startups }) {
  if (!startups?.length) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16, padding: '16px 18px', backdropFilter: 'blur(10px)', textAlign: 'left', width: '100%', animation: 'fadeInUp 0.3s ease' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🚀 Top Startups on Platform</div>
      {startups.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < startups.length - 1 ? 11 : 0, marginBottom: i < startups.length - 1 ? 11 : 0, borderBottom: i < startups.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,rgba(99,102,241,0.6),rgba(139,92,246,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>{s.name?.[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
            <div style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.4)' }}>{s.stage} · {s.industry}</div>
          </div>
          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#a5f3c6', flexShrink: 0 }}>{s.score}/100</div>
        </div>
      ))}
    </div>
  );
}

function TopInvestorsCard({ investors }) {
  if (!investors?.length) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16, padding: '16px 18px', backdropFilter: 'blur(10px)', textAlign: 'left', width: '100%', animation: 'fadeInUp 0.3s ease' }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>💼 Active Investors</div>
      {investors.map((inv, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < investors.length - 1 ? 11 : 0, marginBottom: i < investors.length - 1 ? 11 : 0, borderBottom: i < investors.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,rgba(16,185,129,0.5),rgba(5,150,105,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>{inv.name?.[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.name}</div>
            <div style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.firm}</div>
          </div>
          {inv.industries && inv.industries !== 'General' && (() => {
            let industry = inv.industries;
            try { const arr = JSON.parse(inv.industries); industry = Array.isArray(arr) ? arr[0] : arr; } catch { }
            return <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', flexShrink: 0, maxWidth: 72, textAlign: 'right', lineHeight: 1.3 }}>{industry}</div>;
          })()}
        </div>
      ))}
    </div>
  );
}

/* ─── Right panel ────────────────────────────────────────────── */
function RightPanel({ hoveredRole, stats }) {
  const contentMap = {
    FOUNDER: {
      headline: 'Built for\nFounders',
      headlineSize: '2.4rem',
      sub: 'AI-powered tools to pitch, raise funding, and connect with top investors.',
      subSize: '0.92rem',
      card: 'startups',
      extra: null,
    },
    INVESTOR: {
      headline: 'Discover\nDeal Flow',
      headlineSize: '2.4rem',
      sub: 'AI-ranked startups matching your thesis — curated and ready to pitch.',
      subSize: '0.92rem',
      card: 'investors',
      extra: null,
    },
    ADMIN: {
      headline: 'Full\nControl',
      headlineSize: '3rem',
      sub: 'Manage the entire platform from one powerful dashboard.',
      subSize: '1.05rem',
      card: null,
      extra: (
        <div style={{ marginTop: 28, width: '100%' }}>
          {/* Live stat rows */}
          {[
            { label: 'Startups Listed', value: stats?.startups ?? '—', icon: '🚀' },
            { label: 'Industries', value: stats?.industries ?? '—', icon: '🏭' },
            { label: 'Avg AI Score', value: '70+', icon: '🎯' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: i % 2 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 6 }}>
              <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{row.icon}</span>{row.label}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{row.value}</span>
            </div>
          ))}
        </div>
      ),
    },
  };

  const defaultContent = {
    headline: 'VentureIQ',
    headlineSize: '5rem',
    sub: 'The AI-powered platform connecting ambitious founders with smart capital.',
    subSize: '1.1rem',
    card: null,
    extra: (
      <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {['🤖 AI Matching', '📊 Real-time Analytics', '🔒 Secure', '🌏 Global Network', '⚡ Instant Connect', '📈 Growth Insights'].map((f, i) => (
          <div key={i} style={{ padding: '8px 16px', borderRadius: 22, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{f}</div>
        ))}
      </div>
    ),
  };

  const c = (hoveredRole && contentMap[hoveredRole]) ? contentMap[hoveredRole] : defaultContent;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #4338ca 0%, #5b21b6 45%, #2563eb 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 40px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-5%', right: '-10%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '-10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: 400 }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 30, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginBottom: 28, backdropFilter: 'blur(8px)' }}>
          ✦ AI-Powered Venture Intelligence
        </div>

        {/* Headline */}
        <h2 key={hoveredRole} style={{ fontSize: c.headlineSize, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 16, letterSpacing: '-0.03em', whiteSpace: 'pre-line', transition: 'font-size 0.35s ease', animation: 'fadeInUp 0.3s ease' }}>
          {c.headline}
        </h2>
        <p key={`sub-${hoveredRole}`} style={{ fontSize: c.subSize, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 0, transition: 'all 0.3s ease', animation: 'fadeInUp 0.3s ease' }}>
          {c.sub}
        </p>

        {/* Extra content (pills / stat rows / card) */}
        {c.extra}
        {c.card === 'startups' && <div style={{ marginTop: 28 }}><TopStartupsCard startups={stats?.top_startups} /></div>}
        {c.card === 'investors' && <div style={{ marginTop: 28 }}><TopInvestorsCard investors={stats?.top_investors} /></div>}
      </div>
    </div>
  );
}


/* ─── Main Role Select Page ─────────────────────────────────────── */
export default function RoleSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = location.state?.mode || (location.pathname.startsWith('/register') ? 'signup' : 'login');
  const isLogin = mode === 'login';
  const roles = isLogin ? ROLES_LOGIN : ROLES_REGISTER;

  const [hovered, setHovered] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    publicAPI.platformStats()
      .then(r => setStats(r.data))
      .catch(() => {/* silently fail — hardcoded fallback visible */ });
  }, []);

  const handleSelect = (role) => {
    const dest = isLogin ? '/login/form' : '/register/form';
    navigate(dest, { state: { role, mode } });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--clr-bg-primary)' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '36px 52px', background: 'var(--clr-bg-card)', borderRight: '1px solid var(--clr-border)', overflowY: 'auto', minHeight: '100vh' }}>

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

        <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--clr-text-primary)', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.15 }}>
              {isLogin ? 'Who are you\nlogging in as?' : 'How will you use\nVentureIQ?'}
            </h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
              {isLogin ? 'Select your role to continue to the login form.' : 'Choose your role to set up the right account.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {roles.map((role) => {
              const isHov = hovered === role.value;
              return (
                <button key={role.value} type="button"
                  onClick={() => handleSelect(role.value)}
                  onMouseEnter={() => setHovered(role.value)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ padding: '16px 18px', background: isHov ? role.gradient : 'rgba(255,255,255,0.02)', border: `1.5px solid ${isHov ? role.border : 'var(--clr-border)'}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', transform: isHov ? 'translateX(6px)' : 'translateX(0)', boxShadow: isHov ? `0 6px 24px ${role.color}20` : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: isHov ? `${role.color}22` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${isHov ? role.color + '55' : 'var(--clr-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', transition: 'all 0.2s' }}>
                    {role.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem', color: isHov ? role.color : 'var(--clr-text-primary)', transition: 'color 0.2s', marginBottom: 3 }}>{role.label}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}>{role.desc}</div>
                  </div>
                  <ArrowRight size={15} style={{ color: isHov ? role.color : 'var(--clr-text-muted)', opacity: isHov ? 1 : 0.35, transition: 'all 0.2s', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.84rem', color: 'var(--clr-text-muted)' }}>
            {isLogin
              ? <>Don't have an account?{' '}<Link to="/register" style={{ color: 'var(--clr-accent-1)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link></>
              : <>Already have an account?{' '}<Link to="/login" style={{ color: 'var(--clr-accent-1)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link></>}
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textAlign: 'center' }}>
          © 2026 VentureIQ · <Link to="/" style={{ color: 'var(--clr-text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <RightPanel hoveredRole={hovered} stats={stats} />
    </div>
  );
}
