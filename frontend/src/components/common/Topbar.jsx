import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Moon, Sun, X, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { startupsAPI } from '../../services/api';
import { markMeetingAsOpened } from '../../services/unreadTracker';
import toast from 'react-hot-toast';

const FOUNDER_PAGES = [
  { label: 'Dashboard', path: '/founder/dashboard', keywords: 'home overview stats' },
  { label: 'My Startup', path: '/founder/startup', keywords: 'startup profile manage' },
  { label: 'AI Analysis', path: '/founder/ai-analysis', keywords: 'ml prediction swot ai analysis' },
  { label: 'Analytics', path: '/founder/analytics', keywords: 'charts data analytics metrics' },
  { label: 'Documents', path: '/founder/documents', keywords: 'documents reports predictions ml' },
  { label: 'Bonus Tools', path: '/founder/bonus-tools', keywords: 'tagline email name generator' },
];

const INVESTOR_PAGES = [
  { label: 'Dashboard', path: '/investor/dashboard', keywords: 'home overview stats' },
  { label: 'Discover Startups', path: '/investor/discover', keywords: 'search find startups explore' },
  { label: 'Investment Tools', path: '/investor/investment-tools', keywords: 'roi calculator breakeven tools' },
  { label: 'Compare', path: '/investor/compare', keywords: 'compare startups side by side' },
  { label: 'Watchlist', path: '/investor/watchlist', keywords: 'watchlist bookmarks saved' },
];

const ADMIN_PAGES = [
  { label: 'Dashboard', path: '/admin/dashboard', keywords: 'admin home overview' },
];

const PAGE_MAP = { FOUNDER: FOUNDER_PAGES, INVESTOR: INVESTOR_PAGES, ADMIN: ADMIN_PAGES };

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, markRead, refresh } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const [showNotifs, setShowNotifs] = useState(false);

  const handleAcceptMeeting = async (id) => {
    markRead(id);
    const target = notifications.find(n => n.id === id);
    try {
      await startupsAPI.updateMeeting(id, 'Accepted');
      toast.success(`Accepted meeting request from ${target?.investor_name || 'Investor'}!`);
      refresh();
    } catch {
      toast.error('Failed to update meeting status');
    }
  };

  const handleDeclineMeeting = async (id) => {
    markRead(id);
    const target = notifications.find(n => n.id === id);
    try {
      await startupsAPI.updateMeeting(id, 'Declined');
      toast.error(`Declined meeting request from ${target?.investor_name || 'Investor'}`);
      refresh();
    } catch {
      toast.error('Failed to update meeting status');
    }
  };

  const pages = PAGE_MAP[user?.role] || [];

  const filtered = query.trim()
    ? pages.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.keywords.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setShowResults(false);
  };

  return (
    <header className="topbar">
      <div>
        <h1 style={{ fontSize:'1.1rem', fontWeight:700, lineHeight:1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize:'0.78rem', color:'var(--clr-text-muted)', marginTop:2 }}>{subtitle}</p>}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {/* Theme Toggle */}
        <button className="btn btn-icon btn-ghost" onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ position:'relative' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Dropdown */}
        <div style={{ position:'relative' }} ref={notifRef}>
          <button className="btn btn-icon btn-ghost" onClick={() => setShowNotifs(!showNotifs)} style={{ position:'relative' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position:'absolute', top:2, right:2,
                minWidth:16, height:16, borderRadius:'var(--r-full)',
                background:'var(--clr-danger)', border:'2px solid var(--clr-bg-primary)',
                color:'#fff', fontSize:'0.65rem', fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position:'absolute', top:'calc(100% + 8px)', right:0,
              width:360, background:'var(--clr-bg-card)', border:'1px solid var(--clr-border)',
              borderRadius:'var(--r-md)', boxShadow:'0 10px 30px rgba(0,0,0,0.4)',
              zIndex:300, overflow:'hidden'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--clr-border)', background:'rgba(255,255,255,0.02)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:'0.9rem', fontWeight:700 }}>Notifications</span>
                  {unreadCount > 0 && <span className="badge badge-danger" style={{ fontSize:'0.62rem' }}>{unreadCount} new</span>}
                </div>
                <button onClick={markAllRead} style={{ background:'none', border:'none', fontSize:'0.72rem', color:'var(--clr-accent-1)', cursor:'pointer', fontWeight:600 }}>
                  Mark read
                </button>
              </div>

              <div style={{ maxHeight:360, overflowY:'auto' }}>
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} style={{
                    padding:'12px 16px', borderBottom:'1px solid var(--clr-border)',
                    background: n.unread ? 'rgba(99,102,241,0.06)' : 'transparent',
                    display:'flex', gap:10, alignItems:'flex-start', transition:'background 0.15s'
                  }}>
                    <div style={{
                      width:34, height:34, borderRadius:'var(--r-sm)',
                      background: n.title.includes('Meeting') ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      color: n.title.includes('Meeting') ? 'var(--clr-success)' : '#6366f1',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'1rem'
                    }}>
                      {n.title.includes('Meeting') ? '📅' : (n.type === 'founder_email' ? '📧' : '👁️')}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                        <span style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--clr-text-primary)' }}>{n.title}</span>
                        <span style={{ fontSize:'0.68rem', color:'var(--clr-text-muted)' }}>{n.time}</span>
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'var(--clr-accent-1)', fontWeight:600, marginBottom:4 }}>
                        {n.firm} → {n.startup}
                      </div>
                      <p style={{ fontSize:'0.76rem', color:'var(--clr-text-secondary)', lineHeight:1.4, margin:0 }}>
                        "{n.message}"
                      </p>

                      {/* Interactive Choice Buttons for Founder on Meeting Requests */}
                      {user?.role !== 'INVESTOR' && (n.title.includes('Meeting') || n.type === 'meeting_request') && (
                        <div style={{ marginTop: 8 }}>
                          {n.status === 'Accepted' ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ✓ Meeting Accepted
                            </span>
                          ) : n.status === 'Declined' ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              ✕ Meeting Declined
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAcceptMeeting(n.id); }}
                                className="btn btn-sm"
                                style={{ padding: '3px 10px', fontSize: '0.72rem', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700 }}
                              >
                                ✓ Accept (Yes)
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeclineMeeting(n.id); }}
                                className="btn btn-sm"
                                style={{ padding: '3px 10px', fontSize: '0.72rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700 }}
                              >
                                ✕ Decline (No)
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status indicator for Investor */}
                      {user?.role === 'INVESTOR' && n.status && (
                        <div style={{ marginTop: 6 }}>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                            background: n.status === 'Accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: n.status === 'Accepted' ? '#10b981' : '#ef4444',
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            {n.status === 'Accepted' ? '✓ Accepted' : '✕ Declined'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div style={{ padding:'24px', textAlign:'center', color:'var(--clr-text-muted)', fontSize:'0.85rem' }}>
                    No notifications yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className="btn btn-icon btn-ghost"
          onClick={handleLogout}
          title="Sign out"
          style={{ color: 'var(--clr-danger)' }}
        >
          <LogOut size={18} />
        </button>

        {/* User avatar */}
        <div className="avatar avatar-sm" style={{ cursor:'pointer', background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {user?.avatar}
        </div>
      </div>
    </header>
  );
}
