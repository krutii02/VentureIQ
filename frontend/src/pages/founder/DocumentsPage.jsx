import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Eye, Clock, Brain, Target, TrendingUp, Search, Filter, CheckCircle, AlertTriangle, Printer, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { analysisAPI } from '../../services/api';

const DEFAULT_DOCUMENTS = [
  {
    id: 1,
    title: 'ML Prediction Report — Q3 2025',
    type: 'ML Prediction',
    date: '2025-07-15',
    score: 87,
    status: 'Completed',
    summary: 'Random Forest & XGBoost ensemble analysis across 50 features. Success probability: 87%. Investor interest score: 91/100.',
    details: {
      model: 'Random Forest + XGBoost Ensemble',
      features: 50,
      accuracy: '94.2%',
      successProb: 87,
      riskLevel: 'Low',
      investorScore: 91,
      revenue12m: '$1.24M',
      insights: [
        'Revenue growth trajectory exceeds industry median by 34%',
        'Burn efficiency ratio of 2.5x is above average for Series A',
        'Team size to revenue ratio indicates lean operations',
        'Market timing score is optimal for current funding climate'
      ],
      recommendations: [
        'Reduce CAC by 25% through content-led growth strategy',
        'Expand to 2 new geographies within 6 months',
        'File 2 additional patents to strengthen IP moat before Series B'
      ]
    }
  },
  {
    id: 2,
    title: 'SWOT Analysis — QuickRoom',
    type: 'SWOT Analysis',
    date: '2025-07-10',
    score: null,
    status: 'Completed',
    summary: 'AI-generated comprehensive SWOT analysis powered by Google Gemini, covering strengths, weaknesses, opportunities, and threats.',
    details: {
      strengths: ['Strong technical team with 8+ years average experience', 'Patented AI technology for healthcare diagnostics', 'Growing MoM revenue at 18%'],
      weaknesses: ['High customer acquisition cost ($141)', 'Limited geographic presence (3 cities)', 'Dependency on single cloud vendor (AWS)'],
      opportunities: ['$47B healthcare AI market growing at 42% CAGR', 'Regulatory tailwinds post-COVID for telemedicine', 'Expansion to Tier-2 cities'],
      threats: ['3 well-funded competitors raised Series B recently', 'Data privacy regulation changes', 'Talent retention risk in competitive AI market']
    }
  },
  {
    id: 3,
    title: 'Business Health Check — June 2025',
    type: 'Health Check',
    date: '2025-06-30',
    score: 82,
    status: 'Completed',
    summary: 'Comprehensive health check across 6 dimensions: Revenue Health (82%), Team Health (91%), PMF (74%), Financial Efficiency (68%).',
    details: {
      metrics: [
        { label: 'Revenue Health', score: 82, detail: 'MoM growth of 14.5%' },
        { label: 'Team Health', score: 91, detail: 'Low attrition, Glassdoor 4.6/5' },
        { label: 'Product Market Fit', score: 74, detail: 'NPS score 52' },
        { label: 'Financial Efficiency', score: 68, detail: 'Burn multiple 1.4x' },
        { label: 'Investor Readiness', score: 89, detail: 'Due-diligence ready' },
        { label: 'Market Position', score: 77, detail: 'Top 3 in healthcare AI' },
      ]
    }
  },
];

const TYPE_COLORS = {
  'ML Prediction': { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', icon: '🤖' },
  'SWOT Analysis': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '💡' },
  'Health Check': { bg: 'rgba(16,185,129,0.12)', color: '#10b981', icon: '📊' },
  'Investor Match': { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', icon: '🤝' },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState(DEFAULT_DOCUMENTS[0]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    analysisAPI.getDocuments()
      .then(res => {
        if (res.data && res.data.length > 0) {
          setDocuments(res.data);
          setSelectedDoc(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const types = ['All', ...new Set(documents.map(d => d.type))];

  const filtered = documents.filter(d =>
    (typeFilter === 'All' || d.type === typeFilter) &&
    (d.title.toLowerCase().includes(search.toLowerCase()) || d.summary.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExportPDF = () => {
    toast.success(`Exporting "${selectedDoc?.title || 'Report'}" as PDF...`);
    window.print();
  };

  const handleDeleteDoc = (id, e) => {
    e.stopPropagation();
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    if (selectedDoc?.id === id) {
      setSelectedDoc(updated[0] || null);
    }
    toast.success('Document deleted');
  };

  return (
    <DashboardLayout title="ML Predictions & Documents" subtitle="AI-generated reports, predictions, and analysis history">

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input className="form-input" placeholder="Search documents…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--clr-bg-secondary)', borderRadius: 'var(--r-sm)', padding: 3, border: '1px solid var(--clr-border)' }}>
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className="btn btn-sm"
                style={{
                  background: typeFilter === t ? 'var(--grad-brand)' : 'transparent',
                  color: typeFilter === t ? '#fff' : 'var(--clr-text-muted)',
                  border: 'none', padding: '5px 12px', fontSize: '0.78rem'
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Document List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((doc, i) => {
            const typeStyle = TYPE_COLORS[doc.type] || TYPE_COLORS['ML Prediction'];
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <motion.div
                key={doc.id}
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedDoc(doc)}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--clr-accent-1)' : 'var(--clr-border)',
                  background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--clr-bg-card)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: typeStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {typeStyle.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{doc.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span className="badge" style={{ background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.color}30`, fontSize: '0.65rem' }}>
                          {doc.type}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} /> {doc.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {doc.score !== null && (
                      <span style={{
                        fontWeight: 900, fontSize: '1rem',
                        color: doc.score >= 85 ? 'var(--clr-success)' : doc.score >= 75 ? '#6366f1' : 'var(--clr-warning)',
                        fontFamily: "'Space Grotesk',sans-serif"
                      }}>
                        {doc.score}%
                      </span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 4, color: 'var(--clr-text-muted)' }}
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                  {doc.summary}
                </p>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📄</div>
              <p style={{ fontWeight: 600 }}>No documents found</p>
              <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Try adjusting your search or filter options</p>
            </div>
          )}
        </div>

        {/* Detailed Report Panel */}
        <div>
          {selectedDoc ? (
            <motion.div
              key={selectedDoc.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
              style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}
            >
              <div className="flex-between" style={{ marginBottom: 20 }}>
                <div>
                  <span className="badge badge-purple" style={{ marginBottom: 6 }}>{selectedDoc.type}</span>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedDoc.title}</h3>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
                  <Printer size={13} /> Export PDF
                </button>
              </div>

              {/* ML Prediction Report Details */}
              {selectedDoc.type === 'ML Prediction' && selectedDoc.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {[
                      { label: 'Success Prob.', value: `${selectedDoc.details.successProb}%`, color: '#6366f1', icon: '🎯' },
                      { label: 'Investor Score', value: `${selectedDoc.details.investorScore}/100`, color: 'var(--clr-success)', icon: '📈' },
                      { label: 'Risk Level', value: selectedDoc.details.riskLevel, color: selectedDoc.details.riskLevel === 'Low' ? 'var(--clr-success)' : 'var(--clr-warning)', icon: '🛡️' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px', background: `${s.color}10`, borderRadius: 'var(--r-md)', border: `1px solid ${s.color}25` }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color, fontFamily: "'Space Grotesk',sans-serif" }}>{s.value}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--r-md)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Projected 12-Month Revenue</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--clr-success)', fontFamily: "'Space Grotesk',sans-serif" }}>{selectedDoc.details.revenue12m}</div>
                  </div>

                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} color="var(--clr-success)" /> Insights</h4>
                    {(selectedDoc.details.insights || []).map((ins, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: 'var(--clr-success)', flexShrink: 0, marginTop: 2 }}>→</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>{ins}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14} color="var(--clr-warning)" /> Recommendations</h4>
                    {(selectedDoc.details.recommendations || []).map((rec, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, padding: '8px 10px', background: 'rgba(245,158,11,0.06)', borderRadius: 'var(--r-sm)' }}>
                        <span style={{ color: 'var(--clr-warning)', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>{rec}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)', border: '1px solid var(--clr-border)' }}>
                    <strong>Model:</strong> {selectedDoc.details.model} &nbsp;|&nbsp;
                    <strong>Features:</strong> {selectedDoc.details.features} &nbsp;|&nbsp;
                    <strong>Accuracy:</strong> {selectedDoc.details.accuracy}
                  </div>
                </div>
              )}

              {/* SWOT Details */}
              {selectedDoc.type === 'SWOT Analysis' && selectedDoc.details && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { key: 'strengths', label: '💪 Strengths', color: '#10b981' },
                    { key: 'weaknesses', label: '⚠️ Weaknesses', color: '#ef4444' },
                    { key: 'opportunities', label: '🚀 Opportunities', color: '#6366f1' },
                    { key: 'threats', label: '🔥 Threats', color: '#f59e0b' },
                  ].map(s => (
                    <div key={s.key} style={{ padding: 12, background: `${s.color}08`, borderRadius: 'var(--r-md)', border: `1px solid ${s.color}20` }}>
                      <h4 style={{ color: s.color, fontWeight: 700, marginBottom: 8, fontSize: '0.82rem' }}>{s.label}</h4>
                      {(selectedDoc.details[s.key] || []).map((item, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--clr-text-secondary)', marginBottom: 6, display: 'flex', gap: 6 }}>
                          <span style={{ color: s.color, flexShrink: 0 }}>→</span> {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Health Check Details */}
              {selectedDoc.type === 'Health Check' && selectedDoc.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(selectedDoc.details.metrics || []).map(m => (
                    <div key={m.label}>
                      <div className="flex-between" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.label}</span>
                        <span style={{ fontWeight: 800, color: m.score >= 85 ? 'var(--clr-success)' : m.score >= 70 ? '#6366f1' : 'var(--clr-warning)', fontFamily: "'Space Grotesk',sans-serif" }}>{m.score}%</span>
                      </div>
                      <div className="progress-bar" style={{ marginBottom: 4 }}>
                        <div className="progress-fill" style={{ width: `${m.score}%`, background: m.score >= 85 ? 'var(--clr-success)' : m.score >= 70 ? '#6366f1' : 'var(--clr-warning)' }} />
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{m.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
              <p>Select a document from the list to view its report details</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
