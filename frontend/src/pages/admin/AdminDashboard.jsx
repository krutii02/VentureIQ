import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminAPI } from '../../services/api';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899', '#14b8a6'];

function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <motion.div className="stat-card" whileHover={{ y: -2 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 12 }}>
        {icon}
      </div>
      <div className="stat-value">
        {loading ? <span style={{ fontSize: '1rem', color: 'var(--clr-text-muted)' }}>—</span> : value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{sub}</div>}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError]               = useState(null);
  const [refreshing, setRefreshing]     = useState(false);


  const fetchStats = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(Array.isArray(res.data.users) ? res.data.users : []);
    } catch { /* silent */ }
    finally { setUsersLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const scoreDist  = stats?.score_dist    || [];
  const industries = stats?.industry_data || [];

  return (
    <DashboardLayout title="Admin Control Center" subtitle="Platform overview — live data">

      {/* Error Banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--r-md)', marginBottom: 20, color: '#ef4444', fontSize: '0.85rem',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Refresh */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={() => { fetchStats(true); fetchUsers(); }}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 'var(--r-md)', fontSize: '0.78rem', fontWeight: 600,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            color: 'var(--clr-accent-1)', cursor: refreshing ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard loading={loading} icon="👥" label="Total Users"
          value={stats ? stats.total_users.toLocaleString() : '—'}
          sub={`${stats?.total_startups ?? '—'} startups · ${stats?.total_investors ?? '—'} investors`}
          color="rgba(99,102,241,0.15)" />
        <StatCard loading={loading} icon="🚀" label="Startups Listed"
          value={stats?.total_startups?.toLocaleString() ?? '—'}
          sub="Active on platform"
          color="rgba(16,185,129,0.15)" />
        <StatCard loading={loading} icon="💼" label="Investors Listed"
          value={stats?.total_investors?.toLocaleString() ?? '—'}
          sub="VCs & Angel Investors"
          color="rgba(139,92,246,0.15)" />
        <StatCard loading={loading} icon="⭐" label="Avg Startup Score"
          value={stats ? `${stats.avg_score}%` : '—'}
          sub="AI evaluation average"
          color="rgba(245,158,11,0.15)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Score Distribution */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.9rem' }}>AI Score Distribution</h3>
          {loading ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>Loading chart…</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoreDist.filter(d => d.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="range" stroke="var(--clr-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--clr-text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: '0.8rem' }} />
                <Bar dataKey="count" name="Startups" radius={[4, 4, 0, 0]}>
                  {scoreDist.map((_, i) => <Cell key={i} fill={`hsl(${240 + i * 15},70%,${55 + i * 5}%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Industry Breakdown */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>Startups by Industry</h3>
          {loading ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>Loading chart…</div>
          ) : industries.length === 0 ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>No startup data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={industries} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {industries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginTop: 4 }}>
                {industries.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent User Activity */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recent User Activity</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              {usersLoading ? 'Loading…' : `Showing recent platform signups and logins`}
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={usersLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 'var(--r-md)', fontSize: '0.78rem', fontWeight: 600,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              color: 'var(--clr-success)', cursor: usersLoading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={12} style={{ animation: usersLoading ? 'spin 0.7s linear infinite' : 'none' }} />
            Reload
          </button>
        </div>

        {usersLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⏳</div>
            <p style={{ fontSize: '0.82rem' }}>Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
            <Users size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ fontSize: '0.82rem' }}>No users registered yet</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr><th>User</th><th>Role</th><th>Company / Firm</th><th>Joined</th><th>Last Active</th><th>Activity</th><th>Status</th></tr>
              </thead>
              <tbody>
                {users.slice(0, 8).map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className="avatar avatar-sm"
                          style={{
                            background: u.role === 'FOUNDER'
                              ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                              : 'linear-gradient(135deg,#10b981,#06b6d4)',
                            fontSize: '0.7rem',
                          }}
                        >
                          {(u.name || '??').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'FOUNDER' ? 'badge-purple' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>{u.company || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>{u.joined}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-accent-1)', fontWeight: 600 }}>{u.last_active_formatted || u.last_login || u.joined}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)' }}>
                      {u.role === 'FOUNDER'
                        ? `${u.startup_count} startup${u.startup_count !== 1 ? 's' : ''}`
                        : `${u.meeting_count} meeting${u.meeting_count !== 1 ? 's' : ''}`}
                    </td>
                    <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-warning'}`}>{u.is_active ? 'active' : 'inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}

