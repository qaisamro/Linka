import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
      if (wrapRef.current && !wrapRef.current.contains(e.target) && document.contains(e.target)) {
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
        className={`relative p-2 rounded-xl transition-all duration-200 ${panelOpen
          ? 'bg-[#F9F5F0] text-[#344F1F]'
          : 'text-[#F4991A] hover:text-[#344F1F] hover:bg-[#F9F5F0]'
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
              className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#F4991A] text-[#F9F5F0] text-[10px] font-black rounded-full px-1 shadow-md border border-[#F9F5F0]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Mobile Backdrop - Portal */}
            {createPortal(
              <div className="fixed inset-0 z-[9998] sm:hidden pointer-events-none">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPanelOpen(false)}
                  className="absolute inset-0 bg-[#344F1F]/40 backdrop-blur-sm pointer-events-auto"
                />
              </div>,
              document.body
            )}

            {/* Desktop Backdrop (non-portal for click-outside reference) */}
            <div className="hidden sm:block absolute inset-0 z-[-1]" />

            {/* Panel - Portal for Mobile, Absolute for Desktop */}
            {createPortal(
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col sm:hidden"
              >
                <NotificationPanel onClose={() => setPanelOpen(false)} />
              </motion.div>,
              document.body
            )}

            {/* Desktop View (Keep in flow for positioning) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="hidden sm:flex absolute right-0 top-full mt-3 z-[9900] flex-col"
            >
              <NotificationPanel onClose={() => setPanelOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
