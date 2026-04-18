import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, RefreshCw, ChevronRight, ChevronLeft,
  UserX, UserCheck, Trash2, UserMinus, ToggleLeft, Filter,
} from 'lucide-react';
import { adminAPI } from '../../../api';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

// ── Action meta ────────────────────────────────────────────────────
const ACTION_META = {
  USER_DISABLED:      { label: 'تعطيل حساب',      icon: UserX,       cls: 'bg-amber-100 text-amber-700 border-amber-200',  dot: 'bg-amber-400'  },
  USER_ENABLED:       { label: 'تفعيل حساب',       icon: UserCheck,   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  USER_DELETED:       { label: 'حذف مستخدم',       icon: Trash2,      cls: 'bg-red-100 text-red-700 border-red-200',        dot: 'bg-red-500'    },
  REG_CANCELLED:      { label: 'إلغاء تسجيل',      icon: UserMinus,   cls: 'bg-rose-100 text-rose-700 border-rose-200',     dot: 'bg-rose-400'   },
  REG_STATUS_CHANGED: { label: 'تغيير حالة تسجيل', icon: ToggleLeft,  cls: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-400'   },
};

const ActionBadge = ({ action }) => {
  const m = ACTION_META[action] || { label: action, icon: ClipboardList, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  const Icon = m.icon;
  return (
    <span className={`badge-pill text-[11px] font-bold px-2 py-1 border flex items-center gap-1.5 w-fit ${m.cls}`}>
      <Icon size={11} />
      {m.label}
    </span>
  );
};

const ALL_ACTIONS = Object.keys(ACTION_META);

// ── Audit Log Entry ────────────────────────────────────────────────
function LogEntry({ log, idx }) {
  const [expanded, setExpanded] = useState(false);
  const meta  = ACTION_META[log.action];
  const dot   = meta?.dot || 'bg-slate-300';

  const timeStr = () => {
    try {
      return formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar });
    } catch { return ''; }
  };

  const exactTime = () => {
    try {
      return format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar });
    } catch { return ''; }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="relative"
    >
      {/* Timeline dot */}
      <div className={`absolute top-4 right-0 w-2.5 h-2.5 rounded-full ${dot} shadow-sm ring-2 ring-white z-10`} />

      <div
        className="mr-5 border border-slate-100 rounded-xl p-4 hover:border-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer bg-white"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ActionBadge action={log.action} />
              {log.target_name && (
                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                  {log.target_name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
              <span className="font-semibold text-slate-500">👤 {log.admin_name}</span>
              <span>·</span>
              <span title={exactTime()}>{timeStr()}</span>
            </p>
          </div>
          <span className={`text-slate-300 transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}>
            <ChevronRight size={14} />
          </span>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && log.details && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-2">تفاصيل العملية:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {typeof log.details === 'object'
                    ? Object.entries(log.details).map(([k, v]) => (
                        <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{k}</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{String(v)}</p>
                        </div>
                      ))
                    : (
                        <p className="text-xs text-slate-600 col-span-3">{String(log.details)}</p>
                      )
                  }
                </div>
                <p className="text-[10px] text-slate-300 mt-2">التوقيت: {exactTime()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function AuditLogTab() {
  const [logs, setLogs]             = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getAuditLog({
        page, limit: 20,
        action: actionFilter || undefined,
      });
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      toast.error('خطأ في تحميل سجل العمليات');
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-5">

      {/* ── Filter Row ───────────────────────────────────── */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-500 flex-shrink-0">فلتر بنوع العملية:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActionFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                actionFilter === '' ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              الكل
            </button>
            {ALL_ACTIONS.map(a => {
              const m = ACTION_META[a];
              return (
                <button
                  key={a}
                  onClick={() => setActionFilter(a)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    actionFilter === a ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 mr-auto flex-shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            {pagination.total} عملية
          </span>
          <button
            onClick={() => load(pagination.page)}
            className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────── */}
      <div className="card p-5">
        {loading ? (
          <div className="space-y-3 pr-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="relative">
                <div className="absolute top-4 right-0 w-2.5 h-2.5 rounded-full bg-slate-200 ring-2 ring-white" />
                <div className="mr-5 border border-slate-100 rounded-xl p-4 space-y-2">
                  <div className="skeleton h-5 w-28 rounded-full" />
                  <div className="skeleton h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-slate-400 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-500">لا توجد عمليات مسجّلة بعد</p>
            <p className="text-xs">ستظهر هنا كل عمليات الإدارة فور تنفيذها</p>
          </div>
        ) : (
          <div className="relative pr-3">
            {/* Timeline vertical line */}
            <div className="absolute top-0 bottom-0 right-1 w-px bg-slate-100" />

            <div className="space-y-3">
              {logs.map((log, idx) => (
                <LogEntry key={log.id} log={log} idx={idx} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
            className="p-2 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-600 px-2">
            صفحة {pagination.page} من {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => load(pagination.page + 1)}
            className="p-2 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
