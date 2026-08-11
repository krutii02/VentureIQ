import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle, XCircle, MessageSquare, Send,
  Building2, Rocket, TrendingUp, RefreshCw, Filter,
  Inbox, Sparkles, ChevronDown, ChevronUp, Mail, X, AtSign,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { startupsAPI } from '../../services/api';
import { isMeetingOpened, markMeetingAsOpened } from '../../services/unreadTracker';
import toast from 'react-hot-toast';

/* ── helpers ─────────────────────────────────────────────── */
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

const PALETTE = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
function avatarColor(id) { return PALETTE[(parseInt(id, 10) || 0) % PALETTE.length]; }

const STATUS_CFG = {
  Pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock,       label: 'Pending'  },
  Accepted: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle,  label: 'Accepted' },
  Declined: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle,      label: 'Declined' },
};

/* ── ChatBubble ─────────────────────────────────────────── */
function ChatBubble({ msg, myRole }) {
  const isMe = msg.sender_role === myRole;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        gap: 3,
      }}
    >
      {!isMe && (
        <span style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', marginLeft: 4 }}>
          {msg.sender_name}
        </span>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '9px 14px',
        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isMe
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'rgba(255,255,255,0.07)',
        border: isMe ? 'none' : '1px solid var(--clr-border)',
        color: isMe ? '#fff' : 'var(--clr-text)',
        fontSize: '0.85rem',
        lineHeight: 1.55,
        boxShadow: isMe ? '0 2px 12px rgba(16,185,129,0.35)' : 'none',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
      <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', marginRight: isMe ? 4 : 0, marginLeft: isMe ? 0 : 4 }}>
        {msg.created_at}
      </span>
    </motion.div>
  );
}

/* ── ChatPanel ──────────────────────────────────────────── */
function ChatPanel({ req, myRole }) {
  const [messages, setMessages]   = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await startupsAPI.getMessages(req.id);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silently ignore
    } finally {
      setLoadingMsgs(false);
    }
  }, [req.id]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setSending(true);
    // Optimistic update
    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_role: myRole,
      sender_name: 'You',
      content: text,
      created_at: 'just now',
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    try {
      const res = await startupsAPI.sendMessage(req.id, text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? res.data : m));
    } catch {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = !loadingMsgs && messages.length === 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 320,
      borderTop: '1px solid var(--clr-border)',
    }}>
      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        scrollbarWidth: 'thin',
      }}>
        {loadingMsgs ? (
          <div style={{ textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.82rem', marginTop: 60 }}>
            Loading conversation…
          </div>
        ) : isEmpty ? (
          <div style={{ textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.82rem', marginTop: 60 }}>
            <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>No messages yet — start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <ChatBubble key={msg.id} msg={msg} myRole={myRole} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose bar */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--clr-border)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        background: 'var(--clr-bg-secondary)',
      }}>
        <textarea
          rows={1}
          placeholder="Type a message… (Enter to send)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          style={{
            flex: 1,
            resize: 'none',
            padding: '9px 12px',
            borderRadius: 20,
            border: '1px solid var(--clr-border)',
            background: 'var(--clr-bg-card)',
            color: 'var(--clr-text)',
            fontSize: '0.85rem',
            lineHeight: 1.45,
            outline: 'none',
            maxHeight: 80,
            overflow: 'auto',
            fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = '#10b981'}
          onBlur={e => e.target.style.borderColor = 'var(--clr-border)'}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          title="Send"
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: input.trim()
              ? 'linear-gradient(135deg,#10b981,#059669)'
              : 'rgba(16,185,129,0.15)',
            border: 'none', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
            boxShadow: input.trim() ? '0 2px 10px rgba(16,185,129,0.4)' : 'none',
          }}
        >
          <Send size={16} color={input.trim() ? '#fff' : 'rgba(16,185,129,0.4)'} />
        </button>
      </div>
    </div>
  );
}

/* ── EmailComposerModal (Investor side) ──────────────────── */
function EmailComposerModal({ req, recipientEmail, recipientLabel, onClose }) {
  const [subject, setSubject] = useState(`Re: Meeting Request — ${req.startup || ''}`);
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) { toast.error('Subject cannot be empty'); return; }
    if (!body.trim())    { toast.error('Message body cannot be empty'); return; }
    setSending(true);
    try {
      await startupsAPI.sendEmail(req.id, subject.trim(), body.trim());
      toast.success(`Email sent to ${recipientEmail}!`);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return ReactDOM.createPortal(
    <div
      onClick={() => !sending && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'relative',
          width: 'min(520px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--clr-bg-card)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 18,
          padding: '26px 28px 22px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          zIndex: 9999,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#10b981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--clr-text)' }}>Compose Email</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>Sends directly to their email inbox</div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: 6, borderRadius: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* To: chip */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>TO</label>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '0.82rem', fontWeight: 500, color: 'var(--clr-text)',
          }}>
            <AtSign size={12} style={{ color: '#10b981' }} />
            <span style={{ color: '#10b981' }}>{recipientLabel}</span>
            <span style={{ color: 'var(--clr-text-muted)' }}>·</span>
            <span>{recipientEmail}</span>
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>SUBJECT</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject…"
            style={{
              width: '100%', padding: '9px 12px',
              borderRadius: 10, border: '1px solid var(--clr-border)',
              background: 'var(--clr-bg-secondary)', color: 'var(--clr-text)',
              fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = 'var(--clr-border)'}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', display: 'block', marginBottom: 6 }}>MESSAGE</label>
          <textarea
            rows={6}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message here…"
            autoFocus
            style={{
              width: '100%', resize: 'vertical', padding: '10px 12px',
              borderRadius: 10, border: '1px solid var(--clr-border)',
              background: 'var(--clr-bg-secondary)', color: 'var(--clr-text)',
              fontSize: '0.85rem', lineHeight: 1.55, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = '#10b981'}
            onBlur={e => e.target.style.borderColor = 'var(--clr-border)'}
          />
          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginTop: 4, textAlign: 'right' }}>{body.length} chars</div>
        </div>

        {/* Footer note */}
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
          fontSize: '0.74rem', color: 'var(--clr-text-muted)',
        }}>
          📧 This email will be sent via <strong style={{ color: 'var(--clr-text)' }}>VentureIQ</strong> and will appear directly in their email inbox.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={sending}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}
          >
            <Send size={13} />
            {sending ? 'Sending…' : 'Send Email'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* ── SentCard ───────────────────────────────────────────── */
function SentCard({ req }) {
  const [chatOpen, setChatOpen]   = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [opened, setOpened]       = useState(() => isMeetingOpened(req.id));

  const markOpened = () => {
    if (!opened) {
      setOpened(true);
      markMeetingAsOpened(req.id);
    }
  };

  const handleToggleChat = () => {
    markOpened();
    setChatOpen(v => !v);
  };

  const cfg = STATUS_CFG[req.status] || STATUS_CFG.Pending;
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
      onClick={markOpened}
      style={{
        background: 'var(--clr-bg-card)',
        border: `1px solid ${
          req.status === 'Accepted' ? 'rgba(16,185,129,0.25)'
          : req.status === 'Declined' ? 'rgba(239,68,68,0.18)'
          : 'var(--clr-border)'
        }`,
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        boxShadow: req.status === 'Accepted' ? '0 0 0 2px rgba(16,185,129,0.05)' : 'none',
        position: 'relative',
      }}
    >
      {/* Main Row */}
      <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Startup Avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${avatarColor(req.startup_id || req.id)}, ${avatarColor((req.startup_id || req.id) + 3)})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 700, color: '#fff',
          boxShadow: `0 2px 8px ${avatarColor(req.startup_id || req.id)}44`,
        }}>
          {initials(req.startup)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--clr-text)' }}>
              {req.startup}
            </span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: cfg.bg, color: cfg.color,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <StatusIcon size={10} /> {cfg.label}
            </span>
            {!opened && (
              <span className="unread-badge-pill" title="Unopened message">
                <span className="unread-green-dot" /> UNOPENED
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 5, flexWrap: 'wrap' }}>
            {req.founder_name && (
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--clr-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Rocket size={12} style={{ color: '#10b981' }} /> {req.founder_name} (Founder)
              </span>
            )}
            {req.startup_industry && (
              <span style={{ fontSize: '0.77rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={11} /> {req.startup_industry}
              </span>
            )}
            {req.startup_stage && (
              <span style={{ fontSize: '0.77rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={11} /> {req.startup_stage}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={handleToggleChat}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: 4, flexShrink: 0 }}
          title={chatOpen ? 'Close chat' : 'Open chat'}
        >
          {chatOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Original pitch message */}
      {req.message && (
        <div style={{ padding: '0 22px 14px' }}>
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--r-md)',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
            fontSize: '0.83rem', color: 'var(--clr-text-secondary)', lineHeight: 1.55,
          }}>
            <span style={{ fontWeight: 600, color: 'var(--clr-text)', marginRight: 6 }}>Message:</span>
            {req.message}
          </div>
        </div>
      )}

      {/* Message button + Email button */}
      <div style={{ padding: '0 22px 16px', display: 'flex', gap: 8 }}>
        <button
          className={chatOpen ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
          onClick={handleToggleChat}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            ...(chatOpen ? {
              background: 'linear-gradient(135deg,#10b981,#059669)',
              border: 'none',
            } : {}),
          }}
        >
          <MessageSquare size={13} />
          {chatOpen ? 'Close Chat' : 'Message Founder'}
        </button>
        {req.founder_email && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setEmailOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Mail size={13} /> Email
          </button>
        )}
      </div>

      {/* Email composer modal */}
      <AnimatePresence>
        {emailOpen && (
          <EmailComposerModal
            req={req}
            recipientEmail={req.founder_email}
            recipientLabel={req.founder_name || 'Founder'}
            onClose={() => setEmailOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Inline chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <ChatPanel req={req} myRole="INVESTOR" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SentMeetingsPage() {
  const [meetings, setMeetings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const FILTERS = ['All', 'Pending', 'Accepted', 'Declined'];

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await startupsAPI.getMeetingsSent();
      setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'All' ? meetings : meetings.filter(m => m.status === filter);

  const counts = {
    All:      meetings.length,
    Pending:  meetings.filter(m => m.status === 'Pending').length,
    Accepted: meetings.filter(m => m.status === 'Accepted').length,
    Declined: meetings.filter(m => m.status === 'Declined').length,
  };

  const filterColors = {
    All:      { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    Pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    Accepted: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    Declined: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };

  return (
    <DashboardLayout title="Connections" subtitle="Track meeting requests you've sent to startups and chat with founders">

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Sent',  value: counts.All,      icon: '📤', color: 'rgba(99,102,241,0.15)' },
          { label: 'Awaiting',    value: counts.Pending,  icon: '⏳', color: 'rgba(245,158,11,0.15)' },
          { label: 'Accepted',    value: counts.Accepted, icon: '🤝', color: 'rgba(16,185,129,0.15)' },
          { label: 'Declined',    value: counts.Declined, icon: '❌', color: 'rgba(239,68,68,0.12)' },
        ].map(s => (
          <motion.div
            key={s.label}
            className="stat-card"
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: 12 }}>{s.icon}</div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter + Refresh */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Filter size={15} style={{ color: 'var(--clr-text-muted)', alignSelf: 'center' }} />
            {FILTERS.map(f => {
              const fc = filterColors[f];
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                    border: active ? `1px solid ${fc.color}44` : '1px solid var(--clr-border)',
                    background: active ? fc.bg : 'transparent',
                    color: active ? fc.color : 'var(--clr-text-secondary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {f}
                  <span style={{
                    fontSize: '0.68rem', background: active ? `${fc.color}22` : 'rgba(255,255,255,0.06)',
                    color: active ? fc.color : 'var(--clr-text-muted)',
                    borderRadius: 10, padding: '0 5px', minWidth: 16, textAlign: 'center',
                  }}>
                    {counts[f]}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📤</div>
          <p style={{ color: 'var(--clr-text-muted)' }}>Loading your sent meetings…</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <Inbox size={48} style={{ color: 'var(--clr-text-muted)', marginBottom: 16 }} />
          <h3 style={{ marginBottom: 8 }}>
            {filter === 'All' ? 'No Meeting Requests Sent' : `No ${filter} Requests`}
          </h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
            {filter === 'All'
              ? 'Discover startups and send meeting requests — they will all appear here.'
              : `No ${filter.toLowerCase()} requests at this time.`}
          </p>
          {filter !== 'All' && (
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={() => setFilter('All')}>
              View All
            </button>
          )}
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map(m => (
              <SentCard key={m.id} req={m} />
            ))}
          </AnimatePresence>
        </div>
      )}

    </DashboardLayout>
  );
}
