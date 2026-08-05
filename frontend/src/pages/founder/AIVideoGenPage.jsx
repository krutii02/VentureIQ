import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Play, Pause, Download, RefreshCw, Sparkles, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useStartup } from '../../context/StartupContext';

export default function AIVideoGenPage() {
  const { startup } = useStartup();

  const [config, setConfig] = useState({
    companyName: startup.name || 'QuickRoom',
    industry: startup.industry || 'Healthcare',
    avatar: 'professional_male',
    tone: 'confident',
    duration: '60',
    language: 'English',
    script: ''
  });

  useEffect(() => {
    if (startup) {
      setConfig(p => ({
        ...p,
        companyName: startup.name || p.companyName,
        industry: startup.industry || p.industry
      }));
    }
  }, [startup]);

  const [stage, setStage] = useState('idle'); // idle | scripting | generating | done
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const generateScript = async () => {
    setStage('scripting');
    await new Promise(r => setTimeout(r, 1200));

    const comp = config.companyName || 'MyStartup';
    const ind = config.industry || 'Technology';
    const lang = config.language;
    const tone = config.tone;

    const scriptsByTone = {
      confident: `Hello! I'm the founder of ${comp}, an AI-powered platform transforming the ${ind} market.

We've engineered state-of-the-art machine learning models that optimize operational workflows with 98% accuracy — cutting overhead costs by 40% while doubling revenue velocity.

In recent months, we've scaled our active user base with high month-over-month retention. We're currently raising Series A capital to expand into 15 new metropolitan hubs and scale our core AI features.

Join us as we accelerate growth and redefine leadership in ${ind}!`,
      friendly: `Hi there! Welcome to ${comp}. We're on a mission to bring intelligent, easy-to-use ${ind} tools to thousands of businesses.

Our platform helps teams solve critical pain points in minutes rather than weeks. Customer feedback has been incredible, and our growth trajectory is surging.

We're raising our next funding round to hire top engineering talent and reach more partners. Thank you for tuning in to our journey with ${comp}!`,
      inspiring: `Imagine a world where ${ind} is seamless, intelligent, and accessible to everyone. That is the vision behind ${comp}.

We built ${comp} to solve systemic inefficiencies using proprietary AI models. Every day, our technology empowers teams to achieve unprecedented breakthroughs.

We are inviting visionary investor partners to join our ${comp} journey as we build the next multi-billion-dollar leader in ${ind}.`
    };

    const generated = scriptsByTone[tone] || scriptsByTone.confident;
    setConfig(p => ({ ...p, script: generated }));
    setStage('idle');
    toast.success(`Generated ${tone} ${lang} script for ${comp}!`);
  };

  const generateVideo = async () => {
    setStage('generating');
    await new Promise(r => setTimeout(r, 2500));
    setStage('done');
    toast.success('AI Pitch Video rendered successfully!');
  };

  const handleDownload = () => {
    toast.success('Downloading AI Pitch Video (MP4)...');
  };

  return (
    <DashboardLayout title="AI Pitch Video Generator" subtitle="Generate professional investor pitch videos with HeyGen AI avatars">
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        
        {/* Configuration Panel */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Video Configuration</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginBottom: 20 }}>Powered by HeyGen AI Avatar Technology</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Startup Name</label>
              <input className="form-input" value={config.companyName} onChange={e => setConfig(p => ({ ...p, companyName: e.target.value }))} placeholder="e.g. QuickRoom" />
            </div>

            <div className="form-group">
              <label className="form-label">Industry</label>
              <select className="form-select" value={config.industry} onChange={e => setConfig(p => ({ ...p, industry: e.target.value }))}>
                {['Healthcare', 'FinTech', 'EdTech', 'CleanTech', 'SaaS', 'E-Commerce', 'AgriTech', 'Cybersecurity', 'Logistics', 'Robotics'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">AI Avatar Presenter</label>
              <select className="form-select" value={config.avatar} onChange={e => setConfig(p => ({ ...p, avatar: e.target.value }))}>
                <option value="professional_male">Alex — Executive Male</option>
                <option value="professional_female">Priya — Executive Female</option>
                <option value="casual_male">Jordan — Founder Male</option>
                <option value="casual_female">Sophie — Founder Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Voice Tone & Style</label>
              <select className="form-select" value={config.tone} onChange={e => setConfig(p => ({ ...p, tone: e.target.value }))}>
                <option value="confident">Confident & Professional</option>
                <option value="friendly">Friendly & Approachable</option>
                <option value="inspiring">Inspiring & Visionary</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Duration</label>
              <select className="form-select" value={config.duration} onChange={e => setConfig(p => ({ ...p, duration: e.target.value }))}>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
                <option value="120">2 minutes</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-select" value={config.language} onChange={e => setConfig(p => ({ ...p, language: e.target.value }))}>
                {['English', 'Hindi', 'Spanish', 'French', 'German', 'Mandarin'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <button className="btn btn-secondary" onClick={generateScript} disabled={stage === 'scripting' || stage === 'generating'} style={{ width: '100%', height: 42 }}>
              {stage === 'scripting' ? (
                <><span style={{ width: 14, height: 14, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--clr-accent-1)', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} /> Generating Custom Script…</>
              ) : (
                <><Sparkles size={14} /> Auto-Generate Script</>
              )}
            </button>
          </div>
        </div>

        {/* Script & Interactive Video Player Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Script Editor */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Script Editor</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{config.script.length} characters</span>
            </div>
            <textarea
              className="form-input"
              rows={7}
              placeholder="Click 'Auto-Generate Script' or type your custom pitch script here…"
              value={config.script}
              onChange={e => setConfig(p => ({ ...p, script: e.target.value }))}
              style={{ resize: 'vertical', lineHeight: 1.7 }}
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: 14, width: '100%', height: 44 }}
              onClick={generateVideo}
              disabled={!config.script.trim() || stage === 'generating'}
            >
              {stage === 'generating' ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite', display: 'inline-block' }} /> Rendering HeyGen Avatar Video…</>
              ) : (
                <><Video size={15} /> Render AI Pitch Video</>
              )}
            </button>
          </div>

          {/* Interactive Player Screen */}
          <AnimatePresence>
            {stage === 'generating' && (
              <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 48 }}>
                <div className="animate-pulse-glow" style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px' }}>🎬</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>HeyGen AI is generating your video</h3>
                <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.88rem' }}>Synthesis avatar speech in {config.language} ({config.tone} tone)…</p>
                <div className="progress-bar" style={{ maxWidth: 300, margin: '20px auto 0' }}>
                  <div className="progress-fill" style={{ width: '75%' }} />
                </div>
              </motion.div>
            )}

            {stage === 'done' && (
              <motion.div className="card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={18} color="var(--clr-success)" />
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>AI Video Rendered — {config.companyName} Pitch</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setStage('idle')}><RefreshCw size={13} /> Edit Script</button>
                    <button className="btn btn-primary btn-sm" onClick={handleDownload}><Download size={13} /> Download MP4</button>
                  </div>
                </div>

                {/* Simulated Interactive Video Screen */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(10,14,26,0.95), rgba(20,25,45,0.95))',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--r-lg)',
                    height: 300,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    padding: 20
                  }}
                >
                  {/* Top Video Overlay Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>1080p HD • AI Avatar ({config.avatar})</span>
                    <button onClick={() => setIsMuted(!isMuted)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                  </div>

                  {/* Center Avatar Graphic & Play Button */}
                  <div style={{ textAlign: 'center', zIndex: 10 }}>
                    <div
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: isPlaying ? 'rgba(16,185,129,0.85)' : 'var(--grad-brand)',
                        margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 35px rgba(99,102,241,0.5)', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {isPlaying ? <Pause size={30} fill="#fff" color="#fff" /> : <Play size={30} fill="#fff" color="#fff" style={{ marginLeft: 4 }} />}
                    </div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.92rem' }}>
                      {isPlaying ? `Playing ${config.companyName} Pitch Video…` : 'Click to Play Pitch Video'}
                    </p>
                    <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{config.duration}s • {config.language} • {config.tone}</p>
                  </div>

                  {/* Bottom Audio Wave Progress Bar */}
                  <div style={{ zIndex: 10 }}>
                    <div className="progress-bar" style={{ height: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.1)' }}>
                      <div className="progress-fill" style={{ width: isPlaying ? '65%' : '0%', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
