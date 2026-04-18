import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl } from 'react-leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
import { Calendar, MapPin, Users, X, Flame, Map as MapIcon, Info, Loader2 } from 'lucide-react';
import { eventsAPI, analyticsAPI } from '../api';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import HeatmapLayer from '../components/map/HeatmapLayer';
import NeighborhoodTooltips from '../components/map/NeighborhoodTooltips';

// ─── Fix Leaflet default icon ─────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Constants ───────────────────────────────────────────────────
const HEBRON_CENTER = [31.5290, 35.1010];
const HEBRON_ZOOM = 14;

const TYPE_COLORS = {
  'تطوعية': '#10b981',
  'ثقافية': '#8b5cf6',
  'رياضية': '#f97316',
  'تعليمية': '#3b82f6',
  'بيئية': '#22c55e',
  'اجتماعية': '#ec4899',
};

// ─── Heatmap Legend config ────────────────────────────────────────
const LEGEND_STOPS = [
  { color: '#1e3a8a', label: 'منخفض جداً' },
  { color: '#3b82f6', label: 'منخفض' },
  { color: '#10b981', label: 'متوسط' },
  { color: '#f59e0b', label: 'مرتفع' },
  { color: '#ef4444', label: 'نشاط عالٍ' },
];

// ─── Custom pin icon ─────────────────────────────────────────────
const makeIcon = (color) => L.divIcon({
  html: `
    <div style="position:relative;width:34px;height:34px">
      <div style="
        width:34px;height:34px;background:${color};
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);
      "></div>
    </div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -38],
});

// ─── MapView ──────────────────────────────────────────────────────
export default function MapView() {
  const [events, setEvents] = useState([]);
  const [heatData, setHeatData] = useState({ points: [], neighborhoods: [] });
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('markers'); // 'markers' | 'heatmap'
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingHeat, setLoadingHeat] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Fetch events for markers mode
  useEffect(() => {
    eventsAPI.getAll({ status: 'active' })
      .then(res => setEvents(res.data.events?.filter(e => e.lat && e.lng) || []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  // Fetch heatmap data when switching to heatmap mode
  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    if (heatData.points.length > 0) return; // already loaded

    setLoadingHeat(true);
    analyticsAPI.getHeatmap()
      .then(res => setHeatData({
        points: res.data.points || [],
        neighborhoods: res.data.neighborhoods || [],
      }))
      .catch(() => setHeatData({ points: [], neighborhoods: [] }))
      .finally(() => setLoadingHeat(false));
  }, [viewMode]);

  const switchMode = useCallback((mode) => {
    setSelected(null);
    setViewMode(mode);
  }, []);

  return (
    <div className="h-screen pt-16 flex flex-col bg-slate-900 overflow-hidden">

      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm px-4 py-2.5 flex items-center gap-3 z-10 flex-shrink-0">
        <h1 className="font-bold text-slate-800 text-base flex items-center gap-2">
          {viewMode === 'heatmap'
            ? <><Flame size={16} className="text-orange-500" /> الخريطة الحرارية</>
            : <><MapPin size={16} className="text-brand-500" /> خريطة الفعاليات</>
          }
        </h1>

        <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2 py-0.5 rounded-full">
          {viewMode === 'heatmap' ? `${heatData.points.length} نقطة` : `${events.length} فعالية`}
        </span>

        {/* Event type legend (markers mode) */}
        {viewMode === 'markers' && (
          <div className="mr-auto hidden sm:flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(TYPE_COLORS).slice(0, 4).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                {type}
              </span>
            ))}
          </div>
        )}

        {/* Stats (heatmap mode) */}
        {viewMode === 'heatmap' && !loadingHeat && (
          <div className="mr-auto hidden sm:flex items-center gap-4 text-xs text-slate-500">
            <span>📊 {heatData.neighborhoods.length} حي مرصود</span>
            <span>
              🕐 {heatData.neighborhoods.reduce((s, n) => s + parseFloat(n.total_hours || 0), 0).toFixed(0)} ساعة تطوع
            </span>
          </div>
        )}

        <button onClick={() => setShowInfo(v => !v)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <Info size={16} />
        </button>
      </div>

      {/* ── Map container ────────────────────────────────────────── */}
      <div className="flex-1 relative">

        {/* Loading overlay */}
        {(loadingEvents || loadingHeat) && (
          <div className="absolute inset-0 bg-slate-900/60 z-30 flex items-center justify-center">
            <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3 text-white">
              <Loader2 size={20} className="animate-spin" />
              <span className="font-semibold text-sm">
                {loadingHeat ? 'جاري تحليل البيانات...' : 'جاري تحميل الخريطة...'}
              </span>
            </div>
          </div>
        )}

        <MapContainer
          center={HEBRON_CENTER}
          zoom={HEBRON_ZOOM}
          className="w-full h-full"
          zoomControl={false}
          preferCanvas={true}
        >
          {/* Tile Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />
          <ZoomControl position="bottomright" />

          {/* ── MARKERS MODE ─────────────────────────────────────── */}
          {viewMode === 'markers' && events.map(e => (
            <Marker
              key={e.id}
              position={[parseFloat(e.lat), parseFloat(e.lng)]}
              icon={makeIcon(TYPE_COLORS[e.type] || '#3b82f6')}
              eventHandlers={{ click: () => setSelected(e) }}
            >
              <Popup>
                <div style={{ fontFamily: 'Cairo', direction: 'rtl', minWidth: '180px', padding: '2px' }}>
                  <strong style={{ fontSize: '13px' }}>{e.title}</strong>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
                    📍 {e.location_name}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                    👥 {e.current_participants} / {e.max_participants}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Activity circles behind markers */}
          {viewMode === 'markers' && events.map(e => (
            <Circle key={`r-${e.id}`}
              center={[parseFloat(e.lat), parseFloat(e.lng)]}
              radius={180}
              pathOptions={{
                color: TYPE_COLORS[e.type] || '#3b82f6',
                fillColor: TYPE_COLORS[e.type] || '#3b82f6',
                fillOpacity: 0.07,
                weight: 1,
                opacity: 0.3,
              }}
            />
          ))}

          {/* ── HEATMAP MODE ─────────────────────────────────────── */}
          <HeatmapLayer
            points={heatData.points}
            visible={viewMode === 'heatmap'}
          />

          {viewMode === 'heatmap' && !loadingHeat && (
            <NeighborhoodTooltips neighborhoods={heatData.neighborhoods} />
          )}
        </MapContainer>

        {/* ── Toggle Button ─────────────────────────────────────── */}
        <div className="absolute top-3 right-3 z-[1000]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-1 flex gap-1 shadow-xl backdrop-blur-md border border-white/30"
          >
            <button
              onClick={() => switchMode('markers')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'markers'
                ? 'bg-white text-brand-700 shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              <MapIcon size={14} />
              <span className="hidden sm:inline">الفعاليات</span>
            </button>

            <button
              onClick={() => switchMode('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${viewMode === 'heatmap'
                ? 'bg-white text-orange-600 shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              <Flame size={14} />
              <span className="hidden sm:inline">التفاعل</span>
            </button>
          </motion.div>
        </div>

        {/* ── Heatmap Legend ────────────────────────────────────── */}
        <AnimatePresence>
          {viewMode === 'heatmap' && showLegend && (
            <motion.div
              key="legend"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="absolute bottom-24 right-3 z-[1000]"
            >
              <div className="bg-white/90 rounded-2xl p-3 shadow-xl backdrop-blur-md border border-slate-200 min-w-[150px]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-900 text-xs font-black flex items-center gap-1">
                    <Flame size={11} className="text-orange-600" />
                    مستوى النشاط
                  </p>
                  <button onClick={() => setShowLegend(false)}
                    className="text-slate-400 hover:text-slate-700 transition-colors">
                    <X size={12} />
                  </button>
                </div>

                {/* Gradient bar */}
                <div className="h-2.5 rounded-full mb-2"
                  style={{ background: 'linear-gradient(to right, #1e3a8a, #3b82f6, #10b981, #f59e0b, #ef4444)' }}
                />

                <div className="flex justify-between">
                  {LEGEND_STOPS.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      {(i === 0 || i === LEGEND_STOPS.length - 1) && (
                        <span className="text-slate-900 text-[9px] text-center leading-none font-black">
                          {s.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hover hint */}
                <p className="text-slate-500 text-[10px] mt-2 text-center font-bold">
                  مرر على الأحياء للتفاصيل
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Info panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 right-3 z-[1000] glass rounded-2xl p-4 text-white text-xs max-w-[220px] shadow-xl border border-white/25"
            >
              <button onClick={() => setShowInfo(false)}
                className="absolute top-2 left-2 text-white/50 hover:text-white">
                <X size={12} />
              </button>
              <p className="font-bold mb-2 text-sm">كيف تقرأ الخريطة؟</p>
              <div className="space-y-1.5 text-white/80">
                <p>🔵 <strong>وضع الفعاليات:</strong> كل Pin فعالية قادمة</p>
                <p>🔥 <strong>وضع التفاعل:</strong> الخريطة الحرارية تُظهر كثافة المشاركة بالألوان</p>
                <p>👆 <strong>Hover</strong> على أي منطقة لرؤية إحصائيات الحي</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Event Detail Panel (markers mode) ───────────────── */}
        <AnimatePresence>
          {selected && viewMode === 'markers' && (
            <motion.div
              key="event-panel"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="absolute bottom-4 inset-x-3 sm:inset-x-auto sm:left-3 sm:w-80 z-[1000]"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Image strip */}
                {selected.image_url && (
                  <div className="h-28 overflow-hidden relative">
                    <img src={selected.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}

                <div className="p-4">
                  <button onClick={() => setSelected(null)}
                    className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full p-1 text-slate-500 hover:text-slate-800 shadow-sm transition-colors">
                    <X size={14} />
                  </button>

                  {/* Type badge */}
                  <span className="badge-pill text-xs mb-2 inline-flex"
                    style={{
                      background: (TYPE_COLORS[selected.type] || '#3b82f6') + '18',
                      color: TYPE_COLORS[selected.type] || '#3b82f6'
                    }}>
                    {selected.type}
                  </span>

                  <h3 className="font-bold text-slate-800 text-sm leading-snug mb-3">
                    {selected.title}
                  </h3>

                  <div className="space-y-1.5 mb-4">
                    {[
                      { Icon: MapPin, text: selected.location_name },
                      { Icon: Calendar, text: (() => { try { return format(new Date(selected.date), 'd MMMM', { locale: ar }); } catch { return '—'; } })() },
                      { Icon: Users, text: `${selected.current_participants} / ${selected.max_participants} مشارك` },
                    ].map(({ Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                        <Icon size={11} className="text-brand-400 flex-shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Capacity bar */}
                  <div className="mb-4">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500 transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.round((selected.current_participants / selected.max_participants) * 100))}%` }} />
                    </div>
                  </div>

                  <Link to={`/events/${selected.id}`} className="btn-primary block text-center text-sm py-2.5">
                    عرض التفاصيل والتسجيل ←
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Heatmap stats strip (bottom, heatmap mode) ───────── */}
        <AnimatePresence>
          {viewMode === 'heatmap' && !loadingHeat && heatData.neighborhoods.length > 0 && (
            <motion.div
              key="heat-strip"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 inset-x-3 z-[1000]"
            >
              <div className="bg-white/90 rounded-2xl px-4 py-3 border border-slate-200 shadow-xl backdrop-blur-md">
                <p className="text-slate-900 text-[10px] font-black mb-2 uppercase tracking-wide">
                  أكثر الأحياء نشاطاً
                </p>
                <div className="flex gap-3 overflow-x-auto custom-scroll pb-1">
                  {[...heatData.neighborhoods]
                    .sort((a, b) => b.total_registrations - a.total_registrations)
                    .slice(0, 5)
                    .map((n, i) => {
                      const maxRegs = heatData.neighborhoods.reduce((m, x) => Math.max(m, x.total_registrations), 1);
                      const pct = Math.round((n.total_registrations / maxRegs) * 100);
                      return (
                        <div key={i} className="flex-shrink-0 text-center min-w-[64px]">
                          <div className="relative h-10 bg-white/10 rounded-lg overflow-hidden mb-1">
                            <div
                              className="absolute bottom-0 inset-x-0 rounded-lg transition-all duration-700"
                              style={{
                                height: `${Math.max(15, pct)}%`,
                                background: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : i === 2 ? '#f59e0b' : '#10b981',
                                opacity: 0.85,
                              }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-slate-900 text-xs font-black">
                              {n.total_registrations}
                            </span>
                          </div>
                          <p className="text-slate-800 text-[9px] leading-tight font-black truncate max-w-[64px]">
                            {n.name?.replace('حي ', '')}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Re-show legend button */}
        {viewMode === 'heatmap' && !showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            className="absolute bottom-[130px] right-3 z-[1000] glass text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/25 hover:bg-white/20 transition-colors"
          >
            🎨 دليل الألوان
          </button>
        )}
      </div>
    </div>
  );
}
