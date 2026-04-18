import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const { unreadCount, panelOpen, setPanelOpen } = useNotifications();
  const wrapRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setPanelOpen]);

  return (
    <div ref={wrapRef} className="relative flex-shrink-0">

      {/* ── Bell Button ──────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setPanelOpen(v => !v)}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          panelOpen
            ? 'bg-brand-100 text-brand-700'
            : 'text-slate-500 hover:text-brand-700 hover:bg-brand-50'
        }`}
        aria-label="الإشعارات"
      >
        <AnimatePresence mode="wait" initial={false}>
          {unreadCount > 0 ? (
            <motion.div
              key="ringing"
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <BellRing size={20} className="animate-bounce-soft" />
            </motion.div>
          ) : (
            <motion.div key="silent" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Bell size={20} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full px-1 shadow-md border border-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 z-[70]"
            style={{ transformOrigin: 'top left' }}
          >
            <NotificationPanel onClose={() => setPanelOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
