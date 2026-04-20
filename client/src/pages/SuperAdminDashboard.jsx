import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Calendar, Building2, GraduationCap,
  Plus, Search, MoreVertical, CheckCircle2, XCircle,
  Trash2, RefreshCcw, Activity, Building, Briefcase,
  Clock, ArrowRight, TrendingUp, AlertCircle, Eye, Bell,
  Settings, Database, Filter, Download, UserPlus, Fingerprint,
  Map as MapIcon, Power, Printer, Server, ShieldAlert, LineChart,
  Zap, Globe, MousePointer2, AlertTriangle, MapPin, Mail, Send
} from 'lucide-react';
import { entitiesAPI, adminAPI, superAdminAPI, analyticsAPI } from '../api';
import toast from 'react-hot-toast';

const ENTITY_TYPES = {
  university: { label: 'جامعة', icon: GraduationCap, color: 'text-[#344F1F]', bg: 'bg-[#F9F5F0]' },
  company: { label: 'شركة', icon: Briefcase, color: 'text-[#344F1F]', bg: 'bg-[#F9F5F0]' },
  municipality: { label: 'بلدية', icon: Building2, color: 'text-[#344F1F]', bg: 'bg-[#F9F5F0]' },
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const menuItems = [
    { id: 'monitoring', icon: Activity, label: 'لوحة المراقبة' },
    { id: 'users', icon: Users, label: 'المستخدمون' },
    { id: 'entities', icon: Building, label: 'الجهات والشركاء' },
    { id: 'events', icon: Calendar, label: 'الفعاليات' },
    { id: 'logs', icon: Clock, label: 'سجل العمليات' },
    { id: 'security', icon: ShieldAlert, label: 'الأمن والحظر' },
    { id: 'newsletter', icon: Mail, label: 'النشرة الإخبارية' },
    { id: 'settings', icon: Settings, label: 'إعدادات المنصة' },
  ];

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
    <div className="min-h-screen bg-[#F9F5F0] flex font-vazir relative overflow-x-hidden">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="fixed right-0 top-0 h-full w-64 bg-[#F9F5F0] border-l border-[#F2EAD3] z-[60] pt-24 px-4 hidden lg:block">
        <div className="space-y-1">
          {menuItems.map(item => (
            <NavItem key={item.id} active={activeTab === item.id} onClick={() => setActiveTab(item.id)} icon={item.icon} label={item.label} />
          ))}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#344F1F]/40 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[280px] bg-[#F9F5F0] border-l border-[#F2EAD3] z-[110] shadow-2xl p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-8 border-b border-[#F2EAD3] pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#344F1F] rounded-xl flex items-center justify-center shadow-lg">
                    <Shield size={20} className="text-[#F9F5F0]" />
                  </div>
                  <h3 className="font-black text-[#344F1F]">قائمة التحكم</h3>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-[#F9F5F0] rounded-xl text-[#F4991A] hover:bg-white transition-all">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-2">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === item.id ? 'bg-[#344F1F] text-[#F9F5F0] shadow-xl' : 'text-[#344F1F]/60'
                      }`}
                  >
                    <item.icon size={20} className={activeTab === item.id ? 'text-[#F4991A]' : 'text-current'} />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="absolute bottom-10 left-6 right-6 p-6 bg-white rounded-[2rem] border border-[#F2EAD3] text-center">
                <p className="text-[10px] text-[#F4991A] font-black uppercase mb-3">Linka Control Room</p>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full py-3.5 bg-[#F9F5F0] text-[#344F1F] rounded-xl font-black text-sm border border-[#F2EAD3] flex items-center justify-center gap-2 hover:bg-white transition-all shadow-sm"
                >
                  <Power size={18} /> تسجيل الخروج
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:pr-64 pt-24 pb-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Official Mobile Header (Visible only on mobile) */}
          <div className="lg:hidden flex items-center justify-between mb-8 bg-white p-4 rounded-[2rem] border border-[#F2EAD3] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#344F1F] rounded-xl flex items-center justify-center shadow-lg">
                <Shield size={20} className="text-[#F9F5F0]" />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#344F1F]">غرفة السيطرة</h1>
                <p className="text-[10px] text-[#F4991A] font-bold uppercase tracking-wider">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-12 h-12 flex items-center justify-center bg-[#F9F5F0] text-[#344F1F] rounded-2xl border border-[#F2EAD3] hover:bg-white transition-all active:scale-90"
              title="القائمة"
            >
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-[#344F1F] rounded-full"></div>
                <div className="w-4 h-0.5 bg-[#F4991A] rounded-full ml-auto"></div>
                <div className="w-6 h-0.5 bg-[#344F1F] rounded-full"></div>
              </div>
            </button>
          </div>

          {/* Contextual Action Bar & Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="hidden lg:block space-y-1">
              <h1 className="text-4xl font-black text-[#344F1F] leading-tight">غرفة السيطرة العليا ⚔️</h1>
              <p className="text-[#F4991A] text-lg font-bold">مرحباً بك مجدداً، السيطرة والتحليل بين يديك</p>
            </div>

            {/* Desktop Action Bar / Contextual Mobile Bar */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 p-2 sm:p-0 bg-white sm:bg-transparent rounded-3xl sm:rounded-none border sm:border-0 border-[#F2EAD3] shadow-sm sm:shadow-none">
              <button
                onClick={() => fetchTabData()}
                className="p-3.5 bg-white border border-[#F2EAD3] rounded-2xl text-[#344F1F] hover:bg-white hover:shadow-md transition-all shrink-0"
              >
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
              </button>

              {activeTab === 'entities' && (
                <button
                  onClick={() => setIsEntityModalOpen(true)}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20 text-sm whitespace-nowrap active:scale-95 transition-all"
                >
                  <Plus size={20} /> <span className="hidden sm:inline">إضافة جهة مركزية</span><span className="sm:hidden">إضافة جهة</span>
                </button>
              )}

              {activeTab === 'logs' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => superAdminAPI.exportAuditCsv().then(() => toast.success('تم تنزيل CSV')).catch(() => toast.error('فشل التصدير'))}
                    className="flex items-center gap-2.5 px-5 py-3.5 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black text-xs"
                  >
                    <Download size={18} /> <span className="hidden sm:inline">تصدير التقارير</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-3.5 bg-white text-[#344F1F] rounded-2xl border border-[#F2EAD3] hover:shadow-md transition-all"
                  >
                    <Printer size={18} />
                  </button>
                </div>
              )}

              <div className="hidden lg:block divider-v h-10 w-px bg-[#F2EAD3] mx-2" />

              <button
                onClick={() => setShowLogoutModal(true)}
                className="hidden lg:flex p-3.5 bg-white border border-[#F2EAD3] text-[#344F1F] rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-90"
              >
                <Power size={22} />
              </button>
            </div>
          </div>

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
            {activeTab === 'newsletter' && <NewsletterBroadcastView />}
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
      <AnimatePresence>
        {showLogoutModal && (
          <LogoutModal
            onConfirm={() => { localStorage.clear(); window.location.href = '/login'; }}
            onCancel={() => setShowLogoutModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-[#344F1F]/40 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20"
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-[#F9F5F0] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-[#F2EAD3]">
            <Power size={32} className="text-[#344F1F]" />
          </div>
          <h3 className="text-2xl font-black text-[#344F1F] mb-2">تسجيل الخروج</h3>
          <p className="text-[#344F1F]/60 font-bold mb-8">هل أنت متأكد من رغبتك في الخروج من جلسة السيطرة؟</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="py-4 bg-[#F9F5F0] text-[#344F1F] rounded-2xl font-black text-sm hover:bg-[#F2EAD3] transition-all border border-[#F2EAD3]"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black text-sm hover:shadow-xl hover:shadow-[#344F1F]/20 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={16} className="text-[#F4991A]" />
              نعم، تأكيد
            </button>
          </div>
        </div>
        <div className="bg-[#344F1F] p-2 text-center">
          <p className="text-[10px] text-[#F9F5F0]/40 font-bold uppercase tracking-widest">Linka Mission Control</p>
        </div>
      </motion.div>
    </div>
  );
}

const NavItem = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-[#F9F5F0] text-[#344F1F]' : 'text-[#F4991A] hover:bg-[#F9F5F0] hover:text-[#344F1F]'
      }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

// ─── Sub-Views ─────────────────────────────────────────────────────────────

function MonitoringView({ data, heatmapData, onDismissAlert, onExportUsers }) {
  if (!data) return <div className="p-12 text-center text-[#344F1F]/40 font-black">جاري جلب بيانات المراقبة...</div>;
  const s = data.stats || {};
  const perf = data.performance || {};
  const recent = data.recent_activity || [];
  const alerts = data.alerts || [];
  const neighHeat = [...(data.neighborhood_activity || [])]
    .sort((a, b) => (b.registrations || 0) - (a.registrations || 0))
    .slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
      {/* ── Key Metrics Grids ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatWidget label="إجمالي المتطوعين" value={s.total_users ?? 0} icon={Users} color="blue" trend="+12%" sub="مستخدم نشط" />
        <StatWidget label="الفعاليات المفعّلة" value={s.total_registrations ?? 0} icon={Calendar} color="emerald" trend="+5" sub="فعالية حالية" />
        <StatWidget label="الجهات المركزية" value={s.total_volunteer_hours ?? 0} icon={Building} color="violet" trend="0" sub="شريك معتمد" />
        <StatWidget label="ساعات التطوع" value={s.active_users_7d ?? 0} icon={Clock} color="amber" trend="+450" sub="ساعة منجزة" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Insights */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#F2EAD3] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#344F1F] rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={20} className="text-[#F4991A]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#344F1F]">نبض المنصة</h3>
              <p className="text-[10px] text-[#F4991A] font-bold uppercase">التحليلات اللحظية</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <InsightItem icon={Globe} label="نشاط النظام" val="مستقر 🚀" color="text-[#344F1F]" />
            <InsightItem icon={MousePointer2} label="التفاعل الأخير" val="منذ 2 دقيقة" />
            <InsightItem icon={AlertTriangle} label="تبيهات الأمان" val="0 تهديد" color="text-[#344F1F]" />
          </div>

          <div className="mt-8 p-6 bg-[#344F1F] rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4991A]/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            <p className="text-[#F9F5F0]/60 text-[10px] font-bold uppercase mb-1">النمو الأسبوعي</p>
            <h4 className="text-[#F9F5F0] text-3xl font-black">+240 <span className="text-sm">عضو</span></h4>
          </div>
        </div>

        {/* Live System Alerts */}
        <div className="lg:col-span-2 bg-[#F9F5F0] rounded-[2.5rem] p-6 sm:p-8 border border-[#F9F5F0] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#344F1F] rounded-xl flex items-center justify-center">
                <ShieldAlert size={20} className="text-[#F9F5F0]" />
              </div>
              <h3 className="text-xl font-black text-[#344F1F]">مركز التحذيرات</h3>
            </div>
            <span className="px-4 py-1.5 bg-[#F2EAD3] text-[#344F1F] rounded-full text-[10px] font-black">
              {alerts.length || 0} تنبيه نشط
            </span>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 rich-scroll">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-white/60 dark:bg-white rounded-2xl border border-white flex items-center justify-between group hover:border-[#F4991A]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${alert.severity === 'critical' ? 'bg-[#F4991A]/10 text-[#F4991A]' : 'bg-[#344F1F]/10 text-[#344F1F]'}`}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#344F1F]">{alert.title}</p>
                      <p className="text-[10px] text-[#344F1F]/40 font-bold">{new Date().toLocaleTimeString('ar-EG')}</p>
                    </div>
                  </div>
                  <button onClick={() => onDismissAlert(alert.id)} className="opacity-0 group-hover:opacity-100 p-2 text-[#344F1F]/40 hover:text-[#344F1F] transition-all">
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#344F1F]/40 space-y-4 py-12">
                <Search size={48} className="opacity-20" />
                <p className="font-bold">لا يوجد تنبيهات حرجة حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#F9F5F0] rounded-[2rem] p-6 sm:p-8 shadow-sm border border-[#F9F5F0]">
        <h3 className="text-xl font-bold text-[#344F1F] mb-6 flex items-center gap-2"><Server size={22} className="text-[#F4991A]" /> مراقبة الأداء</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightItem icon={Database} label="قاعدة البيانات" val={perf.database?.connected ? 'متصلة' : 'غير متصلة'} color={perf.database?.connected ? 'text-[#344F1F]' : 'text-[#344F1F]'} />
          <InsightItem icon={Activity} label="طلبات API" val={String(perf.api?.requestsTotal ?? '—')} />
          <InsightItem icon={AlertCircle} label="أخطاء 5xx" val={String(perf.api?.errors5xx ?? 0)} color={(perf.api?.errors5xx || 0) > 0 ? 'text-[#344F1F]' : 'text-[#344F1F]'} />
          <InsightItem icon={Clock} label="الحالة" val={perf.status === 'healthy' ? 'مستقرة' : 'مراقبة'} />
        </div>
      </div>
    </motion.div>
  );
}

function UsersView({ users, onImpersonate, onToggleUser, onDeleteUser, onSearch, search, setSearch }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F9F5F0] rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-[#F9F5F0]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#344F1F]">المستخدمون</h3>
          <p className="text-[10px] sm:text-xs font-bold text-[#F4991A] mt-1 uppercase tracking-widest">إدارة المجتمع والرقابة</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F4991A]" size={18} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="w-full pr-11 py-3 bg-white border border-[#F2EAD3] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#F4991A]/20 transition-all"
              placeholder="بحث بالاسم أو البريد..."
            />
          </div>
          <button onClick={onSearch} className="p-3 bg-[#344F1F] text-[#F9F5F0] rounded-2xl hover:shadow-lg transition-all active:scale-90 shadow-brand-500/20 shadow-lg">
            <Zap size={20} />
          </button>
        </div>
      </div>

      {/* Mobile: Adaptive Card Grid */}
      <div className="lg:hidden space-y-4">
        {users.map(u => (
          <div key={u.id} className="p-5 bg-white rounded-[2rem] border border-[#F2EAD3] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F9F5F0] rounded-bl-[2rem] -z-0 opacity-50 transition-all group-hover:scale-110" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F9F5F0] flex items-center justify-center font-black text-[#344F1F] border border-[#F2EAD3] text-lg">
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-black text-[#344F1F] text-base">{u.name}</p>
                  <p className="text-xs text-[#F4991A] font-bold">{u.email}</p>
                </div>
                <button
                  onClick={() => onToggleUser(u.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${u.is_active ? 'bg-[#344F1F] text-[#F9F5F0]' : 'bg-[#F2EAD3] text-[#344F1F]/40'}`}
                >
                  {u.is_active ? 'نشط' : 'محظور'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F2EAD3]/50">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] text-[#F4991A] font-black uppercase">النقاط</p>
                    <p className="font-black text-[#344F1F]">{u.points || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#F4991A] font-black uppercase">ساعات</p>
                    <p className="font-black text-[#344F1F]">{u.total_hours || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onImpersonate(u.id)} className="p-3 bg-[#F9F5F0] text-[#344F1F] rounded-xl border border-[#F2EAD3]">
                    <UserPlus size={18} />
                  </button>
                  <button onClick={() => onDeleteUser(u.id)} className="p-3 bg-[#F9F5F0] text-[#F4991A] rounded-xl border border-[#F2EAD3]">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Official Table */}
      <div className="hidden lg:block overflow-x-auto rich-scroll rounded-[2rem] border border-[#F2EAD3]">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-[#F9F5F0] text-[#344F1F] text-xs font-black uppercase tracking-wider border-b border-[#F2EAD3]">
              <th className="p-5">المستخدم</th>
              <th className="p-5">النقاط / الساعات</th>
              <th className="p-5">الحالة</th>
              <th className="p-5 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EAD3]">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-[#F9F5F0]/50 transition-colors group">
                <td className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F9F5F0] flex items-center justify-center font-black text-[#344F1F] border border-[#F2EAD3] shadow-sm transform group-hover:rotate-3 transition-transform text-xs overflow-hidden">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-[#344F1F] text-sm">{user.name}</p>
                      <p className="text-[10px] text-[#F4991A] font-medium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-[#344F1F]">{user.points || 0} ن</span>
                    <span className="w-px h-3 bg-[#F2EAD3]" />
                    <span className="text-xs font-bold text-[#F4991A]">{user.total_hours || 0} ساعة</span>
                  </div>
                </td>
                <td className="p-5">
                  <button
                    onClick={() => onToggleUser(user.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${user.is_active ? 'bg-[#344F1F] text-[#F9F5F0]' : 'bg-[#F2EAD3] text-[#344F1F]/40'}`}
                  >
                    {user.is_active ? 'نشط' : 'محظور'}
                  </button>
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onImpersonate(user.id)} className="p-2.5 bg-[#F9F5F0] text-[#344F1F] rounded-xl border border-[#F2EAD3] hover:bg-white transition-all shadow-sm" title="دخول كـ">
                      <UserPlus size={16} />
                    </button>
                    <button onClick={() => onDeleteUser(user.id)} className="p-2.5 bg-[#F9F5F0] text-[#F4991A] rounded-xl border border-[#F2EAD3] hover:bg-white transition-all shadow-sm" title="حذف">
                      <Trash2 size={16} />
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

function EntitiesView({ entities, onToggle, onDelete, onUpdate, search, setSearch }) {
  const filtered = entities.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F9F5F0] rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-[#F9F5F0]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#344F1F]">الجهات والشركاء</h3>
          <p className="text-[10px] sm:text-xs font-bold text-[#F4991A] mt-1 uppercase tracking-widest">إدارة التحقق والمؤسسات</p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن جهة..." className="w-full pr-12 pl-4 py-3 bg-white border border-[#F2EAD3] rounded-2xl focus:ring-2 focus:ring-[#F4991A] transition-all text-sm font-bold" />
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="lg:hidden space-y-4">
        {filtered.map(entity => (
          <div key={entity.id} className="p-5 bg-white rounded-[2rem] border border-[#F2EAD3] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-[#344F1F] text-base">{entity.name}</p>
                <span className="text-[10px] font-black text-[#F4991A] bg-[#F9F5F0] px-2 py-0.5 rounded border border-[#F2EAD3] uppercase">{entity.type}</span>
              </div>
              <button
                onClick={() => onToggle(entity.id, entity.is_active)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${entity.is_active ? 'bg-[#344F1F] text-[#F9F5F0]' : 'bg-[#F2EAD3] text-[#344F1F]/40'}`}
              >
                {entity.is_active ? 'مفعل' : 'معطل'}
              </button>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#F2EAD3]/50">
              <p className="text-xs font-bold text-[#344F1F]">{entity.email}</p>
              <div className="flex gap-2">
                <button onClick={() => onUpdate(entity)} className="p-2.5 bg-[#F9F5F0] text-[#344F1F] rounded-xl border border-[#F2EAD3]">
                  <Settings size={16} />
                </button>
                <button onClick={() => onDelete(entity.id)} className="p-2.5 bg-[#F9F5F0] text-[#F4991A] rounded-xl border border-[#F2EAD3]">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden lg:block overflow-x-auto rich-scroll rounded-[2rem] border border-[#F2EAD3]">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-[#F9F5F0] text-[#344F1F] text-xs font-black uppercase tracking-wider border-b border-[#F2EAD3]">
              <th className="p-5">الجهة</th>
              <th className="p-5">النوع</th>
              <th className="p-5">التواصل</th>
              <th className="p-5">الحالة</th>
              <th className="p-5 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EAD3]">
            {filtered.map(entity => (
              <tr key={entity.id} className="hover:bg-[#F9F5F0]/50 transition-colors group">
                <td className="p-5">
                  <p className="font-black text-[#344F1F] text-sm">{entity.name}</p>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-[#F9F5F0] text-[#344F1F] rounded-lg text-[10px] font-black border border-[#F2EAD3]">
                    {entity.type}
                  </span>
                </td>
                <td className="p-5">
                  <p className="text-xs font-bold text-[#344F1F]">{entity.email}</p>
                </td>
                <td className="p-5">
                  <button
                    onClick={() => onToggle(entity.id, entity.is_active)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${entity.is_active ? 'bg-[#344F1F] text-[#F9F5F0]' : 'bg-[#F2EAD3] text-[#344F1F]/40'}`}
                  >
                    {entity.is_active ? 'مفعل' : 'معطل'}
                  </button>
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-center gap-2 min-w-max">
                    <button onClick={() => onUpdate(entity)} className="p-2.5 bg-[#F9F5F0] text-[#344F1F] rounded-xl border border-[#F2EAD3] hover:bg-white transition-all shadow-sm" title="تعديل">
                      <Settings size={16} />
                    </button>
                    <button onClick={() => onDelete(entity.id)} className="p-2.5 bg-[#F9F5F0] text-[#F4991A] rounded-xl border border-[#F2EAD3] hover:bg-white transition-all shadow-sm" title="حذف">
                      <Trash2 size={16} />
                    </button>
                    {entity.type === 'university' && (
                      <button
                        onClick={() => window.open(`/university/portal?university_id=${entity.id}`, '_blank')}
                        className="p-2.5 bg-[#F9F5F0] text-[#F4991A] rounded-xl border border-[#F2EAD3] hover:bg-white transition-all shadow-sm"
                        title="عرض البوابة"
                      >
                        <Eye size={16} />
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F9F5F0] rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-[#F9F5F0] overflow-hidden">
      <div className="mb-8">
        <h3 className="text-xl sm:text-2xl font-black text-[#344F1F]">جميع الفعاليات</h3>
        <p className="text-[10px] sm:text-xs text-[#F4991A] font-bold mt-1 uppercase tracking-widest">نظرة شاملة على نشاط المنصة</p>
      </div>

      {/* Mobile: Cards */}
      <div className="lg:hidden space-y-4">
        {events.map((ev) => (
          <div key={ev.id} className="p-5 bg-white rounded-[2rem] border border-[#F2EAD3] shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <h4 className="font-black text-[#344F1F] text-sm leading-tight">{ev.title}</h4>
              <span className="text-[10px] font-black px-2 py-1 bg-[#F9F5F0] text-[#344F1F] border border-[#F2EAD3] rounded-lg">{ev.status}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold">
              <div className="flex items-center gap-1.5 text-[#F4991A]">
                <MapPin size={12} /> {ev.neighborhood_name || '—'}
              </div>
              <div className="flex items-center gap-1.5 text-[#344F1F]">
                <Users size={12} /> {ev.registration_count ?? 0} / {ev.max_participants}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden lg:block overflow-x-auto rich-scroll rounded-[2rem] border border-[#F2EAD3]">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-[#F9F5F0] text-[#344F1F] text-xs font-black uppercase tracking-wider border-b border-[#F2EAD3]">
              <th className="p-5">الفعالية</th>
              <th className="p-5">المكان</th>
              <th className="p-5">الحالة</th>
              <th className="p-5">التسجيل</th>
              <th className="p-5">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EAD3]">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-[#F9F5F0]/50 transition-colors group">
                <td className="p-5">
                  <p className="font-bold text-[#344F1F]">{ev.title}</p>
                </td>
                <td className="p-5">
                  <p className="text-sm text-[#344F1F]">{ev.neighborhood_name || '—'}</p>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-[#F9F5F0] text-[#344F1F] rounded-lg text-[10px] font-black border border-[#F2EAD3]">
                    {ev.status}
                  </span>
                </td>
                <td className="p-5">
                  <p className="text-xs font-black text-[#344F1F]">{ev.registration_count ?? 0} / {ev.max_participants}</p>
                </td>
                <td className="p-5 text-xs text-[#F4991A] font-bold">
                  {ev.date ? new Date(ev.date).toLocaleDateString('ar-EG') : '—'}
                </td>
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
      <div className="bg-[#F9F5F0] rounded-[2rem] p-6 sm:p-8 shadow-sm border border-[#F9F5F0]">
        <h3 className="text-xl font-bold text-[#344F1F] mb-4 flex items-center gap-2"><ShieldAlert className="text-[#F4991A]" /> حظر عنوان IP</h3>
        <form className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(ip, reason);
            setIp('');
            setReason('');
          }}
        >
          <div className="flex-1">
            <label className="text-[10px] font-black text-[#F4991A] block mb-1.5 uppercase mr-2">عنوان IP</label>
            <input value={ip} onChange={(e) => setIp(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-[#F2EAD3] font-bold text-sm bg-white" placeholder="مثال: 192.168.1.1" required />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-[#F4991A] block mb-1.5 uppercase mr-2">سبب (اختياري)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-[#F2EAD3] font-bold text-sm bg-white" />
          </div>
          <button type="submit" className="px-8 py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20 active:scale-95 transition-all">حظر</button>
        </form>
      </div>
      <div className="bg-[#F9F5F0] rounded-[2rem] p-8 shadow-sm border border-[#F9F5F0]">
        <h3 className="text-lg font-bold text-[#344F1F] mb-4">العناوين المحظورة</h3>
        <div className="space-y-2">
          {blocked.filter((b) => Number(b.is_active) === 1).length === 0 && <p className="text-sm text-[#F4991A] font-bold">لا توجد عناوين نشطة.</p>}
          {blocked.filter((b) => Number(b.is_active) === 1).map((b) => (
            <div key={b.id} className="flex justify-between items-center p-4 bg-[#F9F5F0] rounded-2xl border border-[#F9F5F0]">
              <div>
                <code className="font-black text-[#344F1F]">{b.ip}</code>
                <p className="text-xs text-[#F4991A]">{b.reason || '—'}</p>
              </div>
              <button type="button" onClick={() => onDisable(b.id)} className="text-xs font-bold text-[#344F1F]">إلغاء الحظر</button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function LogsView({ logs, search, setSearch, logActionFilter, setLogActionFilter, onApplyFilters }) {
  const ACTION_LABELS = {
    USER_LOGIN: 'تسجيل دخول مستخدم',
    ENTITY_LOGIN: 'تسجيل دخول جهة',
    USER_REGISTERED: 'تسجيل مستخدم جديد',
    USER_DISABLED: 'تعطيل حساب',
    USER_ENABLED: 'تفعيل حساب',
    USER_DELETED: 'حذف مستخدم',
    USER_UPDATED_BY_SUPER: 'تعديل بيانات مستخدم',
    REG_CANCELLED: 'إلغاء تسجيل',
    REG_STATUS_CHANGED: 'تغيير حالة تسجيل',
    IMPERSONATION_START: 'بدء تقمص شخصية',
    SETTING_CHANGED: 'تعديل إعداد سيستم',
    IP_BLOCKED: 'حظر عنوان IP',
    IP_UNBLOCKED: 'إلغاء حظر IP',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F9F5F0] rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-[#F9F5F0] print:border-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <h3 className="text-xl sm:text-2xl font-black text-[#344F1F]">سجل العمليات</h3>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()} placeholder="بحث..." className="w-full pr-11 pl-4 py-3 bg-white border border-[#F2EAD3] rounded-2xl text-xs font-bold" />
          </div>
          <input value={logActionFilter} onChange={(e) => setLogActionFilter(e.target.value)} placeholder="نوع العملية..." className="px-4 py-3 bg-white border border-[#F2EAD3] rounded-2xl text-xs font-bold" />
          <button type="button" onClick={onApplyFilters} className="px-6 py-3 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black active:scale-95 transition-all">تصفية</button>
        </div>
      </div>
      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-[#F2EAD3] hover:shadow-md transition-all group gap-2">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#F2EAD3] group-hover:bg-[#F4991A] transition-colors" />
              <div>
                <span className="text-[10px] font-black text-[#F4991A] uppercase tracking-tighter">
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <p className="text-sm font-bold text-[#344F1F]">{log.admin_name} استهدف {log.target_name}</p>
              </div>
            </div>
            <div className="text-right sm:text-left border-t sm:border-0 border-[#F2EAD3]/30 pt-2 sm:pt-0">
              <p className="text-[10px] font-bold text-[#F4991A]">{new Date(log.created_at).toLocaleDateString()}</p>
              <p className="text-[10px] text-[#F4991A] opacity-60 font-medium">{new Date(log.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsView({ settings, onToggle }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F9F5F0] rounded-[2rem] p-8 shadow-sm border border-[#F9F5F0]">
      <h3 className="text-xl font-bold text-[#344F1F] mb-8">إعدادات المنصة (Feature Flags)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map(s => (
          <div key={s.id} className="p-6 bg-[#F9F5F0] rounded-[1.5rem] border border-[#F9F5F0] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-[#344F1F] mb-1">{s.description}</h4>
              <code className="text-[10px] text-[#F4991A] bg-[#F2EAD3] px-1.5 py-0.5 rounded">{s.setting_key}</code>
            </div>
            <button
              onClick={() => onToggle(s.setting_key, s.setting_value)}
              className={`w-12 h-6 rounded-full transition-all relative ${s.setting_value === 'true' ? 'bg-[#344F1F]' : 'bg-[#F2EAD3]'}`}
            >
              <motion.div
                animate={{ x: s.setting_value === 'true' ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-[#F9F5F0] rounded-full shadow-sm"
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
    blue: 'bg-[#F9F5F0] text-[#344F1F]',
    emerald: 'bg-[#F9F5F0] text-[#344F1F]',
    violet: 'bg-[#F9F5F0] text-[#344F1F]',
    amber: 'bg-[#F9F5F0] text-[#344F1F]'
  };
  return (
    <div className="bg-[#F9F5F0] rounded-[2rem] p-4 sm:p-6 shadow-sm border border-[#F9F5F0] group hover:shadow-lg transition-all border-[#F9F5F0] border-b-transparent hover:border-b-brand-500">
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-[1.2rem] ${c[color] || c.blue} transition-transform group-hover:rotate-6`}>
          <Icon size={window.innerWidth < 640 ? 18 : 24} />
        </div>
        {trend !== '0' && (
          <span className="text-[10px] font-black px-2 py-1 bg-[#F9F5F0] text-[#344F1F] rounded-lg">{trend}</span>
        )}
      </div>
      <p className="text-[10px] sm:text-xs font-bold text-[#F4991A] mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-lg sm:text-2xl font-black text-[#344F1F]">{value.toLocaleString('ar-EG')}</h4>
        <span className="text-[8px] sm:text-[10px] text-[#F4991A] font-medium">{sub}</span>
      </div>
    </div>
  );
}

function InsightItem({ icon: Icon, label, val, color = "text-[#344F1F]" }) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 bg-[#F9F5F0] rounded-2xl">
      <div className="flex items-center gap-2 sm:gap-3">
        <Icon size={16} className="text-[#F4991A]" />
        <span className="text-[10px] sm:text-xs font-bold text-[#F4991A]">{label}</span>
      </div>
      <span className={`text-[12px] sm:text-sm font-black ${color}`}>{val}</span>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#344F1F]/40 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#F9F5F0] rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-[#F9F5F0] bg-[#F9F5F0]/50 flex justify-between items-center">
          <h3 className="text-2xl font-black text-[#344F1F]">إضافة جهة مركزية 🏛️</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F2EAD3] rounded-full transition-all"><XCircle size={24} className="text-[#F4991A]" /></button>
        </div>
        <form onSubmit={sub} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">اسم الجهة الرسمي</label>
              <input required value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">النوع</label>
              <select value={data.type} onChange={e => setData({ ...data, type: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm">
                <option value="university">جامعة</option>
                <option value="company">شركة</option>
                <option value="municipality">بلدية</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">الكود</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value })} placeholder="مثال: HU" className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">البريد الإلكتروني</label>
            <input required type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
          </div>
          <div>
            <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">كلمة المرور</label>
            <input required type="password" value={data.password} onChange={e => setData({ ...data, password: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-4 font-bold text-[#F4991A]">إلغاء</button>
            <button type="submit" className="px-12 py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20">إنشاء الآن 🚀</button>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#344F1F]/40 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#F9F5F0] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-[#F9F5F0] bg-[#F9F5F0]/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${ENTITY_TYPES[entity.type]?.bg} ${ENTITY_TYPES[entity.type]?.color}`}>
              <Settings size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#344F1F]">إعدادات: {entity.name}</h3>
              <p className="text-xs text-[#F4991A] font-bold uppercase tracking-wider">{ENTITY_TYPES[entity.type]?.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F2EAD3] rounded-full transition-all"><XCircle size={24} className="text-[#F4991A]" /></button>
        </div>
        <form onSubmit={sub} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">الاسم الرسمي</label>
              <input required value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">البريد الإلكتروني</label>
              <input required type="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">الكود المميز</label>
              <input value={data.code} onChange={e => setData({ ...data, code: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">مسؤول التواصل</label>
              <input value={data.contact_name || ''} onChange={e => setData({ ...data, contact_name: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">رقم الهاتف</label>
              <input value={data.phone || ''} onChange={e => setData({ ...data, phone: e.target.value })} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">الموقع الإلكتروني</label>
              <input value={data.website || ''} onChange={e => setData({ ...data, website: e.target.value })} placeholder="https://..." className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">وصف الجهة</label>
              <textarea value={data.description || ''} onChange={e => setData({ ...data, description: e.target.value })} rows={3} className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-[#F9F5F0]">
            <button type="button" onClick={onClose} className="px-6 py-4 font-bold text-[#F4991A]">إلغاء</button>
            <button type="submit" disabled={loading} className="px-12 py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20 disabled:opacity-50">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✅'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function NewsletterBroadcastView() {
  const [subject, setSubject] = useState('');
  const [messageHtml, setMessageHtml] = useState('');
  const [audience, setAudience] = useState('all');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState({ users: [], subscribers: [] });
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/newsletter/contacts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setContacts(data);
    } catch (err) {
      toast.error('فشل جلب جهات الاتصال');
    } finally {
      setLoadingContacts(false);
    }
  };

  const getCombinedContacts = () => {
    const list = [];
    (contacts.users || []).forEach(u => list.push({ email: u.email, name: u.name, type: 'مستخدم مسجل' }));
    (contacts.subscribers || []).forEach(s => {
      if (!list.find(item => item.email === s.email)) {
        list.push({ email: s.email, name: '—', type: 'مشترك نشرة' });
      }
    });
    return list;
  };

  const allContacts = getCombinedContacts();
  const filteredContacts = allContacts.filter(c => 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSelect = (email) => {
    setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const handleSelectAll = (e) => {
    e.preventDefault();
    if (selectedEmails.length === filteredContacts.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredContacts.map(c => c.email));
    }
  };

  const handleDeleteSubscriber = async (email, e) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا الإيميل والانهاء من النشرة الإخبارية بشكل دائم؟')) return;
    
    try {
      const res = await fetch(`/api/newsletter/subscribers/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      
      toast.success(data.message || 'تم إزالة المشترك بنجاح');
      fetchContacts();
      setSelectedEmails(prev => prev.filter(em => em !== email));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject || !messageHtml) return toast.error('الموضوع ونص الرسالة مطلوبان');
    
    if (audience === 'specific' && selectedEmails.length === 0) {
      return toast.error('يرجى تحديد جهة اتصال واحدة على الأقل');
    }

    if (!window.confirm('أنت على وشك إرسال هذه الرسالة. هل أنت متأكد؟')) return;
    
    setLoading(true);
    try {
      const submitAudience = audience === 'all' ? 'all' : 'custom';
      
      const res = await fetch('/api/newsletter/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ subject, messageHtml, audience: submitAudience, customEmails: selectedEmails })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');
      
      toast.success(data.message || 'تم الإرسال بنجاح');
      setSubject('');
      setMessageHtml('');
      setSelectedEmails([]);
      setAudience('all');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F9F5F0] rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-[#F9F5F0]">
      <div className="mb-8">
        <h3 className="text-xl sm:text-2xl font-black text-[#344F1F] flex items-center gap-3">
          <Mail className="text-[#F4991A]" size={28} /> نظام البث المباشر المتقدم
        </h3>
        <p className="text-xs sm:text-sm font-bold text-[#344F1F]/60 mt-2">
          رسائل منسقة وإشعارات بريدية للجميع، أو استهداف دقيق لأشخاص محددين سواء كانوا مستخدمين أو مشتركين.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-6 max-w-5xl">
        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-[#F2EAD3] shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">عنوان الرسالة (Subject)</label>
              <input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="مثال: إشعار هام..."
                className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">من سيستلم الرسالة؟</label>
              <select 
                value={audience} 
                onChange={(e) => {
                  setAudience(e.target.value);
                  if (e.target.value === 'all') setSelectedEmails([]);
                }}
                className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm"
              >
                <option value="all">إرسال للجميع عام (كافة المشتركين والمستخدمين المعرفين)</option>
                <option value="specific">تحديد أفراد محددين بشكل يدوي (توجيه فردي)</option>
              </select>
            </div>
          </div>

          {audience === 'specific' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
              <label className="text-xs font-black text-[#F4991A] mb-4 uppercase flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span>تحديد المستلمين ({selectedEmails.length} محددون)</span>
                <button type="button" onClick={handleSelectAll} className="text-[#344F1F] hover:underline bg-[#F9F5F0] px-3 py-1.5 rounded w-full sm:w-auto text-center">
                  {selectedEmails.length === filteredContacts.length && filteredContacts.length > 0 ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </button>
              </label>
              
              <div className="mb-4 relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" size={18} />
                <input 
                  type="text" 
                  placeholder="بحث عن اسم أو بريد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-[#F9F5F0] border border-[#F2EAD3] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4991A]/50 text-sm font-bold transition-all placeholder:text-[#344F1F]/40"
                />
              </div>

              <div className="bg-[#F9F5F0] border border-[#F4991A]/30 rounded-2xl overflow-x-auto max-h-60 overflow-y-auto rich-scroll">
                {loadingContacts ? (
                  <div className="p-8 text-center text-[#344F1F]/40 font-black">جاري التحميل...</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-[#344F1F]/40 font-black">لا توجد نتائج مطابقة</div>
                ) : (
                  <table className="w-full text-right text-xs sm:text-sm min-w-[500px]">
                    <thead className="bg-[#F2EAD3] sticky top-0 z-10">
                      <tr>
                        <th className="p-2 sm:p-3 w-12 sm:w-16 text-center">اختيار</th>
                        <th className="p-2 sm:p-3 text-[#344F1F]">الاسم</th>
                        <th className="p-2 sm:p-3 text-[#344F1F]">الإيميل</th>
                        <th className="p-2 sm:p-3 text-[#344F1F]">الجهة/النوع</th>
                        <th className="p-2 sm:p-3 text-[#344F1F] text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EAD3]">
                      {filteredContacts.map((c, i) => (
                        <tr 
                          key={i} 
                          onClick={() => handleToggleSelect(c.email)}
                          className={`cursor-pointer transition-colors ${selectedEmails.includes(c.email) ? 'bg-[#344F1F]/5 text-[#344F1F]' : 'hover:bg-white'}`}
                        >
                          <td className="p-2 sm:p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedEmails.includes(c.email)} 
                              readOnly 
                              className="w-4 h-4 sm:w-5 sm:h-5 accent-[#F4991A] rounded"
                            />
                          </td>
                          <td className="p-2 sm:p-3 font-black text-[#344F1F]">{c.name}</td>
                          <td className="p-2 sm:p-3 font-medium text-[#F4991A] break-all">{c.email}</td>
                          <td className="p-2 sm:p-3 text-[10px] sm:text-xs font-bold text-[#344F1F]/60">
                            <span className="bg-white border border-[#F2EAD3] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">{c.type}</span>
                          </td>
                          <td className="p-2 sm:p-3 text-left">
                            {c.type === 'مشترك نشرة' && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSubscriber(c.email, e)}
                                title="حذف الاشتراك"
                                className="text-[10px] text-red-600 hover:text-white hover:bg-red-600 px-3 py-1 font-bold rounded-lg transition-colors border border-red-200 bg-white shadow-sm"
                              >
                                إزالة
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-xs font-black text-[#F4991A] mb-2 mr-2 uppercase">محتوى الرسالة المنسق</label>
            <textarea 
              value={messageHtml} 
              onChange={(e) => setMessageHtml(e.target.value)} 
              rows={8}
              placeholder="اكتب رسالتك هنا... (يدعم أكواد HTML للتنسيق والصور)"
              className="w-full px-5 py-4 bg-[#F9F5F0] border-0 rounded-2xl focus:ring-2 focus:ring-[#F4991A] font-medium text-sm resize-none text-right"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? <div className="w-5 h-5 border-2 border-[#F4991A] border-t-transparent rounded-full animate-spin" /> : <Send size={20} className="text-[#F4991A]" />}
            {loading ? 'جاري الإرسال...' : audience === 'all' ? 'بث الرسالة بلا استثناء 🚀' : 'إرسال للمحددين فقط'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

