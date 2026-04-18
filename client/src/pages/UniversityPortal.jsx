import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap, Users, Clock, Award, Search, Plus, CheckCircle,
    X, Shield, TrendingUp, BookOpen, BarChart2, Download, QrCode,
    ChevronRight, AlertCircle, Star, Loader2, Building2, Target, MapPin, BadgeCheck
} from 'lucide-react';
import { universityAPI, trainingAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// ─── Certificate Component ─────────────────────────────────────────
function CertificateModal({ cert, onClose }) {
    const printRef = useRef(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        const win = window.open('', '_blank');
        if (!win) { toast.error('يرجى السماح بالنوافذ المنبثقة'); return; }
        win.document.write(`<html dir="rtl"><head>
      <title>شهادة تطوع - ${cert.student_name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"/>
      <style>
        body { font-family: 'Cairo', sans-serif; margin: 0; padding: 24px; -webkit-print-color-adjust: exact; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body onload="setTimeout(()=>{window.print();window.close();},800)">
      <div style="max-width:680px;margin:0 auto">${content}</div>
    </body></html>`);
        win.document.close();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Award size={18} className="text-amber-500" /> شهادة تطوع معتمدة</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm py-2">
                            <Download size={14} /> طباعة / PDF
                        </button>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                    </div>
                </div>
                <div className="p-8 overflow-y-auto max-h-[80vh]">
                    <div ref={printRef}>
                        <div className="border-[6px] border-double border-amber-400 rounded-2xl p-8 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                <GraduationCap size={280} className="text-slate-900" />
                            </div>
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg">🗺️</div>
                                    <div className="text-right">
                                        <p className="font-black text-blue-900 text-lg">منصة Linka</p>
                                        <p className="text-slate-500 text-xs">Linka Volunteering Platform</p>
                                    </div>
                                </div>
                                <div className="h-0.5 bg-gradient-to-l from-transparent via-amber-400 to-transparent" />
                            </div>
                            {/* Content */}
                            <div className="text-center mb-6">
                                <p className="text-slate-500 text-sm mb-2">تشهد {cert.university_name} ومنصة Linka بأن</p>
                                <h1 className="text-3xl font-black text-blue-900 mb-1">{cert.student_name}</h1>
                                {cert.student_id && <p className="text-slate-400 text-sm">الرقم الجامعي: {cert.student_id}</p>}
                                {cert.major && <p className="text-slate-500 text-sm mt-1">التخصص: {cert.major}</p>}
                                <p className="text-slate-600 mt-4 text-base">قد أتمّ ساعات التطوع المجتمعي المعتمدة</p>
                            </div>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[
                                    { label: 'ساعات تطوع خارجي معتمدة', value: cert.academic_hours, icon: '🎓', color: '#059669' },
                                    { label: 'عدد الفعاليات', value: cert.total_participations, icon: '📋', color: '#d97706' },
                                ].map((s, i) => (
                                    <div key={i} className="text-center p-4 rounded-2xl border-2" style={{ borderColor: s.color + '40', background: s.color + '10' }}>
                                        <div className="text-2xl mb-1">{s.icon}</div>
                                        <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Footer */}
                            <div className="border-t border-dashed border-slate-200 pt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400">كود التحقق</p>
                                    <p className="font-mono font-bold text-slate-700 text-sm">{cert.certificate_code}</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <CheckCircle size={24} className="text-white" fill="currentColor" />
                                    </div>
                                    <p className="text-xs text-emerald-600 font-bold">معتمد رسمياً</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400">تاريخ الإصدار</p>
                                    <p className="text-sm font-bold text-slate-700" dir="ltr">{new Date().toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Add Student Modal ────────────────────────────────────────────
function AddStudentModal({ onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [form, setForm] = useState({
        student_id: '',
        student_name: '',
        major: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await universityAPI.addStudent(form);
            toast.success('تم إضافة الطالب بنجاح');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'خطأ في إضافة الطالب');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 font-cairo">
                        <Users size={20} className="text-brand-600" /> إضافة طالب جديد
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الجامعي *</label>
                        <input className="input-field" placeholder="مثال: 202312345" required
                            value={form.student_id} onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">اسم الطالب (اختياري)</label>
                        <input className="input-field" placeholder="الاسم الكامل"
                            value={form.student_name} onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">التخصص</label>
                        <input className="input-field" placeholder="مثال: هندسة حاسوبية"
                            value={form.major} onChange={e => setForm(p => ({ ...p, major: e.target.value }))} />
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={showCredentials} onChange={e => setShowCredentials(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-brand-700 transition-colors">إنشاء حساب (بريد وكلمة سر)</span>
                        </label>
                    </div>

                    <AnimatePresence>
                        {showCredentials && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden pt-2">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
                                    <input type="email" className="input-field" placeholder="student@university.com" required={showCredentials}
                                        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ direction: 'ltr', textAlign: 'right' }} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور *</label>
                                    <input type="password" title="6 أحرف على الأقل" className="input-field" placeholder="6 أحرف على الأقل" required={showCredentials}
                                        value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={{ direction: 'ltr', textAlign: 'right' }} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                        className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} /> إضافة وحفظ الطالب</>}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay }} className="card p-5 hover:-translate-y-1 transition-transform">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md`}>
                <Icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-black text-slate-800" dir="ltr">{value}</p>
            <p className="text-slate-500 text-sm mt-0.5">{label}</p>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────
export default function UniversityPortal() {
    const { user, isUniversity, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentTotal, setStudentTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [universityIdParam] = useState(new URLSearchParams(window.location.search).get('university_id'));
    const [loading, setLoading] = useState(true);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [certStudent, setCertStudent] = useState(null);
    const [certData, setCertData] = useState(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [verifyStudentId, setVerifyStudentId] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [certSearch, setCertSearch] = useState('');
    const [certLoading, setCertLoading] = useState(false);

    const [trainingSessions, setTrainingSessions] = useState([]);
    const [trainingLoading, setTrainingLoading] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState('');
    const [approveNotes, setApproveNotes] = useState('');

    const canAccess = isUniversity || isAdmin;

    useEffect(() => {
        if (!canAccess) { navigate('/'); return; }
        loadDashboard();
    }, []);

    useEffect(() => {
        if (activeTab === 'training') {
            fetchTrainingSessions();
        }
    }, [activeTab]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const [statsRes, stuRes] = await Promise.all([
                universityAPI.getDashboardStats({ university_id: universityIdParam }),
                universityAPI.getMyStudents({ search: '', university_id: universityIdParam }),
            ]);
            setStats(statsRes.data);
            setStudents(stuRes.data.students || []);
            setStudentTotal(stuRes.data.total || 0);
        } catch {
            toast.error('خطأ في تحميل البيانات');
        } finally { setLoading(false); }
    };

    const searchStudents = async (q) => {
        setSearch(q);
        try {
            const res = await universityAPI.getMyStudents({ search: q, university_id: universityIdParam });
            setStudents(res.data.students || []);
            setStudentTotal(res.data.total || 0);
        } catch { /* silent */ }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setVerifyLoading(true);
        try {
            const res = await universityAPI.verifyAttendance({ verification_code: verifyCode, student_id: verifyStudentId });
            toast.success(res.data.message);
            setVerifyCode(''); setVerifyStudentId('');
            loadDashboard();
        } catch (err) {
            toast.error(err.response?.data?.error || 'خطأ في التحقق');
        } finally { setVerifyLoading(false); }
    };

    const handleGetCertificate = async (student) => {
        if (!student.user_id) { toast.error('الطالب غير مرتبط بحساب في المنصة'); return; }
        setCertLoading(true);
        try {
            const res = await universityAPI.getCertificate(student.user_id);
            setCertData(res.data.certificate);
            setCertStudent(student);
        } catch (err) {
            toast.error(err.response?.data?.error || 'الطالب لا يستوفي شروط الشهادة');
        } finally { setCertLoading(false); }
    };

    const fetchTrainingSessions = async () => {
        setTrainingLoading(true);
        try {
            const res = await trainingAPI.listUniversitySessions({ status: 'pending', limit: 120 });
            setTrainingSessions(res.data.sessions || []);
        } catch (err) {
            toast.error(err.response?.data?.error || 'خطأ في جلب جلسات التدريب');
        } finally { setTrainingLoading(false); }
    };

    const approveSession = async (sessionId) => {
        try {
            await trainingAPI.approveSession(sessionId, { signature_url: signatureUrl || null, notes: approveNotes || null });
            toast.success('تم اعتماد الجلسة');
            setTrainingSessions(trainingSessions.filter(s => s.id !== sessionId));
        } catch (err) {
            toast.error(err.response?.data?.error || 'خطأ في اعتماد الجلسة');
        }
    };

    const handleExportReport = async () => {
        try {
            const res = await trainingAPI.exportReport();
            const data = res.data.report || [];
            if (data.length === 0) {
                toast.error('لا توجد بيانات لتصديرها');
                return;
            }

            const headers = ['Session ID', 'Student Name', 'Student Code', 'Training', 'Company', 'Check In', 'Check Out', 'Hours', 'Location', 'Status', 'Geo Verified'];
            const rows = data.map(s => [
                s.session_id,
                s.student_name,
                s.student_code,
                s.training_title,
                s.company,
                s.check_in_at ? new Date(s.check_in_at).toLocaleString('ar-EG') : '',
                s.check_out_at ? new Date(s.check_out_at).toLocaleString('ar-EG') : '',
                s.computed_hours,
                s.location,
                s.session_status,
                s.geo_verified ? 'Yes' : 'No'
            ]);

            const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `university_training_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            toast.error('خطأ في تصدير التقرير');
        }
    };

    const TABS = [
        { key: 'dashboard', label: 'الرئيسية', icon: BarChart2 },
        { key: 'students', label: 'الطلاب', icon: Users },
        { key: 'training', label: 'التدريب الميداني', icon: Target },
        { key: 'verify', label: 'التحقق', icon: Shield },
        { key: 'certs', label: 'الشهادات', icon: Award },
    ];

    if (loading) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <GraduationCap size={48} className="text-brand-500 animate-pulse" />
                <p className="font-semibold">جاري تحميل بوابة الجامعة...</p>
            </div>
        </div>
    );

    const st = stats?.stats || {};

    return (
        <div className="min-h-screen bg-slate-50 pt-16">
            <div className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-hero-gradient rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white">🏛️</div>
                            <div>
                                <h1 className="text-2xl font-black text-brand-900 font-cairo">بوابة {stats?.university_name || 'الجامعة'}</h1>
                                <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                                    <Shield size={14} className="text-emerald-500" /> لوحة الإدارة والصلاحيات المعتمدة
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowAddStudent(true)}
                            className="btn-primary flex items-center gap-2 py-3 px-6 shadow-xl shadow-brand-700/20 active:scale-95 transition-all">
                            <Plus size={18} /> إضافة طالب جديد
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                        {TABS.map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all relative min-w-max ${activeTab === tab.key ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600'}`}>
                                <tab.icon size={18} /> {tab.label}
                                {activeTab === tab.key && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-700 rounded-t-full" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* ── TAB: Dashboard ────────────────────────────────────── */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon={Users} label="إجمالي الطلاب" value={st.total_students || studentTotal} color="from-blue-600 to-blue-800" delay={0.1} />
                            <StatCard icon={TrendingUp} label="ساعات التطوع المعتمدة" value={`${st.total_hours || 0}h`} color="from-emerald-500 to-teal-700" delay={0.2} />
                            <StatCard icon={Award} label="طلاب مؤهلون للشهادة" value={st.eligible_students || 0} color="from-amber-500 to-orange-600" delay={0.3} />
                            <StatCard icon={BarChart2} label="معدل المشاركة" value={`${st.avg_participation || 0}%`} color="from-violet-600 to-indigo-800" delay={0.4} />
                        </div>

                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Users size={20} className="text-brand-600" /> قائمة الطلاب المسجلين
                            </h3>
                            <div className="relative w-72">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input className="input-field pl-10 py-2.5 text-sm" placeholder="ابحث باسم الطالب أو رفمه..."
                                    value={search} onChange={e => { setSearch(e.target.value); searchStudents(e.target.value); }} />
                            </div>
                        </div>

                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-5 py-4 font-bold text-slate-600 text-sm">الطالب</th>
                                            <th className="px-5 py-4 font-bold text-slate-600 text-sm">الرقم الجامعي</th>
                                            <th className="px-5 py-4 font-bold text-slate-600 text-sm">ساعات (تطوع)</th>
                                            <th className="px-5 py-4 font-bold text-slate-600 text-sm">ساعات (ميداني)</th>
                                            <th className="px-5 py-4 font-bold text-slate-600 text-sm">حالة التدريب</th>
                                            <th className="px-5 py-4 font-bold text-slate-600 text-sm">التخصص</th>
                                            <th className="px-5 py-4 font-bold text-slate-600 text-sm">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map((s, i) => (
                                            <motion.tr key={s.link_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">{s.name?.charAt(0)}</div>
                                                        <span className="font-bold text-slate-800 text-sm">{s.name || '—'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{s.student_id}</td>
                                                <td className="px-5 py-4">
                                                    <span className="font-black text-violet-700 text-sm" dir="ltr">{s.academic_hours}h</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-black text-emerald-700 text-sm" dir="ltr">{s.field_hours}h</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {s.training_status === 'none' ? (
                                                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-400">لا يوجد</span>
                                                    ) : s.training_status === 'in_progress' ? (
                                                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-amber-100 text-amber-700 flex flex-col items-center">
                                                            <span>في التدريب</span>
                                                            <span className="text-[8px] opacity-70 truncate max-w-[80px]">{s.training_company}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 flex flex-col items-center">
                                                            <span>أنهى التدريب</span>
                                                            <span className="text-[8px] opacity-70 truncate max-w-[80px]">{s.training_company}</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-500">{s.major || '—'}</td>
                                                <td className="px-5 py-4">
                                                    {s.certificate_eligible ? (
                                                        <button onClick={() => handleGetCertificate(s)}
                                                            disabled={certLoading}
                                                            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs px-3 py-1.5 rounded-xl border border-amber-200 transition-colors">
                                                            {certLoading ? <Loader2 size={11} className="animate-spin" /> : <Award size={11} />} شهادة
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            {Math.max(0, (10 - parseFloat(s.academic_hours)).toFixed(1))}h متبقية
                                                        </span>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {students.length === 0 && (
                                            <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                                                <Users size={40} className="mx-auto mb-3 opacity-30" />
                                                <p>لا يوجد طلاب. أضف طلابك عبر رقمهم الجامعي</p>
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: Students ────────────────────────────────────── */}
                {activeTab === 'students' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black text-slate-800">إدارة سجل الطلاب</h3>
                            <div className="relative w-80">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input className="input-field pl-10 py-2.5 text-sm" placeholder="ابحث باسم الطالب أو رفمه..."
                                    value={search} onChange={e => { setSearch(e.target.value); searchStudents(e.target.value); }} />
                            </div>
                        </div>
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead><tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-5 py-4 text-slate-600 text-sm">الطالب</th>
                                        <th className="px-5 py-4 text-slate-600 text-sm">الرقم الجامعي</th>
                                        <th className="px-5 py-4 text-slate-600 text-sm">التخصص</th>
                                        <th className="px-5 py-4 text-slate-600 text-sm font-bold">الحالة</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map(s => (
                                            <tr key={s.link_id} className="hover:bg-slate-50">
                                                <td className="px-5 py-4 font-bold text-sm text-slate-800">{s.name}</td>
                                                <td className="px-5 py-4 text-sm text-slate-600">{s.student_id}</td>
                                                <td className="px-5 py-4 text-sm text-slate-500">{s.major || '—'}</td>
                                                <td className="px-5 py-4 text-xs">
                                                    <span className={`px-3 py-1 rounded-full font-bold ${s.user_id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {s.user_id ? 'حساب نشط' : 'غير مسجل'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: Training (Field Internship) ───────────────────── */}
                {activeTab === 'training' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 font-cairo">
                                    <Target className="text-brand-600" size={24} /> اعتماد جلسات التدريب الميداني
                                </h3>
                                <p className="text-sm text-slate-500 font-bold mt-1">الجلسات القادمة من نظام التتبع الجغرافي (GPS) والمحتاجة لاعتماد رسمي.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleExportReport} className="btn-primary bg-slate-900 border-none text-sm py-2 px-6 flex items-center gap-2">
                                    <BadgeCheck size={16} className="text-emerald-400" /> تصدير تقرير (Excel)
                                </button>
                                <button onClick={fetchTrainingSessions} className="btn-primary text-sm py-2 px-6 flex items-center gap-2">
                                    {trainingLoading && <Loader2 size={16} className="animate-spin" />}
                                    تحديث القائمة
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                {trainingLoading ? (
                                    <div className="h-48 card flex items-center justify-center">
                                        <Loader2 size={32} className="text-brand-200 animate-spin" />
                                    </div>
                                ) : trainingSessions.length === 0 ? (
                                    <div className="card p-12 text-center text-slate-400 font-bold">
                                        <CheckCircle size={48} className="mx-auto mb-4 opacity-10" />
                                        لا توجد جلسات معلقة حالياً.
                                    </div>
                                ) : (
                                    trainingSessions.map((s, i) => (
                                        <motion.div key={s.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 group hover:border-brand-200 transition-all">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-black text-slate-900">{s.student_name}</span>
                                                    <span className="text-xs font-bold text-slate-400">· {s.student_id || '—'}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 font-bold truncate">{s.offer_title} · {s.company_name || 'شركة'}</p>
                                                <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-bold">
                                                    <div className="flex items-center gap-1.5 text-brand-700">
                                                        <Clock size={14} /> <span dir="ltr">{s.computed_hours}h</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 ${Number(s.geo_verified) === 1 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        <MapPin size={14} /> {Number(s.geo_verified) === 1 ? 'تحقق مكاني: نعم' : 'خارج النطاق'}
                                                    </div>
                                                    <div className="text-slate-400">دخول: {new Date(s.check_in_at).toLocaleTimeString('ar-EG')}</div>
                                                    {s.check_out_at && <div className="text-slate-400">خروج: {new Date(s.check_out_at).toLocaleTimeString('ar-EG')}</div>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => approveSession(s.id)}
                                                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all font-cairo"
                                            >
                                                <CheckCircle size={16} /> اعتماد
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="card p-6 space-y-4 sticky top-24">
                                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 font-cairo">
                                        < BookOpen size={16} className="text-brand-600" /> التوقيع والملاحظات
                                    </h4>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5">رابط التوقيع الرقمي (اختياري)</label>
                                        <input value={signatureUrl} onChange={(e) => setSignatureUrl(e.target.value)}
                                            className="input-field text-sm" placeholder="https://..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5">ملاحظات المشرف</label>
                                        <textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)}
                                            rows={4} className="input-field text-sm" placeholder="اكتب ملاحظات حول الجلسة..." />
                                    </div>
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed flex gap-2">
                                            <AlertCircle size={14} className="flex-shrink-0" />
                                            سيتم حفظ هذه البيانات مع الجلسة بمجرد ضغط زر "اعتماد". يمكنك تغييرها لكل جلسة.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB: Verify Attendance ──────────────────────────────── */}
                {activeTab === 'verify' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="card p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
                                    <Shield size={22} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-800 text-xl font-cairo">التحقق من الحضور</h2>
                                    <p className="text-slate-500 text-sm">أدخل رمز التحقق ورقم الطالب لاعتماد الساعات</p>
                                </div>
                            </div>

                            <form onSubmit={handleVerify} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                                        <QrCode size={14} className="text-brand-600" /> رمز التحقق (من الفعالية)
                                    </label>
                                    <input className="input-field font-mono uppercase tracking-widest text-center text-lg"
                                        placeholder="مثال: A1B2C3D4"
                                        value={verifyCode} onChange={e => setVerifyCode(e.target.value.toUpperCase())} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                                        <BookOpen size={14} className="text-brand-600" /> الرقم الجامعي للطالب
                                    </label>
                                    <input className="input-field" placeholder="مثال: 202312345"
                                        value={verifyStudentId} onChange={e => setVerifyStudentId(e.target.value)} required />
                                </div>
                                <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={verifyLoading}
                                    className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 font-cairo">
                                    {verifyLoading ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={17} /> تأكيد اعتماد الساعات</>}
                                </motion.button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── TAB: Certificates ───────────────────────────────────── */}
                {activeTab === 'certs' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="card p-6">
                            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 font-cairo">
                                <Award size={18} className="text-amber-500" /> إصدار الشهادات
                            </h3>
                            <div className="relative mb-4">
                                <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                                <input value={certSearch} onChange={e => setCertSearch(e.target.value)}
                                    className="input-field pr-9 text-sm py-2" placeholder="ابحث عن طالب باسمه أو رقمه..." />
                            </div>

                            <div className="space-y-3">
                                {students
                                    .filter(s => !certSearch || s.name?.includes(certSearch) || s.student_id?.includes(certSearch))
                                    .map((s, i) => (
                                        <motion.div key={s.link_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {s.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{s.name || '—'}</p>
                                                <p className="text-xs text-slate-400">{s.student_id} {s.major && `· ${s.major}`}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black text-violet-700 text-sm" dir="ltr">{s.academic_hours}h</p>
                                                <div className="text-xs text-slate-400">أكاديمي</div>
                                            </div>
                                            {s.certificate_eligible ? (
                                                <button onClick={() => handleGetCertificate(s)}
                                                    disabled={certLoading}
                                                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors font-cairo">
                                                    {certLoading ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />} إصدار
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">
                                                    يحتاج {Math.max(0, (10 - parseFloat(s.academic_hours)).toFixed(1))}h
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showAddStudent && <AddStudentModal onClose={() => setShowAddStudent(false)} onSuccess={loadDashboard} />}
                {certData && certStudent && <CertificateModal cert={certData} onClose={() => { setCertData(null); setCertStudent(null); }} />}
            </AnimatePresence>
        </div>
    );
}
