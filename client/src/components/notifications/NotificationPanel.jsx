import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, X, Filter,
  Calendar, Award, CheckCircle, Megaphone, Settings
} from 'lucide-react';
import { useNotifications, NOTIF_META } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Filter tabs ────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',          label: 'الكل',    icon: Bell      },
  { key: 'new_event',    label: 'فعاليات', icon: Calendar  },
  { key: 'registration', label: 'تسجيل',   icon: CheckCircle },
  { key: 'badge',        label: 'شارات',   icon: Award     },
  { key: 'announcement', label: 'إعلانات', icon: Megaphone },
];

// ── Relative time formatter ────────────────────────────────────
const timeAgo = (dateStr) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ar });
  } catch {
    return '';
  }
};

// ── Single notification item ───────────────────────────────────
function NotifItem({ notif, onRead, onDelete, onClose }) {
  const meta = NOTIF_META[notif.type] || NOTIF_META.system;
  const isUnread = !notif.is_read;

  const handleClick = () => {
    if (isUnread) onRead(notif.id);
  };

  // Build link based on type + related_id
  const getLink = () => {
    if (notif.related_type === 'event' && notif.related_id) {
      return `/events/${notif.related_id}`;
    }
    return null;
  };

  const link = getLink();
  const WrapTag = link ? Link : 'div';
  const wrapProps = link ? { to: link, onClick: () => { handleClick(); onClose(); } } : { onClick: handleClick };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl mx-2 mb-1 cursor-pointer transition-all duration-200 group ${
        isUnread
          ? 'bg-brand-50 hover:bg-brand-100'
          : 'hover:bg-slate-50'
      }`}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className={`absolute top-3.5 right-2 w-2 h-2 rounded-full ${meta.dot} flex-shrink-0`} />
      )}

      {/* Emoji icon */}
      <WrapTag {...wrapProps} className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${meta.color}`}>
          {meta.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug line-clamp-2 ${isUnread ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
            {notif.title}
          </p>
          {notif.message && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{notif.message}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-400">{timeAgo(notif.created_at)}</span>
            {link && (
              <span className="text-[10px] text-brand-500 font-semibold">← عرض التفاصيل</span>
            )}
          </div>
        </div>
      </WrapTag>

      {/* Delete button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 text-slate-300 hover:text-red-500 transition-all duration-200 flex-shrink-0 mt-0.5"
        title="حذف"
      >
        <X size={12} />
      </motion.button>
    </motion.div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────
export default function NotificationPanel({ onClose }) {
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead,
    deleteNotification, clearRead,
  } = useNotifications();

  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadFiltered = filtered.filter(n => !n.is_read).length;

  return (
    <div
      className="w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
      style={{ maxHeight: '80vh' }}
    >

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-gradient-to-l from-brand-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-hero-gradient flex items-center justify-center shadow-sm">
            <Bell size={13} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-none">الإشعارات</p>
            {unreadCount > 0 && (
              <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
                {unreadCount} غير مقروء
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
              title="تحديد الكل كمقروء"
            >
              <CheckCheck size={13} />
              قراءة الكل
            </motion.button>
          )}
          {notifications.some(n => n.is_read) && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearRead}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="حذف المقروءة"
            >
              <Trash2 size={12} />
            </motion.button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 px-3 py-2 border-b border-slate-50 overflow-x-auto custom-scroll">
        {FILTERS.map(({ key, label, icon: Icon }) => {
          const count = key === 'all'
            ? unreadCount
            : notifications.filter(n => n.type === key && !n.is_read).length;

          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                filter === key
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <Icon size={11} />
              {label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  filter === key ? 'bg-white/30' : 'bg-white text-brand-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Notification List ────────────────────────────────── */}
      <div className="overflow-y-auto custom-scroll py-2" style={{ maxHeight: 'calc(80vh - 140px)' }}>
        {loading ? (
          <div className="space-y-2 px-2 py-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3 px-2">
                <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-4/5" />
                  <div className="skeleton h-2 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-12 text-slate-400 gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Bell size={24} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-500 text-sm">لا توجد إشعارات</p>
              <p className="text-xs mt-0.5">ستظهر الإشعارات هنا عند وصولها</p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filtered.map(notif => (
              <NotifItem
                key={notif.id}
                notif={notif}
                onRead={markAsRead}
                onDelete={deleteNotification}
                onClose={onClose}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            {notifications.length} إشعار إجمالي
          </span>
          <span className="text-xs text-slate-400">
            يتجدد كل 30 ثانية
          </span>
        </div>
      )}
    </div>
  );
}
