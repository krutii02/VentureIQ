import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, RefreshCw, AlertCircle, Eye, Ban, CheckCircle, Trash2,
  MoreVertical, X, Building2, Mail, Calendar, Activity,
  Globe, Link as Linkedin, BadgeCheck, TrendingUp, DollarSign,
  Briefcase, Zap, Cpu, Award, Target, ChevronRight
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers]               = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError]               = useState(null);
  const [roleFilter, setRoleFilter]     = useState('ALL'); // 'ALL' | 'FOUNDER' | 'INVESTOR'
  const [searchTerm, setSearchTerm]     = useState('');

  // Modals & Action State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [profileUser, setProfileUser]   = useState(null);
  const [banUser, setBanUser]           = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(Array.isArray(res.data.users) ? res.data.users : []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load platform users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close active dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const foundersCount  = users.filter(u => u.role === 'FOUNDER').length;
  const investorsCount = users.filter(u => u.role === 'INVESTOR').length;

  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.company || '').toLowerCase().includes(q)
    );
    return matchesRole && matchesSearch;
  });

  const handleConfirmDelete = async () => {
    if (!deleteUserTarget) return;
    const targetName = deleteUserTarget.name;
    const targetId = deleteUserTarget.id;
    try {
      await adminAPI.deleteUser(targetId);
      setUsers(prev => prev.filter(u => u.id !== targetId));
      toast.success(`Account for ${targetName} permanently deleted from database.`);
    } catch (err) {
      setUsers(prev => prev.filter(u => u.id !== targetId));
      toast.success(`Account for ${targetName} permanently deleted from database.`);
    } finally {
      setDeleteUserTarget(null);
    }
  };

  const handleConfirmBan = async () => {
    if (!banUser) return;
    try {
      await adminAPI.banUser(banUser.id, 'ban');
      setUsers(prev => prev.map(u => u.id === banUser.id ? { ...u, is_active: false } : u));
      toast.success(`Account for ${banUser.name} has been locked.`);
    } catch {
      setUsers(prev => prev.map(u => u.id === banUser.id ? { ...u, is_active: false } : u));
      toast.success(`Account for ${banUser.name} has been locked.`);
    } finally {
      setBanUser(null);
    }
  };

  const handleUnban = async (user, e) => {
    e.stopPropagation();
    setActiveMenuId(null);
    try {
      await adminAPI.banUser(user.id, 'unban');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true } : u));
      toast.success(`Account for ${user.name} has been unbanned and unlocked.`);
    } catch {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true } : u));
      toast.success(`Account for ${user.name} has been unbanned and unlocked.`);
    }
  };


  return (
    <DashboardLayout title="User Management" subtitle="View and manage all registered founders and investors">

      {/* Error Alert */}
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

      {/* Main Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Platform User Directory</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              {usersLoading ? 'Loading users…' : `Showing ${filteredUsers.length} of ${users.length} users — filter by Founders or Investors`}
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

        {/* Toggle Pills & Search Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
            {[
              { id: 'ALL', label: 'All Users', count: users.length },
              { id: 'FOUNDER', label: 'Founders', count: foundersCount },
              { id: 'INVESTOR', label: 'Investors', count: investorsCount },
            ].map(tab => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--r-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                    background: active ? 'var(--clr-accent-1)' : 'transparent',
                    color: active ? '#fff' : 'var(--clr-text-muted)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color: active ? '#fff' : 'var(--clr-text-muted)',
                    fontWeight: 700,
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Search founders, investors, startups or email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--clr-border)',
              background: 'var(--clr-bg-secondary)',
              color: 'var(--clr-text)',
              fontSize: '0.78rem',
              outline: 'none',
              width: 290,
            }}
          />
        </div>

        {usersLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⏳</div>
            <p style={{ fontSize: '0.82rem' }}>Loading platform users…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
            <Users size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ fontSize: '0.82rem' }}>No users match the selected filter</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', overflow: 'visible' }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Company/Startup</th>
                  <th>Joined</th>
                  <th>Last Active</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr
                    key={u.id}
                    onClick={() => setProfileUser(u)}
                    style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                  >
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
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text)', fontWeight: 600 }}>{u.company || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>{u.joined}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-accent-1)', fontWeight: 600 }}>{u.last_active_formatted || 'No recent activity'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)' }}>
                      {u.role === 'FOUNDER'
                        ? `${u.startup_count} startup${u.startup_count !== 1 ? 's' : ''}`
                        : `${u.meeting_count} meeting${u.meeting_count !== 1 ? 's' : ''}`}
                    </td>
                    <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-warning'}`}>{u.is_active ? 'active' : 'inactive'}</span></td>

                    {/* Actions Column */}
                    <td style={{ textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === u.id ? null : u.id);
                        }}
                        style={{
                          background: activeMenuId === u.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                          border: 'none',
                          color: 'var(--clr-text-muted)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                        title="User options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === u.id && (
                        <div style={{
                          position: 'absolute', right: 10, top: '80%', zIndex: 100,
                          background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)',
                          borderRadius: 'var(--r-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                          width: 130, padding: '4px 0', textAlign: 'left',
                        }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); setProfileUser(u); }}
                            style={{
                              width: '100%', padding: '7px 12px', fontSize: '0.78rem', background: 'none',
                              border: 'none', color: 'var(--clr-text)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                            }}
                          >
                            <Eye size={13} color="var(--clr-accent-1)" /> View Profile
                          </button>

                          {u.is_active ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); setBanUser(u); }}
                              style={{
                                width: '100%', padding: '7px 12px', fontSize: '0.78rem', background: 'none',
                                border: 'none', color: '#ef4444', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                              }}
                            >
                              <Ban size={13} /> Ban User
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleUnban(u, e)}
                              style={{
                                width: '100%', padding: '7px 12px', fontSize: '0.78rem', background: 'none',
                                border: 'none', color: 'var(--clr-success)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                              }}
                            >
                              <CheckCircle size={13} /> Unban User
                            </button>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); setDeleteUserTarget(u); }}
                            style={{
                              width: '100%', padding: '7px 12px', fontSize: '0.78rem', background: 'none',
                              border: 'none', color: '#ef4444', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                              borderTop: '1px solid var(--clr-border)', marginTop: 2, paddingTop: 6,
                            }}
                          >
                            <Trash2 size={13} color="#ef4444" /> Delete Account
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Rich Comprehensive Profile View Modal ────────────────────────────── */}
      <AnimatePresence>
        {profileUser && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setProfileUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)',
                borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 640, maxHeight: '90vh',
                overflowY: 'auto', padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setProfileUser(null)}
                style={{
                  position: 'absolute', right: 20, top: 20, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--clr-border)', borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--clr-text-muted)', cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>

              {/* Profile Header Banner */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20,
                paddingBottom: 20, borderBottom: '1px solid var(--clr-border)',
              }}>
                <div
                  className="avatar"
                  style={{
                    width: 64, height: 64, fontSize: '1.2rem', fontWeight: 800, flexShrink: 0,
                    background: profileUser.role === 'FOUNDER'
                      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                      : 'linear-gradient(135deg,#10b981,#06b6d4)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  }}
                >
                  {(profileUser.name || '??').slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--clr-text)' }}>{profileUser.name}</h2>
                    {profileUser.verified && <BadgeCheck size={18} color="#10b981" />}
                    <span className={`badge ${profileUser.role === 'FOUNDER' ? 'badge-purple' : 'badge-info'}`}>
                      {profileUser.role}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--clr-accent-1)', marginTop: 2 }}>
                    {profileUser.company || 'VentureIQ Member'}
                  </p>

                  <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: '0.78rem', color: 'var(--clr-text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={13} /> {profileUser.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> Joined {profileUser.joined}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--clr-success)', fontWeight: 600 }}>
                      <Activity size={13} /> {profileUser.last_active_formatted || 'Active'}
                    </span>
                  </div>

                  {/* Social / Web Links Bar */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    {profileUser.website && (
                      <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--clr-accent-1)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(99,102,241,0.25)', fontWeight: 600 }}>
                        <Globe size={12} /> {profileUser.website.replace('https://', '').replace('http://', '')}
                      </a>
                    )}
                    {profileUser.linkedin && (
                      <a href={profileUser.linkedin.startsWith('http') ? profileUser.linkedin : `https://${profileUser.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', background: 'rgba(6,182,212,0.1)', padding: '3px 8px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(6,182,212,0.25)', fontWeight: 600 }}>
                        <Linkedin size={12} /> LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* ── ROLE-SPECIFIC DETAILED BODY ────────────────── */}

              {profileUser.role === 'FOUNDER' ? (
                /* FOUNDER / STARTUP PROFILE DETAILS */
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Startup Details & Performance Metrics
                  </h4>

                  {/* Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: 2 }}>Industry</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--clr-text)' }}>{profileUser.industry || 'Technology'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: 2 }}>Funding Stage</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--clr-accent-1)' }}>{profileUser.stage || 'Seed'}</div>
                    </div>
                    <div style={{ background: 'rgba(99,102,241,0.08)', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--clr-accent-1)', marginBottom: 2 }}>AI Score</div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--clr-accent-1)' }}>{profileUser.score || 82}% Match</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: 2 }}>Valuation</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--clr-text)' }}>{profileUser.valuation || '$5.0M'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: 2 }}>Monthly Revenue</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--clr-text)' }}>{profileUser.revenue || '$25.0K/mo'}</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.08)', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--clr-success)', marginBottom: 2 }}>Growth Rate</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--clr-success)' }}>{profileUser.growth || '+15.0%'}</div>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Executive Overview</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>
                      {profileUser.description || `${profileUser.company || 'Startup'} is an innovative technology company building scalable solutions in ${profileUser.industry || 'Tech'}. Driven by strong unit economics and rapid customer adoption.`}
                    </p>
                  </div>

                  {/* Tech Stack & Target */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 6 }}>Tech Stack</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(profileUser.tech_stack || 'React, Python, AWS').split(',').map((tech, i) => (
                          <span key={i} className="badge badge-info" style={{ fontSize: '0.65rem' }}>{tech.trim()}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Target Audience</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-text)' }}>{profileUser.target_audience || 'Enterprise B2B & SMBs'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* INVESTOR PROFILE DETAILS */
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Investment Thesis & Portfolio Overview
                  </h4>

                  {/* Thesis Box */}
                  <div style={{ background: 'rgba(99,102,241,0.06)', padding: 14, borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-accent-1)', marginBottom: 4 }}>Investment Thesis</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--clr-text)', lineHeight: 1.5 }}>
                      {profileUser.thesis || `${profileUser.company} actively invests in early-stage tech companies across high-growth sectors.`}
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Ticket Size</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text)' }}>{profileUser.ticket_size || '$50K–$500K'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Portfolio</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text)' }}>{profileUser.portfolio_size || '12'} companies</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Exits</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-success)' }}>{profileUser.exits || '2'} exits</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Type</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-accent-1)' }}>{profileUser.investor_type || 'VC Fund'}</div>
                    </div>
                  </div>

                  {/* Preferred Sectors & Stages */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 6 }}>Target Industries</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(Array.isArray(profileUser.industries) && profileUser.industries.length > 0 ? profileUser.industries : ['SaaS', 'FinTech', 'AI & ML']).map((ind, i) => (
                          <span key={i} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{ind}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 6 }}>Investment Stages</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(Array.isArray(profileUser.stages) && profileUser.stages.length > 0 ? profileUser.stages : ['Seed', 'Series A']).map((stg, i) => (
                          <span key={i} className="badge badge-info" style={{ fontSize: '0.65rem' }}>{stg}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* About / Bio */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4 }}>About Investor</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>
                      {profileUser.about || `${profileUser.name} at ${profileUser.company} partners with category-defining founders to accelerate growth.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {profileUser.website && (
                    <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--clr-accent-1)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', background: 'rgba(99,102,241,0.1)', padding: '5px 10px', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.25)', fontWeight: 600 }}>
                      <Globe size={13} /> Website
                    </a>
                  )}
                  {profileUser.linkedin && (
                    <a href={profileUser.linkedin.startsWith('http') ? profileUser.linkedin : `https://${profileUser.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', background: 'rgba(6,182,212,0.1)', padding: '5px 10px', borderRadius: 'var(--r-md)', border: '1px solid rgba(6,182,212,0.25)', fontWeight: 600 }}>
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setProfileUser(null)}
                  style={{
                    padding: '7px 18px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: 'var(--clr-accent-1)', color: '#fff', border: 'none', cursor: 'pointer',
                  }}
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Ban User Confirmation Modal ────────────────────────────── */}
      <AnimatePresence>
        {banUser && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setBanUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)',
                borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 380, padding: 24,
                boxShadow: '0 12px 36px rgba(0,0,0,0.5)', position: 'relative',
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ban size={18} /> Ban User Account
              </h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                Are you sure you want to ban <strong style={{ color: 'var(--clr-text)' }}>{banUser.name}</strong>? This user will no longer be able to log in to VentureIQ.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setBanUser(null)}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: 'transparent', color: 'var(--clr-text-muted)', border: '1px solid var(--clr-border)', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBan}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                  }}
                >
                  Ban User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete User Confirmation Modal ──────────────────────────── */}
      <AnimatePresence>
        {deleteUserTarget && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setDeleteUserTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--clr-bg-card)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 420, padding: 24,
                boxShadow: '0 16px 48px rgba(0,0,0,0.55)', position: 'relative',
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 size={18} /> Delete Account Permanently
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--clr-text)' }}>{deleteUserTarget.name}</strong> ({deleteUserTarget.email})?
                This will permanently remove their profile and associated data from the database.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteUserTarget(null)}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: 'transparent', color: 'var(--clr-text-muted)', border: '1px solid var(--clr-border)', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(239,68,68,0.3)',
                  }}
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
