import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useStartup } from '../../context/StartupContext';

const ChartTooltip = ({ active, payload, label, prefix='', suffix='' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding:'10px 14px', minWidth:140 }}>
      <div style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)', marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize:'0.85rem', fontWeight:600, color:p.color }}>
          {p.name}: {prefix}{typeof p.value === 'number' && p.value > 999 ? `$${(p.value/1000).toFixed(0)}K` : p.value}{suffix}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { startup } = useStartup();
  const [range, setRange] = useState('8M');

  if (!startup) {
    return (
      <DashboardLayout title="Analytics & Insights" subtitle="Real-time performance metrics and financial projections">
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
          <h3 style={{ fontWeight: 700, color: 'var(--clr-text-primary)', marginBottom: 8 }}>Set up your Startup Profile</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
            You haven't created your startup profile yet. Complete your profile to view your performance metrics.
          </p>
          <button onClick={() => window.location.href = '/founder/startup'} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Create Startup Profile
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const revBase = startup.revenue_num || 71000;
  const burnBase = startup.burn_rate || Math.round(revBase * 0.38);
  const usersBase = Number(startup.active_users || 12400);

  const monthlyData = [
    { month:'Jan', revenue: Math.round(revBase * 0.60), users: Math.round(usersBase * 0.65), cac: 165, ltv: 490 },
    { month:'Feb', revenue: Math.round(revBase * 0.68), users: Math.round(usersBase * 0.73), cac: 158, ltv: 510 },
    { month:'Mar', revenue: Math.round(revBase * 0.65), users: Math.round(usersBase * 0.77), cac: 155, ltv: 520 },
    { month:'Apr', revenue: Math.round(revBase * 0.82), users: Math.round(usersBase * 0.84), cac: 148, ltv: 540 },
    { month:'May', revenue: Math.round(revBase * 0.88), users: Math.round(usersBase * 0.89), cac: 143, ltv: 565 },
    { month:'Jun', revenue: Math.round(revBase * 1.00), users: Math.round(usersBase * 0.95), cac: 141, ltv: 592 },
    { month:'Jul', revenue: Math.round(revBase * 0.96), users: Math.round(usersBase * 0.97), cac: 138, ltv: 610 },
    { month:'Aug', revenue: Math.round(revBase * 1.12), users: Math.round(usersBase * 1.00), cac: 134, ltv: 635 },
  ];

  const burnData = monthlyData.map(d => ({
    month: d.month,
    revenue: d.revenue,
    burn: Math.round(d.revenue * 0.38)
  }));

  return (
    <DashboardLayout title="Analytics & Insights" subtitle="Real-time performance metrics and financial projections">
      
      {/* KPI Summary */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:'Avg Monthly Revenue', value:'$59K', sub:'8-month average', color:'#6366f1' },
          { label:'User Growth', value:'+51%', sub:'Jan → Aug', color:'#10b981' },
          { label:'CAC Improvement', value:'-19%', sub:'Cost per acquisition', color:'#f59e0b' },
          { label:'LTV:CAC Ratio', value:'4.7x', sub:'Industry avg: 3x', color:'#8b5cf6' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div style={{ fontSize:'1.9rem', fontWeight:900, color:k.color, fontFamily:"'Space Grotesk',sans-serif" }}>{k.value}</div>
            <div style={{ fontSize:'0.85rem', fontWeight:600, marginTop:2 }}>{k.label}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue + Users */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>Monthly Revenue — {startup.name}</h3>
            <p style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)' }}>USD · 2025</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`$${v/1000}K`} />
              <Tooltip content={<ChartTooltip/>} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revG)" dot={{ fill:'#6366f1', r:4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>Active Users Growth</h3>
            <p style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)' }}>Monthly active platform users</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<ChartTooltip/>} />
              <Bar dataKey="users" name="Users" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Burn Rate + CAC/LTV */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>Revenue vs Burn Rate</h3>
            <p style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)' }}>Monthly cash flow trend</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={burnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`$${v/1000}K`} />
              <Tooltip content={<ChartTooltip/>} />
              <Legend wrapperStyle={{ fontSize:'0.78rem', paddingTop:8 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="burn" name="Burn" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>CAC vs LTV Trend</h3>
            <p style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)' }}>Customer economics over time</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--clr-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`$${v}`} />
              <Tooltip content={<ChartTooltip prefix="$"/>} />
              <Legend wrapperStyle={{ fontSize:'0.78rem', paddingTop:8 }} />
              <Line type="monotone" dataKey="ltv" name="LTV" stroke="#6366f1" strokeWidth={2.5} dot={{ fill:'#6366f1', r:3 }} />
              <Line type="monotone" dataKey="cac" name="CAC" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill:'#f59e0b', r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="card">
        <h3 style={{ fontWeight:700, marginBottom:16 }}>Detailed Monthly Breakdown</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Active Users</th>
                <th>CAC</th>
                <th>LTV</th>
                <th>LTV:CAC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(r => (
                <tr key={r.month}>
                  <td style={{ fontWeight:600 }}>{r.month} 2025</td>
                  <td style={{ color:'var(--clr-success)', fontWeight:600 }}>${(r.revenue/1000).toFixed(0)}K</td>
                  <td>{r.users.toLocaleString()}</td>
                  <td style={{ color:'var(--clr-warning)' }}>${r.cac}</td>
                  <td style={{ color:'var(--clr-accent-1)' }}>${r.ltv}</td>
                  <td style={{ fontWeight:700, color: (r.ltv/r.cac) >= 4 ? 'var(--clr-success)' : 'var(--clr-text-secondary)' }}>
                    {(r.ltv/r.cac).toFixed(1)}x
                  </td>
                  <td><span className={`badge ${r.ltv/r.cac >= 4 ? 'badge-success' : 'badge-warning'}`}>{r.ltv/r.cac >= 4 ? 'Healthy' : 'Watch'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
