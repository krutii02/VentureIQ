import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import Topbar from '../../components/common/Topbar';
import {
  ArrowLeft, MessageSquare, Globe, Link as Linkedin, BadgeCheck, MapPin,
  Briefcase, ArrowUpRight, TrendingUp, Building2, Send, X,
  ExternalLink, CheckCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

/* ── helpers ─────────────────────────────────────────────────────── */
function fmtAmount(val) {
  if (val === null || val === undefined || val === '') return '—';
  const formatted = formatCurrency(val);
  return formatted || '—';
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const PALETTE = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#14b8a6'];
function colorFor(id) { return PALETTE[(parseInt(id, 10) || 0) % PALETTE.length]; }

/* ── Message modal ─────────────────────────────────────────────────── */
function MessageModal({ to, toEmail, firmName, onClose }) {
  const [body, setBody] = useState(
    `Hi ${to},\n\nI'm reaching out after discovering ${firmName}'s profile on VentureIQ.\n\nWe would love to connect and share more about our growth metrics and traction.\n\nWould you be open to an introductory call this week?\n\nBest regards!`
  );
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handle = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);

      toast.success(`Message sent to ${to}! It will reflect in your Connections page.`);

      const newNotif = {
        id: Date.now(),
        type: 'founder_message',
        title: `Message from Founder`,
        firm: firmName || 'VC Firm',
        startup: 'QuickRoom',
        time: 'Just now',
        unread: true,
        message: `"${body.slice(0, 90)}..."`
      };
      try {
        const stored = JSON.parse(localStorage.getItem('ventureiq_notifications_investor') || '[]');
        localStorage.setItem('ventureiq_notifications_investor', JSON.stringify([newNotif, ...stored]));
        window.dispatchEvent(new Event('ventureiq_notification_added'));
      } catch {}

      setTimeout(onClose, 1000);
    }, 600);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:540, background:'var(--clr-bg-card)', border:'1px solid var(--clr-border)', borderRadius:'var(--r-xl)', boxShadow:'var(--shadow-lg)', animation:'fadeInUp 0.25s ease forwards' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderBottom:'1px solid var(--clr-border)', background:'rgba(99,102,241,0.04)' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <MessageSquare size={18} color="var(--clr-accent-1)" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:'0.92rem', color:'var(--clr-text)' }}>Message Investor</div>
            <div style={{ fontSize:'0.74rem', color:'var(--clr-text-muted)' }}>
              To: <span style={{ fontWeight:600, color:'var(--clr-text)' }}>{to}</span> ({firmName})
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--clr-text-muted)', display:'flex' }}><X size={18} /></button>
        </div>

        <div style={{ padding:'16px 20px' }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={8}
            placeholder="Type your message to the investor…"
            style={{
              width:'100%', background:'var(--clr-bg-secondary)', border:'1px solid var(--clr-border)',
              borderRadius:'var(--r-md)', outline:'none', resize:'vertical', fontSize:'0.85rem',
              lineHeight:1.6, color:'var(--clr-text)', padding:'12px 14px', fontFamily:'inherit', boxSizing:'border-box'
            }}
          />
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--clr-border)', background:'rgba(255,255,255,0.01)' }}>
          <span style={{ fontSize:'0.72rem', color:'var(--clr-text-muted)' }}>In-app message via VentureIQ</span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button onClick={handle} disabled={sending || sent || !body.trim()} className="btn btn-primary btn-sm" style={{ gap:6, minWidth:110 }}>
              {sent
                ? <><CheckCircle size={13} /> Sent!</>
                : sending
                  ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin-slow 0.6s linear infinite', display:'inline-block' }} /> Sending…</>
                  : <><Send size={13} /> Send Message</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main profile page ───────────────────────────────────────────── */
export default function InvestorProfilePage() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const [composing, setComposing] = useState(false);

  const investor = state?.investor;

  if (!investor) {
    return (
      <div className="page-layout">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--clr-text-muted)' }}>
            <Building2 size={48} style={{ opacity:0.2, marginBottom:16 }} />
            <p style={{ fontWeight:600 }}>No investor data found.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/founder/investor-match')} style={{ marginTop:12, gap:6 }}>
              <ArrowLeft size={14} /> Back to Investor Match
            </button>
          </div>
        </div>
      </div>
    );
  }

  const color = colorFor(investor.id);
  const portfolioList = investor.portfolio
    ? investor.portfolio.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  /* Handle "interest" cards that come with different field names */
  const displayName  = investor.name   || investor.contact || '—';
  const displayFirm  = investor.firm   || '—';
  const displayEmail = investor.email  || investor.contactEmail || '';

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />

        <div className="page-body" style={{ maxWidth: 920, margin: '0 auto' }}>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
            style={{ gap:6, marginBottom:20 }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Hero card */}
          <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
            {/* Colour banner */}
            <div style={{ height:8, background:`linear-gradient(90deg,${color},${color}55)` }} />

            <div style={{ padding:'28px 32px', display:'flex', alignItems:'flex-start', gap:22 }}>
              {/* Avatar */}
              <div style={{ width:72, height:72, borderRadius:'var(--r-lg)', flexShrink:0, background:`linear-gradient(135deg,${color},${color}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, color:'#fff', fontSize:'1.1rem', overflow:'hidden' }}>
                {investor.logo
                  ? <img src={investor.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }}/>
                  : initials(displayName)
                }
              </div>

              {/* Name block */}
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <h1 style={{ fontSize:'1.4rem', fontWeight:900, margin:0 }}>{displayName}</h1>
                  {investor.verified && <BadgeCheck size={18} color={color} />}
                  {investor.match && (
                    <span style={{ padding:'3px 12px', borderRadius:'var(--r-full)', background:`${color}15`, color, border:`1px solid ${color}30`, fontSize:'0.75rem', fontWeight:700 }}>
                      {investor.match}% match
                    </span>
                  )}
                </div>
                <p style={{ fontSize:'0.9rem', color:'var(--clr-text-muted)', margin:'4px 0 10px' }}>{investor.type || ''}{investor.type && displayFirm ? ' · ' : ''}{displayFirm}</p>
                {investor.locations?.length > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', color:'var(--clr-text-muted)' }}>
                    <MapPin size={13} /> {investor.locations.join(', ')}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => setComposing(true)}
                className="btn btn-primary"
                style={{ gap:8, flexShrink:0 }}
              >
                <MessageSquare size={15} /> Message Investor
              </button>
            </div>

            {/* Links row */}
            {(investor.website || investor.linkedin) && (
              <div style={{ display:'flex', gap:16, padding:'12px 32px', borderTop:'1px solid var(--clr-border)', background:'rgba(255,255,255,0.01)' }}>
                {investor.website && (
                  <a href={investor.website} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.78rem', color:'var(--clr-accent-1)', fontWeight:600, textDecoration:'none' }}>
                    <Globe size={13} /> Website <ExternalLink size={11} />
                  </a>
                )}
                {investor.linkedin && (
                  <a href={investor.linkedin} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.78rem', color:'var(--clr-accent-1)', fontWeight:600, textDecoration:'none' }}>
                    <Linkedin size={13} /> LinkedIn <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Main grid */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>

            {/* Left column */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Overview */}
              {(investor.description || investor.about) && (
                <div className="card">
                  <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Overview</h3>
                  <p style={{ fontSize:'0.86rem', color:'var(--clr-text-secondary)', lineHeight:1.8 }}>
                    {investor.about || investor.description}
                  </p>
                </div>
              )}

              {/* Thesis */}
              {investor.thesis && (
                <div className="card">
                  <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Investment Thesis</h3>
                  <div style={{ padding:'14px 16px', borderLeft:`4px solid ${color}`, background:`${color}08`, borderRadius:'0 var(--r-md) var(--r-md) 0', fontSize:'0.86rem', color:'var(--clr-text-secondary)', lineHeight:1.8 }}>
                    {investor.thesis}
                  </div>
                </div>
              )}

              {/* Investor's note (for "interested" investors) */}
              {investor.note && (
                <div className="card">
                  <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Message to You</h3>
                  <div style={{ padding:'14px 16px', borderLeft:`4px solid ${color}`, background:`${color}08`, borderRadius:'0 var(--r-md) var(--r-md) 0', fontSize:'0.86rem', color:'var(--clr-text-secondary)', lineHeight:1.8, fontStyle:'italic' }}>
                    "{investor.note}"
                  </div>
                  {investor.sentAt && (
                    <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:4, fontSize:'0.74rem', color:'var(--clr-text-muted)' }}>
                      <Clock size={11} /> Sent {investor.sentAt}
                    </div>
                  )}
                </div>
              )}

              {/* Portfolio */}
              {portfolioList.length > 0 && (
                <div className="card">
                  <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Portfolio Companies</h3>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {portfolioList.map(p => (
                      <div key={p} style={{ padding:'6px 14px', borderRadius:'var(--r-sm)', background:'rgba(255,255,255,0.04)', border:'1px solid var(--clr-border)', fontSize:'0.8rem', fontWeight:600, color:'var(--clr-text-secondary)' }}>{p}</div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right column */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Stats */}
              <div className="card">
                <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:14 }}>Track Record</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { label:'Total Investments', value: investor.total_deals || '—' },
                    { label:'Successful Exits',  value: investor.exits       || '—' },
                    { label:'Portfolio Size',    value: investor.portfolio_size || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--clr-border)' }}>
                      <span style={{ fontSize:'0.8rem', color:'var(--clr-text-muted)' }}>{label}</span>
                      <span style={{ fontWeight:800, fontSize:'1.05rem', color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment criteria */}
              <div className="card">
                <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:14 }}>Investment Criteria</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {[
                    { label:'Min Ticket',  value: fmtAmount(investor.min_amount) },
                    { label:'Max Ticket',  value: fmtAmount(investor.max_amount) },
                    { label:'Typical',     value: fmtAmount(investor.ticket_size) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.83rem', padding:'9px 0', borderBottom:'1px solid var(--clr-border)' }}>
                      <span style={{ color:'var(--clr-text-muted)' }}>{label}</span>
                      <span style={{ fontWeight:700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Focus industries */}
              {investor.industries?.length > 0 && (
                <div className="card">
                  <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Focus Industries</h3>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {investor.industries.map(f => (
                      <span key={f} style={{ padding:'4px 12px', borderRadius:'var(--r-full)', background:`${color}15`, color, border:`1px solid ${color}30`, fontSize:'0.73rem', fontWeight:700 }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred stages */}
              {investor.stages?.length > 0 && (
                <div className="card">
                  <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Preferred Stages</h3>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {investor.stages.map(s => (
                      <span key={s} style={{ padding:'4px 12px', borderRadius:'var(--r-full)', background:'rgba(255,255,255,0.05)', border:'1px solid var(--clr-border)', fontSize:'0.73rem', color:'var(--clr-text-secondary)', fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact card */}
              {displayEmail && (
                <div className="card" style={{ background:`${color}08`, border:`1px solid ${color}25` }}>
                  <h3 style={{ fontWeight:700, fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Contact</h3>
                  <div style={{ fontSize:'0.8rem', color:'var(--clr-text-secondary)', marginBottom:14 }}>{displayEmail}</div>
                  <button onClick={() => setComposing(true)} className="btn btn-primary" style={{ width:'100%', gap:8 }}>
                    <MessageSquare size={14} /> Send Message
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {composing && (
        <MessageModal
          to={displayName}
          toEmail={displayEmail}
          firmName={displayFirm}
          onClose={() => setComposing(false)}
        />
      )}
    </div>
  );
}
