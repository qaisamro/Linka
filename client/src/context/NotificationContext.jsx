import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsAPI } from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

// ─── Subtle notification sound using Web Audio API ───────────────────────────
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);           // A5
    oscillator.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.08); // C#6
    oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.15); // E6

    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.55);
  } catch {
    // Silently ignore if AudioContext is blocked
  }
};

// ─── Type meta (icon + colors) ───────────────────────────────────────────────
export const NOTIF_META = {
  registration: { emoji: '📋', label: 'تسجيل', color: 'bg-[#F9F5F0] text-[#344F1F]', dot: 'bg-[#F4991A]' },
  new_event: { emoji: '🎉', label: 'فعالية', color: 'bg-[#F9F5F0] text-[#344F1F]', dot: 'bg-[#F4991A]' },
  attendance: { emoji: '✅', label: 'حضور', color: 'bg-[#F9F5F0] text-[#344F1F]', dot: 'bg-[#F4991A]' },
  badge: { emoji: '🏅', label: 'شارة', color: 'bg-[#F9F5F0] text-[#F4991A]', dot: 'bg-[#F4991A]' },
  system: { emoji: '🔔', label: 'نظام', color: 'bg-[#F9F5F0] text-[#344F1F]', dot: 'bg-[#F4991A]' },
  announcement: { emoji: '📢', label: 'إعلان', color: 'bg-[#F9F5F0] text-[#344F1F]', dot: 'bg-[#F4991A]' },
};

// ─── Provider ────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const { isAuth } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const prevIdsRef = useRef(new Set());
  const isFirstFetch = useRef(true);

  // ── Fetch notifications from server ──────────────────────────────────────
  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (!isAuth) return;
    if (showLoader) setLoading(true);

    try {
      const res = await notificationsAPI.getAll({ limit: 40 });
      const list = res.data.notifications || [];
      const unread = res.data.unread || 0;

      // Detect new unread notifications since last fetch
      if (!isFirstFetch.current) {
        const newUnread = list.filter(n => !n.is_read && !prevIdsRef.current.has(n.id));
        if (newUnread.length > 0) {
          playNotificationSound();
        }
      }

      // Update seen IDs set
      prevIdsRef.current = new Set(list.map(n => n.id));
      isFirstFetch.current = false;

      setNotifications(list);
      setUnreadCount(unread);
    } catch {
      // Silent fail during polling
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [isAuth]);

  // ── Initial fetch + 30-second polling ────────────────────────────────────
  useEffect(() => {
    if (!isAuth) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 30_000);
    return () => clearInterval(interval);
  }, [isAuth, fetchNotifications]);

  // ── Mark single notification as read ─────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, []);

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }, []);

  // ── Delete a single notification ─────────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    try {
      const target = notifications.find(n => n.id === id);
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, [notifications]);

  // ── Clear all read notifications ─────────────────────────────────────────
  const clearRead = useCallback(async () => {
    try {
      await notificationsAPI.clearRead();
      setNotifications(prev => prev.filter(n => !n.is_read));
    } catch { /* ignore */ }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      panelOpen,
      setPanelOpen,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};
