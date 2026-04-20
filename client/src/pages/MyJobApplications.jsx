import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Search, Clock, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    'pending': 'bg-[#F4991A]/10 text-[#F4991A] border border-[#F4991A]/20',
    'reviewed': 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    'contacted': 'bg-[#344F1F]/10 text-[#344F1F] border border-[#344F1F]/20',
    'accepted': 'bg-green-500/10 text-green-600 border border-green-500/20',
    'rejected': 'bg-red-500/10 text-red-600 border border-red-500/20',
};

const STATUS_LABELS = {
    'pending': 'قيد المراجعة',
    'reviewed': 'تم عرض الملف',
    'contacted': 'تم التواصل',
    'accepted': 'مقبول ✅',
    'rejected': 'مرفوض ❌',
};

export default function MyJobApplications() {
    const { isAuth, user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuth && user?.role === 'youth') {
            loadApplications();
        }
    }, [isAuth, user]);

    const loadApplications = async () => {
        try {
            const res = await jobsAPI.getMyApplications();
            setApplications(res.data.applications || []);
        } catch {
            toast.error('خطأ في جلب طلبات العمل الخاصة بك');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-[#F9F5F0]">
            <div className="flex flex-col items-center gap-3">
                <Target size={48} className="text-[#F4991A] animate-pulse" />
                <p className="font-semibold text-[#344F1F]">جاري تحميل طلباتك...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F5F0] pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-3 mb-8">
                    <Target size={32} className="text-[#F4991A]" />
                    <h1 className="text-3xl font-black text-[#344F1F]">متابعة طلبات التوظيف</h1>
                </div>

                {applications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-[#F2EAD3]">
                        <Search className="mx-auto h-16 w-16 text-[#F2EAD3] mb-4" />
                        <h3 className="text-xl font-bold text-[#344F1F] mb-2">لم تقم بالتقديم لأي فرصة بعد</h3>
                        <p className="text-[#344F1F]/70">تصفح صفحة الفرص وابدأ مسيرتك المهنية الآن!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app, index) => (
                            <motion.div
                                key={app.application_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white p-5 rounded-2xl border-2 border-[#F2EAD3] hover:border-[#F4991A] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-[#344F1F]">{app.title}</h3>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[app.application_status] || STATUS_COLORS['pending']}`}>
                                            {STATUS_LABELS[app.application_status] || 'قيد المراجعة'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold text-[#344F1F]/80 mb-1">{app.organization}</p>
                                    <div className="flex gap-4 text-xs font-semibold text-gray-500">
                                        <span className="flex items-center gap-1"><Clock size={14} /> قدمت يوم {new Date(app.applied_at).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {app.contact_email && (
                                        <a
                                            href={`mailto:${app.contact_email}`}
                                            className="px-4 py-2 rounded-xl bg-[#344F1F]/5 text-[#344F1F] text-xs font-black border border-[#344F1F]/10 flex items-center gap-2 hover:bg-[#344F1F] hover:text-white transition-all"
                                        >
                                            <Mail size={14} /> تواصل مع الشركة
                                        </a>
                                    )}
                                    <div className="w-10 h-10 rounded-full bg-[#F9F5F0] border-2 border-[#F2EAD3] flex items-center justify-center text-[#F4991A]">
                                        <Target size={18} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
