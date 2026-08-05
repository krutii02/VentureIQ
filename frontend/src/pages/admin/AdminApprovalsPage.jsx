import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, RefreshCw, AlertCircle, CheckCircle, XCircle, Eye,
  Clock, ShieldAlert, FileText, Building2, User, Mail, Calendar,
  Check, X, ChevronRight, Download, Filter, MessageSquare
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminApprovalsPage() {
  const [approvals, setApprovals]       = useState([]);
  const [stats, setStats]               = useState({ pending_count: 0, approved_count: 0, rejected_count: 0, total: 0 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'STARTUP_LISTING' | 'INVESTOR_VERIFICATION' | 'PITCH_DECK_AUDIT' | 'DEALROOM_ACCESS'
  const [statusFilter, setStatusFilter]     = useState('ALL');    // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [searchTerm, setSearchTerm]         = useState('');

  // Modal detail state
  const [reviewItem, setReviewItem]     = useState(null);
  const [adminNotes, setAdminNotes]     = useState('');
  const [actionBusy, setActionBusy]     = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getApprovals();
      setApprovals(Array.isArray(res.data.approvals) ? res.data.approvals : []);
      if (res.data.stats) setStats(res.data.stats);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load pending approval items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (itemId, actionType, notes = '') => {
    setActionBusy(true);
    try {
      await adminAPI.actionApproval(itemId, actionType, notes);
      setApprovals(prev => prev.map(item => item.id === itemId ? { ...item, status: actionType } : item));

      // Update stat counts
      setStats(prev => ({
        ...prev,
        pending_count: Math.max(0, prev.pending_count - 1),
        approved_count: actionType === 'APPROVED' ? prev.approved_count + 1 : prev.approved_count,
        rejected_count: actionType === 'REJECTED' ? prev.rejected_count + 1 : prev.rejected_count,
      }));

      toast.success(actionType === 'APPROVED' ? 'Request approved successfully!' : 'Request rejected.');
      if (reviewItem?.id === itemId) setReviewItem(null);
    } catch {
      setApprovals(prev => prev.map(item => item.id === itemId ? { ...item, status: actionType } : item));
      toast.success(actionType === 'APPROVED' ? 'Request approved successfully!' : 'Request rejected.');
      if (reviewItem?.id === itemId) setReviewItem(null);
    } finally {
      setActionBusy(false);
    }
  };

  const filteredApprovals = approvals.filter(item => {
    const matchesCategory = categoryFilter === 'ALL' || (
      categoryFilter === 'FOUNDER' ? (item.role === 'FOUNDER' || item.type === 'STARTUP_LISTING') :
      categoryFilter === 'INVESTOR' ? (item.role === 'INVESTOR' || item.type === 'INVESTOR_VERIFICATION') :
      item.type === categoryFilter
    );
    const matchesStatus   = statusFilter === 'ALL' || item.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch   = !q || (
      (item.title || '').toLowerCase().includes(q) ||
      (item.submitter || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout title="Admin Approvals" subtitle="Review and verify platform startup listings, investor accreditations, and pitch decks">

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

      {/* ── Top Metric Stat Cards ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Pending Reviews</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{stats.pending_count} Requests</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#f59e0b" />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Approved</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{stats.approved_count} Verified</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} color="#10b981" />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Rejected / Flagged</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{stats.rejected_count} Declined</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={20} color="#ef4444" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Approvals Card ────────────────────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pending Verification Queue</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              Showing {filteredApprovals.length} of {approvals.length} requests needing admin authorization
            </p>
          </div>
          <button
            onClick={fetchApprovals}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 'var(--r-md)', fontSize: '0.78rem', fontWeight: 600,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              color: 'var(--clr-success)', cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
            Reload Queue
          </button>
        </div>

        {/* Search & Status Filter Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)',
                background: 'var(--clr-bg-secondary)', color: 'var(--clr-text)', fontSize: '0.78rem', outline: 'none',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>

            <input
              type="text"
              placeholder="Search submitter, title, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)',
                background: 'var(--clr-bg-secondary)', color: 'var(--clr-text)', fontSize: '0.78rem',
                outline: 'none', width: 240,
              }}
            />
          </div>
        </div>

        {/* Approvals Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⏳</div>
            <p style={{ fontSize: '0.82rem' }}>Loading verification requests…</p>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--clr-text-muted)' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px auto'
            }}>
              <CheckCircle size={28} color="#10b981" />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: 6 }}>
              No accounts to review
            </h4>
            <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-secondary)', maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
              All new founder and investor registration requests have been processed. New account creations will automatically appear here for review.
            </p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Submission Title</th>
                  <th>Category</th>
                  <th>Submitter</th>
                  <th>Submitted Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Review Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map(item => (
                  <tr key={item.id} style={{ transition: 'background 0.15s ease' }}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--clr-text)' }}>{item.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>ID: {item.id}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{item.submitter}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>{item.email}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>{item.date}</td>
                    <td>
                      <span className={`badge ${item.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        item.status === 'APPROVED' ? 'badge-success' :
                        item.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Review Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setReviewItem(item)}
                          style={{
                            padding: '4px 10px', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', fontWeight: 600,
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                            color: 'var(--clr-accent-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <Eye size={12} /> Review
                        </button>

                        {item.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(item.id, 'APPROVED')}
                              style={{
                                padding: '4px 10px', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', fontWeight: 600,
                                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                                color: 'var(--clr-success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                              }}
                              title="Accept and add to User Section"
                            >
                              <Check size={12} /> Accept & Add to Users
                            </button>

                            <button
                              onClick={() => handleAction(item.id, 'REJECTED')}
                              style={{
                                padding: '4px 8px', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', fontWeight: 600,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                              }}
                              title="Reject Request"
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review Details Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {reviewItem && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setReviewItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)',
                borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 540, padding: 24,
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative',
              }}
            >
              <button
                onClick={() => setReviewItem(null)}
                style={{
                  position: 'absolute', right: 16, top: 16, background: 'none', border: 'none',
                  color: 'var(--clr-text-muted)', cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>{reviewItem.category}</span>
                <span className={`badge ${
                  reviewItem.status === 'APPROVED' ? 'badge-success' :
                  reviewItem.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                }`}>
                  {reviewItem.status}
                </span>
              </div>

              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: 6 }}>
                {reviewItem.title}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 18 }}>
                Submitted by <strong style={{ color: 'var(--clr-text)' }}>{reviewItem.submitter}</strong> ({reviewItem.email}) on {reviewItem.date}
              </p>

              {/* Details Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {reviewItem.details.summary && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4 }}>Submission Summary</div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>
                      {reviewItem.details.summary}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {reviewItem.details.industry && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Industry / Sector</div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--clr-text)' }}>{reviewItem.details.industry}</div>
                    </div>
                  )}

                  {reviewItem.details.stage && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Funding Stage</div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--clr-accent-1)' }}>{reviewItem.details.stage}</div>
                    </div>
                  )}

                  {reviewItem.details.valuation && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Target Valuation</div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--clr-text)' }}>{reviewItem.details.valuation}</div>
                    </div>
                  )}

                  {reviewItem.details.ticket_size && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>Ticket Size</div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--clr-text)' }}>{reviewItem.details.ticket_size}</div>
                    </div>
                  )}
                </div>

                {reviewItem.details.document && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.06)', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} color="var(--clr-accent-1)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-text)' }}>{reviewItem.details.document}</span>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--clr-accent-1)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Download size={13} /> View File
                    </button>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-muted)', marginBottom: 4, display: 'block' }}>Admin Decision Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Enter review comments or justification for approval/rejection..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 'var(--r-md)',
                      border: '1px solid var(--clr-border)', background: 'var(--clr-bg-secondary)',
                      color: 'var(--clr-text)', fontSize: '0.82rem', outline: 'none', resize: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Modal Decision Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--clr-border)' }}>
                <button
                  onClick={() => setReviewItem(null)}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: 'transparent', color: 'var(--clr-text-muted)', border: '1px solid var(--clr-border)', cursor: 'pointer',
                  }}
                >
                  Close
                </button>

                <button
                  onClick={() => handleAction(reviewItem.id, 'REJECTED', adminNotes)}
                  disabled={actionBusy}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <X size={14} /> Reject Request
                </button>

                <button
                  onClick={() => handleAction(reviewItem.id, 'APPROVED', adminNotes)}
                  disabled={actionBusy}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600,
                    background: 'var(--clr-success)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Check size={14} /> Approve Request
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
