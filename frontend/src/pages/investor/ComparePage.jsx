import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { GitCompare, Trophy, TrendingUp, ShieldAlert, Sparkles, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { startupsAPI } from '../../services/api';

export default function ComparePage() {
  const [allStartups, setAllStartups] = useState([]);
  const [s1Id, setS1Id] = useState('');
  const [s2Id, setS2Id] = useState('');

  useEffect(() => {
    startupsAPI.list()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const apiStartups = res.data.map(s => ({
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
            innovation_score: s.innovation_score || 85,
            investor_interest_score: s.investor_interest_score || 88,
            market_trend_score: s.market_trend_score || 91,
          }));
          setAllStartups(apiStartups);
          if (apiStartups.length > 0) {
            setS1Id(apiStartups[0].id);
            if (apiStartups.length > 1) {
              setS2Id(apiStartups[1].id);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const d1 = allStartups.find(s => s.id === Number(s1Id)) || allStartups[0];
  const d2 = allStartups.find(s => s.id === Number(s2Id)) || allStartups[1] || allStartups[0];

  if (!d1 || !d2) {
    return (
      <DashboardLayout title="Compare Startups" subtitle="Head-to-head analysis of venture opportunities">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
          <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite', marginBottom: 12 }} />
          <div>Loading startups...</div>
        </div>
      </DashboardLayout>
    );
  }

  const parseRevNum = (str) => {
    if (!str) return 0;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (str.includes('M')) return num * 1000;
    if (str.includes('K')) return num;
    return num / 1000;
  };

  const parseGrowthNum = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace('%', '')) || 0;
  };

  const parseValuationNum = (str) => {
    if (!str) return 0;
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (str.includes('B')) return num * 1000;
    if (str.includes('M')) return num;
    return num / 1000;
  };

  const radarData = [
    { subject: 'AI Score', A: d1.score, B: d2.score },
    { subject: 'Innovation', A: d1.innovation_score || 85, B: d2.innovation_score || 85 },
    { subject: 'Investor Interest', A: d1.investor_interest_score || 80, B: d2.investor_interest_score || 80 },
    { subject: 'Market Trend', A: d1.market_trend_score || 82, B: d2.market_trend_score || 82 },
    { subject: 'Growth Velocity', A: Math.min(100, Math.max(30, 50 + parseGrowthNum(d1.growth) * 1.5)), B: Math.min(100, Math.max(30, 50 + parseGrowthNum(d2.growth) * 1.5)) },
  ];

  const barData = [
    { name: 'Revenue ($K/mo)', A: parseRevNum(d1.revenue), B: parseRevNum(d2.revenue) },
    { name: 'MoM Growth (%)', A: parseGrowthNum(d1.growth), B: parseGrowthNum(d2.growth) },
    { name: 'Team Size', A: d1.team, B: d2.team },
    { name: 'AI Score (%)', A: d1.score, B: d2.score },
  ];

  const metrics = [
    { label: 'AI Success Score', val1: `${d1.score}%`, val2: `${d2.score}%`, num1: d1.score, num2: d2.score, better: 'higher' },
    { label: 'Monthly Revenue', val1: d1.revenue, val2: d2.revenue, num1: parseRevNum(d1.revenue), num2: parseRevNum(d2.revenue), better: 'higher' },
    { label: 'MoM Growth Rate', val1: d1.growth, val2: d2.growth, num1: parseGrowthNum(d1.growth), num2: parseGrowthNum(d2.growth), better: 'higher' },
    { label: 'Estimated Valuation', val1: d1.valuation || 'N/A', val2: d2.valuation || 'N/A', num1: parseValuationNum(d1.valuation), num2: parseValuationNum(d2.valuation), better: 'higher' },
    { label: 'Active Users', val1: d1.active_users ? d1.active_users.toLocaleString() : 'N/A', val2: d2.active_users ? d2.active_users.toLocaleString() : 'N/A', num1: d1.active_users || 0, num2: d2.active_users || 0, better: 'higher' },
    { label: 'Team Size', val1: `${d1.team} members`, val2: `${d2.team} members`, num1: d1.team, num2: d2.team, better: 'context' },
    { label: 'Innovation Score', val1: `${d1.innovation_score || 85}%`, val2: `${d2.innovation_score || 85}%`, num1: d1.innovation_score || 85, num2: d2.innovation_score || 85, better: 'higher' },
    { label: 'Investor Interest Score', val1: `${d1.investor_interest_score || 88}%`, val2: `${d2.investor_interest_score || 88}%`, num1: d1.investor_interest_score || 88, num2: d2.investor_interest_score || 88, better: 'higher' },
    { label: 'Risk Level', val1: `${d1.risk} Risk`, val2: `${d2.risk} Risk`, num1: d1.risk === 'Low' ? 3 : (d1.risk === 'Medium' ? 2 : 1), num2: d2.risk === 'Low' ? 3 : (d2.risk === 'Medium' ? 2 : 1), better: 'higher' },
    { label: 'Funding Stage', val1: d1.stage, val2: d2.stage, num1: 0, num2: 0, better: 'context' },
  ];

  const getWinner = (m) => {
    if (m.better === 'context' || m.num1 === m.num2) return null;
    return m.num1 > m.num2 ? 'A' : 'B';
  };

  const countWinners = () => {
    let aWins = 0, bWins = 0;
    metrics.forEach(m => {
      const w = getWinner(m);
      if (w === 'A') aWins++;
      if (w === 'B') bWins++;
    });
    return { aWins, bWins };
  };

  const wins = countWinners();

  return (
    <DashboardLayout title="Compare Startups" subtitle={`Compare any of the ${allStartups.length} startups side-by-side`}>

      {/* Selectors Card */}
      <div className="card" style={{ marginBottom: 24, padding: 22 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 6, color: '#6366f1', fontWeight: 700 }}>
              Startup 1 (Primary)
            </label>
            <select
              className="form-select"
              value={s1Id}
              onChange={e => setS1Id(Number(e.target.value))}
              style={{ height: 42, borderColor: 'rgba(99,102,241,0.4)' }}
            >
              {allStartups.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.industry} • {s.stage})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--clr-border)', marginTop: 20 }}>
            <GitCompare size={20} color="var(--clr-text-muted)" />
          </div>

          <div style={{ flex: '1 1 260px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 6, color: '#10b981', fontWeight: 700 }}>
              Startup 2 (Benchmark)
            </label>
            <select
              className="form-select"
              value={s2Id}
              onChange={e => setS2Id(Number(e.target.value))}
              style={{ height: 42, borderColor: 'rgba(16,185,129,0.4)' }}
            >
              {allStartups.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.industry} • {s.stage})
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Side by Side Startup Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {[d1, d2].map((d, i) => {
          const isA = i === 0;
          const color = isA ? '#6366f1' : '#10b981';
          return (
            <div key={d.id || i} className="card" style={{ borderColor: `${color}40`, background: `${color}06`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, width: 48, height: 48, fontSize: '1rem', fontWeight: 900 }}>
                    {d.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.15rem' }}>{d.name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                      {d.industry} • {d.city ? `${d.city}, ${d.country}` : d.country}
                    </div>
                  </div>
                </div>
                <Link to={`/investor/startup/${d.id}`} className="btn btn-ghost btn-sm" style={{ gap: 4, fontSize: '0.75rem' }}>
                  Profile <ExternalLink size={12} />
                </Link>
              </div>

              <p style={{ fontSize: '0.81rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5, marginBottom: 16, minHeight: 40 }}>
                {d.desc}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                <div style={{ padding: '10px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>AI Score</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: color, fontFamily: "'Space Grotesk',sans-serif" }}>{d.score}%</div>
                </div>
                <div style={{ padding: '10px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Revenue</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--clr-success)', marginTop: 2 }}>{d.revenue}</div>
                </div>
                <div style={{ padding: '10px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Growth</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--clr-accent-1)', marginTop: 2 }}>{d.growth}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Head-to-Head Winner AI Summary */}
      <div className="card" style={{ marginBottom: 24, background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trophy size={22} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--clr-text-primary)' }}>
            AI Comparison Executive Takeaway
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
            <strong>{d1.name}</strong> leads in {wins.aWins} metric parameters, while <strong>{d2.name}</strong> leads in {wins.bWins} parameters.{' '}
            {d1.score > d2.score ? `${d1.name} holds a overall higher AI Success Score (${d1.score}% vs ${d2.score}%).` : `${d2.name} holds a overall higher AI Success Score (${d2.score}% vs ${d1.score}%).`}
          </div>
        </div>
      </div>

      {/* Head to Head Detailed Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitCompare size={16} color="var(--clr-accent-1)" /> Head-to-Head Metrics Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {metrics.map(m => {
            const w = getWinner(m);
            return (
              <div
                key={m.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 200px 1fr',
                  gap: 16,
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--clr-border)',
                }}
              >
                {/* Startup A */}
                <div style={{ textAlign: 'right', fontWeight: w === 'A' ? 800 : 500, color: w === 'A' ? '#6366f1' : 'var(--clr-text-secondary)', fontSize: '0.9rem' }}>
                  {m.val1} {w === 'A' && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.18)', color: '#6366f1', fontSize: '0.68rem', fontWeight: 800, marginLeft: 6 }}>WINNER</span>}
                </div>

                {/* Metric Label */}
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.label}
                </div>

                {/* Startup B */}
                <div style={{ fontWeight: w === 'B' ? 800 : 500, color: w === 'B' ? '#10b981' : 'var(--clr-text-secondary)', fontSize: '0.9rem' }}>
                  {w === 'B' && <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.18)', color: '#10b981', fontSize: '0.68rem', fontWeight: 800, marginRight: 6 }}>WINNER</span>} {m.val2}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Performance Radar Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#8b5cf6" /> Performance Radar Comparison
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--clr-text-muted)', fontSize: 11 }} />
              <Radar name={d1.name} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              <Radar name={d2.name} dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Tooltip contentStyle={{ background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: '0.82rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Comparison Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="#10b981" /> Quantitative Metrics Bar Chart
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: '0.82rem' }} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Bar dataKey="A" name={d1.name} fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" name={d2.name} fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </DashboardLayout>
  );
}
