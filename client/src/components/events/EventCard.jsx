import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Users, ChevronLeft, Zap, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { registrationsAPI } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ── Type config: color + emoji ────────────────────────────────
const TYPE_CONFIG = {
  'تطوعية': { bg: 'bg-[#F4991A]', text: 'text-[#344F1F]', dot: 'bg-[#F9F5F0]', bar: 'bg-[#F4991A]', glow: 'shadow-[#F4991A]/25', emoji: '🤝' },
  'ثقافية': { bg: 'bg-[#344F1F]', text: 'text-[#F9F5F0]', dot: 'bg-[#F4991A]', bar: 'bg-[#344F1F]', glow: 'shadow-[#344F1F]/25', emoji: '🎭' },
  'رياضية': { bg: 'bg-[#F4991A]', text: 'text-[#344F1F]', dot: 'bg-[#344F1F]', bar: 'bg-[#F4991A]', glow: 'shadow-[#F4991A]/25', emoji: '⚽' },
  'تعليمية': { bg: 'bg-[#344F1F]', text: 'text-[#F9F5F0]', dot: 'bg-[#F4991A]', bar: 'bg-[#344F1F]', glow: 'shadow-[#344F1F]/25', emoji: '📚' },
  'بيئية': { bg: 'bg-[#F4991A]', text: 'text-[#344F1F]', dot: 'bg-[#344F1F]', bar: 'bg-[#F4991A]', glow: 'shadow-[#F4991A]/25', emoji: '🌱' },
  'اجتماعية': { bg: 'bg-[#344F1F]', text: 'text-[#F9F5F0]', dot: 'bg-[#F4991A]', bar: 'bg-[#344F1F]', glow: 'shadow-[#344F1F]/25', emoji: '🏙️' },
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
];

export default function EventCard({ event, onRegistered }) {
  const { isAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(Number(event.is_registered) > 0);

  useEffect(() => {
    setRegistered(Number(event.is_registered) > 0);
  }, [event.is_registered]);

  const tc = TYPE_CONFIG[event.type] || TYPE_CONFIG['ثقافية'];
  const fillPct = Math.min(100, Math.round((event.current_participants / event.max_participants) * 100));
  const isFull = event.current_participants >= event.max_participants;
  const remaining = event.max_participants - event.current_participants;

  const formattedDate = (() => {
    try { return format(new Date(event.date), 'EEEE، d MMMM', { locale: ar }); }
    catch { return event.date; }
  })();

  const imgSrc = event.image_url || FALLBACK_IMAGES[event.id % FALLBACK_IMAGES.length];

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isAuth) { toast.error('يجب تسجيل الدخول أولاً'); return; }
    if (isFull) { toast.error('الفعالية ممتلئة'); return; }
    setLoading(true);
    try {
      await registrationsAPI.register(event.id);
      setRegistered(true);
      toast.success('تم التسجيل بنجاح! 🎉');
      onRegistered?.();
    } catch (err) {
      const msg = err.response?.data?.error || 'حدث خطأ، حاول مجدداً';
      if (msg.includes('مسبقاً')) setRegistered(true);
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="card group overflow-hidden flex flex-col h-full hover:shadow-card-hover"
    >
      {/* ── Image Area ─────────────────────────────────── */}
      <div className="relative h-48 overflow-hidden bg-[#F2EAD3] flex-shrink-0">
        <img
          src={imgSrc}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => { e.target.src = FALLBACK_IMAGES[0]; }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        {/* Hover shimmer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top badges row */}
        <div className="absolute top-3 inset-x-3 flex justify-between items-start">
          <span className={`badge-pill ${tc.bg} ${tc.text} shadow-md shadow-black/10`}>
            <span className="text-xs">{tc.emoji}</span>
            {event.type}
          </span>
          <span className="badge-pill bg-[#344F1F]/50 text-[#F9F5F0] backdrop-blur-sm shadow-md">
            <Clock size={10} />
            {event.duration_hours}ساعة
          </span>
        </div>

        {/* Bottom of image row */}
        <div className="absolute bottom-3 inset-x-3 flex justify-between items-end">
          {event.neighborhood_name && (
            <span className="flex items-center gap-1 text-[#F9F5F0]/90 text-xs font-medium drop-shadow-sm">
              <MapPin size={11} />
              {event.neighborhood_name}
            </span>
          )}
          {!registered && !isFull && (
            <motion.span
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="flex items-center gap-1 bg-[#F4991A] text-[#344F1F] text-xs font-black px-2.5 py-1 rounded-full shadow-lg shadow-[#F4991A]/30"
            >
              <Zap size={10} />
              +10 نقاط
            </motion.span>
          )}
          {registered && (
            <span className="flex items-center gap-1 bg-[#344F1F] text-[#F9F5F0] text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              ✅ تم التقديم
            </span>
          )}
        </div>
      </div>

      {/* ── Content Area ───────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Title */}
        <h3 className="font-bold text-[#344F1F] text-base leading-snug line-clamp-2 group-hover:text-[#344F1F] transition-colors duration-200">
          {event.title}
        </h3>

        {/* Meta rows */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-[#F4991A]">
            <div className="w-5 h-5 rounded-lg bg-[#F9F5F0] flex items-center justify-center flex-shrink-0">
              <Calendar size={11} className="text-[#344F1F]" />
            </div>
            <span className="line-clamp-1 text-xs">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#F4991A]">
            <div className="w-5 h-5 rounded-lg bg-[#F9F5F0] flex items-center justify-center flex-shrink-0">
              <MapPin size={11} className="text-[#344F1F]" />
            </div>
            <span className="line-clamp-1 text-xs">{event.location_name}</span>
          </div>
        </div>

        {/* Capacity */}
        <div className="mt-auto">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1 text-[#F4991A] font-medium">
              <Users size={11} />
              {event.current_participants} مشارك
            </span>
            <span className={`font-bold text-xs ${isFull ? 'text-[#F4991A]' :
              remaining <= 5 ? 'text-[#F4991A]' :
                'text-[#344F1F]'
              }`}>
              {isFull ? '🔴 مكتمل' : remaining <= 5 ? `⚠️ ${remaining} متبقي` : `${remaining} مقعد`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-[#F9F5F0] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
              className={`h-full rounded-full ${fillPct >= 90 ? 'bg-gradient-to-r from-[#F4991A] to-[#F4991A]' :
                fillPct >= 60 ? 'bg-gradient-to-r from-[#F4991A] to-[#F4991A]' :
                  `${tc.bar}`
                }`}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRegister}
            disabled={loading || registered || isFull}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${registered
              ? 'bg-[#F9F5F0] text-[#344F1F] border-2 border-[#F2EAD3] cursor-default'
              : isFull
                ? 'bg-[#F9F5F0] text-[#F4991A] cursor-not-allowed border-2 border-[#F2EAD3]'
                : 'btn-primary'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                جاري...
              </span>
            ) : registered ? '✅ طلبك قيد المعالجة' : isFull ? 'مكتمل' : 'انضم الآن'}
          </motion.button>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to={`/events/${event.id}`}
              className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-[#F2EAD3] hover:border-[#F4991A] hover:bg-[#F9F5F0] text-[#F4991A] hover:text-[#344F1F] transition-all duration-200 flex-shrink-0"
              title="عرض التفاصيل"
            >
              <ChevronLeft size={18} />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
