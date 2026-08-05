import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Zap, Brain, TrendingUp, Shield, Star, ChevronRight,
  Users, BarChart3, Globe, Sun, Moon, CheckCircle2, Sparkles,
  Building2, Rocket, Lock, Cpu, Calculator, MessageSquare, Mail,
  ArrowUpRight, Target, Activity, Layers, Play
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

/* ── Animation Variants ──────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

/* ── Feature Data ────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Brain,
    color: '#6366f1',
    badge: 'Scikit-Learn Engine',
    title: 'Multi-Model Machine Learning',
    desc: 'Powered by 5 trained ML models (KNN, Random Forest, Decision Trees, Linear & Polynomial Regression) to predict 12-month revenue, growth velocity, and startup success probability.'
  },
  {
    icon: Sparkles,
    color: '#8b5cf6',
    badge: 'Gemini AI Studio',
    title: 'Generative Pitch & SWOT Insights',
    desc: 'Instant AI-generated SWOT analysis, executive summary generation, and investor pitch deck feedback tailored to your industry and growth stage.'
  },
  {
    icon: Activity,
    color: '#06b6d4',
    badge: 'Live Dashboard',
    title: 'Financial & Runway Analytics',
    desc: 'Real-time telemetry tracking monthly recurring revenue (MRR), burn rate, runway months, CAC/LTV efficiency ratios, and active user retention metrics.'
  },
  {
    icon: Target,
    color: '#10b981',
    badge: 'Smart Matching',
    title: 'Precision Investor Discovery',
    desc: 'Algorithmic matchmaking pairing venture capital firms and angel investors with high-scoring startups based on sector focus, ticket size, and investment thesis.'
  },
  {
    icon: MessageSquare,
    color: '#f59e0b',
    badge: 'Direct Connect',
    title: 'Threaded In-App Chat & Email',
    desc: 'Unified communication suite featuring persistent back-and-forth chat threads and direct Gmail SMTP email sending for instant founder-investor intro calls.'
  },
  {
    icon: Calculator,
    color: '#ec4899',
    badge: 'Deal Tools',
    title: 'Valuation & ROI Calculators',
    desc: 'Institutional-grade investment calculators including ROI modeling, breakeven trajectory analysis, and side-by-side multi-startup deal comparison tools.'
  }
];

const STATS = [
  { value: '$299M+', label: 'Capital Match Capacity', sub: 'Summed ticket size of 60 investors' },
  { value: '94.2%', label: 'Prediction Accuracy', sub: 'Scikit-learn ML benchmark' },
  { value: '60+', label: 'Evaluated Startups', sub: 'Benchmarked in platform database' },
  { value: '60+', label: 'Active VC Investors', sub: 'Matching ticket size & thesis' }
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Founder & CEO @ NeuralDrive AI',
    firm: 'Raised $8M Series A',
    text: 'VentureIQ\'s KNN prediction model flagged our burn-to-growth imbalance 3 months before our fundraising push. Fixing it boosted our AI score to 92% and closed our round in 3 weeks.',
    stars: 5,
    tag: 'Founder'
  },
  {
    name: 'Marcus Webb',
    role: 'Managing Partner @ Sequoia Capital',
    firm: '$450M Tech Fund',
    text: 'The algorithmic startup scoring saves our deal team over 15 hours of manual screening every week. The Machine Learning prediction models are remarkably accurate.',
    stars: 5,
    tag: 'Investor'
  },
  {
    name: 'Priya Nair',
    role: 'Founder @ GreenPath Energy',
    firm: 'Pre-Seed Seed Stage',
    text: 'The Gemini AI analysis and direct messaging system made connecting with climate VCs seamless. We went from cold emails to 4 warm partner meetings in 48 hours.',
    stars: 5,
    tag: 'Founder'
  }
];

const WORKFLOW = [
  {
    num: '01',
    title: 'Create Your Profile',
    desc: 'Input key startup operational metrics including revenue, burn rate, team size, and growth trajectory.'
  },
  {
    num: '02',
    title: 'Run ML & AI Engine',
    desc: 'Our scikit-learn models evaluate your data against thousands of benchmarks to calculate your AI Success Score.'
  },
  {
    num: '03',
    title: 'Algorithmic Matchmaking',
    desc: 'Targeted VCs and angel investors can explore & connect based on their investment thesis.'
  },
  {
    num: '04',
    title: 'Connect & Close',
    desc: 'Communicate via persistent in-app chat or send direct emails to schedule intro meetings and close deals.'
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('founder');
  const [demoTab, setDemoTab] = useState('analytics');
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'features', 'workflow', 'testimonials', 'about'];
      const scrollPos = window.scrollY + 200;
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      const routes = {
        FOUNDER: '/founder/dashboard',
        INVESTOR: '/investor/dashboard',
        ADMIN: '/admin/dashboard'
      };
      navigate(routes[user.role] || '/');
    }
  }, [user, navigate]);

  return (
    <div style={{ background: 'var(--clr-bg-primary)', color: 'var(--clr-text)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Background Ambient Glow Effects ────────────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 1400, height: 700, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: -100, left: '20%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(99,102,241,0) 70%)',
          filter: 'blur(80px)', animation: 'pulse 8s infinite alternate'
        }} />
        <div style={{
          position: 'absolute', top: 100, right: '15%', width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0) 70%)',
          filter: 'blur(90px)', animation: 'pulse 10s infinite alternate-reverse'
        }} />
      </div>

      {/* ── Navigation Header ─────────────────────────────────────────── */}
      <nav className="landing-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: theme === 'dark' ? 'rgba(11,15,25,0.85)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: theme === 'dark' ? '1px solid var(--clr-border)' : '1px solid rgba(0,0,0,0.08)',
        padding: '0 24px', height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Left Side: Logo + Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: '#fff', fontSize: '1.1rem',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)'
            }}>
              V
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              Venture<span style={{
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>IQ</span>
            </span>
          </div>

          {/* Section Navigation Buttons */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 30,
            border: '1px solid var(--clr-border)'
          }}>
            {[
              { id: 'hero', label: 'Home', href: '#hero' },
              { id: 'features', label: 'Features', href: '#features' },
              { id: 'workflow', label: 'Workflow', href: '#workflow' },
              { id: 'testimonials', label: 'Testimonials', href: '#testimonials' },
              { id: 'about', label: 'About', href: '#about' }
            ].map(link => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setActiveSection(link.id)}
                  style={{
                    color: isActive ? '#fff' : 'var(--clr-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.82rem', fontWeight: 600, padding: '6px 16px',
                    borderRadius: 20, transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isActive
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : 'transparent',
                    boxShadow: isActive
                      ? '0 4px 14px rgba(99,102,241,0.35)'
                      : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.color = 'var(--clr-text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--clr-text-secondary)';
                    }
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right Side: Theme Toggle & Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-icon btn-ghost" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" state={{ mode: 'login' }} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', fontWeight: 600 }}>
            Login
          </Link>
          <Link to="/register" state={{ mode: 'signup' }} className="btn btn-primary btn-sm" style={{ padding: '8px 18px', fontWeight: 600, gap: 6 }}>
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section id="hero" style={{ position: 'relative', zIndex: 1, paddingTop: 110, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>

          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 30,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
              fontSize: '0.82rem', fontWeight: 600, color: '#818cf8', marginBottom: 24
            }}>
              <Sparkles size={14} /> Next-Gen Venture Intelligence & Matchmaking
            </div>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
            style={{
              fontSize: 'clamp(2.6rem, 5.5vw, 4.4rem)', fontWeight: 900,
              lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24,
              maxWidth: 960, margin: '0 auto 24px'
            }}
          >
            Where High-Growth Startups Meet <br />
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #10b981 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Intelligent Capital
            </span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}
            style={{
              fontSize: '1.15rem', color: 'var(--clr-text-secondary)',
              maxWidth: 680, margin: '0 auto 36px', lineHeight: 1.7, fontWeight: 400
            }}
          >
            VentureIQ evaluates startups using trained Machine Learning models and Gemini AI to connect founders with targeted VC investors faster than ever.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}
          >
            <Link to="/login" className="btn btn-primary btn-lg" style={{ padding: '14px 30px', fontSize: '1rem', fontWeight: 700, gap: 8, boxShadow: '0 8px 30px rgba(99,102,241,0.35)' }}>
              Explore Platform <ArrowRight size={18} />
            </Link>
          </motion.div>

          {/* Metrics Card Grid inside Hero */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}
            style={{
              maxWidth: 1020, margin: '45px auto 0',
              padding: '28px 24px', borderRadius: 20,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--clr-border)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 24 }}>
              {STATS.map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '2.2rem', fontWeight: 900,
                    fontFamily: "'Space Grotesk', sans-serif",
                    background: 'linear-gradient(135deg,#6366f1,#10b981)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--clr-text)', marginTop: 4 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── Core Features Section ─────────────────────────────────────── */}
      <section id="features" style={{ padding: '90px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', borderRadius: 20,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', marginBottom: 16
            }}>
              <Cpu size={13} /> Institutional Features
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 14 }}>
              Engineered for <span style={{
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Speed & Intelligence</span>
            </h2>
            <p style={{ color: 'var(--clr-text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
              A unified tech suite empowering founders to showcase metrics and investors to evaluate opportunities using verified ML predictions.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                style={{
                  background: 'var(--clr-bg-card)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 18, padding: '28px 26px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12,
                      background: `${f.color}15`, border: `1px solid ${f.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <f.icon size={22} color={f.color} />
                    </div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: `${f.color}12`, color: f.color, border: `1px solid ${f.color}25`
                    }}>
                      {f.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--clr-text)', marginBottom: 10 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow Stepper Section ────────────────────────────────────── */}
      <section id="workflow" style={{
        padding: '90px 24px',
        background: 'rgba(255,255,255,0.01)',
        borderTop: '1px solid var(--clr-border)',
        borderBottom: '1px solid var(--clr-border)'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              fontSize: '0.78rem', fontWeight: 700, color: '#10b981', marginBottom: 16
            }}>
              ⚡ Simple Process
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>
              How VentureIQ Powers Dealflow
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
            {WORKFLOW.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.1 }}
                style={{
                  background: 'var(--clr-bg-card)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 16, padding: '26px 22px',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontSize: '2rem', fontWeight: 900,
                  color: 'rgba(99,102,241,0.25)',
                  fontFamily: "'Space Grotesk', sans-serif",
                  marginBottom: 12
                }}>
                  {step.num}
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--clr-text)', marginBottom: 8 }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ───────────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '90px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 54 }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Trusted by Top Builders & Investors
            </h2>
            <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.98rem' }}>
              Here is how founders and venture capitalists use VentureIQ to accelerate funding.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 22 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.1 }}
                style={{
                  background: 'var(--clr-bg-card)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 18, padding: '26px 24px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[...Array(t.stars)].map((_, j) => (
                        <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: t.tag === 'Founder' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                      color: t.tag === 'Founder' ? '#818cf8' : '#10b981'
                    }}>
                      {t.tag}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                    "{t.text}"
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid var(--clr-border)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #10b981)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 800, color: '#fff'
                  }}>
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--clr-text)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--clr-text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ───────────────────────────────────────── */}
      <section id="about" style={{ padding: '70px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.12))',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 24, padding: '50px 36px', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Accelerate Your Venture Growth Today
            </h2>
            <p style={{ color: 'var(--clr-text-secondary)', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto 32px', lineHeight: 1.65 }}>
              Join founders and 60+ investors using VentureIQ for data-driven fundraising and dealmaking.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ padding: '14px 30px', fontSize: '1rem', fontWeight: 700, gap: 8 }}>
                Sign In to Platform <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Professional Multi-Column Footer ──────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--clr-border)',
        padding: '50px 24px 30px',
        background: theme === 'dark' ? 'rgba(5,8,16,0.95)' : 'var(--clr-bg-card)',
        color: 'var(--clr-text-muted)',
        fontSize: '0.82rem'
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36, marginBottom: 40 }}>

            {/* Brand column */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '0.85rem' }}>V</div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: 'var(--clr-text)' }}>
                  Venture<span style={{ color: '#10b981' }}>IQ</span>
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.6, maxWidth: 300, color: 'var(--clr-text-muted)' }}>
                The intelligence layer for startup ecosystems. Machine learning predictions, Gemini AI analytics, and targeted investor matchmaking.
              </p>
            </div>

            {/* Platform links */}
            <div>
              <div style={{ fontWeight: 700, color: 'var(--clr-text)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/register" style={{ color: 'var(--clr-text-muted)', textDecoration: 'none' }} className="hover-link">Founder Sign Up</Link>
                <Link to="/register" style={{ color: 'var(--clr-text-muted)', textDecoration: 'none' }} className="hover-link">Investor Sign Up</Link>
                <Link to="/login" style={{ color: 'var(--clr-text-muted)', textDecoration: 'none' }} className="hover-link">Platform Login</Link>
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <div style={{ fontWeight: 700, color: 'var(--clr-text)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Technology</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Scikit-Learn ML Suite</span>
                <span style={{ color: 'var(--clr-text-muted)' }}>Google Gemini AI</span>
                <span style={{ color: 'var(--clr-text-muted)' }}>Django REST Framework</span>
                <span style={{ color: 'var(--clr-text-muted)' }}>React.js + Framer Motion</span>
              </div>
            </div>

          </div>

          <div style={{
            paddingTop: 24, borderTop: '1px solid var(--clr-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12
          }}>
            <div>VentureIQ © {new Date().getFullYear()} — Academic Venture Intelligence System</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> All Systems Operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
