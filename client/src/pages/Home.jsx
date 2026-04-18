import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Calendar, Users, Trophy, Star, Zap,
  ArrowLeft, CheckCircle, Heart, Leaf, Sparkles,
  TrendingUp, Shield, Award
} from 'lucide-react';
import { eventsAPI } from '../api';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../context/AuthContext';

// ─── Animated Counter ─────────────────────────────────────────────
function CountUp({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const increment = end / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref} dir="ltr">{count.toLocaleString('en-US')}{suffix}</span>;
}

// ─── Stats data ────────────────────────────────────────────────────
const STATS = [
  {
    icon: Users, value: 1200, suffix: '+', label: 'شاب مسجّل',
    gradient: 'from-brand-600 to-brand-800', glow: 'shadow-brand-600/30'
  },
  {
    icon: Calendar, value: 85, suffix: '', label: 'فعالية منجزة',
    gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30'
  },
  {
    icon: Trophy, value: 4500, suffix: '+', label: 'ساعة تطوع',
    gradient: 'from-gold-500 to-amber-600', glow: 'shadow-gold-500/30'
  },
  {
    icon: Map, value: 8, suffix: '', label: 'حي مشمول',
    gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30'
  },
];

// ─── Features data ─────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🗺️', title: 'خريطة تفاعلية',
    desc: 'اكتشف الفعاليات على خريطة مدينة الخليل التفاعلية واختر ما يناسب منطقتك',
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    accent: 'text-blue-600',
  },
  {
    icon: '🏅', title: 'نظام المكافآت',
    desc: 'اكسب نقاطاً وشارات لكل مشاركة وتنافس على منصة Linka في لوحة المتصدرين',
    gradient: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50',
    accent: 'text-amber-600',
  },
  {
    icon: '🤖', title: 'مساعد ذكي',
    desc: 'تحدّث مع مساعدنا الذكي الذي يقترح الفعاليات المناسبة لاهتماماتك',
    gradient: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50',
    accent: 'text-violet-600',
  },
  {
    icon: '⚡', title: 'تسجيل فوري',
    desc: 'سجّل في أي فعالية بضغطة واحدة وتابع سجلك التطوعي كاملاً',
    gradient: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50',
    accent: 'text-emerald-600',
  },
];

// ─── Steps ──────────────────────────────────────────────────────────
const STEPS = [
  { num: '01', icon: Users, title: 'أنشئ حسابك', desc: 'سجّل مجاناً في دقيقة واحدة', color: 'from-brand-600 to-brand-800' },
  { num: '02', icon: Calendar, title: 'اختر فعاليتك', desc: 'تصفح الفعاليات على الخريطة أو القائمة', color: 'from-emerald-500 to-teal-600' },
  { num: '03', icon: CheckCircle, title: 'سجّل وشارك', desc: 'انضم وتابع نقاطك وشاراتك', color: 'from-gold-500 to-amber-600' },
];

// ─── Social proof avatars ───────────────────────────────────────────
const AVATARS = ['أ', 'م', 'ف', 'س', 'ن'];

// ─── Event type filters ─────────────────────────────────────────────
const EVENT_TYPES = ['الكل', 'تطوعية', 'ثقافية', 'رياضية', 'تعليمية', 'بيئية'];

// ─── Floating Particles ────────────────────────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 5.5) % 90}%`,
  top: `${10 + (i * 7.3) % 80}%`,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  delay: `${(i * 0.4) % 4}s`,
  duration: `${3 + (i % 4)}s`,
}));

export default function Home() {
  const { isAuth } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');

  useEffect(() => {
    eventsAPI.getAll({ status: 'active' })
      .then(res => setEvents(res.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'الكل'
    ? events.slice(0, 6)
    : events.filter(e => e.type === filter).slice(0, 6);

  return (
    <div className="min-h-screen">

      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <section className="animated-gradient relative overflow-hidden min-h-screen flex items-center pt-16">

        {/* Dark overlay to guarantee text contrast at all gradient phases */}
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />

        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern-sm pointer-events-none" />

        {/* Particle dots */}
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="particle-dot"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--delay': p.delay,
              '--duration': p.duration,
            }}
          />
        ))}

        {/* Large glowing orbs */}
        <div className="hero-glow-orb w-96 h-96 top-1/4 left-8 bg-blue-400/20"
          style={{ animationDuration: '7s' }} />
        <div className="hero-glow-orb w-80 h-80 bottom-1/4 right-8 bg-cyan-400/15"
          style={{ animationDuration: '9s', animationDelay: '2s' }} />
        <div className="hero-glow-orb w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 bg-emerald-400/10"
          style={{ animationDuration: '11s', animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: Text ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-white order-2 lg:order-1"
            >
              {/* Badge chip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 text-sm font-semibold mb-6"
              >
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                مبادرة بلدية الخليل 🏛️
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight mb-6"
              >
                كن جزءاً من{" "}
                <span className="text-gradient-hero inline-block">
                  مستقبل الخليل
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white text-lg sm:text-xl leading-relaxed mb-8 max-w-lg drop-shadow-sm font-medium"
              >
                منصة Linka تربط الشباب بالفعاليات والفرص التطوعية.
                اكتشف، شارك، واترك أثراً في مجتمعك.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-3 mb-10"
              >
                {!isAuth ? (
                  <>
                    <Link to="/register" className="btn-white">
                      <Zap size={18} className="text-brand-600" />
                      ابدأ الآن مجاناً
                    </Link>
                    <Link to="/events"
                      className="glass-strong text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-white/25 transition-all duration-200 flex items-center gap-2">
                      <Calendar size={18} />
                      استعرض الفعاليات
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/events" className="btn-white">
                      <Calendar size={18} className="text-brand-600" />
                      الفعاليات القادمة
                    </Link>
                    <Link to="/map"
                      className="glass-strong text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-white/25 transition-all duration-200 flex items-center gap-2">
                      <Map size={18} />
                      الخريطة التفاعلية
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Social proof row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-4 flex-wrap"
              >
                {/* Avatar stack */}
                <div className="flex items-center">
                  {AVATARS.map((letter, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 border-2 border-white/80 flex items-center justify-center text-white text-xs font-bold shadow-md"
                      style={{ marginRight: i > 0 ? '-10px' : '0', zIndex: AVATARS.length - i }}
                    >
                      {letter}
                    </div>
                  ))}
                  <div
                    className="w-9 h-9 rounded-full bg-white/20 backdrop-blur border-2 border-white/60 flex items-center justify-center text-white text-xs font-bold"
                    style={{ marginRight: '-10px' }}
                  >
                    +
                  </div>
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">+1,200 شاب انضموا</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={11} className="text-gold-400 fill-gold-400" />
                    ))}
                    <span className="text-white/70 text-xs mr-1">5.0</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-white/20 hidden sm:block" />

                {/* Trust indicators */}
                <div className="flex gap-4 text-white/70 text-xs">
                  {[
                    { icon: CheckCircle, label: 'مجاني 100%' },
                    { icon: Shield, label: 'آمن وموثوق' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon size={13} className="text-emerald-400" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* ── Right: Hero Visual Card ──────────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.9, ease: 'easeOut' }}
              className="order-1 lg:order-2 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[340px]">

                {/* Main app card */}
                <div className="glass-card-strong rounded-3xl p-5 shadow-hero-card animate-float">
                  {/* App header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center text-sm shadow-md">🗺️</div>
                      <div>
                        <p className="text-white font-bold text-xs leading-none">Linka</p>
                        <p className="text-white/50 text-[10px] leading-none mt-0.5">منصة الشباب التفاعلية</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-white/50 text-[10px]">مرحباً، أحمد 👋</p>
                      <p className="text-gold-400 font-black text-lg leading-none">250 ⭐</p>
                    </div>
                  </div>

                  {/* Active event card */}
                  <div className="bg-white/10 rounded-2xl p-3 mb-3 border border-white/15">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-emerald-500/30 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-emerald-400/30">
                        🌱
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">زراعة أشجار الزيتون</p>
                        <p className="text-white/50 text-xs mt-0.5">غداً الجمعة • جبل جوهر</p>
                        {/* Mini progress */}
                        <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full w-3/4" />
                        </div>
                      </div>
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0">
                        ✓ مسجّل
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { emoji: '🎯', val: '12', lbl: 'فعالية' },
                      { emoji: '⏱️', val: '48h', lbl: 'ساعات' },
                      { emoji: '🏆', val: '5', lbl: 'شارة' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 rounded-xl p-2 text-center border border-white/10">
                        <div className="text-base">{s.emoji}</div>
                        <div className="text-white font-black text-sm leading-tight">{s.val}</div>
                        <div className="text-white/40 text-[9px]">{s.lbl}</div>
                      </div>
                    ))}
                  </div>

                  {/* Badges row */}
                  <div className="flex gap-1.5">
                    {['🌱 مبادر', '⭐ نجم', '🤝 متطوع'].map((b, i) => (
                      <span key={i} className="flex-1 text-center bg-white/10 border border-white/15 rounded-lg py-1.5 text-[10px] text-white/80 font-semibold">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Floating badge: Achievement */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
                  className="hero-badge -top-4 -right-4"
                >
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-[10px] text-slate-400 leading-none">إنجاز جديد!</p>
                    <p className="text-xs font-black text-slate-800 leading-none mt-0.5">القائد المجتمعي</p>
                  </div>
                </motion.div>

                {/* Floating badge: Points */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="absolute -bottom-3 -left-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl shadow-xl px-3.5 py-2.5 border border-emerald-400/30"
                >
                  <p className="text-[11px] font-black leading-none">+10 نقاط 🎉</p>
                  <p className="text-[9px] text-white/70 leading-none mt-0.5">زراعة الزيتون</p>
                </motion.div>

                {/* Floating badge: Live indicator */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute top-1/2 -right-6 bg-white rounded-xl shadow-floating px-2.5 py-2 flex items-center gap-1.5 border border-slate-100"
                >
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-700">نشط الآن</span>
                </motion.div>

              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" className="w-full fill-premium-main" preserveAspectRatio="none" style={{ fill: '#f4f7ff' }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          STATS SECTION — Colored gradient cards
      ═══════════════════════════════════════ */}
      <section className="py-16 bg-premium-main">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {STATS.map(({ icon: Icon, value, suffix, label, gradient, glow }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`stat-hero-card bg-gradient-to-br ${gradient} shadow-lg ${glow} inner-shine`}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 dot-pattern-sm opacity-20 rounded-2xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 backdrop-blur-sm">
                    <Icon size={20} className="text-white" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-white leading-none stat-num-shadow">
                    <CountUp end={value} suffix={suffix} />
                  </p>
                  <p className="text-white/80 text-xs sm:text-sm mt-2 font-semibold">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white mesh-bg-rich">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 font-bold text-sm px-4 py-1.5 rounded-full">
              <Sparkles size={14} />
              المميزات
            </span>
            <h2 className="section-title mt-4">كل ما تحتاجه في مكان واحد</h2>
            <p className="section-subtitle max-w-xl mx-auto">
              منصة مصممة خصيصاً لتسهيل المشاركة المجتمعية عبر Linka
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="feature-card gradient-border"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 badge-shine`}>
                  {f.icon}
                </div>

                {/* Content */}
                <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-brand-700 transition-colors">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          EVENTS SECTION
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          >
            <div>
              <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 font-bold text-sm px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                قادمة قريباً
              </span>
              <h2 className="section-title mt-3">الفعاليات القادمة</h2>
              <p className="section-subtitle">انضم إلى الفعاليات وابدأ رحلتك التطوعية</p>
            </div>
            <Link to="/events" className="btn-primary self-start sm:self-auto whitespace-nowrap">
              كل الفعاليات
              <ArrowLeft size={16} />
            </Link>
          </motion.div>

          {/* Type Filters */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-8 custom-scroll">
            {EVENT_TYPES.map(type => (
              <motion.button
                key={type}
                onClick={() => setFilter(type)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 ${filter === type
                  ? 'bg-brand-700 text-white shadow-md shadow-brand-700/25'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                  }`}
              >
                {type}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="card overflow-hidden">
                    <div className="skeleton h-48" style={{ borderRadius: '0' }} />
                    <div className="p-4 space-y-3">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton h-2 w-full" />
                      <div className="skeleton h-10 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : displayed.length > 0 ? (
              <motion.div
                key="events"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {displayed.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="event-card-wrap"
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 text-slate-400"
              >
                <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                  <Calendar size={36} className="text-brand-300" />
                </div>
                <p className="font-semibold text-slate-600">لا توجد فعاليات في هذه الفئة حالياً</p>
                <button onClick={() => setFilter('الكل')} className="btn-primary mt-4">
                  عرض كل الفعاليات
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 bg-gold-100 text-gold-600 font-bold text-sm px-4 py-1.5 rounded-full">
              <TrendingUp size={14} />
              كيف تبدأ؟
            </span>
            <h2 className="section-title mt-4">3 خطوات فقط</h2>
            <p className="section-subtitle max-w-md mx-auto">
              انضم لمجتمع Linka في ثلاث خطوات بسيطة
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector lines (desktop only) */}
            <div className="hidden md:block absolute top-10 inset-x-0 z-0">
              <div className="mx-auto h-0.5 bg-gradient-to-l from-transparent via-brand-200 to-transparent"
                style={{ width: '66%', marginRight: '17%' }} />
            </div>

            {STEPS.map(({ num, icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="relative z-10 text-center group"
              >
                {/* Step number badge */}
                <div className="relative inline-block mb-5">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
                    <Icon size={32} className="text-white" />
                  </div>
                  {/* Number chip */}
                  <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${color} text-white text-xs font-black flex items-center justify-center shadow-md ring-2 ring-white`}>
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-brand-700 transition-colors">
                  {title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA inside section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link to={isAuth ? '/events' : '/register'} className="btn-primary-lg">
              <Zap size={20} />
              {isAuth ? 'تصفح الفعاليات الآن' : 'ابدأ رحلتك التطوعية'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA BANNER (for non-auth users)
      ═══════════════════════════════════════ */}
      {!isAuth && (
        <section className="py-20 animated-gradient dot-pattern-sm relative overflow-hidden">
          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          {/* Orbs */}
          <div className="hero-glow-orb w-96 h-96 -top-20 -left-20 bg-blue-400/20" style={{ animationDuration: '8s' }} />
          <div className="hero-glow-orb w-64 h-64 -bottom-10 -right-10 bg-emerald-400/15" style={{ animationDuration: '10s' }} />

          <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-5xl mb-5">🚀</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                انضم إلى Linka اليوم
              </h2>
              <p className="text-white text-lg max-w-md mx-auto leading-relaxed mb-8 font-medium drop-shadow-sm">
                أكثر من 1,200 شاب يصنعون الفرق يومياً.
                <br />
                كن واحداً منهم — مجاناً.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/register"
                  className="btn-white text-base px-10 py-4 rounded-2xl w-full sm:w-auto">
                  <Heart size={20} className="text-rose-500" fill="currentColor" />
                  سجّل مجاناً الآن
                </Link>
                <Link to="/events"
                  className="glass-strong text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/25 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Calendar size={18} />
                  استعرض الفعاليات
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex justify-center flex-wrap gap-8 mt-10 text-white font-bold text-sm drop-shadow-sm">
                {[
                  { icon: Users, label: '1,200+ شاب' },
                  { icon: Calendar, label: '85+ فعالية' },
                  { icon: Award, label: '4,500+ ساعة' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={14} className="text-emerald-400" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="bg-brand-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

            {/* Logo + description */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/20">
                🗺️
              </div>
              <div>
                <p className="font-bold text-lg">Linka</p>
                <p className="text-white/50 text-xs mt-0.5">منصة الشباب التفاعلية الحديثة</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex gap-6 text-white/60 text-sm">
              {[
                { label: 'الفعاليات', to: '/events' },
                { label: 'الخريطة', to: '/map' },
                { label: 'المتصدرون', to: '/leaderboard' },
              ].map(({ label, to }) => (
                <Link key={to} to={to} className="hover:text-white transition-colors">
                  {label}
                </Link>
              ))}
            </div>

            {/* Credit */}
            <p className="text-white/40 text-sm flex items-center gap-1">
              صُنع بـ <Heart size={12} fill="currentColor" className="text-rose-400" /> لمدينة الخليل
            </p>
          </div>

          {/* Divider + copyright */}
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-white/30 text-xs">
            © 2026 Linka · جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
