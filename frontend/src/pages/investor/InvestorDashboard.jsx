import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { TrendingUp, Search, Bookmark, ArrowRight, Star, Filter } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { startupsAPI, profileAPI } from '../../services/api';
import { formatCurrency } from '../../utils/currency';

export default function InvestorDashboard() {
  const { user, updateUser } = useAuth();
  const [startups, setStartups] = useState([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [startupsRes, watchlistRes, meetingsRes, profileRes] = await Promise.all([
          startupsAPI.list(),
          startupsAPI.getWatchlist(),
          startupsAPI.getMeetingsSent(),
          profileAPI.get().catch(() => null)
        ]);
        setStartups(Array.isArray(startupsRes.data) ? startupsRes.data : []);
        setWatchlistCount(Array.isArray(watchlistRes.data) ? watchlistRes.data.length : 0);
        setMeetingsCount(Array.isArray(meetingsRes.data) ? meetingsRes.data.length : 0);
        if (profileRes?.data) {
          setProfileData(profileRes.data);
          if (updateUser) {
            updateUser({
              firm: profileRes.data.firm,
              company: profileRes.data.company,
              name: profileRes.data.name
            });
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute derived data from real startups
  const topStartups = [...startups].sort((a, b) => b.score - a.score).slice(0, 6);
  
  const scatterData = startups.slice(0, 15).map(s => ({
    id: s.id,
    x: s.score,
    y: parseFloat(String(s.revenue).replace(/[^0-9.]/g, '')) * 1000 || 50000,
    z: s.team_size || 5,
    name: s.name
  }));

  const industryMap = {};
  startups.forEach(s => {
    if (!industryMap[s.industry]) {
      industryMap[s.industry] = { count: 0, totalScore: 0 };
    }
    industryMap[s.industry].count += 1;
    industryMap[s.industry].totalScore += s.score;
  });
  
  const industryData = Object.entries(industryMap)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const avgPortfolioScore = startups.length 
    ? Math.round(startups.reduce((acc, s) => acc + s.score, 0) / startups.length)
    : 0;

  const firmOrCompany = profileData?.firm || profileData?.company || user?.firm || user?.company;

  const alerts = [
    { text: 'Discover new startups tailored to your investment thesis', icon: '🎯', time: 'Just now', type: 'info' },
    { text: `${startups.length} verified startups available on VentureIQ`, icon: '📊', time: '1h ago', type: 'success' },
    ...(firmOrCompany ? [] : [{ text: 'Complete your investor profile to improve AI matchmaking', icon: '⚙️', time: '1d ago', type: 'warning' }]),
  ];

  return (
    <DashboardLayout title="Investor Dashboard" subtitle="Track investment opportunities, watchlist startups, and manage intro meetings">

      {/* Welcome Banner: Firm / Company Name */}
      <div className="card" style={{
        marginBottom: 24, padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))',
        border: '1px solid rgba(16,185,129,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--clr-text)', letterSpacing: '-0.02em' }}>
            💼 {firmOrCompany || `${user?.name || 'Investor'}'s Firm`}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)', marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>👤 {user?.name || 'Investor'}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Investor / Venture Capitalist</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{startups.length} verified startups available</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/investor/my-profile" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
            {firmOrCompany ? 'View Profile' : 'Complete Profile'} <ArrowRight size={13} />
          </Link>
          <Link to="/investor/discover" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
            Discover Startups <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: '🔍', label: 'Startups Discovered', value: loading ? '-' : startups.length, change: 'Available in DB', color: 'rgba(99,102,241,0.15)' },
          { icon: '❤️', label: 'Watchlisted', value: loading ? '-' : watchlistCount, change: 'Saved to profile', color: 'rgba(16,185,129,0.15)' },
          { icon: '📊', label: 'Avg Platform Score', value: loading ? '-' : `${avgPortfolioScore}%`, change: 'Across all startups', color: 'rgba(139,92,246,0.15)' },
          { icon: '🤝', label: 'Meetings Requested', value: loading ? '-' : meetingsCount, change: 'Sent by you', color: 'rgba(245,158,11,0.15)' },
        ].map(s => (
          <motion.div key={s.label} className="stat-card" whileHover={{ y: -2 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 12 }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{s.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Top Startups + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>

        {/* Top Startups Table */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Top Scoring Startups</h3>
            <Link to="/investor/discover" className="btn btn-secondary btn-sm"><Search size={13} /> Explore All ({startups.length})</Link>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Startup</th>
                  <th>Industry</th>
                  <th>Score</th>
                  <th>Stage</th>
                  <th>Revenue</th>
                  <th>Risk</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Loading startups...</td></tr>
                ) : topStartups.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No startups found</td></tr>
                ) : (
                  topStartups.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: '0.68rem' }}>
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{s.name}</div>
                            {s.founder_name && <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 500 }}>👤 {s.founder_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-info">{s.industry}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 32, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: s.score >= 85 ? 'var(--clr-success)' : s.score >= 75 ? '#6366f1' : 'var(--clr-warning)', width: `${s.score}%` }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: s.score >= 85 ? 'var(--clr-success)' : '#6366f1' }}>{s.score}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)' }}>{s.stage}</td>
                      <td style={{ color: 'var(--clr-success)', fontWeight: 600, fontSize: '0.85rem' }}>{formatCurrency(s.revenue || 0)}</td>
                      <td><span className={`badge ${s.risk_level === 'Low' ? 'badge-success' : s.risk_level === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{s.risk_level || 'Medium'}</span></td>
                      <td>
                        <Link to={`/investor/startup/${s.id}`} className="btn btn-ghost btn-sm">View <ArrowRight size={12} /></Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Live Feed & Updates</h3>
            <span className="badge badge-danger">New</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.02)', border: `1px solid var(--clr-border)`, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{a.icon}</span>
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>{a.text}</p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Industry Bar Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>Startups by Sector</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 16 }}>Count and average AI score from database</p>
          <ResponsiveContainer width="100%" height={200}>
            {industryData.length > 0 ? (
              <BarChart data={industryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="var(--clr-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="card" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>{payload[0]?.payload?.name}: {payload[0]?.value} startups (Avg Score: {payload[0]?.payload?.avgScore}%)</div> : null} />
                <Bar dataKey="count" name="Count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {industryData.map((_, i) => <Cell key={i} fill={`hsl(${240 + i * 20},75%,${55 + i * 3}%)`} />)}
                </Bar>
              </BarChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--clr-text-muted)' }}>No data available</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Opportunity Map scatter */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>Opportunity Matrix</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 16 }}>Score vs Revenue (bubble = team size)</p>
          <ResponsiveContainer width="100%" height={200}>
            {scatterData.length > 0 ? (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" dataKey="x" name="Score" domain={[60, 100]} unit="%" stroke="var(--clr-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="y" name="Revenue" stroke="var(--clr-text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => formatCurrency(v, { compact: true })} />
                <ZAxis type="number" dataKey="z" range={[30, 200]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload?.length ? <div className="card" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>{payload[0]?.payload?.name} (Score: {payload[0]?.value}%)</div> : null} />
                <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.7}>
                  {scatterData.map((_, i) => <Cell key={i} fill={`hsl(${240 + i * 25},70%,60%)`} />)}
                </Scatter>
              </ScatterChart>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--clr-text-muted)' }}>No data available</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

    </DashboardLayout>
  );
}
