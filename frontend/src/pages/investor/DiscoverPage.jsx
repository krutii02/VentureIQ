import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Bookmark, BookmarkCheck, ArrowRight, TrendingUp, Star, Heart, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { startupsAPI } from '../../services/api';

const INDUSTRIES = ['All', 'Healthcare', 'CleanTech', 'SaaS', 'EdTech', 'FinTech', 'AgriTech', 'AI & Machine Learning', 'Cybersecurity', 'E-commerce', 'Logistics', 'Robotics'];
const STAGES = ['All', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C'];

const SEEDED_FOUNDERS = [
  'Alex Founder', 'Vikram Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Roy',
  'Devika Sundaram', 'Kabir Mehta', 'Neha Varma', 'Arjun Kapoor', 'Siddharth Nair',
  'Aditi Rao', 'Karan Verma', 'Simran Kaur', 'Aarav Malhotra', 'Isha Deshmukh'
];

function getFounderName(s) {
  if (s.founder_name && s.founder_name !== 'None') return s.founder_name;
  if (!s.name) return 'Founder';
  const charCodeSum = (typeof s.id === 'number' ? s.id : s.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  return SEEDED_FOUNDERS[Math.abs(charCodeSum) % SEEDED_FOUNDERS.length];
}

// Normalise a DB startup row to the shape the UI expects
function normalise(s) {
  return {
    id: s.id,
    name: s.name,
    founder_name: getFounderName(s),
    industry: s.industry,
    country: s.country,
    city: s.city || '',
    stage: s.stage,
    score: s.score,
    revenue: s.revenue,
    growth: s.growth,
    team: s.team_size,
    risk: s.risk_level,
    tags: s.tags_array || [s.industry, s.stage].filter(Boolean),
    desc: s.description,
    valuation: s.valuation,
    active_users: s.active_users,
    founded_year: s.founded_year,
    innovation_score: s.innovation_score,
    investor_interest_score: s.investor_interest_score,
    market_trend_score: s.market_trend_score,
    tech_stack: s.tech_stack,
    target_audience: s.target_audience,
    website: s.website,
  };
}

export default function DiscoverPage() {
  const [startups, setStartups] = useState([]);
  const [loadingStartups, setLoadingStartups] = useState(true);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [stage, setStage] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [bookmarked, setBookmarked] = useState(() => {
    try {
      const stored = localStorage.getItem('ventureiq_bookmarks');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [interested, setInterested] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('investor_interests') || '[]')); }
    catch { return new Set(); }
  });
  const [view, setView] = useState('grid');

  // Load startups from DB
  useEffect(() => {
    setLoadingStartups(true);
    startupsAPI.list()
      .then(res => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setStartups(rows.map(normalise));
      })
      .catch(() => setStartups([]))
      .finally(() => setLoadingStartups(false));
  }, []);

  // Sync bookmarked set from DB watchlist
  useEffect(() => {
    startupsAPI.getWatchlist()
      .then(res => {
        const ids = (res.data || []).map(w => w.startup?.id).filter(Boolean);
        const idSet = new Set(ids);
        setBookmarked(idSet);
        localStorage.setItem('ventureiq_bookmarks', JSON.stringify([...idSet]));
      })
      .catch(() => {});
  }, []);

  const toggleBookmark = (id) => {
    startupsAPI.toggleBookmark(id)
      .then(res => {
        setBookmarked(prev => {
          const next = new Set(prev);
          res.data.bookmarked ? next.add(id) : next.delete(id);
          localStorage.setItem('ventureiq_bookmarks', JSON.stringify([...next]));
          window.dispatchEvent(new Event('ventureiq_bookmarks_changed'));
          return next;
        });
      })
      .catch(() => {
        // Optimistic toggle fallback
        setBookmarked(prev => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          localStorage.setItem('ventureiq_bookmarks', JSON.stringify([...next]));
          window.dispatchEvent(new Event('ventureiq_bookmarks_changed'));
          return next;
        });
      });
  };

  const toggleInterest = (startup) => {
    setInterested(prev => {
      const next = new Set(prev);
      if (next.has(startup.id)) {
        next.delete(startup.id);
      } else {
        next.add(startup.id);
        // Persist for founder's Investor Match page
        const stored = JSON.parse(localStorage.getItem('investor_interests_data') || '[]');
        const already = stored.find(x => x.startupId === startup.id);
        if (!already) {
          stored.push({
            startupId: startup.id,
            startupName: startup.name,
            industry: startup.industry,
            stage: startup.stage,
            score: startup.score,
            sentAt: new Date().toISOString(),
          });
          localStorage.setItem('investor_interests_data', JSON.stringify(stored));
        }
      }
      localStorage.setItem('investor_interests', JSON.stringify([...next]));
      return next;
    });
  };

  const isFiltered = industry !== 'All' || stage !== 'All' || minScore > 0 || search.trim() !== '';

  const clearFilters = () => {
    setSearch('');
    setIndustry('All');
    setStage('All');
    setMinScore(0);
  };

  const filtered = startups.filter(s =>
    (industry === 'All' || s.industry === industry) &&
    (stage === 'All' || s.stage === stage) &&
    s.score >= minScore &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.industry.toLowerCase().includes(search.toLowerCase()) ||
     (s.desc && s.desc.toLowerCase().includes(search.toLowerCase())) ||
     s.country.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout title="Discover Startups" subtitle={`${filtered.length} startups match your criteria`}>

      {/* Search + Filters */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input className="form-input" placeholder="Search startups, industries, countries…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>

          {/* Industry */}
          <div style={{ flex: '1 1 150px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: 4 }}>Industry</label>
            <select className="form-select" value={industry} onChange={e => setIndustry(e.target.value)}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>

          {/* Stage */}
          <div style={{ flex: '1 1 130px' }}>
            <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: 4 }}>Stage</label>
            <select className="form-select" value={stage} onChange={e => setStage(e.target.value)}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Score */}
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 4, fontWeight: 600 }}>Min Score: {minScore}%</div>
            <input type="range" min={0} max={90} value={minScore} onChange={e => setMinScore(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--clr-accent-1)' }} />
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--clr-bg-secondary)', borderRadius: 'var(--r-sm)', padding: 3, border: '1px solid var(--clr-border)' }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setView(v)} className="btn btn-sm"
                style={{ background: view === v ? 'var(--grad-brand)' : 'transparent', color: view === v ? '#fff' : 'var(--clr-text-muted)', border: 'none', padding: '5px 12px' }}>
                {v === 'grid' ? '⊞ Grid' : '≡ List'}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {isFiltered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={clearFilters}
              className="btn btn-sm"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--r-sm)',
                padding: '6px 14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <XCircle size={14} />
              Clear Filters
            </motion.button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loadingStartups && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Loading startups from database…</p>
        </div>
      )}

      {/* Startup Cards */}
      {!loadingStartups && (
        <AnimatePresence>
          {view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 18 }}>
              {filtered.map((s, i) => (
                <motion.div key={s.id} className="card" layout
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }} whileHover={{ y: -4 }}
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  {/* Bookmark button */}
                  <button onClick={() => toggleBookmark(s.id)}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: bookmarked.has(s.id) ? 'var(--clr-accent-1)' : 'var(--clr-text-muted)', transition: 'color 0.2s' }}>
                    {bookmarked.has(s.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div className="avatar" style={{ background: `linear-gradient(135deg,hsl(${s.score * 3},65%,55%),hsl(${s.score * 4},70%,45%))`, flexShrink: 0, width: 42, height: 42, fontSize: '0.9rem' }}>
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                          <span>👤 {s.founder_name}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: 1 }}>{s.city ? `${s.city}, ${s.country}` : s.country}</div>
                      </div>
                    </div>

                    <p style={{ flex: 1, fontSize: '0.82rem', color: 'var(--clr-text-muted)', lineHeight: 1.5, marginBottom: 14, minHeight: 40 }}>{s.desc}</p>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {(s.tags || []).map(t => <span key={t} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{t}</span>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'Revenue', value: s.revenue, color: 'var(--clr-success)' },
                        { label: 'Growth', value: s.growth, color: 'var(--clr-accent-1)' },
                        { label: 'Team', value: `${s.team} ppl`, color: 'var(--clr-text-secondary)' },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: m.color }}>{m.value}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--clr-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>AI Score</span>
                      <span style={{ fontWeight: 900, fontSize: '1rem', color: s.score >= 85 ? 'var(--clr-success)' : s.score >= 75 ? '#6366f1' : 'var(--clr-warning)', fontFamily: "'Space Grotesk',sans-serif" }}>{s.score}%</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={`badge ${s.risk === 'Low' ? 'badge-success' : s.risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{s.risk}</span>

                      <Link to={`/investor/startup/${s.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
                        View <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr><th>Startup</th><th>Industry</th><th>Stage</th><th>Revenue</th><th>Growth</th><th>Score</th><th>Risk</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontSize: '0.68rem' }}>{s.name.slice(0, 2).toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>👤 {s.founder_name}</div>
                              <div style={{ fontSize: '0.70rem', color: 'var(--clr-text-muted)' }}>{s.country}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-info">{s.industry}</span></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)' }}>{s.stage}</td>
                        <td style={{ color: 'var(--clr-success)', fontWeight: 600, fontSize: '0.85rem' }}>{s.revenue}</td>
                        <td style={{ color: 'var(--clr-accent-1)', fontWeight: 600 }}>{s.growth}</td>
                        <td style={{ fontWeight: 800, color: s.score >= 85 ? 'var(--clr-success)' : s.score >= 75 ? '#6366f1' : 'var(--clr-warning)', fontFamily: "'Space Grotesk',sans-serif" }}>{s.score}%</td>
                        <td><span className={`badge ${s.risk === 'Low' ? 'badge-success' : s.risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{s.risk}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => toggleBookmark(s.id)} className="btn btn-ghost btn-sm" style={{ color: bookmarked.has(s.id) ? 'var(--clr-accent-1)' : '' }}>
                              {bookmarked.has(s.id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                            </button>

                            <Link to={`/investor/startup/${s.id}`} className="btn btn-secondary btn-sm">View</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AnimatePresence>
      )}

      {!loadingStartups && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
          <p style={{ fontWeight: 600 }}>No startups match your criteria</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Try clearing your filters or searching for another keyword</p>
        </div>
      )}
    </DashboardLayout>
  );
}
