import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight, Target, Zap, Users, DollarSign, Clock, Star, AlertTriangle, CheckCircle, Pencil, Plus, X } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useStartup } from '../../context/StartupContext';
import { startupsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { isMeetingOpened, markMeetingAsOpened } from '../../services/unreadTracker';

// ── Mock Data ────────────────────────────────────────────────────────

const RADAR_DATA = [
  { subject:'Innovation', A:88 }, { subject:'Market Fit', A:72 },
  { subject:'Team', A:90 }, { subject:'Finance', A:65 },
  { subject:'Scalability', A:80 }, { subject:'Traction', A:76 },
];

const TASKS = [
  { text: 'Upload Q3 financial report', done: false, priority: 'high' },
  { text: 'Update pitch deck slides 8-12', done: false, priority: 'medium' },
  { text: 'Review investor interest signals', done: true, priority: 'high' },
  { text: 'Generate AI SWOT analysis', done: true, priority: 'medium' },
  { text: 'Schedule demo day video shoot', done: false, priority: 'low' },
];

const INITIAL_ACTIVITY = [
  { icon:'🤖', text:'AI analysis completed — Score: 87%', time:'2d ago', type:'ai' },
];

function StatCard({ icon, label, value, change, changeUp, gradient }) {
  return (
    <motion.div className="stat-card" whileHover={{ y:-3 }} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ width:44, height:44, borderRadius:'var(--r-md)', background:gradient||'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>
          {icon}
        </div>
        {change && (
          <span className={`stat-change ${changeUp?'up':'down'}`} style={{ display:'flex', alignItems:'center', gap:3 }}>
            {changeUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {change}
          </span>
        )}
      </div>
      <div className="stat-value" style={{ marginTop:12 }}>{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

export default function FounderDashboard() {
  const { user } = useAuth();
  const { startup } = useStartup();
  const [tasks, setTasks] = useState(TASKS);
  const [activities, setActivities] = React.useState(INITIAL_ACTIVITY);
  const successScore = startup?.score || 85;

  const radarData = [
    { subject: 'Innovation', A: startup?.innovation_score || 82 },
    { subject: 'Market Fit', A: startup?.investor_interest_score || 78 },
    { subject: 'Team', A: Math.min(96, Math.max(55, (startup?.team_size || 5) * 6 + 45)) },
    { subject: 'Finance', A: startup?.score || 75 },
    { subject: 'Scalability', A: startup?.market_trend_score || 80 },
    { subject: 'Traction', A: startup?.investor_interest_score || 76 },
  ];

  const loadDashboardData = () => {
    startupsAPI.getMeetings()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const meetingActivities = res.data.map(m => ({
            id: m.id,
            icon: '📧',
            text: `Connection request from ${m.investor_name} (${m.firm || 'VC'})`,
            time: 'Recently',
            type: 'meeting'
          }));
          setActivities(prev => {
            const texts = new Set(prev.map(p => p.text));
            return [...meetingActivities.filter(ma => !texts.has(ma.text)), ...prev];
          });
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    loadDashboardData();
    window.addEventListener('ventureiq_notification_added', loadDashboardData);
    return () => window.removeEventListener('ventureiq_notification_added', loadDashboardData);
  }, []);

  const revBase = startup?.revenue_num || 71000;
  const growthPct = startup?.growth_num || 0;
  const burnBase = startup?.burn_rate || Math.round(revBase * 0.38);
  const runwayMonths = burnBase > 0 ? Math.max(1, Math.round((revBase * 12) / burnBase)) : 24;
  const activeUsers = Number(startup?.active_users || 0);

  const revenueData = [
    { month: 'Jan', revenue: Math.round(revBase * 0.60), target: Math.round(revBase * 0.55) },
    { month: 'Feb', revenue: Math.round(revBase * 0.68), target: Math.round(revBase * 0.62) },
    { month: 'Mar', revenue: Math.round(revBase * 0.65), target: Math.round(revBase * 0.70) },
    { month: 'Apr', revenue: Math.round(revBase * 0.82), target: Math.round(revBase * 0.78) },
    { month: 'May', revenue: Math.round(revBase * 0.88), target: Math.round(revBase * 0.85) },
    { month: 'Jun', revenue: Math.round(revBase * 1.00), target: Math.round(revBase * 0.92) },
    { month: 'Jul', revenue: Math.round(revBase * 0.96), target: Math.round(revBase * 0.98) },
    { month: 'Aug', revenue: Math.round(revBase * 1.12), target: Math.round(revBase * 1.05) },
  ];

  const toggleTask  = (i) => setTasks(prev => prev.map((t,idx) => idx===i ? { ...t, done:!t.done } : t));

  /* ── To-Do editing ── */
  const [editMode,   setEditMode]   = useState(false);
  const [newText,    setNewText]    = useState('');
  const [newPri,     setNewPri]     = useState('medium');

  const addTask = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    setTasks(prev => [...prev, { text: trimmed, done: false, priority: newPri }]);
    setNewText('');
    setNewPri('medium');
  };

  const deleteTask = (i) => setTasks(prev => prev.filter((_, idx) => idx !== i));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card" style={{ padding:'10px 14px', minWidth:140 }}>
        <div style={{ fontSize:'0.78rem', color:'var(--clr-text-muted)', marginBottom:6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ fontSize:'0.88rem', fontWeight:600, color:p.color }}>
            {p.name}: {formatCurrency(p.value, { compact: true })}
          </div>
        ))}
      </div>
    );
  };

  if (!startup) {
    return (
      <DashboardLayout title="Founder Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}!`}>
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚀</div>
          <h3 style={{ fontWeight: 700, color: 'var(--clr-text-primary)', marginBottom: 8 }}>Set up your Startup Profile</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
            You haven't created your startup profile yet. Complete your profile to get a venture score, attract investors, and manage your dashboard.
          </p>
          <Link to="/founder/startup" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Create Startup Profile
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Founder Dashboard" subtitle="Overview of your startup performance and investor activity">

      {/* Welcome Banner: Startup Name bigger + Founder Name below */}
      <div className="card" style={{
        marginBottom: 24, padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--clr-text)', letterSpacing: '-0.02em' }}>
            🚀 {startup.name}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)', marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>👤 {user?.name || 'Founder'}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>Founder & CEO</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{startup.industry} ({startup.stage})</span>
          </div>
        </div>
        <Link to="/founder/startup" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          Manage Startup Profile <ArrowRight size={13} />
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        <StatCard icon="💰" label="Monthly Revenue" value={formatCurrency(startup.revenue || revBase, { suffix: '/month' })} change={growthPct !== 0 ? `${growthPct > 0 ? '+' : ''}${growthPct}%` : null} changeUp={growthPct > 0} gradient="rgba(16,185,129,0.15)" />
        <StatCard icon="🔥" label="Burn Rate" value={formatCurrency(burnBase, { suffix: '/month', compact: true })} change={burnBase > 0 && revBase > 0 ? `${((burnBase / revBase) * 100).toFixed(0)}% of rev` : null} changeUp={false} gradient="rgba(239,68,68,0.15)" />
        <StatCard icon="⏳" label="Runway" value={`${runwayMonths} months`} change={runwayMonths >= 18 ? 'Healthy' : runwayMonths >= 12 ? 'Moderate' : 'Low'} changeUp={runwayMonths >= 12} gradient="rgba(245,158,11,0.15)" />
        <StatCard icon="👥" label="Active Users" value={activeUsers.toLocaleString()} change={startup.growth ? startup.growth : null} changeUp={growthPct >= 0} gradient="rgba(99,102,241,0.15)" />
      </div>

      {/* Main Grid */}
      <div className="dashboard-main-grid">

        {/* Revenue Chart */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:20 }}>
            <div>
              <h3 style={{ fontWeight:700, fontSize:'1rem' }}>Revenue vs Target</h3>
              <p style={{ fontSize:'0.78rem', color:'var(--clr-text-muted)' }}>Monthly performance overview</p>
            </div>
            <span className="badge badge-success">On Track</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="tgtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>formatCurrency(v, { compact: true })} />
              <Tooltip content={<CustomTooltip/>} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fill="url(#tgtGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Score + Radar */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Success Score */}
          <div className="card" style={{ textAlign:'center' }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--clr-text-secondary)', marginBottom:12 }}>AI SUCCESS SCORE</h3>
            <div style={{ position:'relative', width:120, height:120, margin:'0 auto' }}>
              <svg width="120" height="120" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
                  strokeDasharray={`${2*Math.PI*50*(successScore/100)} ${2*Math.PI*50*(1-successScore/100)}`}
                  strokeLinecap="round"/>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#10b981"/>
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--clr-text-primary)', fontFamily:"'Space Grotesk',sans-serif" }}>{successScore}%</span>
              </div>
            </div>
            <div style={{ marginTop:10 }}>
              <span className={`badge ${successScore >= 80 ? 'badge-success' : successScore >= 68 ? 'badge-purple' : 'badge-warning'}`}>
                {successScore >= 80 ? 'Excellent' : successScore >= 70 ? 'Very Good' : successScore >= 55 ? 'Good' : 'Moderate'}
              </span>
              <p style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)', marginTop:6 }}>Top {Math.max(4, 100 - successScore)}% of startups</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding:16 }}>
            <h3 style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:12 }}>Quick Actions</h3>
            {[
              { label:'Run AI Analysis', to:'/founder/ai-analysis', icon:'🤖', color:'#6366f1' },
              { label:'Generate SWOT', to:'/founder/ai-analysis', icon:'💡', color:'#8b5cf6' },
              { label:'View Analytics', to:'/founder/analytics', icon:'📊', color:'#06b6d4' },
            ].map(a => (
              <Link key={a.label} to={a.to} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:'var(--r-sm)', marginBottom:4, transition:'background 0.15s', textDecoration:'none' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <span style={{ fontSize:'1rem' }}>{a.icon}</span>
                <span style={{ fontSize:'0.83rem', fontWeight:500, color:'var(--clr-text-secondary)', flex:1 }}>{a.label}</span>
                <ArrowRight size={12} color="var(--clr-text-muted)" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="dashboard-bottom-grid">

        {/* Radar Chart */}
        <div className="card">
          <h3 style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:16 }}>Performance Radar</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'var(--clr-text-muted)', fontSize:10 }} />
              <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} dot={{ fill:'#6366f1', r:3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom:14 }}>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>To-Do List</h3>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)' }}>{tasks.filter(t=>t.done).length}/{tasks.length} done</span>
              <button
                onClick={() => setEditMode(v => !v)}
                title={editMode ? 'Done editing' : 'Edit list'}
                style={{
                  display:'flex', alignItems:'center', gap:4,
                  padding:'3px 10px', borderRadius:'var(--r-full)',
                  border:`1px solid ${editMode ? 'var(--clr-accent-1)' : 'var(--clr-border)'}`,
                  background: editMode ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: editMode ? 'var(--clr-accent-1)' : 'var(--clr-text-muted)',
                  cursor:'pointer', fontSize:'0.72rem', fontWeight:600, transition:'all 0.2s',
                }}
              >
                <Pencil size={11} /> {editMode ? 'Done' : 'Edit'}
              </button>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'6px 8px', borderRadius:'var(--r-sm)', background: t.done ? 'rgba(16,185,129,0.05)' : 'transparent', transition:'background 0.15s' }}>
                {/* Checkbox */}
                <div
                  onClick={() => toggleTask(i)}
                  style={{ width:18, height:18, borderRadius:4, border:`2px solid ${t.done ? 'var(--clr-success)' : 'var(--clr-border)'}`, background: t.done ? 'var(--clr-success)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, transition:'all 0.2s', cursor:'pointer' }}
                >
                  {t.done && <span style={{ color:'#fff', fontSize:'0.6rem', fontWeight:900 }}>✓</span>}
                </div>
                {/* Label */}
                <span
                  onClick={() => toggleTask(i)}
                  style={{ fontSize:'0.82rem', color: t.done ? 'var(--clr-text-muted)' : 'var(--clr-text-secondary)', textDecoration: t.done ? 'line-through' : 'none', flex:1, lineHeight:1.4, cursor:'pointer' }}
                >{t.text}</span>
                {/* Priority badge */}
                <span style={{ fontSize:'0.68rem', padding:'1px 6px', borderRadius:'var(--r-full)', flexShrink:0, background: t.priority==='high' ? 'rgba(239,68,68,0.15)' : t.priority==='medium' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)', color: t.priority==='high' ? 'var(--clr-danger)' : t.priority==='medium' ? 'var(--clr-warning)' : 'var(--clr-accent-1)', fontWeight:600 }}>
                  {t.priority}
                </span>
                {/* Delete — edit mode only */}
                {editMode && (
                  <button
                    onClick={() => deleteTask(i)}
                    title="Remove task"
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--clr-danger)', padding:0, display:'flex', alignItems:'center', opacity:0.75, flexShrink:0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add row — edit mode only */}
          {editMode && (
            <div style={{ marginTop:10, display:'flex', gap:6, alignItems:'center' }}>
              <input
                className="form-input"
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Add a task…"
                style={{ flex:1, height:34, fontSize:'0.8rem', padding:'0 10px' }}
              />
              <select
                value={newPri}
                onChange={e => setNewPri(e.target.value)}
                className="form-select"
                style={{ width:90, height:34, fontSize:'0.78rem', padding:'0 8px' }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={addTask}
                className="btn btn-primary btn-icon"
                title="Add task"
                style={{ height:34, width:34, flexShrink:0 }}
              >
                <Plus size={15} />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginTop:20 }}>
        <div className="flex-between" style={{ marginBottom:16 }}>
          <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>Recent Activity</h3>
          <span className="badge badge-info">Live</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
          {activities.map((a, i) => {
            const unopened = a.type === 'meeting' && a.id && !isMeetingOpened(a.id);
            return (
              <Link
                key={i}
                to="/founder/meetings"
                onClick={() => a.id && markMeetingAsOpened(a.id)}
                style={{
                  display:'flex', gap:10, padding:'10px 12px', borderRadius:'var(--r-md)',
                  background:'rgba(255,255,255,0.02)', border:'1px solid var(--clr-border)',
                  textDecoration: 'none', position: 'relative'
                }}
              >
                <span style={{ fontSize:'1.2rem', flexShrink:0 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize:'0.8rem', color:'var(--clr-text-secondary)', lineHeight:1.4, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {a.text}
                    {unopened && (
                      <span className="unread-green-dot" title="Unopened message" />
                    )}
                  </p>
                  <span style={{ fontSize:'0.72rem', color:'var(--clr-text-muted)' }}>{a.time}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

    </DashboardLayout>
  );
}
