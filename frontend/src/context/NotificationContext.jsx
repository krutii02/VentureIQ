import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { startupsAPI } from '../services/api';
import { getOpenedMeetingIds, markMeetingAsOpened } from '../services/unreadTracker';

const NotificationContext = createContext(null);

const POLL_INTERVAL = 10_000; // 10 seconds

/**
 * Centralised notification provider.
 *
 * – Polls the backend every 10 s for new meeting requests / responses.
 * – Compares against the "opened" set to compute unread count.
 * – Fires the existing `ventureiq_notification_added` DOM event so
 *   other components (Sidebar badges, Dashboard activity) stay in sync.
 */
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Tracks the most-recent set of IDs so we can detect genuinely new items
  const prevIdsRef = useRef(new Set());
  const intervalRef = useRef(null);

  /* ── Fetch from backend + reconcile ───────────────────────────── */
  const fetchNotifications = useCallback(async () => {
    if (!user?.role) return;

    const token = localStorage.getItem('ventureiq_token');
    if (!token) return;

    try {
      let items = [];

      if (user.role === 'FOUNDER') {
        const res = await startupsAPI.getMeetings();
        const data = Array.isArray(res.data) ? res.data : [];
        items = data.map(m => ({
          id: m.id,
          title: `Meeting request from ${m.investor_name}`,
          investor_name: m.investor_name,
          investor_email: m.investor_email,
          firm: m.firm || 'Independent',
          startup: m.startup,
          startup_id: m.startup_id,
          message: m.message || 'Interested in your startup',
          status: m.status,
          time: m.time || 'Recently',
          type: 'meeting',
        }));
      } else if (user.role === 'INVESTOR') {
        const res = await startupsAPI.getMeetingsSent();
        const data = Array.isArray(res.data) ? res.data : [];
        items = data.map(m => ({
          id: m.id,
          title: m.founder_reply
            ? `${m.startup_name || 'Founder'} replied to your request`
            : `Meeting request to ${m.startup_name || 'Startup'}`,
          startup: m.startup_name,
          startup_id: m.startup_id,
          firm: m.startup_name,
          message: m.founder_reply || m.message || 'Pending response',
          status: m.status,
          time: m.time || m.created_at || 'Recently',
          type: m.founder_reply ? 'meeting_response' : 'meeting_sent',
        }));
      }

      // Mark unread based on opened-meetings tracker
      const openedSet = getOpenedMeetingIds();
      const withUnread = items.map(n => ({
        ...n,
        unread: !openedSet.has(String(n.id)),
      }));

      setNotifications(withUnread);
      setUnreadCount(withUnread.filter(n => n.unread).length);

      // Check if there are any genuinely new items since last poll
      const currentIds = new Set(items.map(n => String(n.id)));
      const prevIds = prevIdsRef.current;
      const hasNew = items.some(n => !prevIds.has(String(n.id)));

      if (hasNew && prevIds.size > 0) {
        // New notification arrived — notify other components
        window.dispatchEvent(new Event('ventureiq_notification_added'));
      }

      prevIdsRef.current = currentIds;
    } catch {
      // Backend offline — keep existing state
    }
  }, [user?.role]);

  /* ── Start / stop polling ─────────────────────────────────────── */
  useEffect(() => {
    if (!user?.role) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Poll
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    // Also listen for local events (same-tab actions)
    const onLocalEvent = () => fetchNotifications();
    window.addEventListener('ventureiq_notification_added', onLocalEvent);
    window.addEventListener('ventureiq_opened_meetings_changed', onLocalEvent);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('ventureiq_notification_added', onLocalEvent);
      window.removeEventListener('ventureiq_opened_meetings_changed', onLocalEvent);
    };
  }, [user?.role, fetchNotifications]);

  /* ── Actions ──────────────────────────────────────────────────── */
  const markAllRead = useCallback(() => {
    notifications.forEach(n => markMeetingAsOpened(n.id));
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
  }, [notifications]);

  const markRead = useCallback((id) => {
    markMeetingAsOpened(id);
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, unread: false } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      refresh,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
