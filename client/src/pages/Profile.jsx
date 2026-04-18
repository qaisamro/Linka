import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Clock, Users, Calendar, Trophy,
  LogOut, MapPin, CheckCircle, ChevronRight,
  GraduationCap, TrendingUp, Zap, Award, FileText, Share2, Camera
} from 'lucide-react';
import CVPreviewModal from '../components/profile/CVPreviewModal';
import { usersAPI, registrationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

// ── Badge gradient map ─────────────────────────────────────────
const BADGE_CONFIG = {
  '🌱': { gradient: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-300', label: 'مبادر' },
  '⭐': { gradient: 'from-yellow-400 to-amber-500', glow: 'shadow-amber-300', label: 'نجم' },
  '🏆': { gradient: 'from-amber-400 to-orange-500', glow: 'shadow-orange-300', label: 'بطل' },
  '🤝': { gradient: 'from-blue-400 to-cyan-500', glow: 'shadow-blue-300', label: 'متعاون' },
  '🎖️': { gradient: 'from-violet-400 to-purple-500', glow: 'shadow-purple-300', label: 'متميز' },
  '👑': { gradient: 'from-pink-400 to-rose-500', glow: 'shadow-pink-300', label: 'قائد' },
};

// ── Circular Progress Ring ─────────────────────────────────────
function RingProgress({ percent, size = 80, stroke = 7, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke}
          strokeLinecap="round"
          stroke="url(#progressGrad)"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.5 }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.03 }}
      className={`stat-card bg-gradient-to-br ${gradient} inner-shine`}
    >
      <div className="absolute inset-0 dot-pattern-sm opacity-15 rounded-2xl pointer-events-none" />
      <div className="relative z-10">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-2xl sm:text-3xl font-black text-white leading-none stat-num-shadow" dir="ltr">
          {typeof value === 'number' ? value.toLocaleString('en-US') : value}
        </p>
        <p className="text-white/75 text-xs font-semibold mt-1.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Loading spinner ────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-brand-600 text-lg">🗺️</div>
        </div>
        <p className="font-semibold text-sm">جاري تحميل ملفك الشخصي...</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('activity');
  const [showCV, setShowCV] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setProfile({ ...profile, avatar_url: base64 });
        updateUser({ avatar_url: base64 }); // Update globally
        usersAPI.updateProfile({ avatar_url: base64 })
          .then(() => toast.success('تم تحديث الصورة الشخصية'))
          .catch(() => toast.error('خطأ في حفظ الصورة'));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    Promise.all([
      usersAPI.getProfile(),
      registrationsAPI.getMy(),
    ]).then(([pRes, rRes]) => {
      setProfile(pRes.data.user);
      setBadges(pRes.data.badges || []);
      setRegistrations(rRes.data.registrations || []);
    })
      .catch(() => toast.error('خطأ في تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/'); toast.success('تم تسجيل الخروج'); };

  if (loading) return <Spinner />;

  const p = profile || user;
  const pts = p?.points || 0;
  const levelName = pts >= 100 ? 'قائد 👑' : pts >= 50 ? 'ناشط ⭐' : 'مبتدئ 🌱';
  const levelClr = pts >= 100 ? 'from-amber-400 to-orange-500' :
    pts >= 50 ? 'from-brand-500 to-brand-700' :
      'from-emerald-400 to-teal-500';
  const levelBadge = pts >= 100 ? 'bg-amber-100 text-amber-700' :
    pts >= 50 ? 'bg-brand-100 text-brand-700' :
      'bg-emerald-100 text-emerald-700';
  const nextLevel = pts >= 100 ? 200 : pts >= 50 ? 100 : 50;
  const progress = Math.min(100, Math.round((pts / nextLevel) * 100));

  const activityRegs = registrations.filter(r => r.status === 'attended');
  const upcomingRegs = registrations.filter(r => r.status === 'registered');

  return (
    <div className="min-h-screen bg-slate-50 pt-16">

      {/* ── Cover Banner ─────────────────────────────────── */}
      <div className="h-48 animated-gradient dot-pattern relative overflow-hidden">
        {/* Orbs */}
        <div className="hero-glow-orb w-48 h-48 top-2 right-8 bg-white/10" style={{ animationDuration: '6s' }} />
        <div className="hero-glow-orb w-32 h-32 bottom-0 left-12 bg-cyan-400/20" style={{ animationDuration: '8s', animationDelay: '1s' }} />

        {/* Profile Image Overlay in Header */}
        {(profile?.avatar_url || user?.avatar_url) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 right-4 sm:right-6 md:right-8 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl hidden sm:block"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/30">
              <img src={profile?.avatar_url || user?.avatar_url} alt="User Profile" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-slate-50/20 to-transparent" />
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-20 pb-24">

        {/* ── Profile Header Card ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-5 sm:p-6 mb-5 relative overflow-hidden"
        >
          {/* Top-right logout */}
          <button
            onClick={handleLogout}
            className="absolute top-4 left-4 p-2.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all duration-200"
            title="تسجيل الخروج"
          >
            <LogOut size={17} />
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar with ring progress */}
            <div className="flex-shrink-0 relative group">
              <RingProgress percent={progress} size={88} stroke={5}>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${levelClr} flex items-center justify-center text-2xl font-black text-white shadow-lg overflow-hidden`}>
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p?.name?.charAt(0)
                  )}
                </div>
              </RingProgress>
              {/* Online indicator */}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-x-0 bottom-0 top-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-2xl"
              >
                <Camera size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 mt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">{p?.name}</h1>
                <span className={`badge-pill text-xs ${levelBadge}`}>{levelName}</span>
              </div>

              <p className="text-slate-400 text-xs sm:text-sm">{p?.email}</p>

              {p?.neighborhood_name && (
                <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                  <MapPin size={11} className="text-brand-400" />
                  {p.neighborhood_name} · الخليل
                </p>
              )}

              {p?.is_university_student && (
                <div className="mt-2 flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-brand-100 w-fit">
                  <GraduationCap size={12} />
                  {p.university} {p.student_id ? `(${p.student_id})` : ''}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCV(true)}
                  className="btn-primary flex items-center gap-2 py-2 px-4 text-xs shadow-lg shadow-brand-700/20"
                >
                  <FileText size={14} /> توليد السيرة الذاتية (CV)
                </motion.button>
                <button className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${levelClr} flex items-center justify-center`}>
                  <Zap size={12} className="text-white" />
                </div>
                <span className="font-black text-slate-800 text-sm">{pts} نقطة</span>
              </div>
              <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200 font-medium">
                {progress}% · الهدف: {nextLevel}
              </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                className={`h-full bg-gradient-to-l from-brand-600 to-emerald-400 rounded-full relative overflow-hidden`}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer rounded-full" />
              </motion.div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-left font-medium">
              {nextLevel - pts} نقطة للمستوى التالي
            </p>
          </div>
        </motion.div>

        {/* ── Colored Stat Cards ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard icon={Star} value={pts} label="النقاط" gradient="from-amber-500 to-orange-500" delay={0.1} />
          <StatCard
            icon={p?.is_university_student ? GraduationCap : Clock}
            value={`${p?.is_university_student ? p?.external_hours : (p?.total_hours || 0)}h`}
            label={p?.is_university_student ? "ساعات تطوع خارجي" : "ساعات"}
            gradient={p?.is_university_student ? "from-violet-600 to-purple-800" : "from-brand-600 to-brand-800"}
            delay={0.15}
          />
          <StatCard icon={Users} value={p?.participations || 0} label="مشاركة" gradient="from-emerald-500 to-teal-600" delay={0.2} />
          <StatCard icon={Trophy} value={badges.length} label="شارة" gradient="from-violet-500 to-purple-600" delay={0.25} />
        </div>

        {/* ── Badges Section ─────────────────────────────── */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="card p-5 sm:p-6 mb-5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Trophy size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm leading-none">شاراتي</h2>
                  <p className="text-slate-400 text-[10px] mt-0.5">الإنجازات المكتسبة</p>
                </div>
              </div>
              <span className="badge-pill bg-amber-100 text-amber-600 font-black">
                {badges.length} شارة
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {badges.map((badge, i) => {
                const cfg = BADGE_CONFIG[badge.icon] || { gradient: 'from-slate-400 to-slate-500', glow: 'shadow-slate-200', label: '' };
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.4, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.35 + i * 0.08, type: 'spring', stiffness: 250, damping: 15 }}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className="group text-center cursor-default"
                    title={badge.description}
                  >
                    <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-2xl shadow-lg ${cfg.glow} group-hover:shadow-xl transition-all duration-300 badge-shine relative overflow-hidden`}>
                      {badge.icon}
                    </div>
                    <p className="text-xs font-bold text-slate-600 mt-2 leading-tight line-clamp-1">{badge.name}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Activity Tabs ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="card overflow-hidden"
        >
          {/* Tab header */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {[
              { key: 'activity', label: 'نشاطاتي', icon: CheckCircle, count: activityRegs.length, color: 'text-emerald-600' },
              { key: 'upcoming', label: 'القادمة', icon: Calendar, count: upcomingRegs.length, color: 'text-brand-600' },
            ].map(({ key, label, icon: Icon, count, color }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-sm transition-all duration-200 relative ${tab === key
                  ? 'text-brand-700 bg-white'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}
              >
                <Icon size={15} className={tab === key ? color : ''} />
                {label}
                {count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black ${tab === key ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                    {count}
                  </span>
                )}
                {/* Active indicator */}
                {tab === key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 inset-x-4 h-0.5 bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {tab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activityRegs.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle}
                      title="لم تشارك في أي فعالية بعد"
                      sub="سجّل في فعاليات وابدأ جمع النقاط والشارات!"
                    />
                  ) : (
                    <div className="space-y-2">
                      {activityRegs.map((r, i) => (
                        <ActivityItem key={r.id} reg={r} index={i} type="attended" />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'upcoming' && (
                <motion.div
                  key="upcoming"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {upcomingRegs.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="لا توجد فعاليات قادمة"
                      sub="تصفّح الفعاليات وسجّل في ما يناسبك"
                    />
                  ) : (
                    <div className="space-y-2">
                      {upcomingRegs.map((r, i) => (
                        <ActivityItem key={r.id} reg={r} index={i} type="registered" />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>

      <AnimatePresence>
        {showCV && <CVPreviewModal onClose={() => setShowCV(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────
function ActivityItem({ reg, index, type }) {
  const formatDate = (d) => {
    try { return format(new Date(d), 'd MMM yyyy', { locale: ar }); }
    catch { return d; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base shadow-sm ${type === 'attended'
        ? 'bg-emerald-100 border border-emerald-200'
        : 'bg-brand-100 border border-brand-200'
        }`}>
        {type === 'attended' ? '✅' : '⏳'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm line-clamp-1 group-hover:text-brand-700 transition-colors">
          {reg.title}
        </p>
        <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
          <MapPin size={9} />
          {reg.location_name}
          <span className="text-slate-200 mx-1">·</span>
          {formatDate(reg.date)}
        </p>
      </div>

      {type === 'attended' && (
        <div className="flex-shrink-0">
          <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg" dir="ltr">
            +{reg.duration_hours}h
          </span>
        </div>
      )}
      {type === 'registered' && (
        <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-400 transition-colors flex-shrink-0" />
      )}
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 shadow-inner">
        <Icon size={28} className="text-slate-300" />
      </div>
      <p className="font-bold text-slate-600 mb-1">{title}</p>
      <p className="text-xs text-slate-400 max-w-xs">{sub}</p>
    </div>
  );
}
