import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Calendar, Users, Trophy, Star, Zap,
  ArrowLeft, CheckCircle, Heart, Leaf, Sparkles,
  TrendingUp, Shield, Award, Target
} from 'lucide-react';
import { eventsAPI } from '../api';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/2.jpg.png';

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
    gradient: 'from-[#344F1F] to-[#344F1F]', glow: 'shadow-[#344F1F]/30'
  },
  {
    icon: Calendar, value: 85, suffix: '', label: 'فعالية منجزة',
    gradient: 'from-[#F4991A] to-[#344F1F]', glow: 'shadow-[#F4991A]/30'
  },
  {
    icon: Trophy, value: 4500, suffix: '+', label: 'ساعة تطوع',
    gradient: 'from-[#F4991A] to-[#344F1F]', glow: 'shadow-[#F4991A]/30'
  },
  {
    icon: Map, value: 8, suffix: '', label: 'حي مشمول',
    gradient: 'from-[#F4991A] to-[#344F1F]', glow: 'shadow-[#F4991A]/30'
  },
];

// ─── Features data ─────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🗺️', title: 'خريطة تفاعلية',
    desc: 'اكتشف الفعاليات على الخريطة التفاعلية واختر ما يناسب منطقتك',
    gradient: 'from-[#F4991A] to-[#F4991A]',
    bg: 'bg-[#F9F5F0]',
    accent: 'text-[#344F1F]',
  },
  {
    icon: '🏅', title: 'نظام المكافآت',
    desc: 'اكسب نقاطاً وشارات لكل مشاركة وتنافس على منصة Linka في لوحة المتصدرين',
    gradient: 'from-[#F4991A] to-[#F4991A]',
    bg: 'bg-[#F9F5F0]',
    accent: 'text-[#344F1F]',
  },
  {
    icon: '🤖', title: 'مساعد ذكي',
    desc: 'تحدّث مع مساعدنا الذكي الذي يقترح الفعاليات المناسبة لاهتماماتك',
    gradient: 'from-[#F4991A] to-[#F4991A]',
    bg: 'bg-[#F9F5F0]',
    accent: 'text-[#344F1F]',
  },
  {
    icon: '⚡', title: 'تسجيل فوري',
    desc: 'سجّل في أي فعالية بضغطة واحدة وتابع سجلك التطوعي كاملاً',
    gradient: 'from-[#F4991A] to-[#F4991A]',
    bg: 'bg-[#F9F5F0]',
    accent: 'text-[#344F1F]',
  },
];

// ─── Steps ──────────────────────────────────────────────────────────
const STEPS = [
  { num: '01', icon: Users, title: 'أنشئ حسابك', desc: 'سجّل مجاناً في دقيقة واحدة', color: 'from-[#344F1F] to-[#344F1F]' },
  { num: '02', icon: Calendar, title: 'اختر فعاليتك', desc: 'تصفح الفعاليات على الخريطة أو القائمة', color: 'from-[#F4991A] to-[#344F1F]' },
  { num: '03', icon: CheckCircle, title: 'سجّل وشارك', desc: 'انضم وتابع نقاطك وشاراتك', color: 'from-[#F4991A] to-[#344F1F]' },
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
        <div className="absolute inset-0 bg-[#344F1F]/35 pointer-events-none" />

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
        <div className="hero-glow-orb w-96 h-96 top-1/4 left-8 bg-[#F4991A]/20"
          style={{ animationDuration: '7s' }} />
        <div className="hero-glow-orb w-80 h-80 bottom-1/4 right-8 bg-[#F4991A]/15"
          style={{ animationDuration: '9s', animationDelay: '2s' }} />
        <div className="hero-glow-orb w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 bg-[#F4991A]/10"
          style={{ animationDuration: '11s', animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: Text ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-[#F9F5F0] order-1 lg:order-1"
            >
              {/* Badge chip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-[#F9F5F0]/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 text-sm font-semibold mb-6"
              >
                <span className="w-2 h-2 bg-[#F4991A] rounded-full animate-pulse" />
                مبادرة وطنية شبابية 🏛️
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
                  مستقبل الشباب
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[#F9F5F0] text-lg sm:text-xl leading-relaxed mb-8 max-w-lg drop-shadow-sm font-medium"
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
                      <Zap size={18} className="text-[#344F1F]" />
                      ابدأ الآن مجاناً
                    </Link>
                    <Link to="/events"
                      className="glass-strong text-[#F9F5F0] font-semibold px-8 py-3.5 rounded-2xl hover:bg-[#F9F5F0]/25 transition-all duration-200 flex items-center gap-2">
                      <Calendar size={18} />
                      استعرض الفعاليات
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/events" className="btn-white">
                      <Calendar size={18} className="text-[#344F1F]" />
                      الفعاليات القادمة
                    </Link>
                    <Link to="/map"
                      className="glass-strong text-[#F9F5F0] font-semibold px-8 py-3.5 rounded-2xl hover:bg-[#F9F5F0]/25 transition-all duration-200 flex items-center gap-2">
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
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F4991A] to-[#344F1F] border-2 border-white/80 flex items-center justify-center text-[#F9F5F0] text-xs font-bold shadow-md"
                      style={{ marginRight: i > 0 ? '-10px' : '0', zIndex: AVATARS.length - i }}
                    >
                      {letter}
                    </div>
                  ))}
                  <div
                    className="w-9 h-9 rounded-full bg-[#F9F5F0]/20 backdrop-blur border-2 border-white/60 flex items-center justify-center text-[#F9F5F0] text-xs font-bold"
                    style={{ marginRight: '-10px' }}
                  >
                    +
                  </div>
                </div>
                <div>
                  <p className="text-[#F9F5F0] font-bold text-sm leading-tight">+1,200 شاب انضموا</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={11} className="text-[#F4991A] fill-[#F4991A]" />
                    ))}
                    <span className="text-[#F9F5F0]/70 text-xs mr-1">5.0</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-[#F9F5F0]/20 hidden sm:block" />

                {/* Trust indicators */}
                <div className="flex gap-4 text-[#F9F5F0]/70 text-xs">
                  {[
                    { icon: CheckCircle, label: 'مجاني 100%' },
                    { icon: Shield, label: 'آمن وموثوق' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon size={13} className="text-[#F4991A]" />
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
              className="order-2 lg:order-2 flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[340px]">

                {/* Main app card */}
                <div className="glass-card-strong rounded-[2.5rem] p-6 shadow-2xl animate-float border-white/20 backdrop-blur-3xl">
                  {/* App header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F9F5F0] flex items-center justify-center p-1 shadow-md border border-[#F2EAD3]">
                        <img src={logo} alt="L" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="text-[#F9F5F0] font-black text-sm tracking-tight leading-none">Linka</p>
                        <p className="text-[#F9F5F0]/60 text-[10px] leading-none mt-1 font-medium">منصة الشباب التفاعلية</p>
                      </div>
                    </div>
                    <div className="text-left bg-[#F9F5F0]/10 px-3 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                      <p className="text-[#F9F5F0]/70 text-[9px] font-bold">مرحباً، أحمد 👋</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Zap size={14} className="text-[#F4991A] fill-[#F4991A]" />
                        <p className="text-[#F9F5F0] font-black text-base leading-none">250</p>
                      </div>
                    </div>
                  </div>

                  {/* Active event card */}
                  <div className="bg-[#F9F5F0]/10 rounded-[2rem] p-4 mb-4 border border-white/20 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F4991A]/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#F4991A]/20 transition-all" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-[#F4991A] rounded-2xl flex items-center justify-center text-[#F9F5F0] flex-shrink-0 shadow-lg shadow-[#F4991A]/20">
                        <Leaf size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F9F5F0] font-black text-sm truncate">زراعة أشجار الزيتون</p>
                        <p className="text-[#F9F5F0]/60 text-[11px] mt-1 font-bold">غداً الجمعة • وسط المدينة</p>
                        {/* Mini progress */}
                        <div className="mt-2.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '75%' }}
                            transition={{ duration: 1.5, delay: 1 }}
                            className="h-full bg-[#F4991A] rounded-full"
                          />
                        </div>
                      </div>
                      <div className="bg-[#344F1F] text-[#F9F5F0] text-[10px] font-black px-3 py-1.5 rounded-xl flex-shrink-0 shadow-sm flex items-center gap-1 border border-white/10">
                        <CheckCircle size={10} />
                        مسجّل
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { icon: Target, val: '12', lbl: 'فعالية', color: 'text-[#F4991A]' },
                      { icon: TrendingUp, val: '48h', lbl: 'ساعات', color: 'text-[#F9F5F0]' },
                      { icon: Award, val: '5', lbl: 'شارة', color: 'text-[#F4991A]' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-[1.25rem] p-3 text-center border border-white/10 hover:bg-white/10 transition-all group">
                        <div className="flex justify-center mb-1.5">
                          <s.icon size={16} className={`${s.color} group-hover:scale-110 transition-transform`} />
                        </div>
                        <div className="text-[#F9F5F0] font-black text-sm leading-tight">{s.val}</div>
                        <div className="text-[#F9F5F0]/40 text-[9px] font-bold mt-0.5">{s.lbl}</div>
                      </div>
                    ))}
                  </div>

                  {/* Badges row */}
                  <div className="flex gap-2">
                    {[
                      { icon: Shield, lbl: 'مبادر' },
                      { icon: Zap, lbl: 'نجم' },
                      { icon: Heart, lbl: 'متطوع' }
                    ].map((b, i) => (
                      <span key={i} className="flex-1 flex items-center justify-center gap-1.5 bg-[#F9F5F0]/5 border border-white/10 rounded-xl py-2 text-[10px] text-[#F9F5F0]/90 font-black hover:bg-white/10 transition-all cursor-default">
                        <b.icon size={12} className="text-[#F4991A]" />
                        {b.lbl}
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
                    <p className="text-[10px] text-[#F4991A] leading-none">إنجاز جديد!</p>
                    <p className="text-xs font-black text-[#344F1F] leading-none mt-0.5">القائد المجتمعي</p>
                  </div>
                </motion.div>

                {/* Floating badge: Points */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="absolute -bottom-3 -left-4 bg-gradient-to-br from-[#F4991A] to-[#F4991A] text-[#F9F5F0] rounded-2xl shadow-xl px-3.5 py-2.5 border border-[#F4991A]/30"
                >
                  <p className="text-[11px] font-black leading-none">+10 نقاط 🎉</p>
                  <p className="text-[9px] text-[#F9F5F0]/70 leading-none mt-0.5">زراعة الزيتون</p>
                </motion.div>

                {/* Floating badge: Live indicator */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute top-1/2 -right-6 bg-[#F9F5F0] rounded-xl shadow-floating px-2.5 py-2 flex items-center gap-1.5 border border-[#F9F5F0]"
                >
                  <span className="w-2 h-2 bg-[#F4991A] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-[#344F1F]">نشط الآن</span>
                </motion.div>

              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" className="w-full fill-premium-main" preserveAspectRatio="none" style={{ fill: '#F9F5F0' }}>
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
                  <div className="w-10 h-10 rounded-xl bg-[#F9F5F0]/20 flex items-center justify-center mb-3 backdrop-blur-sm">
                    <Icon size={20} className="text-[#F9F5F0]" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-[#F9F5F0] leading-none stat-num-shadow">
                    <CountUp end={value} suffix={suffix} />
                  </p>
                  <p className="text-[#F9F5F0]/80 text-xs sm:text-sm mt-2 font-semibold">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-[#F9F5F0] mesh-bg-rich">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 bg-[#F9F5F0] text-[#344F1F] font-bold text-sm px-4 py-1.5 rounded-full">
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
                className="feature-card"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-4 transition-all duration-300`}>
                  {f.icon}
                </div>

                {/* Content */}
                <h3 className="font-bold text-[#344F1F] text-base mb-2 group-hover:text-[#344F1F] transition-colors">
                  {f.title}
                </h3>
                <p className="text-[#F4991A] text-sm leading-relaxed">{f.desc}</p>

                <p className="text-[#F4991A] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          EVENTS SECTION
      ═══════════════════════════════════════ */}
      <section className="py-20 bg-[#F9F5F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          >
            <div>
              <span className="inline-flex items-center gap-2 bg-[#F9F5F0] text-[#344F1F] font-bold text-sm px-4 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-[#F4991A] rounded-full animate-pulse" />
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
                  ? 'bg-[#344F1F] text-[#F9F5F0] shadow-md shadow-[#344F1F]/25'
                  : 'bg-[#F9F5F0] text-[#344F1F] hover:bg-[#F9F5F0] border border-[#F2EAD3] hover:border-[#F2EAD3]'
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
                className="text-center py-20 text-[#F4991A]"
              >
                <div className="w-20 h-20 rounded-3xl bg-[#F9F5F0] flex items-center justify-center mx-auto mb-4">
                  <Calendar size={36} className="text-[#F2EAD3]" />
                </div>
                <p className="font-semibold text-[#344F1F]">لا توجد فعاليات في هذه الفئة حالياً</p>
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
      <section className="py-20 bg-[#F9F5F0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 bg-[#F9F5F0] text-[#344F1F] font-bold text-sm px-4 py-1.5 rounded-full">
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
                    <Icon size={32} className="text-[#F9F5F0]" />
                  </div>
                  {/* Number chip */}
                  <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${color} text-[#F9F5F0] text-xs font-black flex items-center justify-center shadow-md ring-2 ring-white`}>
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-bold text-[#344F1F] text-lg mb-2 group-hover:text-[#344F1F] transition-colors">
                  {title}
                </h3>
                <p className="text-[#F4991A] text-sm leading-relaxed">{desc}</p>
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
          <div className="absolute inset-0 bg-[#344F1F]/40 pointer-events-none" />
          {/* Orbs */}
          <div className="hero-glow-orb w-96 h-96 -top-20 -left-20 bg-[#F4991A]/20" style={{ animationDuration: '8s' }} />
          <div className="hero-glow-orb w-64 h-64 -bottom-10 -right-10 bg-[#344F1F]/15" style={{ animationDuration: '10s' }} />

          <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-5xl mb-5">🚀</div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#F9F5F0] mb-4 leading-tight">
                انضم إلى Linka اليوم
              </h2>
              <p className="text-[#F9F5F0] text-lg max-w-md mx-auto leading-relaxed mb-8 font-medium drop-shadow-sm">
                أكثر من 1,200 شاب يصنعون الفرق يومياً.
                <br />
                كن واحداً منهم — مجاناً.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/register"
                  className="bg-[#F2EAD3] text-[#344F1F] text-base px-10 py-4 rounded-2xl w-full sm:w-auto font-bold flex items-center justify-center gap-2">
                  <Heart size={20} className="text-[#F4991A]" fill="currentColor" />
                  سجّل مجاناً الآن
                </Link>
                <Link to="/events"
                  className="border-2 border-[#F9F5F0] text-[#F9F5F0] font-semibold px-8 py-4 rounded-2xl hover:bg-[#F9F5F0]/10 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center">
                  <Calendar size={18} />
                  استعرض الفعاليات
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex justify-center flex-wrap gap-8 mt-10 text-[#F9F5F0] font-bold text-sm drop-shadow-sm">
                {[
                  { icon: Users, label: '1,200+ شاب' },
                  { icon: Calendar, label: '85+ فعالية' },
                  { icon: Award, label: '4,500+ ساعة' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon size={14} className="text-[#F4991A]" />
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
      <footer className="bg-[#344F1F] text-[#F9F5F0] py-12 border-t border-[#F4991A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

            {/* Logo + description */}
            <div className="flex items-center gap-3">
              <div className="w-25 h-16 bg-[#F9F5F0]/10 rounded-xl flex items-center justify-center p-2 border border-[#F9F5F0]/20 overflow-hidden">
                <img src={logo} alt="Linka" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-lg text-[#F4991A]">Linka</p>
                <p className="text-[#F9F5F0]/70 text-xs mt-0.5">منصة الشباب التفاعلية الحديثة</p>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex gap-6 text-[#F9F5F0]/80 text-sm">
              {[
                { label: 'الرئيسية', to: '/' },
                { label: 'من نحن', to: '/about' },
                { label: 'الفعاليات', to: '/events' },
                // { label: 'الخريطة', to: '/map' },
                // { label: 'المتصدرون', to: '/leaderboard' },
              ].map(({ label, to }) => (
                <Link key={to} to={to} className="hover:text-[#F4991A] transition-colors">
                  {label}
                </Link>
              ))}
            </div>

            {/* Credit */}
            <p className="text-[#F9F5F0]/60 text-sm flex items-center gap-1">
              صُنع بـ <Heart size={12} fill="currentColor" className="text-[#F4991A]" /> لمستقبل أفضل
            </p>
          </div>

          {/* Divider + copyright */}
          <div className="border-t border-[#F9F5F0]/10 mt-8 pt-6 text-center text-[#F9F5F0]/50 text-xs">
            © 2026 Linka · جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
