import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserX, UserCheck, Trash2, Shield,
  Users, RefreshCw, ChevronRight, ChevronLeft,
  Phone, Mail, MapPin, Star, Clock, AlertTriangle,
} from 'lucide-react';
import { adminAPI } from '../../../api';
import { useAuth } from '../../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

// ── Role / status badges ───────────────────────────────────────────
const RoleBadge = ({ role }) => (
  <span className={`badge-pill text-[10px] font-black px-2 py-0.5 ${
    role === 'admin'
      ? 'bg-[#F9F5F0] text-[#344F1F] border border-[#F2EAD3]'
      : 'bg-[#F9F5F0] text-[#344F1F] border border-[#F2EAD3]'
  }`}>
    {role === 'admin' ? '👑 مدير' : '🙋 شاب'}
  </span>
);

const StatusBadge = ({ isActive }) => (
  <span className={`badge-pill text-[10px] font-bold px-2 py-0.5 ${
    isActive
      ? 'bg-[#F9F5F0] text-[#344F1F] border border-[#F2EAD3]'
      : 'bg-[#F9F5F0] text-[#344F1F] border border-[#F2EAD3]'
  }`}>
    {isActive ? '🟢 نشط' : '🔴 معطّل'}
  </span>
);

// ── Confirm Dialog ─────────────────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#344F1F]/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#F9F5F0] rounded-2xl shadow-2xl w-full max-w-sm p-6"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            danger ? 'bg-[#F9F5F0]' : 'bg-[#F9F5F0]'
          }`}>
            <AlertTriangle size={22} className={danger ? 'text-[#F4991A]' : 'text-[#F4991A]'} />
          </div>
          <h3 className="font-black text-[#344F1F] text-center text-base mb-2">{title}</h3>
          <p className="text-[#F4991A] text-sm text-center mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#F2EAD3] text-[#344F1F] font-semibold text-sm hover:bg-[#F9F5F0] transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-[#F9F5F0] transition-colors ${
                danger ? 'bg-[#F4991A] hover:bg-[#344F1F]' : 'bg-[#F4991A] hover:bg-[#344F1F]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function UsersTab() {
  const { user: adminUser } = useAuth();
  const [users, setUsers]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ q: '', role: '', status: '' });
  const [search, setSearch]     = useState('');
  const [confirm, setConfirm]   = useState(null); // { type, user }
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers({
        q: filters.q, role: filters.role, status: filters.status,
        page, limit: 15,
      });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      toast.error('خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, q: search }));
  };

  const openConfirm = (type, user) => setConfirm({ type, user });
  const closeConfirm = () => setConfirm(null);

  const execConfirm = async () => {
    if (!confirm) return;
    const { type, user } = confirm;
    setActionId(user.id);
    closeConfirm();

    try {
      if (type === 'toggle') {
        const res = await adminAPI.toggleUser(user.id);
        toast.success(res.data.message);
      } else if (type === 'delete') {
        const res = await adminAPI.deleteUser(user.id);
        toast.success(res.data.message);
      }
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في تنفيذ العملية');
    } finally {
      setActionId(null);
    }
  };

  const timeAgo = (d) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ar }); }
    catch { return ''; }
  };

  return (
    <div className="space-y-5">

      {/* ── Search & Filters ─────────────────────────────── */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 right-3 text-[#F4991A]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد أو الهاتف..."
              className="input-field pr-9 text-sm"
            />
          </div>

          <select
            value={filters.role}
            onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
            className="input-field text-sm w-full sm:w-36"
          >
            <option value="">جميع الأدوار</option>
            <option value="youth">شباب</option>
            <option value="admin">مدراء</option>
          </select>

          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="input-field text-sm w-full sm:w-36"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطّل</option>
          </select>

          <button type="submit" className="btn-primary text-sm px-5 flex-shrink-0">
            بحث
          </button>
        </form>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F9F5F0]">
          <p className="text-xs text-[#F4991A] font-medium">
            إجمالي النتائج: <span className="font-black text-[#344F1F]">{pagination.total}</span> مستخدم
          </p>
          <button
            onClick={() => load(pagination.page)}
            className="flex items-center gap-1.5 text-xs text-[#344F1F] hover:text-[#344F1F] font-semibold"
          >
            <RefreshCw size={12} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── Users Table ──────────────────────────────────── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-slate-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-1/3" />
                  <div className="skeleton h-2.5 w-1/2" />
                </div>
                <div className="skeleton h-6 w-14 rounded-full" />
                <div className="skeleton h-7 w-16 rounded-lg" />
                <div className="skeleton h-7 w-7 rounded-lg" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-[#F4991A] gap-3">
            <div className="w-16 h-16 rounded-3xl bg-[#F9F5F0] flex items-center justify-center">
              <Users size={28} className="text-[#F2EAD3]" />
            </div>
            <p className="font-semibold text-[#F4991A]">لا يوجد مستخدمون مطابقون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9F5F0]/80 text-[#F4991A] text-xs font-bold border-b border-[#F9F5F0]">
                  <th className="text-right px-5 py-3.5">المستخدم</th>
                  <th className="text-right px-5 py-3.5 hidden md:table-cell">التواصل</th>
                  <th className="text-right px-5 py-3.5 hidden sm:table-cell">النشاط</th>
                  <th className="text-right px-5 py-3.5">الدور</th>
                  <th className="text-right px-5 py-3.5">الحالة</th>
                  <th className="text-right px-5 py-3.5">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {users.map((u, idx) => {
                    const isSelf   = u.id === adminUser?.id;
                    const isAdmin  = u.role === 'admin';
                    const busy     = actionId === u.id;

                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`group transition-colors ${
                          u.is_active ? 'hover:bg-[#F9F5F0]/30' : 'bg-[#F9F5F0]/30 hover:bg-[#F9F5F0]/60'
                        }`}
                      >
                        {/* User identity */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[#F9F5F0] font-black text-sm flex-shrink-0 shadow-sm ${
                              u.is_active ? 'bg-hero-gradient' : 'bg-[#F2EAD3]'
                            }`}>
                              {u.name?.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-bold text-sm leading-none ${u.is_active ? 'text-[#344F1F]' : 'text-[#F4991A] line-through'}`}>
                                {u.name}
                                {isSelf && <span className="mr-1 text-[10px] text-[#F4991A]">(أنت)</span>}
                              </p>
                              <p className="text-[11px] text-[#F4991A] mt-0.5">{timeAgo(u.created_at)}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-xs text-[#F4991A]">
                              <Mail size={10} className="text-[#F2EAD3]" />
                              {u.email}
                            </p>
                            {u.phone && (
                              <p className="flex items-center gap-1.5 text-xs text-[#F4991A]">
                                <Phone size={10} className="text-[#F2EAD3]" />
                                {u.phone}
                              </p>
                            )}
                            {u.neighborhood_name && (
                              <p className="flex items-center gap-1.5 text-xs text-[#F4991A]">
                                <MapPin size={10} className="text-[#F2EAD3]" />
                                {u.neighborhood_name}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Activity */}
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-xs text-[#344F1F] font-semibold">
                              <Star size={10} className="text-[#F4991A]" />
                              {u.points} نقطة
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-[#F4991A]">
                              <Clock size={10} />
                              {u.attended_count}/{u.total_regs} فعالية
                            </p>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <RoleBadge role={u.role} />
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusBadge isActive={u.is_active === 1 || u.is_active === true} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {!isSelf && !isAdmin && (
                              <>
                                {/* Toggle disable/enable */}
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  disabled={busy}
                                  onClick={() => openConfirm('toggle', u)}
                                  title={u.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                                  className={`p-2 rounded-xl transition-all duration-200 ${
                                    u.is_active
                                      ? 'hover:bg-[#F9F5F0] text-[#F4991A] hover:text-[#344F1F]'
                                      : 'hover:bg-[#F9F5F0] text-[#F4991A] hover:text-[#344F1F]'
                                  }`}
                                >
                                  {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                                </motion.button>

                                {/* Delete */}
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  disabled={busy}
                                  onClick={() => openConfirm('delete', u)}
                                  title="حذف نهائي"
                                  className="p-2 rounded-xl hover:bg-[#F9F5F0] text-[#F4991A] hover:text-[#F4991A] transition-all duration-200"
                                >
                                  <Trash2 size={15} />
                                </motion.button>
                              </>
                            )}
                            {(isSelf || isAdmin) && (
                              <span className="text-[10px] text-[#F2EAD3] px-2">
                                <Shield size={13} className="text-[#F2EAD3]" />
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => load(pagination.page - 1)}
            className="p-2 rounded-xl border border-[#F2EAD3] hover:border-[#F2EAD3] hover:bg-[#F9F5F0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold text-[#344F1F] px-2">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => load(pagination.page + 1)}
            className="p-2 rounded-xl border border-[#F2EAD3] hover:border-[#F2EAD3] hover:bg-[#F9F5F0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {/* ── Confirm Modal ────────────────────────────────── */}
      <ConfirmModal
        open={!!confirm}
        title={
          confirm?.type === 'delete'
            ? `حذف "${confirm?.user?.name}" نهائياً؟`
            : confirm?.user?.is_active
            ? `تعطيل حساب "${confirm?.user?.name}"؟`
            : `تفعيل حساب "${confirm?.user?.name}"؟`
        }
        message={
          confirm?.type === 'delete'
            ? 'سيتم حذف المستخدم وجميع بياناته بشكل دائم ولا يمكن التراجع عن هذا الإجراء.'
            : confirm?.user?.is_active
            ? 'سيتم منع المستخدم من تسجيل الدخول فوراً حتى يُعاد تفعيل حسابه.'
            : 'سيتمكن المستخدم من تسجيل الدخول مجدداً.'
        }
        confirmLabel={
          confirm?.type === 'delete' ? 'حذف نهائي' :
          confirm?.user?.is_active   ? 'تعطيل'     : 'تفعيل'
        }
        danger={confirm?.type === 'delete'}
        onConfirm={execConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
