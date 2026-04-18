import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Clock, Users, TrendingUp, Award, Zap } from 'lucide-react';
import { usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_CONFIG = [
  { rank: 1, height: 'h-28', gradient: 'from-amber-400 to-yellow-500', shadow: 'shadow-amber-400/40', border: 'border-amber-300', ring: 'ring-amber-300', size: 'w-20 h-20 text-3xl', crown: true },
  { rank: 2, height: 'h-20', gradient: 'from-slate-300 to-slate-400', shadow: 'shadow-slate-400/40', border: 'border-slate-300', ring: 'ring-slate-300', size: 'w-16 h-16 text-2xl', crown: false },
  { rank: 3, height: 'h-14', gradient: 'from-amber-600 to-orange-600', shadow: 'shadow-orange-600/40', border: 'border-orange-400', ring: 'ring-orange-400', size: 'w-16 h-16 text-2xl', crown: false },
];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="skeleton w-8 h-8 rounded-full" />
      <div className="skeleton w-10 h-10 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton w-16 h-6 rounded-full" />
    </div>
  );
}

export default function Leaderboard() {
  const { user: me } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.getLeaderboard()
      .then(res => setLeaders(res.data.leaderboard || []))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : [];
  const podiumConfig = top3.length >= 3 ? [PODIUM_CONFIG[1], PODIUM_CONFIG[0], PODIUM_CONFIG[2]] : [];

  return (
    <div className="min-h-screen bg-premium-main pt-16 top-accent-line">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="animated-gradient dot-pattern relative overflow-hidden">
        {/* Dark overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-black/35 pointer-events-none" />
        <div className="hero-glow-orb w-72 h-72 top-1/4 left-10 bg-amber-400/15" style={{ animationDuration: '6s' }} />
        <div className="hero-glow-orb w-64 h-64 bottom-1/4 right-10 bg-yellow-400/10" style={{ animationDuration: '8s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-6xl mb-4 inline-block"
            >
              🏆
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">لوحة المتصدرين</h1>
            <p className="text-white/90 text-lg drop-shadow-sm">أكثر شبابنا نشاطاً وتطوعاً على Linka · تنافس وتصدّر القائمة!</p>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 40" className="w-full fill-slate-50">
            <path d="M0,20 C480,40 960,0 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {loading ? (
          <div className="card overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <AnimatePresence>

            {/* ── Podium ─────────────────────────────────── */}
            {top3.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mb-10"
              >
                <div className="flex items-end justify-center gap-3 sm:gap-6">
                  {podiumOrder.map((leader, i) => {
                    const cfg = podiumConfig[i];
                    return (
                      <motion.div
                        key={leader.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.6 }}
                        className="flex-1 text-center max-w-[140px]"
                      >
                        {/* Crown for 1st */}
                        {cfg.crown && (
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-2xl mb-1"
                          >
                            👑
                          </motion.div>
                        )}

                        {/* Avatar */}
                        <div className={`${cfg.size} rounded-3xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center font-black text-white mx-auto mb-2 shadow-xl ${cfg.shadow} border-4 ${cfg.border} ring-2 ${cfg.ring} ring-offset-2`}>
                          {leader.name?.charAt(0)}
                        </div>

                        <p className="font-black text-slate-800 text-sm truncate px-1">{leader.name?.split(' ')[0]}</p>
                        <p className="text-amber-500 font-black text-sm mt-0.5">⭐ {leader.points?.toLocaleString('en-US')}</p>

                        {/* Podium block */}
                        <div className={`${cfg.height} bg-gradient-to-t ${cfg.gradient} rounded-t-2xl mt-3 flex items-center justify-center text-3xl shadow-lg ${cfg.shadow}`}>
                          {MEDALS[cfg.rank - 1]}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Full list ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Trophy size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800">ترتيب المتطوعين</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{leaders.length} مشارك فاعل</p>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {leaders.map((leader, i) => {
                  const isMe = me?.id === leader.id;
                  const isTop = i < 3;
                  return (
                    <motion.div
                      key={leader.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.5) }}
                      className={`flex items-center gap-3 sm:gap-4 p-4 transition-colors ${isMe ? 'bg-brand-50 border-r-4 border-brand-500' :
                        isTop ? 'bg-amber-50/40 hover:bg-amber-50' :
                          'hover:bg-slate-50'
                        }`}
                    >
                      {/* Rank */}
                      <div className={`w-9 h-9 flex items-center justify-center font-black text-lg flex-shrink-0 rounded-xl ${isTop ? `bg-gradient-to-br ${PODIUM_CONFIG[i].gradient} text-white shadow-md` : 'bg-slate-100 text-slate-500 text-sm'
                        }`}>
                        {isTop ? MEDALS[i] : `${(i + 1).toLocaleString('en-US')}`}
                      </div>

                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md ${isMe ? 'bg-gradient-to-br from-brand-500 to-brand-700' : 'bg-hero-gradient'
                        }`}>
                        {leader.name?.charAt(0)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm truncate ${isMe ? 'text-brand-700' : 'text-slate-800'}`}>
                            {leader.name}
                          </p>
                          {isMe && <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">أنت</span>}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{leader.neighborhood_name || 'الخليل'}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                        <span className="hidden sm:flex items-center gap-1">
                          <Users size={11} /> {leader.participations?.toLocaleString('en-US')}
                        </span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Clock size={11} /> <span dir="ltr">{leader.total_hours}h</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-500 font-black text-sm">
                          <Star size={13} fill="currentColor" />
                          <span dir="ltr">{leader.points?.toLocaleString('en-US')}</span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {leaders.length === 0 && (
                  <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
                    <Award size={48} className="text-slate-200" />
                    <p className="font-semibold">لا توجد بيانات بعد</p>
                    <p className="text-xs">شارك في الفعاليات لتصبح أول المتصدرين!</p>
                  </div>
                )}
              </div>
            </motion.div>

          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
