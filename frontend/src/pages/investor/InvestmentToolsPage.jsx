import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, BarChart3, DollarSign, Clock, Target } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { toolsAPI } from '../../services/api';

export default function InvestmentToolsPage() {
  /* ROI Calculator State */
  const [roi, setRoi] = useState({
    investment: 500000,
    valuation: 8500000,
    exitVal: 85000000,
    years: 5,
    ownership: 8
  });
  const [roiResult, setRoiResult] = useState(null);

  /* Break-even Calculator State */
  const [be, setBe] = useState({
    fixedCosts: 280000,
    variableCost: 45,
    sellingPrice: 120
  });
  const [beResult, setBeResult] = useState(null);

  const calcROI = async () => {
    try {
      const res = await toolsAPI.calculateROI(roi);
      setRoiResult(res.data);
    } catch {
      const inv = Math.max(1, Number(roi.investment) || 0);
      const exitVal = Math.max(0, Number(roi.exitVal) || 0);
      const ownershipPct = (Number(roi.ownership) || 0) / 100;
      const years = Math.max(1, Number(roi.years) || 1);
      const exitReturnVal = exitVal * ownershipPct;
      const moicVal = inv > 0 ? (exitReturnVal / inv) : 0;
      let irrVal = 0;
      if (moicVal > 0 && years > 0) {
        irrVal = (Math.pow(moicVal, 1 / years) - 1) * 100;
      }
      setRoiResult({
        multiple: moicVal.toFixed(2),
        irr: irrVal.toFixed(1),
        exitReturn: Math.round(exitReturnVal).toLocaleString(),
        moic: moicVal.toFixed(2),
      });
    }
  };

  const calcBreakeven = async () => {
    try {
      const res = await toolsAPI.calculateBreakeven(be);
      setBeResult(res.data);
    } catch {
      const fc = Math.max(0, Number(be.fixedCosts) || 0);
      const vc = Math.max(0, Number(be.variableCost) || 0);
      const sp = Math.max(0, Number(be.sellingPrice) || 0);
      const marginPerUnit = sp - vc;
      if (marginPerUnit <= 0) {
        setBeResult({ units: 'N/A (Selling price <= Variable cost)', revenue: 0, months: 'N/A' });
        return;
      }
      const units = Math.ceil(fc / marginPerUnit);
      const revenue = units * sp;
      const estimatedMonths = Math.ceil(fc / (marginPerUnit * 100));
      setBeResult({
        units: units.toLocaleString(),
        revenue: Math.ceil(revenue).toLocaleString(),
        months: Math.max(1, estimatedMonths)
      });
    }
  };

  return (
    <DashboardLayout title="Investment Tools" subtitle="ROI calculators and financial analysis tools">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ROI Calculator */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💰</div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>ROI Calculator</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>Estimate your return on investment</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Investment Amount ($)', key: 'investment', placeholder: 'e.g. 500000' },
              { label: 'Current Valuation ($)', key: 'valuation', placeholder: 'e.g. 8500000' },
              { label: 'Expected Exit Valuation ($)', key: 'exitVal', placeholder: 'e.g. 85000000' },
              { label: 'Investment Horizon (years)', key: 'years', placeholder: 'e.g. 5' },
              { label: 'Equity Stake (%)', key: 'ownership', placeholder: 'e.g. 8' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={f.placeholder}
                  value={roi[f.key]}
                  onChange={e => setRoi(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={calcROI}>
            <Calculator size={15} /> Calculate ROI
          </button>

          {roiResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Return Multiple', value: `${roiResult.multiple}x`, color: 'var(--clr-accent-1)', icon: '📈' },
                { label: 'IRR (Annualized)', value: `${roiResult.irr}%`, color: 'var(--clr-success)', icon: '🎯' },
                { label: 'Exit Payout', value: `$${roiResult.exitReturn}`, color: 'var(--clr-warning)', icon: '💵' },
                { label: 'MOIC', value: `${roiResult.moic}x`, color: '#8b5cf6', icon: '⚡' },
              ].map(r => (
                <div key={r.label} style={{ textAlign: 'center', padding: '14px', background: `${r.color}10`, borderRadius: 'var(--r-md)', border: `1px solid ${r.color}30` }}>
                  <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{r.icon}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: r.color, fontFamily: "'Space Grotesk',sans-serif" }}>{r.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Break-even Calculator */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📊</div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Break-Even Calculator</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>When does the startup become profitable?</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Monthly Fixed Costs ($)', key: 'fixedCosts', placeholder: 'e.g. 280000' },
              { label: 'Variable Cost per Unit ($)', key: 'variableCost', placeholder: 'e.g. 45' },
              { label: 'Selling Price per Unit ($)', key: 'sellingPrice', placeholder: 'e.g. 120' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={f.placeholder}
                  value={be[f.key]}
                  onChange={e => setBe(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            {/* Explanation */}
            <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
              💡 <strong style={{ color: 'var(--clr-text-secondary)' }}>Contribution Margin:</strong> ${be.sellingPrice - be.variableCost} per unit<br />
              <strong style={{ color: 'var(--clr-text-secondary)' }}>Margin Ratio:</strong> {be.sellingPrice > 0 ? (((be.sellingPrice - be.variableCost) / be.sellingPrice) * 100).toFixed(1) : 0}%
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)' }} onClick={calcBreakeven}>
            <BarChart3 size={15} /> Calculate Break-Even
          </button>

          {beResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Units Needed', value: beResult.units, color: 'var(--clr-accent-1)', icon: '📦' },
                  { label: 'Break-Even Revenue', value: `$${beResult.revenue}`, color: 'var(--clr-success)', icon: '💵' },
                  { label: 'Est. Months', value: `${beResult.months} mo`, color: 'var(--clr-warning)', icon: '📅' },
                ].map(r => (
                  <div key={r.label} style={{ textAlign: 'center', padding: '12px 8px', background: `${r.color}10`, borderRadius: 'var(--r-md)', border: `1px solid ${r.color}30` }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{r.icon}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: r.color, fontFamily: "'Space Grotesk',sans-serif" }}>{r.value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{r.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 6 }}>
                  <span>Current Progress (assumed 40%)</span>
                  <span style={{ color: 'var(--clr-warning)' }}>40%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '40%', background: 'linear-gradient(90deg,#f59e0b,#10b981)' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Valuation Reference Card */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📐 Valuation Benchmarks by Stage</h3>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr><th>Stage</th><th>Typical Valuation</th><th>Equity Dilution</th><th>Revenue Req.</th><th>Risk</th><th>Expected Return</th></tr>
            </thead>
            <tbody>
              {[
                { stage: 'Pre-Seed', val: '$500K–$2M', equity: '15–25%', rev: '$0–$10K MRR', risk: 'Very High', ret: '50–100x' },
                { stage: 'Seed', val: '$2M–$10M', equity: '10–20%', rev: '$10K–$100K MRR', risk: 'High', ret: '20–50x' },
                { stage: 'Series A', val: '$10M–$50M', equity: '15–25%', rev: '$100K–$1M MRR', risk: 'Medium', ret: '10–25x' },
                { stage: 'Series B', val: '$50M–$200M', equity: '10–20%', rev: '$1M–$5M MRR', risk: 'Lower', ret: '5–15x' },
                { stage: 'Series C+', val: '$200M+', equity: '5–15%', rev: '$5M+ MRR', risk: 'Low', ret: '3–8x' },
              ].map(r => (
                <tr key={r.stage}>
                  <td style={{ fontWeight: 600 }}>{r.stage}</td>
                  <td style={{ color: 'var(--clr-success)' }}>{r.val}</td>
                  <td style={{ color: 'var(--clr-warning)' }}>{r.equity}</td>
                  <td style={{ color: 'var(--clr-text-secondary)' }}>{r.rev}</td>
                  <td><span className={`badge ${r.risk === 'Low' ? 'badge-success' : r.risk === 'Lower' ? 'badge-info' : r.risk === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{r.risk}</span></td>
                  <td style={{ color: 'var(--clr-accent-1)', fontWeight: 700 }}>{r.ret}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
