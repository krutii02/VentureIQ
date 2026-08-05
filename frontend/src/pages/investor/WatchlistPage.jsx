import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookmarkX, ArrowRight, TrendingUp, Bookmark, Search, Edit2, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { startupsAPI } from '../../services/api';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const res = await startupsAPI.getWatchlist();
      if (Array.isArray(res.data)) {
        setWatchlist(res.data);
      }
    } catch (err) {
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (startupId, name) => {
    try {
      await startupsAPI.toggleBookmark(startupId);
      setWatchlist(prev => prev.filter(w => w.startup.id !== startupId));
      window.dispatchEvent(new Event('ventureiq_bookmarks_changed'));
      toast.success(`Removed ${name} from watchlist`);
    } catch (err) {
      toast.error('Failed to remove bookmark');
    }
  };

  const handleSaveNote = async (startupId) => {
    try {
      await startupsAPI.updateWatchlistNote(startupId, tempNote);
      setWatchlist(prev => prev.map(w => w.startup.id === startupId ? { ...w, notes: tempNote } : w));
      setEditingId(null);
      toast.success('Note updated');
    } catch (err) {
      toast.error('Failed to update note');
    }
  };

  const startEditNote = (startupId, currentNote) => {
    setEditingId(startupId);
    setTempNote(currentNote || '');
  };

  return (
    <DashboardLayout title="Watchlist" subtitle={loading ? 'Loading...' : `${watchlist.length} bookmarked and tracked startups`}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Loading watchlist...</p>
        </div>
      ) : watchlist.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 18 }}>
          <AnimatePresence>
            {watchlist.map((w, i) => {
              const s = w.startup;
              const userNote = w.notes;
              const isEditing = editingId === s.id;

              return (
                <motion.div
                  key={s.id}
                  className="card"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}
                >
                  <div>
                    {/* Top Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div
                        className="avatar"
                        style={{
                          background: `linear-gradient(135deg, hsl(${s.score * 3},65%,55%), hsl(${s.score * 4},70%,45%))`,
                          flexShrink: 0,
                          width: 44,
                          height: 44,
                          fontSize: '0.9rem',
                          fontWeight: 800,
                        }}
                      >
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                          {s.industry} • {s.stage}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 900,
                          color: s.score >= 88 ? 'var(--clr-success)' : '#6366f1',
                          fontFamily: "'Space Grotesk',sans-serif",
                        }}
                      >
                        {s.score}%
                      </span>
                    </div>

                    {/* Note Box */}
                    <div
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(245,158,11,0.06)',
                        borderRadius: 'var(--r-sm)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        marginBottom: 14,
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--clr-warning)', fontWeight: 700 }}>📝 DUE DILIGENCE NOTE</div>
                        {!isEditing && (
                          <button
                            onClick={() => startEditNote(s.id, userNote)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', display: 'flex', padding: 2 }}
                            title="Edit note"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <input
                            type="text"
                            className="form-input"
                            value={tempNote}
                            onChange={e => setTempNote(e.target.value)}
                            style={{ fontSize: '0.78rem', height: 30, padding: '2px 8px', flex: 1 }}
                            autoFocus
                          />
                          <button onClick={() => handleSaveNote(s.id)} className="btn btn-primary btn-sm" style={{ padding: '0 8px', height: 30 }}>
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.81rem', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
                          {userNote || <span style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>No notes added yet.</span>}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {((typeof s.tags === 'string' ? s.tags.split(',') : s.tags) || [s.industry]).map(t => (
                        <span key={t} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--clr-border)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--clr-success)', fontWeight: 700 }}>
                      {s.revenue} <span style={{ color: 'var(--clr-accent-1)', fontWeight: 600, fontSize: '0.75rem', marginLeft: 4 }}>{s.growth}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={() => removeBookmark(s.id, s.name)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--clr-danger)', padding: '5px 8px' }}
                        title="Remove from Watchlist"
                      >
                        <BookmarkX size={15} />
                      </button>
                      <Link to={`/investor/startup/${s.id}`} className="btn btn-secondary btn-sm" style={{ gap: 4, padding: '5px 12px', fontSize: '0.75rem' }}>
                        View <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
          <Bookmark size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: 700, color: 'var(--clr-text-primary)', marginBottom: 6 }}>Your Watchlist is Empty</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
            Bookmark startups from the Discover page to track their progress, add notes, and monitor metrics side-by-side.
          </p>
          <Link to="/investor/discover" className="btn btn-primary" style={{ gap: 8, padding: '10px 24px', fontSize: '0.85rem' }}>
            <Search size={15} /> Discover Startups
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
