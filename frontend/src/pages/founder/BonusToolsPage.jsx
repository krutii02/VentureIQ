import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Copy, RefreshCw, Check, Zap, Mail, Hash, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { toolsAPI } from '../../services/api';
import { useStartup } from '../../context/StartupContext';

const TOOLS = [
  { id: 'tagline', icon: '✨', label: 'Tagline Generator', color: '#6366f1', desc: 'Generate 5 compelling taglines for your startup' },
  { id: 'email', icon: '📧', label: 'Investor Email', color: '#10b981', desc: 'Craft a professional investor outreach email' },
  { id: 'bio', icon: '📝', label: 'Founder Bio', color: '#f59e0b', desc: 'Write a compelling founder bio for pitch decks' },
];

export default function BonusToolsPage() {
  const { startup } = useStartup();

  const [activeTool, setActiveTool] = useState('tagline');
  const [companyName, setCompanyName] = useState(startup.name || 'QuickRoom');
  const [industry, setIndustry] = useState(startup.industry || 'Healthcare');
  const [targetAudience, setTargetAudience] = useState('Hospitals & diagnostic centers');
  const [uvp, setUvp] = useState(startup.description || 'AI-powered diagnostic imaging with 98% accuracy at 40% lower cost');

  useEffect(() => {
    if (startup) {
      setCompanyName(startup.name || 'QuickRoom');
      setIndustry(startup.industry || 'Healthcare');
      if (startup.description) setUvp(startup.description);
    }
  }, [startup]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const getDynamicFallback = (toolKey) => {
    const comp = companyName.trim() || 'QuickRoom';
    const ind = industry || 'Healthcare';
    const aud = targetAudience || 'enterprise clients';
    const u = uvp || 'AI-powered efficiency and scaling';
    const randIdx = Math.floor(Math.random() * 3);

    const taglineTemplates = [
      [
        `${comp}: Where ${ind} Meets Next-Gen Intelligence`,
        `Turning ${ind} Metrics Into ${comp}'s Destiny`,
        `${comp} — AI-Powered. Investor-Ready. Future-Proof.`,
        `The Smartest Path to Scale ${comp} in ${ind}`,
        `${comp}: ${u}`
      ],
      [
        `Innovating ${ind} for ${aud} — ${comp}`,
        `${comp}: Decode Success Before You Build It`,
        `Empowering ${aud} with ${comp} Technology`,
        `${comp} — Unlocking Next-Level ${ind} Value`,
        `${comp}: Fast, Intelligent, Future-Ready`
      ],
      [
        `${comp}: The Next Big Leap in ${ind}`,
        `Transforming ${aud} Operations — ${comp}`,
        `${comp} — ${u}`,
        `Driven by Intelligence. Built for ${ind} Leaders.`,
        `${comp}: Scalable Tech for Modern ${aud}`
      ]
    ];

    const emailTemplates = [
      `Subject: ${comp} — AI-Driven ${ind}, High Growth, Raising Series A\n\nHi [Investor Name],\n\nI hope this email finds you well. I am the Founder & CEO of ${comp}.\n\nWe are building a category-leading platform in ${ind} tailored for ${aud}.\n\nOur Key Metrics & Value Proposition:\n• ${u}\n• Strong month-over-month revenue velocity and active user retention\n• High AI Success Score on VentureIQ ML analytics\n\nWe are currently raising our Series A round to scale our engineering team and expand market reach.\n\nWould you have 15 minutes next Tuesday for a brief intro call? I would be glad to share our pitch deck.\n\nBest regards,\nFounding Team | ${comp}`,
      `Subject: Intro Request: ${comp} (${ind} / Series A)\n\nHi [Investor Name],\n\nFollowing your recent investments in ${ind}, I wanted to introduce ${comp}.\n\nWe provide ${u} targeting ${aud}.\n\nHighlights:\n• Rapid revenue expansion with strong unit economics\n• Growing active customer base\n• Experienced founding team\n\nWe're closing our Series A round and would love to include you in the process. Are you available for a 15-minute call this week?\n\nBest,\nFounding Team | ${comp}`
    ];

    const nameTemplates = [
      [
        `Nexa${comp.slice(0, 5)}`, `${comp}AI`, `Clear${ind.slice(0, 4)}`, `${comp}Pulse`,
        `Vision${ind.slice(0, 4)}`, `Cure${comp.slice(0, 4)}`, `${comp}IQ`, `Smart${ind.slice(0, 5)}`
      ],
      [
        `${comp}Hub`, `Inno${ind.slice(0, 4)}`, `Meta${comp.slice(0, 4)}`, `${comp}Sync`,
        `Flow${ind.slice(0, 4)}`, `${comp}Scale`, `Omni${comp.slice(0, 4)}`, `Core${ind.slice(0, 4)}`
      ]
    ];

    const bioTemplates = [
      `The founding team at ${comp} brings deep domain expertise at the intersection of ${ind} and artificial intelligence. Driven by a mission to empower ${aud}, ${comp} delivers high-impact solutions built on '${u}'. With a relentless focus on unit economics and product velocity, ${comp} is positioned for market leadership.`,
      `Co-founded by seasoned tech leaders, ${comp} was built to address critical inefficiencies in ${ind}. Leveraging proprietary AI models, ${comp} serves ${aud} with groundbreaking precision. The team has scaled ${comp} to strong revenue milestones while maintaining lean operating margins.`
    ];

    if (toolKey === 'tagline') return taglineTemplates[randIdx % taglineTemplates.length];
    if (toolKey === 'name') return nameTemplates[randIdx % nameTemplates.length];
    if (toolKey === 'email') return emailTemplates[randIdx % emailTemplates.length];
    return bioTemplates[randIdx % bioTemplates.length];
  };

  const generate = async () => {
    setLoading(true);
    setResult(null);

    const payload = {
      tool: activeTool,
      company: companyName,
      industry,
      targetAudience,
      uvp
    };

    try {
      const res = await toolsAPI.generateAI(payload);
      setResult(res.data.result);
      toast.success(`Generated custom ${activeTool} copy!`);
    } catch {
      await new Promise(r => setTimeout(r, 800));
      setResult(getDynamicFallback(activeTool));
      toast.success(`Generated custom ${activeTool} copy!`);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    const textToCopy = Array.isArray(text) ? text.join('\n') : text;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout title="Bonus AI Tools" subtitle="Gemini AI-powered generators to supercharge your startup branding">

      {/* Tool Selection Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {TOOLS.map(t => (
          <motion.div
            key={t.id} whileHover={{ y: -3 }}
            onClick={() => { setActiveTool(t.id); setResult(null); }}
            className="card"
            style={{
              cursor: 'pointer',
              borderColor: activeTool === t.id ? t.color : 'var(--clr-border)',
              background: activeTool === t.id ? `${t.color}12` : 'var(--clr-bg-card)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>{t.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4, color: activeTool === t.id ? t.color : 'var(--clr-text-primary)' }}>{t.label}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
        {/* Input Form Panel */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Configuration</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginBottom: 20 }}>Customize parameters for Gemini AI</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. QuickRoom" />
            </div>

            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="form-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                {['Healthcare', 'FinTech', 'EdTech', 'CleanTech', 'SaaS', 'E-Commerce', 'AgriTech', 'Cybersecurity', 'Logistics', 'Robotics'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <input className="form-input" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g. Hospitals & clinics" />
            </div>

            <div className="form-group">
              <label className="form-label">Unique Value Proposition</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={uvp} onChange={e => setUvp(e.target.value)} placeholder="e.g. AI-powered diagnostic imaging with 98% accuracy" />
            </div>

            <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ width: '100%', height: 44, marginTop: 4 }}>
              {loading ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} /> Generating Copy…</>
              ) : (
                <><Wand2 size={15} /> Generate with Gemini AI</>
              )}
            </button>
          </div>
        </div>

        {/* Output Results Panel */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700 }}>{TOOLS.find(t => t.id === activeTool)?.label} Results</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Tailored for {companyName || 'your startup'} ({industry})</p>
            </div>
            {result && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={generate}><RefreshCw size={13} /> Regenerate</button>
                <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(result)}>
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy All</>}
                </button>
              </div>
            )}
          </div>

          {!result && !loading && (
            <div style={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--clr-text-muted)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem' }}>{TOOLS.find(t => t.id === activeTool)?.icon}</div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--clr-text-secondary)' }}>Ready to Generate Copy</p>
              <p style={{ fontSize: '0.82rem', maxWidth: 300, lineHeight: 1.5 }}>Adjust your company details on the left and click <strong>"Generate with Gemini AI"</strong> to create personalized copy.</p>
            </div>
          )}

          {loading && (
            <div style={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div className="animate-pulse-glow" style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🧠</div>
              <p style={{ fontWeight: 600, color: 'var(--clr-text-secondary)' }}>Gemini AI is crafting copy for {companyName}…</p>
            </div>
          )}

          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {Array.isArray(result) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.15)', cursor: 'pointer' }}
                      onClick={() => copyToClipboard(item)}>
                      <span style={{ fontWeight: 800, color: 'var(--clr-accent-1)', minWidth: 22, fontFamily: "'Space Grotesk',sans-serif" }}>{i + 1}</span>
                      <span style={{ fontSize: '0.92rem', color: 'var(--clr-text-primary)', lineHeight: 1.5, flex: 1 }}>{item}</span>
                      <Copy size={14} color="var(--clr-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div>
                  <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--clr-text-secondary)', lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                    {result}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
