import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Clock, CheckCircle,
  Plus, Eye, MapPin, BarChart2, Activity,
  Sparkles, RefreshCw, Trash2, Megaphone, Send,
  UserCog, ClipboardList, LayoutDashboard,
} from 'lucide-react';
import { usersAPI, eventsAPI, registrationsAPI, notificationsAPI, neighborhoodsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import CreateEventModal from './CreateEventModal';
import UsersTab from './tabs/UsersTab';
import EventRegistrationsTab from './tabs/EventRegistrationsTab';
import AuditLogTab from './tabs/AuditLogTab';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

// ─── Tab definition ───────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'الرئيسية',        icon: LayoutDashboard },
  { key: 'users',     label: 'المستخدمون',       icon: UserCog         },
  { key: 'regs',      label: 'إدارة المشاركات',  icon: Calendar        },
  { key: 'audit',     label: 'سجل الإجراءات',    icon: ClipboardList   },
];

// ─── Animated Stat Card ───────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`stat-card bg-gradient-to-br ${gradient} inner-shine`}
    >
      <div className="absolute inset-0 dot-pattern-sm opacity-15 rounded-2xl pointer-events-none" />
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm shadow-inner-top">
          <Icon size={26} className="text-white" />
        </div>
        <div>
          <p className="text-white/70 text-xs font-semibold leading-none">{label}</p>
          <p className="text-3xl font-black text-white leading-none mt-1.5 stat-num-shadow">{value}</p>
          {sub && <p className="text-white/60 text-xs font-medium mt-1">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────
function TypeChart({ data }) {
  if (!data?.length) return (
    <div className="flex flex-col items-center py-8 text-slate-300">
      <BarChart2 size={36} className="mb-2" />
      <p className="text-sm font-semibold">لا توجد بيانات بعد</p>
    </div>
  );
  const max = Math.max(...data.map(d => Number(d.count)));
  const COLORS = {
    'تطوعية': '#10b981', 'ثقافية': '#8b5cf6', 'رياضية': '#f97316',
    'تعليمية': '#3b82f6', 'بيئية': '#22c55e', 'اجتماعية': '#ec4899',
  };
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-slate-700 text-sm">{d.type}</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: COLORS[d.type] || '#3b82f6' }}>
              {d.count}
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / max) * 100}%` }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.9, ease: 'easeOut' }}
              className="h-full rounded-full relative overflow-hidden"
              style={{ background: COLORS[d.type] || '#3b82f6' }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Neighborhood Chart ───────────────────────────────────────────
function NeighborhoodChart({ data }) {
  if (!data?.length) return (
    <p className="text-slate-400 text-sm text-center py-8 font-semibold">لا توجد بيانات بعد</p>
  );
  const max = Math.max(...data.map(d => Number(d.registrations)));
  const GRADIENTS = [
    'from-brand-600 to-brand-800', 'from-brand-500 to-brand-700',
    'from-brand-400 to-brand-600', 'from-brand-300 to-brand-500',
    'from-brand-200 to-brand-400',
  ];
  const COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 + 0.2 }} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${GRADIENTS[i] || GRADIENTS[4]} flex items-center justify-center flex-shrink-0 text-white text-xs font-black shadow-sm`}>
            {i + 1}
          </div>
          <span className="text-sm text-slate-700 w-24 flex-shrink-0 font-semibold truncate">{d.name}</span>
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.registrations / max) * 100}%` }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(to left, ${COLORS[i]}, ${COLORS[Math.min(i+1,4)]})` }}
            />
          </div>
          <span className="text-xs font-black text-slate-500 w-8 text-left">{d.registrations}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────
function SectionCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`card overflow-hidden ${className}`}>
      {children}
    </motion.div>
  );
}

// ─── Status Badge (attendance) ────────────────────────────────────
function StatusBadge({ status }) {
  const MAP = {
    registered: { label: 'مسجّل',  cls: 'bg-blue-100 text-blue-700 border border-blue-200'      },
    attended:   { label: 'حضر',    cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    absent:     { label: 'غائب',   cls: 'bg-red-100 text-red-600 border border-red-200'           },
  };
  const s = MAP[status] || MAP.registered;
  return <span className={`badge-pill text-xs ${s.cls}`}>{s.label}</span>;
}

// ─── Overview Tab (stats + charts + events + attendance + broadcast) ──
function OverviewTab({ stats, events, onCreateEvent, onRefresh, refreshing }) {
  const [registrations, setRegs]    = useState([]);
  const [confirmId, setConfirmId]   = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [broadcast, setBroadcast]   = useState({
    title: '', message: '', type: 'announcement', target: 'youth', neighborhood_id: '',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    neighborhoodsAPI.getAll()
      .then(r => setNeighborhoods(r.data.neighborhoods || []))
      .catch(() => {});
  }, []);

  const loadEventRegs = async (eventId) => {
    try {
      const res = await registrationsAPI.getByEvent(eventId);
      setRegs(res.data.registrations || []);
    } catch { setRegs([]); }
  };

  const handleConfirm = async (regId) => {
    setConfirmId(regId);
    try {
      await registrationsAPI.confirm(regId);
      toast.success('تم تأكيد الحضور ومنح النقاط ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ');
    } finally {
      setConfirmId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفعالية؟')) return;
    try {
      await eventsAPI.remove(id);
      toast.success('تم حذف الفعالية');
      onRefresh();
    } catch { toast.error('خطأ في الحذف'); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title.trim()) return toast.error('يرجى كتابة عنوان الإشعار');
    setSending(true);
    try {
      await notificationsAPI.broadcast({
        title: broadcast.title, message: broadcast.message,
        type: broadcast.type, target: broadcast.target,
        neighborhood_id: broadcast.neighborhood_id || null,
      });
      toast.success('تم إرسال الإشعار بنجاح 📢');
      setBroadcast({ title: '', message: '', type: 'announcement', target: 'youth', neighborhood_id: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الإرسال');
    } finally {
      setSending(false);
    }
  };

  const s = stats?.stats || {};

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="إجمالي الشباب"  value={s.total_users || 0}
          gradient="from-brand-600 to-brand-800"    delay={0}   sub="مسجّل في المنصة" />
        <StatCard icon={Calendar}    label="فعاليات نشطة"   value={s.active_events || 0}
          gradient="from-emerald-500 to-teal-600"   delay={0.1} sub="متاحة للتسجيل" />
        <StatCard icon={CheckCircle} label="إجمالي الحضور"  value={s.total_attendances || 0}
          gradient="from-violet-500 to-purple-600"  delay={0.2} sub="تأكيد حضور" />
        <StatCard icon={Clock}       label="ساعات التطوع"   value={`${Math.round(s.total_volunteer_hours || 0)}h`}
          gradient="from-amber-500 to-orange-500"   delay={0.3} sub="مجموع الساعات" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard delay={0.4}>
          <div className="p-5 border-b border-slate-50 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md">
              <BarChart2 size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-none">الفعاليات حسب النوع</h2>
              <p className="text-slate-400 text-[10px] mt-0.5">توزيع الأنشطة</p>
            </div>
          </div>
          <div className="p-5"><TypeChart data={stats?.eventsByType} /></div>
        </SectionCard>

        <SectionCard delay={0.5}>
          <div className="p-5 border-b border-slate-50 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MapPin size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-none">أكثر الأحياء تفاعلاً</h2>
              <p className="text-slate-400 text-[10px] mt-0.5">بناءً على التسجيلات</p>
            </div>
          </div>
          <div className="p-5"><NeighborhoodChart data={stats?.topNeighborhoods} /></div>
        </SectionCard>
      </div>

      {/* Events Table */}
      <SectionCard delay={0.6}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
              <Calendar size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-none">إدارة الفعاليات</h2>
              <p className="text-slate-400 text-[10px] mt-0.5">{events.length} فعالية مسجّلة</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold">
                <th className="text-right px-5 py-3.5 border-b border-slate-100">الفعالية</th>
                <th className="text-right px-5 py-3.5 hidden sm:table-cell border-b border-slate-100">النوع</th>
                <th className="text-right px-5 py-3.5 hidden md:table-cell border-b border-slate-100">التاريخ</th>
                <th className="text-right px-5 py-3.5 border-b border-slate-100">المشاركون</th>
                <th className="text-right px-5 py-3.5 border-b border-slate-100">الحالة</th>
                <th className="text-right px-5 py-3.5 border-b border-slate-100">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {events.map((ev, idx) => {
                const fill = Math.round((ev.current_participants / ev.max_participants) * 100);
                return (
                  <motion.tr key={ev.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 + 0.6 }}
                    className="hover:bg-brand-50/30 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-brand-700">{ev.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} />{ev.location_name}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="badge-pill bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">{ev.type}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-sm text-slate-500 font-medium">
                      {(() => { try { return format(new Date(ev.date), 'd MMM', { locale: ar }); } catch { return '—'; } })()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            fill >= 90 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                            fill >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                         'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          }`} style={{ width: `${fill}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap font-semibold">
                          {ev.current_participants}/{ev.max_participants}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge-pill text-xs font-bold ${
                        ev.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {ev.status === 'active' ? '🟢 نشطة' : '⚪ منتهية'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/events/${ev.id}`}
                          className="p-2 rounded-xl hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-all" title="عرض">
                          <Eye size={15} />
                        </Link>
                        <button onClick={() => handleDelete(ev.id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all" title="حذف">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                        <Calendar size={28} className="text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-500">لا توجد فعاليات — أنشئ أول فعالية!</p>
                      <button onClick={onCreateEvent} className="btn-primary text-sm"><Plus size={15} /> أنشئ فعالية</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Attendance Confirmation */}
      {events.length > 0 && (
        <SectionCard delay={0.7} className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <CheckCircle size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm leading-none">تأكيد الحضور</h2>
              <p className="text-slate-400 text-[10px] mt-0.5">مراجعة المسجّلين ومنح النقاط</p>
            </div>
          </div>
          <select onChange={e => loadEventRegs(e.target.value)} className="input-field mb-5 text-sm" defaultValue="">
            <option value="" disabled>اختر فعالية لعرض المسجّلين...</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
          {registrations.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {registrations.map((r, i) => (
                  <motion.div key={r.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-hero-gradient text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md">
                      {r.user_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm leading-none">{r.user_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.email}</p>
                    </div>
                    <StatusBadge status={r.status} />
                    {r.status === 'registered' && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleConfirm(r.id)}
                        disabled={confirmId === r.id}
                        className="btn-green text-xs py-1.5 px-3 flex items-center gap-1 flex-shrink-0">
                        {confirmId === r.id ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : <><CheckCircle size={12} /> تأكيد</>}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Users size={20} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold">اختر فعالية لعرض المسجّلين</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Broadcast Notification */}
      <SectionCard delay={0.8} className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md">
            <Megaphone size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm leading-none">إرسال إشعار جماعي</h2>
            <p className="text-slate-400 text-[10px] mt-0.5">أرسل إشعاراً لجميع المستخدمين أو شريحة محددة</p>
          </div>
        </div>
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">عنوان الإشعار *</label>
            <input type="text" value={broadcast.title}
              onChange={e => setBroadcast(p => ({ ...p, title: e.target.value }))}
              placeholder="مثال: إعلان هام للشباب..."
              className="input-field text-sm" maxLength={200} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">نص الإشعار (اختياري)</label>
            <textarea value={broadcast.message}
              onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))}
              placeholder="تفاصيل إضافية..." className="input-field text-sm resize-none" rows={3} maxLength={500} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">نوع الإشعار</label>
              <select value={broadcast.type}
                onChange={e => setBroadcast(p => ({ ...p, type: e.target.value }))} className="input-field text-sm">
                <option value="announcement">📢 إعلان</option>
                <option value="new_event">🎉 فعالية جديدة</option>
                <option value="system">🔔 نظام</option>
                <option value="badge">🏅 شارة</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الجمهور المستهدف</label>
              <select value={broadcast.target}
                onChange={e => setBroadcast(p => ({ ...p, target: e.target.value }))} className="input-field text-sm">
                <option value="youth">الشباب فقط</option>
                <option value="admin">المدراء فقط</option>
                <option value="all">الجميع</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الحي (اختياري)</label>
              <select value={broadcast.neighborhood_id}
                onChange={e => setBroadcast(p => ({ ...p, neighborhood_id: e.target.value }))} className="input-field text-sm">
                <option value="">جميع الأحياء</option>
                {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
            type="submit" disabled={sending}
            className="btn-primary w-full sm:w-auto flex items-center gap-2 justify-center">
            {sending ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : <Send size={16} />}
            {sending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
          </motion.button>
        </form>
      </SectionCard>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab]   = useState('overview');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        usersAPI.getAdminStats(),
        eventsAPI.getAll({}),
      ]);
      setStats(statsRes.data);
      setEvents(eventsRes.data.events || []);
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    toast.success('تم تحديث البيانات');
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
          <Activity size={20} className="absolute inset-0 m-auto text-brand-500" />
        </div>
        <p className="font-semibold text-sm">جاري تحميل لوحة التحكم...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-16">

      {/* ── Admin Header Banner ────────────────────────── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <BarChart2 size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 leading-none">لوحة التحكم</h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  مرحباً {user?.name} · <span className="text-amber-500 font-bold">مدير النظام</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale: 0.95, rotate: 180 }} onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 text-sm font-semibold transition-all">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                تحديث
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={18} />
                إنشاء فعالية
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ───────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-all duration-200 border-b-2 flex-shrink-0 ${
                  activeTab === key
                    ? 'border-brand-700 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
                }`}
              >
                <Icon size={15} />
                {label}
                {activeTab === key && (
                  <motion.div layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-700 rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab
                stats={stats}
                events={events}
                onCreateEvent={() => setShowCreate(true)}
                onRefresh={loadAll}
                refreshing={refreshing}
              />
            )}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'regs'  && <EventRegistrationsTab />}
            {activeTab === 'audit' && <AuditLogTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateEventModal
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              loadAll();
              toast.success('تم إنشاء الفعالية! 🎉');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
