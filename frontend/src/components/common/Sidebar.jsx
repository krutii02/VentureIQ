import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Rocket, Brain, TrendingUp,
  Wand2, Users, Search, Calculator, GitCompare, Bookmark,
  Shield, UserCheck, Settings, LogOut, ChevronDown, Bell,
  BarChart3, Video, Handshake, UserCircle, Inbox,
  Clock, CheckCircle, XCircle, MessageSquare, Send,
  ChevronUp, Building2, Mail, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { startupsAPI } from '../../services/api';
import { getOpenedMeetingIds, isMeetingOpened, markMeetingAsOpened } from '../../services/unreadTracker';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const FOUNDER_NAV = [
  { label: 'Dashboard',        to: '/founder/dashboard',       icon: LayoutDashboard },
  { label: 'My Startup',       to: '/founder/startup',          icon: Rocket },
  { label: 'AI Analysis',      to: '/founder/ai-analysis',      icon: Brain },
  { label: 'Analytics',        to: '/founder/analytics',        icon: TrendingUp },
  { label: 'AI Video',         to: '/founder/ai-video',         icon: Video },
  { label: 'Bonus Tools',      to: '/founder/bonus-tools',      icon: Wand2 },
  { label: 'Investor Match',   to: '/founder/investor-match',   icon: Handshake },
  { label: 'Connections',      to: '/founder/meetings',         icon: Inbox,    badge: 'MEETINGS_COUNT' },
  { label: 'Settings',         to: '/founder/settings',         icon: Settings },
];

const INVESTOR_NAV = [
  { label: 'Dashboard',         to: '/investor/dashboard',        icon: LayoutDashboard },
  { label: 'Discover',          to: '/investor/discover',         icon: Search },
  { label: 'My Profile',        to: '/investor/my-profile',       icon: UserCircle },
  { label: 'Investment Tools',  to: '/investor/investment-tools', icon: Calculator },
  { label: 'Compare',           to: '/investor/compare',          icon: GitCompare },
  { label: 'Watchlist',         to: '/investor/watchlist',        icon: Bookmark,  badge: 'WATCHLIST_COUNT' },
  { label: 'Connections',       to: '/investor/meetings',         icon: MessageSquare, badge: 'MEETINGS_SENT_COUNT' },
  { label: 'Settings',          to: '/investor/settings',         icon: Settings },
];

const ADMIN_NAV = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users',     to: '/admin/users',     icon: Users },
  { label: 'Settings',  to: '/admin/settings',  icon: Settings },
];

const NAV_MAP   = { FOUNDER: FOUNDER_NAV,    INVESTOR: INVESTOR_NAV, ADMIN: ADMIN_NAV };
const ROLE_LABEL = { FOUNDER: 'Founder Workspace', INVESTOR: 'Investor Hub', ADMIN: 'Admin Control' };

/* ── Status helpers ───────────────────────────────── */
const STATUS_CFG = {
  Pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.13)',  Icon: Clock,       label: 'Pending'  },
  Accepted: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle, label: 'Accepted' },
  Declined: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  Icon: XCircle,     label: 'Declined' },
};

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

const PALETTE = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];
function avatarColor(id) { return PALETTE[(parseInt(id, 10) || 0) % PALETTE.length]; }

/* ══════════════════════════════════════════════════
   MEETING PANEL (shared component)
══════════════════════════════════════════════════ */
function MeetingPanel({ role, onClose }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [replyMap, setReplyMap] = useState({});   // { [id]: text }
  const [saving, setSaving]     = useState(null); // id being saved
  const [filter, setFilter]     = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = role === 'FOUNDER'
        ? await startupsAPI.getMeetings()
        : await startupsAPI.getMeetingsSent();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, newStatus) => {
    setSaving(id);
    try {
      await startupsAPI.updateMeeting(id, newStatus);
      setItems(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success(`Request ${newStatus.toLowerCase()}`);
    } catch { toast.error('Update failed'); }
    finally { setSaving(null); }
  };

  const handleReply = async (id) => {
    const text = (replyMap[id] || '').trim();
    if (!text) { toast.error('Reply cannot be empty'); return; }
    setSaving(id);
    try {
      await startupsAPI.replyToMeeting(id, text);
      setItems(prev => prev.map(r =>
        r.id === id ? { ...r, founder_reply: text, status: r.status === 'Pending' ? 'Accepted' : r.status } : r
      ));
      setReplyMap(prev => ({ ...prev, [id]: '' }));
      toast.success('Reply sent!');
    } catch { toast.error('Failed to send reply'); }
    finally { setSaving(null); }
  };

  const filtered = filter === 'All' ? items : items.filter(i => i.status === filter);

  const filterColors = {
    All:      '#6366f1',
    Pending:  '#f59e0b',
    Accepted: '#10b981',
    Declined: '#ef4444',
  };

  const counts = {
    All:      items.length,
    Pending:  items.filter(i => i.status === 'Pending').length,
    Accepted: items.filter(i => i.status === 'Accepted').length,
    Declined: items.filter(i => i.status === 'Declined').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: 232,
        top: 0,
        bottom: 0,
        width: 360,
        zIndex: 900,
        background: 'var(--clr-bg-card)',
        borderRight: '1px solid var(--clr-border)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel Header */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid var(--clr-border)',
        background: role === 'FOUNDER'
          ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))'
          : 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(6,182,212,0.05))',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {role === 'FOUNDER'
              ? <Inbox size={16} style={{ color: '#6366f1' }} />
              : <MessageSquare size={16} style={{ color: '#10b981' }} />
            }
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-text)' }}>
              {role === 'FOUNDER' ? 'Incoming Requests' : 'Sent Meetings'}
            </span>
            {counts.Pending > 0 && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                background: '#f59e0b', color: '#fff',
              }}>
                {counts.Pending} new
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={load}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: 4 }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: 4 }}
              title="Close panel"
            >
              <XCircle size={15} />
            </button>
          </div>
        </div>

        {/* Mini filters */}
        <div style={{ display: 'flex', gap: 5 }}>
          {['All', 'Pending', 'Accepted', 'Declined'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '3px 9px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                border: filter === f ? `1px solid ${filterColors[f]}55` : '1px solid var(--clr-border)',
                background: filter === f ? `${filterColors[f]}18` : 'transparent',
                color: filter === f ? filterColors[f] : 'var(--clr-text-muted)',
                cursor: 'pointer',
              }}
            >
              {f} {counts[f] > 0 && <span style={{ opacity: 0.7 }}>({counts[f]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⏳</div>
            <p style={{ fontSize: '0.82rem' }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
            <Inbox size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
            <p style={{ fontSize: '0.82rem' }}>
              {filter === 'All'
                ? role === 'FOUNDER' ? 'No connections yet' : 'No meetings sent yet'
                : `No ${filter.toLowerCase()} requests`}
            </p>
          </div>
        ) : (
          filtered.map(item => {
            const cfg = STATUS_CFG[item.status] || STATUS_CFG.Pending;
            const StatusIcon = cfg.Icon;
            const isBusy = saving === item.id;
            const unopened = !isMeetingOpened(item.id);

            return (
              <div
                key={item.id}
                onClick={() => markMeetingAsOpened(item.id)}
                style={{
                  background: 'var(--clr-bg-secondary)',
                  border: `1px solid ${item.status === 'Pending' ? 'rgba(245,158,11,0.2)' : item.status === 'Accepted' ? 'rgba(16,185,129,0.15)' : 'var(--clr-border)'}`,
                  borderRadius: 'var(--r-md)',
                  padding: '12px 13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  position: 'relative',
                }}
              >
                {/* Item header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${avatarColor(item.id)}, ${avatarColor(item.id + 2)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                  }}>
                    {role === 'FOUNDER' ? initials(item.investor_name) : initials(item.startup)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--clr-text)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {role === 'FOUNDER' ? (item.investor_name || 'Investor') : item.startup}
                      {unopened && (
                        <span className="unread-green-dot" title="Unopened message" />
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                      {role === 'FOUNDER'
                        ? (item.firm || 'Independent VC')
                        : `${item.startup_industry || ''} · ${item.startup_stage || ''}`}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                    background: cfg.bg, color: cfg.color,
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    <StatusIcon size={9} /> {cfg.label}
                  </span>
                </div>

                {/* Message */}
                {item.message && (
                  <div style={{
                    fontSize: '0.78rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5,
                    padding: '8px 10px', borderRadius: 6,
                    background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.08)',
                  }}>
                    {item.message.length > 120 ? item.message.slice(0, 117) + '…' : item.message}
                  </div>
                )}

                {/* Founder Reply (for investor view) */}
                {role === 'INVESTOR' && item.founder_reply && (
                  <div style={{
                    fontSize: '0.78rem', color: 'var(--clr-text)', lineHeight: 1.5,
                    padding: '8px 10px', borderRadius: 6,
                    background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)',
                    position: 'relative',
                  }}>
                    <div style={{
                      fontSize: '0.62rem', fontWeight: 700, color: '#10b981', marginBottom: 4,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      💬 Founder's Reply
                    </div>
                    {item.founder_reply.length > 120 ? item.founder_reply.slice(0, 117) + '…' : item.founder_reply}
                  </div>
                )}

                {/* No reply yet (investor) */}
                {role === 'INVESTOR' && !item.founder_reply && (
                  <div style={{
                    fontSize: '0.75rem', color: 'var(--clr-text-muted)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Clock size={11} style={{ color: '#f59e0b' }} />
                    Awaiting founder's reply…
                  </div>
                )}

                {/* Founder: Actions + Reply */}
                {role === 'FOUNDER' && (
                  <>
                    {/* Quick actions */}
                    {item.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleAction(item.id, 'Accepted')}
                          disabled={isBusy}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                            border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)',
                            color: '#10b981', cursor: isBusy ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          }}
                        >
                          <CheckCircle size={11} /> Accept
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'Declined')}
                          disabled={isBusy}
                          style={{
                            flex: 1, padding: '5px 0', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                            border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)',
                            color: '#ef4444', cursor: isBusy ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          }}
                        >
                          <XCircle size={11} /> Decline
                        </button>
                      </div>
                    )}

                    {/* Show existing reply */}
                    {item.founder_reply && (
                      <div style={{
                        fontSize: '0.77rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5,
                        padding: '7px 9px', borderRadius: 6,
                        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)',
                      }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your reply</div>
                        {item.founder_reply}
                      </div>
                    )}

                    {/* Reply input */}
                    <textarea
                      rows={2}
                      placeholder={item.founder_reply ? 'Update your reply…' : 'Write a reply to this investor…'}
                      value={replyMap[item.id] || ''}
                      onChange={e => setReplyMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                      style={{
                        width: '100%', resize: 'none', padding: '7px 9px',
                        borderRadius: 6, border: '1px solid var(--clr-border)',
                        background: 'var(--clr-bg-card)', color: 'var(--clr-text)',
                        fontSize: '0.78rem', lineHeight: 1.45, outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => handleReply(item.id)}
                      disabled={isBusy || !(replyMap[item.id] || '').trim()}
                      style={{
                        padding: '6px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                        background: isBusy || !(replyMap[item.id] || '').trim()
                          ? 'rgba(255,255,255,0.04)'
                          : 'var(--clr-accent-1)',
                        color: isBusy || !(replyMap[item.id] || '').trim()
                          ? 'var(--clr-text-muted)'
                          : '#fff',
                        border: 'none', cursor: isBusy || !(replyMap[item.id] || '').trim() ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Send size={11} /> {isBusy ? 'Sending…' : 'Send Reply'}
                    </button>
                  </>
                )}

                {/* Time */}
                <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', textAlign: 'right' }}>
                  {item.time}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--clr-border)', flexShrink: 0 }}>
        <NavLink
          to={role === 'FOUNDER' ? '/founder/meetings' : '/investor/meetings'}
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--clr-accent-1)', background: 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.15)', textDecoration: 'none',
            transition: 'background 0.15s',
          }}
        >
          <ArrowUpRight size={14} />
          View Full {role === 'FOUNDER' ? 'Inbox' : 'Meetings Page'}
        </NavLink>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════ */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = NAV_MAP[user?.role] || [];

  /* ── Live watchlist count ─────────────────────────── */
  const getWatchlistCount = () => {
    try {
      const stored = localStorage.getItem('ventureiq_bookmarks');
      const arr = stored ? JSON.parse(stored) : [3, 10, 13];
      return Array.isArray(arr) ? arr.length : 0;
    } catch { return 0; }
  };

  const [watchlistCount, setWatchlistCount]       = useState(getWatchlistCount);
  const [meetingsCount, setMeetingsCount]         = useState(0);
  const [meetingsSentCount, setMeetingsSentCount] = useState(0);
  const [hasUnreadConnections, setHasUnreadConnections] = useState(false);

  useEffect(() => {
    const sync = () => setWatchlistCount(getWatchlistCount());
    window.addEventListener('storage', sync);
    window.addEventListener('ventureiq_bookmarks_changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ventureiq_bookmarks_changed', sync);
    };
  }, []);

  /* ── Live meeting counts & unread check ─────────────────────────── */
  const checkUnreadConnections = useCallback(async () => {
    if (!user?.role) return;
    try {
      const openedSet = getOpenedMeetingIds();
      let items = [];
      if (user.role === 'FOUNDER') {
        const res = await startupsAPI.getMeetings();
        items = Array.isArray(res.data) ? res.data : [];
      } else if (user.role === 'INVESTOR') {
        const res = await startupsAPI.getMeetingsSent();
        items = Array.isArray(res.data) ? res.data : [];
      }
      const hasUnread = items.some(m => !openedSet.has(String(m.id)));
      setHasUnreadConnections(hasUnread);
    } catch { /* silent */ }
  }, [user?.role]);

  useEffect(() => {
    if (!user?.role) return;
    const fetchCounts = async () => {
      try {
        if (user.role === 'FOUNDER') {
          const res = await startupsAPI.getMeetings();
          const data = Array.isArray(res.data) ? res.data : [];
          setMeetingsCount(data.filter(m => m.status === 'Pending').length);
        } else if (user.role === 'INVESTOR') {
          const res = await startupsAPI.getMeetingsSent();
          const data = Array.isArray(res.data) ? res.data : [];
          setMeetingsSentCount(data.filter(m => m.founder_reply).length);
        }
      } catch { /* silent */ }
    };
    fetchCounts();
    checkUnreadConnections();

    window.addEventListener('storage', checkUnreadConnections);
    window.addEventListener('ventureiq_opened_meetings_changed', checkUnreadConnections);
    window.addEventListener('ventureiq_notification_added', checkUnreadConnections);

    const interval = setInterval(() => {
      fetchCounts();
      checkUnreadConnections();
    }, 15000); // refresh every 15s

    return () => {
      window.removeEventListener('storage', checkUnreadConnections);
      window.removeEventListener('ventureiq_opened_meetings_changed', checkUnreadConnections);
      window.removeEventListener('ventureiq_notification_added', checkUnreadConnections);
      clearInterval(interval);
    };
  }, [user?.role, checkUnreadConnections]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = {
    FOUNDER:  'var(--clr-accent-1)',
    INVESTOR: 'var(--clr-success)',
    ADMIN:    'var(--clr-warning)',
  }[user?.role];

  const getBadgeValue = (badge) => {
    if (badge === 'WATCHLIST_COUNT')     return watchlistCount;
    if (badge === 'MEETINGS_COUNT')      return meetingsCount;
    if (badge === 'MEETINGS_SENT_COUNT') return meetingsSentCount;
    return badge;
  };

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">V</div>
          <div>
            <div className="sidebar-logo-text">Venture<span>IQ</span></div>
            <div style={{ fontSize:'0.65rem', color:'var(--clr-text-muted)', fontWeight:600, letterSpacing:'0.08em' }}>
              {ROLE_LABEL[user?.role]}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(item => {
            const badgeVal = item.badge ? getBadgeValue(item.badge) : null;
            const isConnectionsTab = item.label === 'Connections';
            const showGreenDot = isConnectionsTab && hasUnreadConnections;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <item.icon className="link-icon" strokeWidth={1.8} />
                <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.label}
                  {showGreenDot && (
                    <span
                      className="unread-green-dot"
                      title="Unopened connection message"
                    />
                  )}
                </span>
                {item.badge && badgeVal > 0 && (
                  <span className="link-badge" style={{
                    background: item.badge === 'MEETINGS_COUNT' || item.badge === 'MEETINGS_SENT_COUNT'
                      ? '#f59e0b' : undefined,
                    color: item.badge === 'MEETINGS_COUNT' || item.badge === 'MEETINGS_SENT_COUNT'
                      ? '#fff' : undefined,
                  }}>{badgeVal}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="avatar" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}88)` }}>
              {user?.avatar}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--clr-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.company || user?.firm || (user?.role === 'FOUNDER' ? 'My Startup' : 'VentureIQ Investor')}
              </div>
              <div style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
                {user?.name} ({user?.role === 'FOUNDER' ? 'Founder' : 'Investor'})
              </div>
            </div>
            <ChevronDown size={14} color="var(--clr-text-muted)" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
          </div>
          {userMenuOpen && (
            <div style={{ marginTop:6, padding:'4px 0', background:'var(--clr-bg-card)', borderRadius:'var(--r-md)', border:'1px solid var(--clr-border)', overflow:'hidden' }}>
              <button className="sidebar-link btn-ghost" style={{ width:'100%', justifyContent:'flex-start', borderRadius:0, border:'none', color:'var(--clr-danger)' }} onClick={handleLogout}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
