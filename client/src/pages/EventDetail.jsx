import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin, Calendar, Clock, Users, ChevronRight,
  Share2, Heart, CheckCircle, AlertCircle
} from 'lucide-react';
import { eventsAPI, registrationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TYPE_COLORS = {
  'تطوعية': '#10b981', 'ثقافية': '#8b5cf6', 'رياضية': '#f97316',
  'تعليمية': '#3b82f6', 'بيئية': '#22c55e', 'اجتماعية': '#ec4899',
};

export default function EventDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { isAuth }  = useAuth();

  const [event, setEvent]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [liked, setLiked]       = useState(false);

  useEffect(() => {
    eventsAPI.getById(id)
      .then(res => setEvent(res.data.event))
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="animate-spin h-10 w-10 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="font-semibold">جاري التحميل...</p>
      </div>
    </div>
  );

  if (!event) return null;

  const fillPct  = Math.round((event.current_participants / event.max_participants) * 100);
  const isFull   = event.current_participants >= event.max_participants;
  const typeColor = TYPE_COLORS[event.type] || '#3b82f6';

  const formattedDate = (() => {
    try { return format(new Date(event.date), "EEEE، d MMMM yyyy 'الساعة' HH:mm", { locale: ar }); }
    catch { return event.date; }
  })();

  const handleRegister = async () => {
    if (!isAuth) { toast.error('يجب تسجيل الدخول أولاً'); navigate('/login'); return; }
    if (isFull)  { toast.error('الفعالية ممتلئة'); return; }
    setRegLoading(true);
    try {
      await registrationsAPI.register(event.id);
      setRegistered(true);
      setEvent(prev => ({ ...prev, current_participants: prev.current_participants + 1 }));
      toast.success('تم التسجيل بنجاح! 🎉 سنراك هناك');
    } catch (err) {
      const msg = err.response?.data?.error || 'خطأ';
      if (msg.includes('مسبقاً')) setRegistered(true);
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16">

      {/* Hero Image */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-slate-900">
        <img
          src={event.image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800'}
          alt={event.title}
          className="w-full h-full object-cover opacity-80"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-4 inset-x-4">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-semibold bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <ChevronRight size={14} />
            الفعاليات
          </Link>
        </div>

        {/* Event title overlay */}
        <div className="absolute bottom-6 inset-x-6">
          <span className="badge-pill text-xs mb-3 inline-flex" style={{ background: typeColor + '30', color: '#fff', borderColor: typeColor }}>
            {event.type}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-snug">{event.title}</h1>
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button onClick={() => setLiked(l => !l)}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${liked ? 'bg-red-500 text-white' : 'bg-black/20 text-white hover:bg-black/30'}`}>
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleShare}
            className="p-2 rounded-full bg-black/20 text-white hover:bg-black/30 backdrop-blur-sm transition-colors">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Main Content ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Meta pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-3"
            >
              {[
                { icon: Calendar, text: formattedDate },
                { icon: MapPin,   text: event.location_name },
                { icon: Clock,    text: `${event.duration_hours} ساعة` },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm text-sm text-slate-600 font-medium">
                  <Icon size={14} className="text-brand-500 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </motion.div>

            {/* Description */}
            {event.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <h2 className="font-bold text-slate-800 mb-3 text-lg">عن الفعالية</h2>
                <p className="text-slate-600 leading-relaxed">{event.description}</p>
              </motion.div>
            )}

            {/* Map */}
            {event.lat && event.lng && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                  <MapPin size={16} className="text-brand-500" />
                  <h2 className="font-bold text-slate-800">الموقع على الخريطة</h2>
                </div>
                <div className="h-52">
                  <MapContainer
                    center={[parseFloat(event.lat), parseFloat(event.lng)]}
                    zoom={16}
                    className="w-full h-full"
                    zoomControl={true}
                    style={{ direction: 'ltr' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Circle
                      center={[parseFloat(event.lat), parseFloat(event.lng)]}
                      radius={200}
                      pathOptions={{ color: typeColor, fillColor: typeColor, fillOpacity: 0.15, weight: 2 }}
                    />
                    <Marker position={[parseFloat(event.lat), parseFloat(event.lng)]}>
                      <Popup><div style={{ fontFamily: 'Cairo', direction: 'rtl' }}>{event.location_name}</div></Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="p-3 bg-slate-50 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={13} className="text-brand-500" />
                  <span>{event.location_name}</span>
                  {event.neighborhood_name && <span className="text-slate-300">·</span>}
                  {event.neighborhood_name && <span>{event.neighborhood_name}</span>}
                </div>
              </motion.div>
            )}

            {/* Points Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-gradient-to-l from-brand-700 to-brand-900 rounded-2xl p-5 text-white"
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span className="text-xl">🏆</span> ما ستكسبه بالمشاركة
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: '10', label: 'نقطة', icon: '⭐' },
                  { val: `${event.duration_hours}`, label: 'ساعة تطوع', icon: '⏰' },
                  { val: '1', label: 'مشاركة', icon: '✅' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="text-2xl">{item.icon}</div>
                    <div className="font-black text-lg mt-1">{item.val}</div>
                    <div className="text-white/60 text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Register Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="card p-5 sticky top-20"
            >
              <h3 className="font-bold text-slate-800 mb-4">التسجيل في الفعالية</h3>

              {/* Capacity */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Users size={14} className="text-brand-500" />
                    {event.current_participants} مشارك
                  </span>
                  <span className={isFull ? 'text-red-500 font-bold' : 'text-slate-400'}>
                    {isFull ? 'مكتمل!' : `${event.max_participants - event.current_participants} مقعد متبقي`}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                    className={`h-full rounded-full ${fillPct >= 90 ? 'bg-red-400' : fillPct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 text-center">{fillPct}% ممتلئ</p>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleRegister}
                disabled={regLoading || registered || isFull}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                  registered
                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200'
                    : isFull
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'btn-primary shadow-lg hover:shadow-xl'
                }`}
              >
                {regLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : registered ? (
                  <><CheckCircle size={20} /> مسجّل بنجاح ✅</>
                ) : isFull ? (
                  <><AlertCircle size={20} /> الفعالية ممتلئة</>
                ) : (
                  <>انضم الآن 🚀</>
                )}
              </button>

              {!isAuth && !registered && !isFull && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  <Link to="/login" className="text-brand-600 font-semibold hover:underline">سجّل دخولك</Link> للانضمام
                </p>
              )}

              {/* Event meta */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={13} className="text-brand-400 flex-shrink-0" />
                  <span className="text-xs leading-relaxed">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={13} className="text-brand-400" />
                  <span>المدة: {event.duration_hours} ساعة</span>
                </div>
                {event.neighborhood_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={13} className="text-brand-400" />
                    <span>{event.neighborhood_name}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
