import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserMinus, ChevronDown, RefreshCw, Users,
  Calendar, CheckCircle, XCircle, Clock, AlertTriangle,
  MapPin, Phone, Mail, Filter,
} from 'lucide-react';
import { adminAPI, eventsAPI } from '../../../api';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/ui/ConfirmModal';

// ── Status config ──────────────────────────────────────────────────
const STATUS_META = {
  registered: { label: 'مسجّل', icon: Clock, cls: 'bg-[#F9F5F0] text-[#344F1F] border-[#F2EAD3]' },
  attended: { label: 'حضر', icon: CheckCircle, cls: 'bg-[#F9F5F0] text-[#344F1F] border-[#F2EAD3]' },
  cancelled: { label: 'ملغى', icon: XCircle, cls: 'bg-[#F9F5F0] text-[#344F1F] border-[#F2EAD3]' },
  absent: { label: 'لم يحضر', icon: UserMinus, cls: 'bg-[#F9F5F0] text-[#F4991A] border-[#F2EAD3]' },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.registered;
  const Icon = m.icon;
  return (
    <span className={`badge-pill text-xs font-bold px-2 py-0.5 border flex items-center gap-1 w-fit ${m.cls}`}>
      <Icon size={10} />
      {m.label}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────
export default function EventRegistrationsTab() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [regs, setRegs] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [actionId, setActionId] = useState(null);

  // Load events list
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventsAPI.getAll({});
        setEvents(res.data.events || []);
      } catch {
        toast.error('خطأ في تحميل الفعاليات');
      } finally {
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, []);

  const loadRegistrations = useCallback(async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      const res = await adminAPI.getEventRegs(selectedEvent, {
        status: statusFilter || undefined,
      });
      setRegs(res.data.registrations || []);
      setEventInfo(res.data.event || null);
    } catch {
      toast.error('خطأ في تحميل المشاركين');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, statusFilter]);

  useEffect(() => { loadRegistrations(); }, [loadRegistrations]);

  const handleStatusChange = async (regId, newStatus) => {
    setActionId(regId);
    try {
      const res = await adminAPI.changeRegStatus(regId, newStatus);
      toast.success(res.data.message);
      loadRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في تغيير الحالة');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setActionId(confirmCancel.id);
    setConfirmCancel(null);
    try {
      const res = await adminAPI.cancelReg(confirmCancel.id);
      toast.success(res.data.message);
      loadRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في إلغاء التسجيل');
    } finally {
      setActionId(null);
    }
  };

  const timeAgo = (d) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ar }); }
    catch { return ''; }
  };

  const formatDate = (d) => {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: ar }); }
    catch { return '—'; }
  };

  // Count by status
  const counts = regs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">

      {/* ── Event Selector ───────────────────────────────── */}
      <div className="card p-4">
        <label className="block text-xs font-bold text-[#344F1F] mb-2">اختر فعالية لإدارة مشاركيها</label>
        {eventsLoading ? (
          <div className="skeleton h-10 rounded-xl" />
        ) : (
          <select
            value={selectedEvent}
            onChange={e => { setSelectedEvent(e.target.value); setStatusFilter(''); }}
            className="input-field text-sm"
          >
            <option value="">— اختر فعالية —</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title} · {formatDate(ev.date)}
              </option>
            ))}
          </select>
        )}

        {/* Event quick stats */}
        {eventInfo && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 pt-3 border-t border-[#F9F5F0] flex items-center gap-4 flex-wrap"
          >
            <span className="flex items-center gap-1.5 text-xs text-[#F4991A] font-semibold">
              <Users size={12} className="text-[#F4991A]" />
              {eventInfo.current_participants}/{eventInfo.max_participants} مشارك
            </span>
            {Object.entries(counts).map(([st, cnt]) => (
              <StatusBadge key={st} status={st} />
            ))}
            <span className="mr-auto text-xs font-bold text-[#344F1F]">
              {regs.length} تسجيل
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Status Filter Row ─────────────────────────────── */}
      {selectedEvent && (
        <div className="flex items-center gap-2 overflow-x-auto">
          {[{ key: '', label: 'الكل' }, ...Object.entries(STATUS_META).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === f.key
                ? 'bg-[#344F1F] text-[#F9F5F0] shadow-sm'
                : 'bg-[#F9F5F0] text-[#F4991A] hover:bg-[#F2EAD3]'
                }`}
            >
              {f.label}
              {f.key && counts[f.key] > 0 && (
                <span className="mr-1.5 text-[10px]">({counts[f.key]})</span>
              )}
            </button>
          ))}
          <button onClick={loadRegistrations} className="flex-shrink-0 mr-auto p-1.5 rounded-lg text-[#344F1F] hover:bg-[#F9F5F0] transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      {/* ── Registrations Table ──────────────────────────── */}
      {!selectedEvent ? (
        <div className="card flex flex-col items-center py-16 text-[#F4991A] gap-3">
          <div className="w-16 h-16 rounded-3xl bg-[#F9F5F0] flex items-center justify-center">
            <Calendar size={28} className="text-[#F2EAD3]" />
          </div>
          <p className="font-semibold text-[#F4991A]">اختر فعالية من القائمة أعلاه</p>
        </div>
      ) : loading ? (
        <div className="card space-y-0 divide-y divide-slate-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-1/3" />
                <div className="skeleton h-2.5 w-1/2" />
              </div>
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-7 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : regs.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-[#F4991A] gap-3">
          <Users size={36} className="text-[#F2EAD3]" />
          <p className="font-semibold text-[#F4991A]">لا توجد تسجيلات مطابقة</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9F5F0]/80 text-[#F4991A] text-xs font-bold border-b border-[#F9F5F0]">
                  <th className="text-right px-5 py-3.5">المشارك</th>
                  <th className="text-right px-5 py-3.5 hidden md:table-cell">معلومات الاتصال</th>
                  <th className="text-right px-5 py-3.5 hidden sm:table-cell">وقت التسجيل</th>
                  <th className="text-right px-5 py-3.5">الحالة</th>
                  <th className="text-right px-5 py-3.5">تغيير الحالة</th>
                  <th className="text-right px-5 py-3.5">إلغاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {regs.map((r, idx) => {
                    const busy = actionId === r.id;
                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group hover:bg-[#F9F5F0]/20 transition-colors"
                      >
                        {/* Participant */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[#F9F5F0] font-black text-sm flex-shrink-0 overflow-hidden ${r.is_active ? 'bg-hero-gradient' : 'bg-[#F2EAD3]'
                              }`}>
                              {r.avatar_url ? (
                                <img src={r.avatar_url} alt={r.user_name} className="w-full h-full object-cover" />
                              ) : (
                                r.user_name?.charAt(0)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#344F1F] text-sm leading-none">{r.user_name}</p>
                              {r.neighborhood_name && (
                                <p className="flex items-center gap-1 text-[11px] text-[#F4991A] mt-0.5">
                                  <MapPin size={9} /> {r.neighborhood_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="space-y-0.5">
                            <p className="flex items-center gap-1.5 text-xs text-[#F4991A]">
                              <Mail size={10} className="text-[#F2EAD3]" /> {r.email}
                            </p>
                            {r.phone && (
                              <p className="flex items-center gap-1.5 text-xs text-[#F4991A]">
                                <Phone size={10} className="text-[#F2EAD3]" /> {r.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Registered at */}
                        <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-[#F4991A] font-medium">
                          {timeAgo(r.registered_at)}
                        </td>

                        {/* Current status */}
                        <td className="px-5 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>

                        {/* Status change dropdown */}
                        <td className="px-5 py-3.5">
                          <select
                            value={r.status}
                            disabled={busy}
                            onChange={e => handleStatusChange(r.id, e.target.value)}
                            className="text-xs rounded-lg border border-[#F2EAD3] px-2 py-1.5 bg-[#F9F5F0] text-[#344F1F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#F2EAD3] disabled:opacity-50 cursor-pointer hover:border-[#F2EAD3] transition-colors"
                          >
                            {Object.entries(STATUS_META).map(([key, m]) => (
                              <option key={key} value={key}>{m.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Cancel registration */}
                        <td className="px-5 py-3.5">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            disabled={busy || r.status === 'cancelled'}
                            onClick={() => setConfirmCancel(r)}
                            title="إلغاء التسجيل وحذفه"
                            className="p-2 rounded-xl hover:bg-[#F9F5F0] text-[#F4991A] hover:text-[#F4991A] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <UserMinus size={15} />
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={handleCancel}
        title={`إلغاء تسجيل "${confirmCancel?.user_name}"؟`}
        message="سيتم حذف سجل المشاركة بشكل نهائي وتعديل عدد المشاركين في الفعالية."
      />
    </div>
  );
}
