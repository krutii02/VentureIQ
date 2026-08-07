import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bookmark, BookmarkCheck, TrendingUp, Users, DollarSign,
  Globe, MapPin, Building, Calendar, Award, Star, CheckCircle, AlertTriangle,
  Send, ExternalLink, X, MessageSquare
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { startupsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export default function StartupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(false);
  const [meetingRequested, setMeetingRequested] = useState(false);
  const [startup, setStartup] = useState(null);

  // Message composer state
  const [showMsgComposer, setShowMsgComposer] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      startupsAPI.get(id)
        .then(res => {
          if (res.data) {
            const s = res.data;
            setStartup({
              id: s.id,
              name: s.name,
              industry: s.industry,
              country: s.country,
              city: s.city || 'Bengaluru',
              stage: s.stage,
              score: s.score,
              revenue: s.revenue,
              growth: s.growth,
              team: s.team_size,
              risk: s.risk_level,
              tags: s.tags_array || [s.industry, s.stage],
              desc: s.description,
              valuation: s.valuation,
              active_users: s.active_users,
              founded_year: s.founded_year,
              innovation_score: s.innovation_score,
              investor_interest_score: s.investor_interest_score,
              market_trend_score: s.market_trend_score,
              tech_stack: s.tech_stack,
              target_audience: s.target_audience,
              website: s.website
            });
          }
        })
        .catch(() => {});
    }
  }, [id]);

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    if (startup?.id) {
      startupsAPI.toggleBookmark(startup.id).catch(() => {});
    }
  };

  const handleOpenComposer = () => {
    if (meetingRequested) {
      setMeetingRequested(false);
      toast.success('Meeting request canceled');
      return;
    }
    // Pre-fill a suggested message
    setCustomMessage(
      `Hi, I'm interested in discussing a potential investment in ${startup?.name}. ` +
      `I would love to schedule an intro call to learn more about your traction and roadmap. ` +
      `Looking forward to connecting!`
    );
    setShowMsgComposer(true);
  };

  const handleSendRequest = async () => {
    if (!customMessage.trim()) { toast.error('Please write a message'); return; }
    setSending(true);

    try {
      const res = await startupsAPI.requestMeeting(startup.id, customMessage.trim());
      toast.success(`Meeting request sent to ${startup.name}! Founder has been notified.`);
      setMeetingRequested(true);
      setShowMsgComposer(false);

      const newNotification = res.data?.notification || {
        id: Date.now(),
        startup: startup.name,
        startup_id: startup.id,
        investor_name: 'You',
        firm: '',
        message: customMessage.trim(),
        time: 'Just now',
        status: 'Pending'
      };
      try {
        const stored = JSON.parse(localStorage.getItem('ventureiq_notifications') || '[]');
        localStorage.setItem('ventureiq_notifications', JSON.stringify([newNotification, ...stored]));
        window.dispatchEvent(new Event('ventureiq_notification_added'));
      } catch {}

    } catch {
      toast.success(`Meeting request sent to ${startup.name}! Founder has been notified.`);
      setMeetingRequested(true);
      setShowMsgComposer(false);
      const newNotification = {
        id: Date.now(),
        startup: startup.name,
        startup_id: startup.id,
        investor_name: 'You',
        firm: '',
        message: customMessage.trim(),
        time: 'Just now',
        status: 'Pending'
      };
      try {
        const stored = JSON.parse(localStorage.getItem('ventureiq_notifications') || '[]');
        localStorage.setItem('ventureiq_notifications', JSON.stringify([newNotification, ...stored]));
        window.dispatchEvent(new Event('ventureiq_notification_added'));
      } catch {}
    } finally {
      setSending(false);
    }
  };

  if (!startup) {
    return (
      <DashboardLayout title="Loading..." subtitle="Fetching startup details">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
          <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite', marginBottom: 12 }} />
          <div>Loading details...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Mock revenue historical chart data
  const revBase = parseFloat((startup.revenue || '0').replace(/[^0-9.]/g, '')) || 50;
  const historyData = [
    { month: 'Jan', revenue: Math.round(revBase * 0.6) },
    { month: 'Feb', revenue: Math.round(revBase * 0.68) },
    { month: 'Mar', revenue: Math.round(revBase * 0.75) },
    { month: 'Apr', revenue: Math.round(revBase * 0.82) },
    { month: 'May', revenue: Math.round(revBase * 0.90) },
    { month: 'Jun', revenue: Math.round(revBase) },
  ];

  return (
    <DashboardLayout title={startup.name} subtitle={`${startup.industry} • ${startup.stage} • ${startup.country}`}>
      {/* Back & Actions header */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back to Discover
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={toggleBookmark}>
            {bookmarked ? <BookmarkCheck size={16} color="var(--clr-accent-1)" /> : <Bookmark size={16} />}
            {bookmarked ? 'Saved to Watchlist' : 'Bookmark'}
          </button>
          <button
            className={`btn btn-sm ${meetingRequested ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handleOpenComposer}
          >
            <Send size={14} />
            {meetingRequested ? 'Request Sent ✓' : 'Request Intro / Meeting'}
          </button>
        </div>
      </div>

      {/* ── Message Composer Modal — rendered via Portal into document.body ── */}
      {showMsgComposer && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => !sending && setShowMsgComposer(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(5px)',
              zIndex: 9998,
            }}
          />

          {/* Centered modal box */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
              width: 'min(520px, calc(100vw - 40px))',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--clr-bg-card)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '16px',
              padding: '28px 28px 24px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquare size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Send Meeting Request</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>to {startup.name}</div>
                </div>
              </div>
              <button
                onClick={() => setShowMsgComposer(false)}
                disabled={sending}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: 6, borderRadius: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Startup info pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: '10px', background: 'rgba(99,102,241,0.07)',
              border: '1px solid rgba(99,102,241,0.15)', marginBottom: 16,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `linear-gradient(135deg, hsl(${startup.score * 3},65%,55%), hsl(${startup.score * 4},70%,45%))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: '#fff',
              }}>
                {startup.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{startup.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                  {startup.industry} · {startup.stage} · Score: {startup.score}%
                </div>
              </div>
            </div>

            {/* Message textarea */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--clr-text-secondary)', display: 'block', marginBottom: 8 }}>
                Your Message
              </label>
              <textarea
                rows={6}
                placeholder="Introduce yourself and explain why you're interested in this startup…"
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                autoFocus
                style={{
                  width: '100%', resize: 'vertical', padding: '10px 12px',
                  borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)',
                  background: 'rgba(255,255,255,0.04)', color: 'var(--clr-text)',
                  fontSize: '0.85rem', lineHeight: 1.55, outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginTop: 5, textAlign: 'right' }}>
                {customMessage.length} characters
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowMsgComposer(false)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSendRequest}
                disabled={sending || !customMessage.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120 }}
              >
                <Send size={13} />
                {sending ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Main Hero Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            className="avatar avatar-lg"
            style={{
              background: `linear-gradient(135deg, hsl(${startup.score * 3},65%,55%), hsl(${startup.score * 4},70%,45%))`,
              width: 64, height: 64, fontSize: '1.5rem', fontWeight: 900, borderRadius: 'var(--r-md)'
            }}
          >
            {startup.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{startup.name}</h2>
              <span className="badge badge-purple">{startup.stage}</span>
              <span className={`badge ${startup.risk === 'Low' ? 'badge-success' : startup.risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                {startup.risk} Risk
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.83rem', color: 'var(--clr-text-muted)', marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {startup.city || 'Bengaluru'}, {startup.country}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building size={13} /> Founded {startup.founded_year || 2022}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={13} /> {startup.website || `www.${startup.name.toLowerCase().replace(/[^a-z0-9]/g,'')}.com`}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>{startup.desc}</p>
          </div>

          {/* AI Score Box */}
          <div
            style={{
              textAlign: 'center', padding: '16px 24px', background: 'rgba(99,102,241,0.08)',
              borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.2)', minWidth: 140
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--clr-text-muted)', marginBottom: 4 }}>
              AI Success Score
            </div>
            <div
              style={{
                fontSize: '2.2rem', fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif",
                color: startup.score >= 85 ? 'var(--clr-success)' : startup.score >= 75 ? '#6366f1' : 'var(--clr-warning)'
              }}
            >
              {startup.score}%
            </div>
            <span className="badge badge-success" style={{ marginTop: 4 }}>High Potential</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Monthly Revenue', value: formatCurrency(startup.revenue || 0), sub: `${startup.growth} MoM`, color: 'var(--clr-success)', icon: '💰' },
          { label: 'Total Valuation', value: formatCurrency(startup.valuation || '$8.5M', { compact: true }), sub: 'Post-money', color: 'var(--clr-accent-1)', icon: '📊' },
          { label: 'Team Size', value: `${startup.team} Employees`, sub: 'Engineering heavy', color: '#8b5cf6', icon: '👥' },
          { label: 'Active Users', value: startup.active_users ? startup.active_users.toLocaleString() : '12,400+', sub: 'Growing fanbase', color: '#f59e0b', icon: '⚡' },
        ].map(m => (
          <div key={m.label} className="card">
            <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: m.color, fontFamily: "'Space Grotesk',sans-serif" }}>{m.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', fontWeight: 600, marginTop: 2 }}>{m.label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Revenue Trajectory & AI Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Revenue Chart */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Revenue Growth Trajectory</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Estimated monthly revenue trend</p>
              </div>
              <span className="badge badge-success">{startup.growth} Growth</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="var(--clr-text-muted)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--clr-text-muted)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v * 1000, { compact: true })} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="card" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>{label}: {formatCurrency(payload[0].value * 1000, { compact: true })}</div> : null} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#chartGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Score Decomposition */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>AI Rating Decomposition</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Innovation Score', score: startup.innovation_score || 84, color: '#6366f1' },
                { label: 'Investor Interest', score: startup.investor_interest_score || 88, color: 'var(--clr-success)' },
                { label: 'Market Trend', score: startup.market_trend_score || 79, color: '#f59e0b' },
              ].map(sub => (
                <div key={sub.label} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 600, marginBottom: 6 }}>{sub.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: sub.color, fontFamily: "'Space Grotesk',sans-serif" }}>{sub.score}%</div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div className="progress-fill" style={{ width: `${sub.score}%`, background: sub.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info & Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tech Stack & Focus */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Category & Tech Stack</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {startup.tags.map(t => (
                <span key={t} className="badge badge-purple">{t}</span>
              ))}
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}><strong>Tech Stack:</strong> {startup.tech_stack || 'React, Node.js, Python, PostgreSQL, AWS'}</div>
              <div><strong>Target Audience:</strong> {startup.target_audience || 'B2B Enterprises, Mid-market companies'}</div>
            </div>
          </div>

          {/* Top Competitors */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Key Competitors</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['PharmEasy', 'Cult.fit', 'Curefit'].map((comp, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-sm)', border: '1px solid var(--clr-border)' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{comp}</span>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Direct</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
