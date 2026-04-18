import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Calendar, Building2, GraduationCap,
  Plus, Search, MoreVertical, CheckCircle2, XCircle,
  Trash2, RefreshCcw, Activity, Building, Briefcase,
  Clock, ArrowRight, TrendingUp, AlertCircle, Eye, Bell,
  Settings, Database, Filter, Download, UserPlus, Fingerprint,
  Map as MapIcon, Power, Printer, Server, ShieldAlert, LineChart
} from 'lucide-react';
import { entitiesAPI, adminAPI, superAdminAPI, analyticsAPI } from '../api';
import toast from 'react-hot-toast';

const ENTITY_TYPES = {
  university: { label: 'جامعة', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
  company: { label: 'شركة', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
  municipality: { label: 'بلدية', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Data States
  const [monitoringData, setMonitoringData] = useState(null);
  const [users, setUsers] = useState([]);
  const [entities, setEntities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [allEvents, setAllEvents] = useState([]);
  const [blockedIps, setBlockedIps] = useState([]);
  const [logActionFilter, setLogActionFilter] = useState('');
  const [heatmapData, setHeatmapData] = useState(null);

  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, pagination.page]);

  useEffect(() => {
    if (activeTab !== 'monitoring') return;
    const t = setInterval(() => {
      superAdminAPI.getOverview().then((res) => setMonitoringData(res.data)).catch(() => { });
    }, 20000);
    return () => clearInterval(t);
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'monitoring') {
        const res = await superAdminAPI.getOverview();
        setMonitoringData(res.data);
        try {
          const hm = await analyticsAPI.getHeatmap();
          setHeatmapData(hm.data);
        } catch (_) {
          setHeatmapData(null);
        }
      } else if (activeTab === 'users') {
        const res = await adminAPI.listUsers({ q: search, page: pagination.page });
        setUsers(res.data.users);
        setPagination((p) => ({ ...p, total: res.data.pagination.total }));
      } else if (activeTab === 'entities') {
        const res = await entitiesAPI.list();
        setEntities(res.data.entities);
      } else if (activeTab === 'events') {
        const res = await superAdminAPI.listAllEvents();
        setAllEvents(res.data.events);
      } else if (activeTab === 'logs') {
        const res = await adminAPI.getAuditLog({
          page: pagination.page,
          search,
          action: logActionFilter || undefined,
        });
        setLogs(res.data.logs);
      } else if (activeTab === 'security') {
        const res = await superAdminAPI.listBlockedIps();
        setBlockedIps(res.data.blocked);
      } else if (activeTab === 'settings') {
        const res = await adminAPI.getSettings();
        setSettings(res.data.settings);
      }
    } catch (err) {
      toast.error('خطأ في مزامنة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (id) => {
    try {
      const res = await adminAPI.impersonate(id);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(res.data.message);
      window.location.href = '/profile';
    } catch (err) {
      toast.error('خطأ في عملية التقمص');
    }
  };

  const handleToggleEntity = async (id, currentStatus) => {
    try {
      await entitiesAPI.toggle(id);
      setEntities(entities.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e));
      toast.success('تم تحديث حالة الجهة');
    } catch (err) {
      toast.error('خطأ في تحديث الحالة');
    }
  };

  const handleDeleteEntity = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الجهة نهائياً؟')) return;
    try {
      await entitiesAPI.delete(id);
      setEntities(entities.filter(e => e.id !== id));
      toast.success('تم حذف الجهة بنجاح');
    } catch (err) {
      toast.error('خطأ في عملية الحذف');
    }
  };

  const handleUpdateEntity = async (id, data) => {
    try {
      await entitiesAPI.update(id, data);
      setEntities(entities.map(e => e.id === id ? { ...e, ...data } : e));
      toast.success('تم تحديث بيانات الجهة بنجاح');
      setIsSettingsModalOpen(false);
    } catch (err) {
      toast.error('خطأ في تحديث البيانات');
    }
  };

  const handleToggleSetting = async (key, currentValue) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      await adminAPI.updateSetting(key, newValue);
      setSettings(settings.map(s => s.setting_key === key ? { ...s, setting_value: newValue } : s));
      toast.success('تم تحديث الإعداد بنجاح');
    } catch (err) {
      toast.error('خطأ في التحديث');
    }
  };

  const handleToggleUser = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('تم تحديث حالة المستخدم');
      fetchTabData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر التحديث');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('تأكيد حذف المستخدم نهائيا؟')) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success('تم الحذف');
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر الحذف');
    }
  };

  const handleMarkAlertRead = async (id) => {
    try {
      await superAdminAPI.markAlertRead(id);
      setMonitoringData((prev) =>
        prev
          ? { ...prev, alerts: (prev.alerts || []).filter((a) => a.id !== parseInt(id, 10)) }
          : prev
      );
    } catch (_) {
      toast.error('تعذر أرشفة التنبيه');
    }
  };

  const handleAddBlockedIp = async (ip, reason) => {
    try {
      await superAdminAPI.addBlockedIp({ ip, reason });
      toast.success('تم حظر العنوان');
      fetchTabData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الحظر');
    }
  };

  const handleDisableBlocked = async (id) => {
    try {
      await superAdminAPI.disableBlockedIp(id);
      toast.success('تم إلغاء الحظر');
      setBlockedIps(blockedIps.map((b) => (b.id === id ? { ...b, is_active: 0 } : b)));
    } catch (_) {
      toast.error('فشل الإلغاء');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-vazir">
      {/* Sidebar Navigation */}
      <aside className="fixed right-0 top-0 h-full w-64 bg-white border-l border-slate-200 z-[60] pt-24 px-4 hidden lg:block">
        <div className="space-y-1">
          <NavItem active={activeTab === 'monitoring'} onClick={() => setActiveTab('monitoring')} icon={Activity} label="لوحة المراقبة" />
          <NavItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="المستخدمون" />
          <NavItem active={activeTab === 'entities'} onClick={() => setActiveTab('entities')} icon={Building} label="الجهات" />
          <NavItem active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={Calendar} label="الفعاليات" />
          <NavItem active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={Clock} label="سجل العمليات" />
          <NavItem active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={ShieldAlert} label="الأمن والحظر" />
          <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="إعدادات المنصة" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pr-64 pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Top Bar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">غرفة السيطرة العليا ⚔️</h1>
              <p className="text-slate-500 font-bold">مرحباً بك مجدداً، السيطرة والتحليل بين يديك</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fetchTabData()} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              {activeTab === 'entities' && (
                <button onClick={() => setIsEntityModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-brand-700 text-white rounded-2xl font-black shadow-lg shadow-brand-200">
                  <Plus size={20} /> إضافة جهة مركزية
                </button>
              )}
              {activeTab === 'logs' && (
                <>
                  <button type="button" onClick={() => superAdminAPI.exportAuditCsv().then(() => toast.success('تم تنزيل CSV')).catch(() => toast.error('فشل التصدير'))} className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm">
                    <Download size={18} /> Excel / CSV
                  </button>
                  <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-800 rounded-2xl font-bold text-sm border border-slate-200">
                    <Printer size={18} /> طباعة PDF
                  </button>
                </>
              )}
              <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all">
                <Power size={20} />
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'monitoring' && (
              <MonitoringView
                data={monitoringData}
                heatmapData={heatmapData}
                onDismissAlert={handleMarkAlertRead}
                onExportUsers={() => superAdminAPI.exportUsersCsv().then(() => toast.success('تم التصدير')).catch(() => toast.error('فشل التصدير'))}
              />
            )}
            {activeTab === 'users' && (
              <UsersView
                users={users}
                onImpersonate={handleImpersonate}
                onToggleUser={handleToggleUser}
                onDeleteUser={handleDeleteUser}
                onSearch={() => fetchTabData()}
                search={search}
                setSearch={setSearch}
              />
            )}
            {activeTab === 'entities' && (
              <EntitiesView
                entities={entities}
                onToggle={handleToggleEntity}
                onDelete={handleDeleteEntity}
                onEdit={(entity) => { setSelectedEntity(entity); setIsSettingsModalOpen(true); }}
                search={search}
                setSearch={setSearch}
              />
            )}
            {activeTab === 'events' && <EventsAdminView events={allEvents} />}
            {activeTab === 'logs' && (
              <LogsView
                logs={logs}
                search={search}
                setSearch={setSearch}
                logActionFilter={logActionFilter}
                setLogActionFilter={setLogActionFilter}
                onApplyFilters={() => fetchTabData()}
              />
            )}
            {activeTab === 'security' && (
              <SecurityView
                blocked={blockedIps}
                onAdd={handleAddBlockedIp}
                onDisable={handleDisableBlocked}
              />
            )}
            {activeTab === 'settings' && <SettingsView settings={settings} onToggle={handleToggleSetting} />}
          </AnimatePresence>
        </div>
      </main>

      {isEntityModalOpen && <EntityCreateModal onClose={() => setIsEntityModalOpen(false)} onRefresh={fetchTabData} />}
      {isSettingsModalOpen && (
        <EntitySettingsModal
          entity={selectedEntity}
          onClose={() => setIsSettingsModalOpen(false)}
          onSubmit={handleUpdateEntity}
        />
      )}
    </div>
  );
}

const NavItem = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

// ─── Sub-Views ─────────────────────────────────────────────────────────────

function MonitoringView({ data, heatmapData, onDismissAlert, onExportUsers }) {
  if (!data) return null;
  const s = data.stats || {};
  const perf = data.performance || {};
  const recent = data.recent_activity || [];
  const alerts = data.alerts || [];
  const neighHeat = [...(data.neighborhood_activity || [])]
    .sort((a, b) => (b.registrations || 0) - (a.registrations || 0))
    .slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 print:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatWidget icon={Users} color="blue" label="المستخدمون (الكل)" value={s.total_users ?? 0} sub={`حسابات نشطة: ${s.active_accounts ?? 0}`} trend="0" />
        <StatWidget icon={Calendar} color="emerald" label="التسجيلات" value={s.total_registrations ?? 0} sub={`فعاليات قادمة: ${s.upcoming_events ?? 0}`} trend="0" />
        <StatWidget icon={Clock} color="violet" label="ساعات التطوع" value={s.total_volunteer_hours ?? 0} sub="تراكمي" trend="0" />
        <StatWidget icon={LineChart} color="amber" label="نشط 7 أيام" value={s.active_users_7d ?? 0} sub="تسجيلات أو دخول" trend="0" />
      </div>

      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 space-y-3">
          <h3 className="font-black text-amber-900 flex items-center gap-2"><Bell size={20} /> تنبيهات إدارية</h3>
          {alerts.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 bg-white/80 rounded-2xl p-4 border border-amber-100">
              <div>
                <p className="text-sm font-bold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-600">{a.body}</p>
                <span className="text-[10px] font-bold text-amber-700">{a.severity} · {a.alert_type}</span>
              </div>
              <button type="button" onClick={() => onDismissAlert(a.id)} className="text-xs font-bold text-brand-700 hover:underline">تم الاطلاع</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-brand-600" size={24} /> نشاط لحظي (~20ث)
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg animate-pulse">مباشر</span>
          </div>
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {recent.length === 0 && <p className="text-sm text-slate-400 font-bold">لا يوجد نشاط مسجل بعد.</p>}
            {recent.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0">
                    {String(log.action || '').includes('USER') ? '\u2022' : String(log.action || '').includes('EVENT') ? '\u25CF' : '\u25CB'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{log.action}</p>
                    <p className="text-xs text-slate-500 truncate">{log.admin_name} → {log.target_name || '—'}</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 shrink-0 mr-2">{new Date(log.created_at).toLocaleString('ar-EG')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Server size={22} className="text-slate-500" /> مراقبة الأداء</h3>
            <InsightItem icon={Database} label="قاعدة البيانات" val={perf.database?.connected ? 'متصلة' : 'غير متصلة'} color={perf.database?.connected ? 'text-emerald-600' : 'text-red-600'} />
            <InsightItem icon={Activity} label="طلبات API" val={String(perf.api?.requestsTotal ?? '—')} />
            <InsightItem icon={AlertCircle} label="أخطاء 5xx" val={String(perf.api?.errors5xx ?? 0)} color={(perf.api?.errors5xx || 0) > 0 ? 'text-red-600' : 'text-emerald-600'} />
            <InsightItem icon={Clock} label="الحالة" val={perf.status === 'healthy' ? 'مستقرة' : 'مراقبة'} />
          </div>

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">رؤى ذكية</h3>
            <div className="p-5 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl text-white shadow-lg shadow-brand-700/20 mb-4">
              <p className="text-xs font-bold opacity-80 mb-1">أكثر حي نشاطاً</p>
              <h4 className="text-2xl font-black">{data.insights?.top_neighborhood || '—'}</h4>
              <p className="text-[10px] mt-2 opacity-70">مستخدمون بالحي: {data.insights?.top_neighborhood_count ?? 0}</p>
            </div>
            <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 mb-4">
              <p className="text-xs font-bold text-violet-800 mb-1">أكثر جامعة مشاركة</p>
              <p className="text-lg font-black text-violet-950">{data.insights?.top_university || '—'}</p>
              <p className="text-[10px] text-violet-600">طلاب مسجلون: {data.insights?.top_university_users ?? 0}</p>
            </div>
            <button type="button" onClick={onExportUsers} className="w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2">
              <Download size={18} /> تصدير المستخدمين (CSV / Excel)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2"><MapIcon className="text-orange-500" size={24} /> Heatmap الأحياء</h3>
        <p className="text-xs text-slate-500 mb-6 font-bold">الترتيب حسب التسجيلات المرتبطة بسكان الحي</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {neighHeat.map((n) => (
            <div key={n.name} className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
              <p className="font-black text-slate-900">{n.name}</p>
              <p className="text-xs text-slate-600 mt-1">تسجيلات: <b>{n.registrations}</b> · فريدون: <b>{n.unique_users}</b></p>
            </div>
          ))}
        </div>
        {heatmapData?.neighborhoods?.length > 0 && (
          <p className="text-[10px] text-slate-400 mt-4">الخريطة التفصيلية: صفحة الخريطة ({heatmapData.meta?.total_points || 0} نقطة).</p>
        )}
      </div>

      <p className="text-center text-[10px] text-slate-400 font-bold print:hidden">Sub-admin: دور <code className="bg-slate-100 px-1 rounded">sub_admin</code> — لوحة /admin فقط.</p>
    </motion.div>
  );
}

function UsersView({ users, onImpersonate, onToggleUser, onDeleteUser, onSearch, search, setSearch }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="بحث عن مستخدم بالاسم أو الإيميل..."
            className="w-full pr-12 pl-4 py-3 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all text-sm font-bold"
          />
        </div>
        <button type="button" onClick={onSearch} className="px-5 py-3 bg-brand-700 text-white rounded-2xl text-sm font-black">تطبيق البحث</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">المستخدم</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الحي</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">مشاركات</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">ساعات</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">النقاط</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الحالة</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-600">{u.neighborhood_name || '—'}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{u.total_regs ?? 0}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{u.total_hours ?? 0}</td>
                <td className="px-6 py-4 text-sm font-bold text-brand-600">{u.points}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {u.is_active ? 'نشط' : 'محظور'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" onClick={() => onImpersonate(u.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" title="دخول كالمستخدم">
                      <Eye size={18} />
                    </button>
                    <button type="button" onClick={() => onToggleUser(u.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl" title="تعطيل/تفعيل">
                      <Power size={18} />
                    </button>
                    <button type="button" onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl" title="حذف">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function EntitiesView({ entities, search, setSearch, onToggle, onDelete, onEdit }) {
  const filtered = entities.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن جهة (جامعة، شركة...)" className="w-full pr-12 pl-4 py-3 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all text-sm font-bold" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الجهة</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">نوع</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الحالة</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${ENTITY_TYPES[e.type]?.bg} flex items-center justify-center text-xl`}>
                      {e.type === 'university' ? '🎓' : e.type === 'company' ? '💼' : '🏢'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{e.name}</p>
                      <p className="text-xs text-slate-400">{e.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ENTITY_TYPES[e.type]?.color.replace('text-', 'bg-')}`}></span>
                    <span className="text-sm font-bold text-slate-600">{ENTITY_TYPES[e.type]?.label || e.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onToggle(e.id, e.is_active)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${e.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    {e.is_active ? 'نشط' : 'معطل'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(e)}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(e.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                    {e.type === 'university' && (
                      <button
                        onClick={() => window.open(`/university/portal?university_id=${e.id}`, '_blank')}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                        title="عرض البوابة"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function EventsAdminView({ events }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-800">جميع الفعاليات (عرض Super Admin)</h3>
        <p className="text-xs text-slate-500 font-bold mt-1">يشمل الملغاة والمكتملة — إدارة التفاصيل من لوحة /admin</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 font-black text-slate-500 text-xs">العنوان</th>
              <th className="px-4 py-3 font-black text-slate-500 text-xs">الحي</th>
              <th className="px-4 py-3 font-black text-slate-500 text-xs">الحالة</th>
              <th className="px-4 py-3 font-black text-slate-500 text-xs">المسجّلون</th>
              <th className="px-4 py-3 font-black text-slate-500 text-xs">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-800">{ev.title}</td>
                <td className="px-4 py-3 text-slate-600">{ev.neighborhood_name || '—'}</td>
                <td className="px-4 py-3"><span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100">{ev.status}</span></td>
                <td className="px-4 py-3 font-bold text-brand-600">{ev.registration_count ?? 0} / {ev.max_participants}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{ev.date ? new Date(ev.date).toLocaleDateString('ar-EG') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function SecurityView({ blocked, onAdd, onDisable }) {
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldAlert className="text-red-500" /> حظر عنوان IP</h3>
        <form className="flex flex-wrap gap-3 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(ip, reason);
            setIp('');
            setReason('');
          }}
        >
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-500 block mb-1">عنوان IP</label>
            <input value={ip} onChange={(e) => setIp(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-bold text-sm" placeholder="مثال: 192.168.1.1" required />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-slate-500 block mb-1">سبب (اختياري)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-bold text-sm" />
          </div>
          <button type="submit" className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black">حظر</button>
        </form>
      </div>
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">العناوين المحظورة</h3>
        <div className="space-y-2">
          {blocked.filter((b) => Number(b.is_active) === 1).length === 0 && <p className="text-sm text-slate-400 font-bold">لا توجد عناوين نشطة.</p>}
          {blocked.filter((b) => Number(b.is_active) === 1).map((b) => (
            <div key={b.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <code className="font-black text-slate-800">{b.ip}</code>
                <p className="text-xs text-slate-500">{b.reason || '—'}</p>
              </div>
              <button type="button" onClick={() => onDisable(b.id)} className="text-xs font-bold text-brand-700">إلغاء الحظر</button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function LogsView({ logs, search, setSearch, logActionFilter, setLogActionFilter, onApplyFilters }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 print:border-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <h3 className="text-xl font-bold text-slate-800">سجل العمليات (Audit)</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative w-52">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()} placeholder="بحث..." className="w-full pr-9 pl-2 py-2 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold" />
          </div>
          <input value={logActionFilter} onChange={(e) => setLogActionFilter(e.target.value)} placeholder="نوع العملية (USER_LOGIN...)" className="w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
          <button type="button" onClick={onApplyFilters} className="px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-black">تصفية</button>
        </div>
      </div>
      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-slate-100 rounded-2xl hover:border-brand-300 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-brand-500 transition-colors" />
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">{log.action}</span>
                <p className="text-sm font-bold text-slate-800">{log.admin_name} استهدف {log.target_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400">{new Date(log.created_at).toLocaleDateString()}</p>
              <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsView({ settings, onToggle }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
      <h3 className="text-xl font-bold text-slate-800 mb-8">إعدادات المنصة (Feature Flags)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map(s => (
          <div key={s.id} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-800 mb-1">{s.description}</h4>
              <code className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{s.setting_key}</code>
            </div>
            <button
              onClick={() => onToggle(s.setting_key, s.setting_value)}
              className={`w-12 h-6 rounded-full transition-all relative ${s.setting_value === 'true' ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
              <motion.div
                animate={{ x: s.setting_value === 'true' ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Shared UI Components ──────────────────────────────────────────────────

function StatWidget({ label, value, icon: Icon, color, trend, sub }) {
  const c = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 group hover:shadow-lg transition-all border-b-4 border-b-transparent hover:border-b-brand-500">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${c[color] || c.blue} transition-transform group-hover:rotate-6`}>
          <Icon size={24} />
        </div>
        {trend !== '0' && (
          <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">{trend}</span>
        )}
      </div>
      <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-2xl font-black text-slate-800">{value.toLocaleString('ar-EG')}</h4>
        <span className="text-[10px] text-slate-400 font-medium">{sub}</span>
      </div>
    </div>
  );
}

function InsightItem({ icon: Icon, label, val, color = "text-slate-800" }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500">{label}</span>
      </div>
      <span className={`text-sm font-black ${color}`}>{val}</span>
    </div>
  );
}

function EntityCreateModal({ onClose, onRefresh }) {
  const [data, setData] = useState({ name: '', type: 'university', email: '', password: '', code: '' });
  const sub = async (e) => {
    e.preventDefault();
    try {
      await entitiesAPI.create(data);
      toast.success('تم إنشاء الجهة');
      onRefresh();
      onClose();
    } catch (err) { toast.error('خطأ في الاتصال'); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-2xl font-black text-slate-800">إضافة جهة مركزية 🏛️</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><XCircle size={24} className="text-slate-400" /></button>
        </div>
        <form onSubmit={sub} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">اسم الجهة الرسمي</label>
              <input required value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">النوع</label>
              <select value={data.type} onChange={e => setData({ ...data, type: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm">
                <option value="university">جامعة</option>
                <option value="company">شركة</option>
                <option value="municipality">بلدية</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">الكود</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value })} placeholder="مثال: HU" className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">البريد الإلكتروني</label>
            <input required type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">كلمة المرور</label>
            <input required type="password" value={data.password} onChange={e => setData({ ...data, password: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-4 font-bold text-slate-400">إلغاء</button>
            <button type="submit" className="px-12 py-4 bg-brand-700 text-white rounded-2xl font-black shadow-lg shadow-brand-700/20">إنشاء الآن 🚀</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EntitySettingsModal({ entity, onClose, onSubmit }) {
  const [data, setData] = useState({ ...entity });
  const [loading, setLoading] = useState(false);

  const sub = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(entity.id, data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${ENTITY_TYPES[entity.type]?.bg} ${ENTITY_TYPES[entity.type]?.color}`}>
              <Settings size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">إعدادات: {entity.name}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{ENTITY_TYPES[entity.type]?.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all"><XCircle size={24} className="text-slate-400" /></button>
        </div>
        <form onSubmit={sub} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">الاسم الرسمي</label>
              <input required value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">البريد الإلكتروني</label>
              <input required type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">الكود المميز</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">مسؤول التواصل</label>
              <input value={data.contact_name || ''} onChange={e => setData({ ...data, contact_name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">رقم الهاتف</label>
              <input value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">الموقع الإلكتروني</label>
              <input value={data.website || ''} onChange={e => setData({ ...data, website: e.target.value })} placeholder="https://..." className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-slate-400 mb-2 mr-2 uppercase">وصف الجهة</label>
              <textarea value={data.description || ''} onChange={e => setData({ ...data, description: e.target.value })} rows={3} className="w-full px-5 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-brand-500 font-bold text-sm resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="px-6 py-4 font-bold text-slate-400">إلغاء</button>
            <button type="submit" disabled={loading} className="px-12 py-4 bg-brand-700 text-white rounded-2xl font-black shadow-lg shadow-brand-700/20 disabled:opacity-50">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✅'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
