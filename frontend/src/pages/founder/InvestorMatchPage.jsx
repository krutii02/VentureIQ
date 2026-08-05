import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar';
import Topbar from '../../components/common/Topbar';
import {
  Handshake, Building2, Search, ChevronDown, ArrowRight,
  Bookmark, BookmarkCheck, BadgeCheck
} from 'lucide-react';
import { investorsAPI } from '../../services/api';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function fmtAmount(val) {
  const n = parseFloat(val);
  if (!n || isNaN(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const PALETTE = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];
function colorFor(id) { return PALETTE[(parseInt(id, 10) || 0) % PALETTE.length]; }

/* Saved investors – localStorage */
const SAVED_KEY = 'ventureiq_saved_investors';
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
}
function persistSaved(arr) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(arr));
}

/* ═══════════════════════════════════════════════
   INVESTOR GRID CARD  (Discover-style)
═══════════════════════════════════════════════ */
function InvestorCard({ investor, onClick, isSaved, onToggleSave, index }) {
  const color = colorFor(investor.id);
  const name  = investor.name  || investor.investor_name || investor.contact || '—';
  const firm  = investor.firm  || 'Independent';
  const desc  = investor.description || investor.note || '';

  const stats = [
    { label: 'Ticket',  value: fmtAmount(investor.ticket_size) || '—', color: 'var(--clr-success)' },
    { label: 'Deals',   value: investor.total_deals || '—',            color: 'var(--clr-accent-1)' },
    { label: 'Exits',   value: investor.exits       || '—',            color: 'var(--clr-text-secondary)' },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      className="card"
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      {/* Save / Bookmark button */}
      <button
        onClick={e => { e.stopPropagation(); onToggleSave(investor); }}
        title={isSaved ? 'Remove from Saved' : 'Save Investor'}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          color: isSaved ? 'var(--clr-accent-1)' : 'var(--clr-text-muted)',
          transition: 'color 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Header: avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingRight: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0,
            background: `linear-gradient(135deg, ${color}, ${color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#fff', fontSize: '0.88rem', overflow: 'hidden',
          }}>
            {investor.logo
              ? <img src={investor.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
              : initials(name)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: '0.98rem' }}>
              {name}
              {investor.verified && <BadgeCheck size={13} color={color} />}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              {firm}
            </div>
            {(investor.locations?.[0] || investor.location || investor.country) && (
              <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                📍 {investor.locations?.[0] || investor.location || investor.country}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p style={{ flex: 1, fontSize: '0.82rem', color: 'var(--clr-text-muted)', lineHeight: 1.5, marginBottom: 14, minHeight: 38,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {desc || 'No description available.'}
        </p>

        {/* Industry / stage tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {(investor.industries || []).slice(0, 4).map(t => (
            <span key={t} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{t}</span>
          ))}
          {investor.match && (
            <span style={{
              padding: '1px 8px', borderRadius: 'var(--r-full)',
              background: `${color}18`, color, border: `1px solid ${color}30`,
              fontSize: '0.65rem', fontWeight: 700,
            }}>
              {investor.match}% match
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {stats.map(m => (
            <div key={m.label} style={{ textAlign: 'center', padding: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ paddingTop: 10, borderTop: '1px solid var(--clr-border)' }}>
        {/* Centered full-width View button */}
        <button
          onClick={e => { e.stopPropagation(); onClick(investor); }}
          className="btn btn-secondary"
          style={{
            width: '100%', justifyContent: 'center',
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600,
          }}
        >
          View Investor Profile <ArrowRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
const PAGE_SIZE = 12;

export default function InvestorMatchPage() {
  const navigate = useNavigate();

  const [tab,       setTab]       = useState('browse');
  const [search,    setSearch]    = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [investors, setInvestors] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [offset,    setOffset]    = useState(0);
  const [loading,   setLoading]   = useState(false);

  /* Saved investors */
  const [savedList, setSavedList] = useState(() => loadSaved());
  const savedIds = new Set(savedList.map(inv => String(inv.id)));

  const firstNewRef = useRef(null);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* Reset on search change */
  useEffect(() => { setInvestors([]); setOffset(0); setTotal(0); }, [debSearch]);

  /* Fetch page */
  const fetchPage = useCallback((off) => {
    setLoading(true);
    investorsAPI.list({ search: debSearch, limit: PAGE_SIZE, offset: off })
      .then(res => {
        const data = res.data;
        setTotal(data.total || 0);
        if (off === 0) {
          setInvestors(data.results || []);
        } else {
          setInvestors(prev => [...prev, ...(data.results || [])]);
          setTimeout(() => firstNewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debSearch]);

  useEffect(() => { fetchPage(0); }, [fetchPage]);

  const handleShowMore = () => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    fetchPage(next);
  };

  const openProfile = (investor) => {
    const invData = { ...investor, name: investor.name || investor.investor_name };
    navigate(`/founder/investor-profile/${investor.id || 'new'}`, { state: { investor: invData } });
  };

  const handleToggleSave = (investor) => {
    const key = String(investor.id);
    setSavedList(prev => {
      let next;
      if (prev.some(inv => String(inv.id) === key)) {
        next = prev.filter(inv => String(inv.id) !== key);
        toast.success('Removed from Saved', { icon: '🔖' });
      } else {
        next = [investor, ...prev];
        toast.success('Investor saved!', { icon: '✨' });
      }
      persistSaved(next);
      return next;
    });
  };

  const hasMore = investors.length < total;

  const TABS = [
    { id: 'browse', label: 'Browse Investors',                                               icon: Handshake   },
    { id: 'saved',  label: `Saved${savedList.length > 0 ? ` (${savedList.length})` : ''}`,  icon: BookmarkCheck },
  ];

  /* Shared card grid renderer */
  const renderGrid = (list) => (
    <AnimatePresence>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
        {list.map((inv, i) => (
          <div key={inv.id || i} ref={offset > 0 && i === offset ? firstNewRef : null}>
            <InvestorCard
              investor={inv}
              onClick={openProfile}
              isSaved={savedIds.has(String(inv.id))}
              onToggleSave={handleToggleSave}
              index={i}
            />
          </div>
        ))}
      </div>
    </AnimatePresence>
  );

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />

        <div className="page-header" style={{ padding: '28px 32px 0' }}>
          <div>
            <h1 className="page-title">Investor Match</h1>
            <p className="page-subtitle">
              {tab === 'browse'
                ? `${total > 0 ? `${total} investors` : 'Browse investors'} — find your perfect match`
                : `${savedList.length} investor${savedList.length !== 1 ? 's' : ''} saved`}
            </p>
          </div>
        </div>

        <div className="page-body">

          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content', marginBottom: 24 }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                  fontSize: '0.83rem', fontWeight: 600, transition: 'all 0.18s',
                  background: tab === id ? 'var(--grad-brand)' : 'transparent',
                  color: tab === id ? '#fff' : 'var(--clr-text-muted)',
                  boxShadow: tab === id ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── BROWSE ── */}
          {tab === 'browse' && (
            <>
              {/* Search bar */}
              <div className="card" style={{ marginBottom: 24, padding: 16 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
                  <input
                    className="form-input"
                    placeholder="Search by name, firm or industry…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              {/* Loading */}
              {loading && investors.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
                  <p style={{ fontWeight: 600 }}>Loading investors…</p>
                </div>
              )}

              {/* Grid */}
              {investors.length > 0 && renderGrid(investors)}

              {/* Loading more */}
              {loading && investors.length > 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--clr-text-muted)', fontSize: '0.83rem' }}>
                  <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite', verticalAlign: 'middle', marginRight: 8 }} />
                  Loading more investors…
                </div>
              )}

              {/* Empty */}
              {!loading && investors.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                  <p style={{ fontWeight: 600 }}>No investors found</p>
                  <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Try a different search term</p>
                </div>
              )}

              {/* Show more */}
              {hasMore && !loading && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button onClick={handleShowMore} className="btn btn-secondary" style={{ gap: 8, padding: '10px 28px', fontSize: '0.85rem' }}>
                    <ChevronDown size={16} /> Show More Investors
                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginLeft: 4 }}>
                      ({investors.length} / {total})
                    </span>
                  </button>
                </div>
              )}

              {!hasMore && investors.length > 0 && !loading && (
                <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.77rem', color: 'var(--clr-text-muted)' }}>
                  All {total} investors loaded
                </p>
              )}
            </>
          )}

          {/* ── SAVED ── */}
          {tab === 'saved' && (
            <>
              {/* Info banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', borderRadius: 'var(--r-md)', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: 24, fontSize: '0.81rem', color: 'var(--clr-text-secondary)' }}>
                <BookmarkCheck size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                <span>Investors you've bookmarked for later. Click the bookmark icon on any card to save or remove.</span>
              </div>

              {savedList.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 64, color: 'var(--clr-text-muted)' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <Bookmark size={30} color="#6366f1" style={{ opacity: 0.45 }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: 'var(--clr-text-primary)' }}>No saved investors yet</div>
                  <p style={{ fontSize: '0.83rem', maxWidth: 320, margin: '0 auto 20px' }}>
                    Browse investors and click the <Bookmark size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> bookmark icon to save them here.
                  </p>
                  <button onClick={() => setTab('browse')} className="btn btn-primary btn-sm" style={{ gap: 7 }}>
                    <Handshake size={14} /> Browse Investors
                  </button>
                </div>
              ) : (
                renderGrid(savedList)
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
