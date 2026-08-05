import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startupsAPI } from '../services/api';

const StartupContext = createContext(null);

export function StartupProvider({ children }) {
  const [startup, setStartupState] = useState(null);   // null = no startup yet (new founder)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load from backend on mount
  const loadStartup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await startupsAPI.mine();
      // Backend returns null (HTTP 200 with null body) when no startup exists
      setStartupState(res.data || null);
    } catch (err) {
      // Backend offline — try localStorage as fallback
      try {
        const saved = localStorage.getItem('ventureiq_founder_startup');
        setStartupState(saved ? JSON.parse(saved) : null);
      } catch {
        setStartupState(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ventureiq_token');
    if (token) {
      loadStartup();
    } else {
      setLoading(false);
    }
  }, [loadStartup]);

  /**
   * Save/update the founder's startup to the DB.
   * Normalises the revenue and burn_rate fields for backward-compat.
   */
  const updateStartup = async (newData) => {
    try {
      const res = await startupsAPI.saveMyStartup(newData);
      const saved = res.data;
      setStartupState(saved);
      // Keep localStorage copy as offline fallback
      localStorage.setItem('ventureiq_founder_startup', JSON.stringify(saved));
      // Re-fetch from backend to ensure full data (including computed fields)
      await loadStartup();
      return saved;
    } catch (err) {
      // Offline fallback — save locally only
      const updated = { ...startup, ...newData };
      setStartupState(updated);
      localStorage.setItem('ventureiq_founder_startup', JSON.stringify(updated));
      return updated;
    }
  };

  // Convenience getter — returns numeric revenue for charts
  const startupWithMeta = startup
    ? {
        ...startup,
        revenue_num: parseFloat(String(startup.revenue || '0').replace(/[^0-9.]/g, '')) || 0,
        burn_rate: startup.burn_rate || 0,
        team: startup.team_size || 0,
        risk: startup.risk_level || 'Medium',
      }
    : null;

  return (
    <StartupContext.Provider value={{ startup: startupWithMeta, rawStartup: startup, updateStartup, loadStartup, loading, error }}>
      {children}
    </StartupContext.Provider>
  );
}

export function useStartup() {
  const ctx = useContext(StartupContext);
  if (!ctx) throw new Error('useStartup must be used within StartupProvider');
  return ctx;
}
