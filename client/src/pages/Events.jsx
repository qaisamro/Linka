import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, MapPin, SlidersHorizontal, Calendar } from 'lucide-react';
import { eventsAPI, neighborhoodsAPI } from '../api';
import EventCard from '../components/events/EventCard';

const TYPES = [
  { label: 'الكل', emoji: '🌐' },
  { label: 'تطوعية', emoji: '🤝' },
  { label: 'ثقافية', emoji: '🎭' },
  { label: 'رياضية', emoji: '⚽' },
  { label: 'تعليمية', emoji: '📚' },
  { label: 'بيئية', emoji: '🌱' },
  { label: 'اجتماعية', emoji: '🏙️' },
];

// Skeleton card
function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-3/5" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-2 w-full mt-2" />
        <div className="skeleton h-10 w-full rounded-xl mt-1" />
      </div>
    </div>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [neighborFilter, setNeighborFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    const params = { status: 'active' };
    if (typeFilter !== 'الكل') params.type = typeFilter;
    if (neighborFilter) params.neighborhood_id = neighborFilter;

    eventsAPI.getAll(params)
      .then(res => setEvents(res.data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    neighborhoodsAPI.getAll()
      .then(res => setNeighborhoods(res.data.neighborhoods || []))
      .catch(() => { });
  }, []);

  useEffect(() => { fetchEvents(); }, [typeFilter, neighborFilter]);

  const filtered = events.filter(e =>
    !search ||
    e.title?.includes(search) ||
    e.location_name?.includes(search) ||
    e.description?.includes(search)
  );

  const clearFilters = () => { setTypeFilter('الكل'); setNeighborFilter(''); setSearch(''); };
  const hasFilters = typeFilter !== 'الكل' || neighborFilter || search;

  return (
    <div className="min-h-screen bg-premium-main pt-16 top-accent-line">

      {/* ── Hero Header ──────────────────────────────────── */}
      <div className="animated-gradient dot-pattern relative overflow-hidden">
        {/* Deep dark overlay to guarantee text contrast at all gradient phases */}
        <div className="absolute inset-0 bg-[#344F1F]/65 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#F9F5F0]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#F4991A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 bg-[#F9F5F0]/15 backdrop-blur-md border border-[#F9F5F0]/20 rounded-full px-5 py-2 text-sm font-bold text-[#F9F5F0] mb-6 shadow-xl">
              <span className="w-2.5 h-2.5 bg-[#F4991A] rounded-full animate-ping" />
              فعاليات نشطة الآن
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-[#F9F5F0] mb-4 tracking-tight drop-shadow-2xl">
              الفعاليات القادمة <span className="text-[#F4991A]">في مدينتك</span>
            </h1>
            <p className="text-[#F9F5F0] text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-xl font-bold">
              اكتشف الفرص التطوعية الأكثر تأثيراً وانضم لمجتمع <span className="text-[#F4991A] font-black">Linka</span> في صناعة مستقبل أفضل لمدينتنا.
            </p>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 40" className="w-full fill-[#F9F5F0]">
            <path d="M0,20 C480,40 960,0 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Sticky Filter Bar ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky top-16 z-30 mb-8"
        >
          <div className="card p-4 shadow-md">
            {/* Search row */}
            <div className="flex gap-3 mb-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-[#F4991A] pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pr-10 text-sm"
                  placeholder="ابحث عن فعالية أو موقع..."
                />
              </div>

              {/* Neighborhood select – desktop */}
              <div className="relative hidden sm:flex items-center">
                <MapPin size={14} className="absolute right-3 text-[#F4991A] pointer-events-none" />
                <select
                  value={neighborFilter}
                  onChange={e => setNeighborFilter(e.target.value)}
                  className="input-field pr-9 pl-4 text-sm min-w-[160px]"
                >
                  <option value="">كل الأحياء</option>
                  {neighborhoods.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${showFilters ? 'border-[#F4991A] bg-[#F9F5F0] text-[#344F1F]' : 'border-[#F2EAD3] text-[#344F1F]'
                  }`}
              >
                <SlidersHorizontal size={15} />
                فلاتر
              </button>
            </div>

            {/* Mobile neighborhood (conditional) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden sm:hidden mb-3"
                >
                  <div className="relative">
                    <MapPin size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-[#F4991A] pointer-events-none" />
                    <select
                      value={neighborFilter}
                      onChange={e => setNeighborFilter(e.target.value)}
                      className="input-field pr-9 text-sm"
                    >
                      <option value="">كل الأحياء</option>
                      {neighborhoods.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Type pills row */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1">
              <div className="flex gap-2 flex-shrink-0">
                {TYPES.map(({ label, emoji }) => (
                  <button
                    key={label}
                    onClick={() => setTypeFilter(label)}
                    className={`filter-pill ${typeFilter === label ? 'filter-pill-active' : 'filter-pill-inactive'
                      }`}
                  >
                    <span className="text-sm">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>

              <div className="mr-auto flex items-center gap-3 flex-shrink-0">
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs font-semibold text-[#F4991A] hover:text-[#344F1F] transition-colors whitespace-nowrap"
                  >
                    <X size={12} /> مسح
                  </button>
                )}
                <span className="text-[#F4991A] text-xs font-medium whitespace-nowrap bg-[#F9F5F0] px-3 py-1 rounded-full">
                  {loading ? '...' : `${filtered.length} فعالية`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Events Grid ───────────────────────────────────── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((event, i) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="event-card-wrap"
                >
                  <EventCard event={event} onRegistered={fetchEvents} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* ── Empty State ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#F9F5F0] to-[#F2EAD3] flex items-center justify-center mb-6 shadow-inner">
              <Calendar size={44} className="text-[#F4991A]" />
            </div>
            <h3 className="text-xl font-bold text-[#344F1F] mb-2">لا توجد فعاليات مطابقة</h3>
            <p className="text-[#F4991A] text-sm mb-6 max-w-xs">
              جرّب تغيير فلاتر البحث أو استعرض جميع الفعاليات
            </p>
            <button onClick={clearFilters} className="btn-primary">
              <Filter size={15} />
              مسح الفلاتر
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
