import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Award, Clock, Users, Download,
  CheckCircle, BookOpen, TrendingUp, Star, Shield,
  ChevronDown, X, Search, Filter, ExternalLink
} from 'lucide-react';
import { universityAPI, trainingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ─── Multiplier table config ─────────────────────────────────────
const MULTIPLIERS = {
  'تعليمية': { value: 1.50, color: 'text-blue-600', bg: 'bg-blue-100', bar: '#3b82f6' },
  'بيئية': { value: 1.00, color: 'text-green-600', bg: 'bg-green-100', bar: '#10b981' },
  'تطوعية': { value: 1.00, color: 'text-emerald-600', bg: 'bg-emerald-100', bar: '#059669' },
  'رياضية': { value: 0.75, color: 'text-orange-600', bg: 'bg-orange-100', bar: '#f97316' },
  'اجتماعية': { value: 0.75, color: 'text-pink-600', bg: 'bg-pink-100', bar: '#ec4899' },
  'ثقافية': { value: 0.50, color: 'text-purple-600', bg: 'bg-purple-100', bar: '#8b5cf6' },
};

// ─── Animated counter ─────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    const steps = 50;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(parseFloat((target * (step / steps)).toFixed(decimals)));
      if (step >= steps) { setDisplay(target); clearInterval(timer); }
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return <span ref={ref} dir="ltr">{display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

// ─── Certificate Card ─────────────────────────────────────────────
function CertificateModal({ student, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('يرجى السماح بالنوافذ المنبثقة (Popups) للمتابعة');
      return;
    }
    win.document.write(`
      <html dir="rtl">
        <head>
          <title>شهادة ساعات تطوع خارجي - ${student.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"/>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    brand: { 50: '#f0f9ff', 100: '#e0f2fe', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' }
                  }
                }
              }
            }
          </script>
          <style>
            body { font-family: 'Cairo', sans-serif; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; }
            .hero-gradient { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); }
            .badge-pill { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 800)">
          <div class="max-w-2xl mx-auto">${content}</div>
        </body>
      </html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Award size={20} className="text-amber-500" /> شهادة ساعات تطوع خارجي
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="btn-primary flex items-center gap-2 text-sm py-2">
              <Download size={15} /> طباعة / PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate design */}
        <div ref={printRef} className="p-8">
          <div className="border-[6px] border-double border-amber-400 rounded-2xl p-8 relative overflow-hidden">
            {/* Background watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <GraduationCap size={300} className="text-brand-900" />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-14 h-14 bg-hero-gradient rounded-2xl flex items-center justify-center text-3xl shadow-lg">🗺️</div>
                <div className="text-right">
                  <p className="font-black text-brand-900 text-lg">منصة Linka</p>
                  <p className="text-slate-500 text-xs">Linka Volunteering Platform</p>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-l from-transparent via-amber-400 to-transparent" />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <p className="text-slate-500 text-sm mb-1">تشهد منصة Linka بأن</p>
              <h1 className="text-3xl font-black text-brand-900 mb-1">{student.name}</h1>
              {student.student_id !== '—' && (
                <p className="text-slate-400 text-sm">رقم الطالب: {student.student_id}</p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'ساعات تطوع خارجي', value: student.academic_hours, icon: '🎓', color: '#059669' },
                { label: 'عدد الأنشطة', value: student.total_participations, icon: '📋', color: '#d97706' },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 rounded-2xl border-2"
                  style={{ borderColor: s.color + '40', background: s.color + '08' }}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-black" style={{ color: s.color }}>
                    <span dir="ltr">
                      {typeof s.value === 'number' ? s.value.toLocaleString('en-US') : s.value}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Activities */}
            {Object.keys(student.activities_breakdown || {}).length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-slate-400 font-semibold mb-2 text-center">الأنشطة المشمولة</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(student.activities_breakdown).map(([type, cnt]) => (
                    <span key={type} className={`badge-pill text-xs ${MULTIPLIERS[type]?.bg || 'bg-slate-100'} ${MULTIPLIERS[type]?.color || 'text-slate-600'}`}>
                      {type} ({cnt})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-dashed border-slate-200 pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">كود التحقق</p>
                <p className="font-mono font-bold text-slate-700 text-sm">{student.certificate_code}</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-1">
                  <CheckCircle size={28} className="text-white" fill="currentColor" />
                </div>
                <p className="text-xs text-emerald-600 font-bold">معتمد رسمياً</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400">تاريخ الإصدار</p>
                <p className="text-sm font-bold text-slate-700" dir="ltr">
                  {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function UniversityDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUni, setFilterUni] = useState('');
  const [universities, setUniversities] = useState([]);
  const [certStudent, setCertStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('students'); // students | multipliers | insights | training

  const [trainingSessions, setTrainingSessions] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }

    Promise.all([
      universityAPI.getReport({ limit: 100 }),
      universityAPI.getUniversities(),
    ]).then(([reportRes, uniRes]) => {
      setData(reportRes.data);
      setUniversities(uniRes.data.universities || []);
    }).catch(() => toast.error('خطأ في تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'training') return;
    fetchTrainingSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchTrainingSessions = async () => {
    setTrainingLoading(true);
    try {
      const res = await trainingAPI.listUniversitySessions({ status: 'pending', limit: 120 });
      setTrainingSessions(res.data.sessions || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في جلب جلسات التدريب');
    } finally {
      setTrainingLoading(false);
    }
  };

  const approveSession = async (sessionId) => {
    try {
      await trainingAPI.approveSession(sessionId, { signature_url: signatureUrl || null, notes: approveNotes || null });
      toast.success('تم اعتماد الجلسة');
      setTrainingSessions(trainingSessions.filter((s) => s.id !== sessionId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر اعتماد الجلسة');
    }
  };

  const handleFilter = () => {
    setLoading(true);
    universityAPI.getReport({ university: filterUni || undefined, limit: 100 })
      .then(r => setData(r.data))
      .catch(() => toast.error('خطأ في الفلترة'))
      .finally(() => setLoading(false));
  };

  const filtered = (data?.students || []).filter(s =>
    !search ||
    s.name.includes(search) ||
    s.email.includes(search) ||
    s.student_id?.includes(search)
  );

  const eligible = filtered.filter(s => s.certificate_eligible);

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <GraduationCap size={48} className="text-brand-500 animate-pulse" />
        <p className="font-semibold">جاري تحميل التقرير الأكاديمي...</p>
      </div>
    </div>
  );

  const s = data?.summary || {};

  return (
    <div className="min-h-screen bg-slate-50 pt-16">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                <GraduationCap size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800">نظام الساعات الخارجية</h1>
                <p className="text-slate-500 text-xs mt-0.5">تحويل ساعات التطوع إلى ساعات معتمدة أكاديمياً</p>
              </div>
            </div>

            {/* Innovation badge */}
            <div className="sm:mr-auto flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-2">
              <button
                onClick={() => {
                  const csv = buildCSV(filtered);
                  downloadCSV(csv, 'external_hours_report.csv');
                  toast.success('تم تصدير التقرير');
                }}
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-4 py-2 rounded-xl border border-emerald-200 transition-colors text-sm"
              >
                <Download size={15} /> تصدير CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Summary Stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'الطلاب المشاركون', value: s.total_students, color: 'from-brand-600 to-brand-800', decimals: 0 },
            { icon: GraduationCap, label: 'ساعات تطوع خارجي', value: s.total_academic_hours, color: 'from-violet-500 to-purple-600', decimals: 1, suffix: 'h' },
            { icon: Award, label: 'مؤهلون للشهادة', value: eligible.length, color: 'from-amber-500 to-orange-500', decimals: 0 },
          ].map(({ icon: Icon, label, value, color, decimals, suffix = '' }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-6 hover:-translate-y-1 transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md`}>
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-2xl font-black text-slate-800">
                <AnimatedNumber value={parseFloat(value) || 0} decimals={decimals} suffix={suffix} />
              </p>
              <p className="text-slate-500 text-sm mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Innovation callout ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-l from-violet-700 to-brand-900 rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={18} className="text-violet-300" />
                <span className="font-bold text-violet-200 text-sm uppercase tracking-wide">كيف يعمل النظام؟</span>
              </div>
              <h3 className="text-xl font-black mb-2">ساعات التطوع → ساعات تطوع خارجي معتمدة</h3>
              <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
                كل نشاط تطوعي يُترجم إلى ساعات تطوع خارجي حسب معامل تحويل معتمد.
                الأنشطة التعليمية والتدريبية تحمل معاملاً أعلى لأهميتها التنموية.
                الطلاب الحاصلون على 10 ساعات تطوع خارجي أو أكثر يحصلون على شهادة معتمدة قابلة للتحقق.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              {[
                { type: 'تعليمية', val: '×1.5' },
                { type: 'بيئية / تطوعية', val: '×1.0' },
                { type: 'ثقافية', val: '×0.5' },
              ].map((m, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
                  <p className="text-white/60 text-xs">{m.type}</p>
                  <p className="text-2xl font-black mt-1">{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {[
              { key: 'students', label: 'الطلاب', icon: Users },
              { key: 'multipliers', label: 'معاملات التحويل', icon: BookOpen },
              { key: 'insights', label: 'تحليلات', icon: TrendingUp },
              { key: 'training', label: 'التدريب الميداني', icon: Award },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === key
                  ? 'text-brand-700 border-b-2 border-brand-700 bg-brand-50'
                  : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* ─── TAB: Students ─────────────────────────────────── */}
          {activeTab === 'students' && (
            <div>
              {/* Filters */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    className="input-field pr-9 text-sm py-2"
                    placeholder="البحث بالاسم أو الرقم الجامعي..." />
                </div>
                <div className="flex items-center gap-2">
                  <select value={filterUni} onChange={e => setFilterUni(e.target.value)}
                    className="input-field text-sm py-2 appearance-none">
                    <option value="">كل الجامعات</option>
                    {universities.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                  <button onClick={handleFilter} className="btn-primary text-sm py-2 px-4 flex items-center gap-1">
                    <Filter size={13} /> تطبيق
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-medium mr-auto">
                  {filtered.length} طالب · {eligible.length} مؤهل
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase text-right">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">الطالب</th>
                      <th className="px-5 py-3 hidden sm:table-cell">الجامعة</th>
                      <th className="px-5 py-3">ساعات تطوع خارجي</th>
                      <th className="px-5 py-3 hidden md:table-cell">الأنشطة</th>
                      <th className="px-5 py-3">الشهادة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((student, i) => (
                      <motion.tr key={student.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.6) }}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Rank */}
                        <td className="px-5 py-4 text-sm font-bold text-slate-400">
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${(i + 1).toLocaleString('en-US')}`}
                        </td>

                        {/* Student info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-hero-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {student.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                              <p className="text-xs text-slate-400">
                                {student.student_id !== '—' ? student.student_id : student.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* University */}
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                            {student.university}
                          </span>
                        </td>

                        {/* Academic hours */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <GraduationCap size={13} className="text-violet-500" />
                            <span className="font-black text-violet-700 text-sm" dir="ltr">
                              {parseFloat(student.academic_hours).toLocaleString('en-US', { minimumFractionDigits: 1 })}h
                            </span>
                          </div>
                        </td>

                        {/* Activity breakdown */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(student.activities_breakdown || {}).slice(0, 3).map(([type, cnt]) => (
                              <span key={type}
                                className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium border border-slate-200">
                                {type}: {cnt.toLocaleString('en-US')}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Certificate */}
                        <td className="px-5 py-4">
                          {student.certificate_eligible ? (
                            <button
                              onClick={() => setCertStudent(student)}
                              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
                            >
                              <Award size={12} /> شهادة
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {Math.max(0, (10 - parseFloat(student.academic_hours)).toFixed(1))}h متبقية
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-16 text-slate-400">
                        <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                        <p>لا توجد بيانات مطابقة</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB: Multipliers ──────────────────────────────── */}
          {activeTab === 'multipliers' && (
            <div className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {Object.entries(MULTIPLIERS).map(([type, cfg], i) => (
                  <motion.div key={type}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    className="card p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`badge-pill text-sm font-bold ${cfg.bg} ${cfg.color}`}>{type}</span>
                      <span className="text-2xl font-black text-slate-800">×{cfg.value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(cfg.value / 1.5) * 100}%` }}
                        transition={{ delay: i * 0.07 + 0.3, duration: 0.7 }}
                        className="h-full rounded-full"
                        style={{ background: cfg.bar }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      مثال: 4 ساعات تطوع = <strong style={{ color: cfg.bar }}>
                        {(4 * cfg.value).toFixed(1)} ساعات تطوع خارجي
                      </strong>
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Policy box */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <BookOpen size={16} /> سياسة الاعتماد الأكاديمي
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div className="space-y-2">
                    <p>✅ الحد الأدنى للشهادة: <strong>10 ساعات تطوع خارجي</strong></p>
                    <p>✅ يُشترط تأكيد الحضور الفعلي من المشرف</p>
                    <p>✅ كل شهادة تحمل كوداً فريداً للتحقق</p>
                  </div>
                  <div className="space-y-2">
                    <p>🎓 قابلة للاعتماد في الجامعات الشريكة</p>
                    <p>📄 تُحتسب في ساعات الخدمة المجتمعية</p>
                    <p>🔐 مؤمّنة بتوقيع رقمي قابل للتحقق</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Insights ─────────────────────────────────── */}
          {activeTab === 'insights' && (
            <div className="p-6 space-y-6">

              {/* Activity distribution */}
              {data?.activity_distribution?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChartIcon /> توزيع ساعات تطوع خارجي حسب نوع النشاط
                  </h3>
                  <div className="space-y-3">
                    {data.activity_distribution.map((a, i) => {
                      const max = Math.max(...data.activity_distribution.map(x => parseFloat(x.academic_hours)));
                      const pct = Math.round((parseFloat(a.academic_hours) / max) * 100);
                      const cfg = MULTIPLIERS[a.type] || { bar: '#64748b', bg: 'bg-slate-100', color: 'text-slate-600' };
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className={`badge-pill text-xs ${cfg.bg} ${cfg.color}`}>{a.type}</span>
                            <div className="flex items-center gap-4 text-slate-500 text-xs">
                              <span>×{a.avg_multiplier} معامل</span>
                              <span>{a.total_participations} مشارك</span>
                              <strong className="text-slate-700">{a.academic_hours}h أكاديمي</strong>
                            </div>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: i * 0.1, duration: 0.8 }}
                              className="h-full rounded-full"
                              style={{ background: cfg.bar }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top neighborhoods */}
              {data?.top_neighborhoods?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Star size={16} className="text-amber-500" /> أكثر الأحياء إنتاجاً أكاديمياً
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {data.top_neighborhoods.map((n, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`card p-4 text-center ${i === 0 ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                      >
                        <div className="text-2xl mb-1">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</div>
                        <p className="font-bold text-slate-800 text-sm">{n.name}</p>
                        <p className="text-violet-600 font-black text-lg mt-1">{n.academic_hours}h</p>
                        <p className="text-slate-400 text-xs">{n.students} طالب</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roadmap */}
              <div className="bg-gradient-to-l from-slate-800 to-brand-900 rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  خارطة طريق التوسع
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { phase: 'المرحلة الأولى', status: 'مكتملة ✅', items: ['ربط بلدية الخليل', 'نظام الساعات الأساسي', 'شهادات رقمية'], color: 'border-emerald-500' },
                    { phase: 'المرحلة الثانية', status: 'قادمة 🔜', items: ['ربط API الجامعات', 'نقل تلقائي للسجلات', 'توقيع بلوكتشين'], color: 'border-amber-500' },
                    { phase: 'المرحلة الثالثة', status: 'مستقبلية 🚀', items: ['شبكة فلسطين كاملة', 'AI لتقييم الأنشطة', 'اعتراف دولي'], color: 'border-blue-400' },
                  ].map((p, i) => (
                    <div key={i} className={`border-r-4 ${p.color} pr-4`}>
                      <p className="font-black text-sm mb-0.5">{p.phase}</p>
                      <p className="text-white/50 text-xs mb-2">{p.status}</p>
                      <ul className="space-y-1">
                        {p.items.map((item, j) => (
                          <li key={j} className="text-white/70 text-xs flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-white/40 rounded-full flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Training (Field Internship) ───────────────────── */}
          {activeTab === 'training' && (
            <div className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-800">اعتماد الحضور للتدريب الميداني</h3>
                  <p className="text-sm text-slate-500 font-bold mt-1">هذه الجلسات قادمة من نظام Check-in/out (Geo) وتحتاج اعتماد رسمي.</p>
                </div>
                <button onClick={fetchTrainingSessions} className="btn-primary text-sm py-2 px-4">تحديث الجلسات</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3">
                  {trainingLoading ? (
                    <div className="h-40 card flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
                    </div>
                  ) : trainingSessions.length === 0 ? (
                    <div className="card p-8 text-center text-slate-400 font-bold">لا توجد جلسات معلقة حالياً.</div>
                  ) : (
                    trainingSessions.map((s) => (
                      <div key={s.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate">{s.student_name} · {s.student_id || '—'}</p>
                          <p className="text-sm text-slate-600 font-bold truncate">{s.offer_title} — {s.company_name || 'شركة'}</p>
                          <div className="text-xs text-slate-500 font-bold mt-2 flex flex-wrap gap-3">
                            <span>ساعات: <span dir="ltr">{s.computed_hours}</span></span>
                            <span>تحقق مكاني: {Number(s.geo_verified) === 1 ? <span className="text-emerald-600">نعم</span> : <span className="text-red-600">لا</span>}</span>
                            <span>دخول: {new Date(s.check_in_at).toLocaleString('ar-EG')}</span>
                            {s.check_out_at && <span>خروج: {new Date(s.check_out_at).toLocaleString('ar-EG')}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveSession(s.id)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1"
                          >
                            <CheckCircle size={14} /> اعتماد
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="card p-5 space-y-3">
                  <h4 className="font-black text-slate-900 text-sm">التوقيع والملاحظات</h4>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">رابط التوقيع (اختياري)</label>
                    <input value={signatureUrl} onChange={(e) => setSignatureUrl(e.target.value)} className="input-field text-sm py-2" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظات المشرف (اختياري)</label>
                    <textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} rows={4} className="input-field text-sm py-2" placeholder="ملاحظات حول الانضباط/المهارات..." />
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                    عند الضغط على “اعتماد” سيتم حفظ التوقيع/الملاحظات على الجلسة الحالية التي تضغط اعتمادها.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {certStudent && (
          <CertificateModal student={certStudent} onClose={() => setCertStudent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────
function BarChartIcon() {
  return <TrendingUp size={16} className="text-violet-500" />;
}

function buildCSV(students) {
  const header = 'الاسم,البريد,الجامعة,رقم الطالب,ساعات تطوع خارجي,المشاركات,مؤهل للشهادة\n';
  const rows = students.map(s =>
    `${s.name},${s.email},${s.university},${s.student_id},${s.academic_hours},${s.total_participations},${s.certificate_eligible ? 'نعم' : 'لا'}`
  ).join('\n');
  return '\uFEFF' + header + rows; // BOM for Arabic Excel support
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
