import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ArrowRight, Heart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { registrationsAPI } from '../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function MyEvents() {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        regId: null,
        title: '',
        message: ''
    });

    useEffect(() => {
        fetchMyRegistrations();
    }, []);

    const fetchMyRegistrations = async () => {
        setLoading(true);
        try {
            const res = await registrationsAPI.getMyRegistrations();
            setRegistrations(res.data.registrations || []);
        } catch (err) {
            toast.error('خطأ في جلب الفعاليات');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (regId) => {
        setConfirmModal({
            show: true,
            regId,
            title: 'إلغاء التسجيل',
            message: 'هل أنت متأكد من إلغاء التسجيل في هذه الفعالية؟'
        });
    };

    const confirmCancel = async () => {
        try {
            await registrationsAPI.delete(confirmModal.regId);
            toast.success('تم إلغاء التسجيل بنجاح');
            fetchMyRegistrations();
        } catch (err) {
            toast.error('تعذر إلغاء التسجيل');
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-[#F9F5F0]">
            <div className="flex flex-col items-center gap-3 text-[#F4991A]">
                <Loader2 className="animate-spin h-10 w-10" />
                <p className="font-semibold">جاري تحميل فعالياتك...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F9F5F0] pt-40 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-[#344F1F] mb-2 font-display">فعالياتي</h1>
                        <p className="text-[#F4991A] font-bold">تابع جميع الفعاليات التي سجلت بها وحالة حضورك.</p>
                    </div>
                    <Link to="/events" className="btn-primary py-3 px-6 flex items-center gap-2 self-start md:self-auto">
                        اكتشف المزيد <ArrowRight size={18} />
                    </Link>
                </div>

                {registrations.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-16 text-center"
                    >
                        <div className="w-20 h-20 bg-[#F9F5F0] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={40} className="text-[#F4991A]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#344F1F] mb-2">لم تقم بالتسجيل في أي فعالية بعد</h3>
                        <p className="text-[#F4991A] font-bold mb-8">انضم إلى الفعاليات النشطة وابدأ في جمع النقاط!</p>
                        <Link to="/events" className="btn-primary py-3 px-8">استعرض الفعاليات</Link>
                    </motion.div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {registrations.map((reg, i) => (
                                <motion.div
                                    key={reg.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="card group overflow-hidden flex flex-col md:flex-row relative"
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                                        {reg.status === 'attended' ? (
                                            <span className="flex items-center gap-1 bg-[#344F1F] text-[#F9F5F0] text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                                ✅ تم الحضور
                                            </span>
                                        ) : reg.status === 'pending' ? (
                                            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                                ⏳ بانتظار موافقة الجهة
                                            </span>
                                        ) : reg.status === 'cancelled' ? (
                                            <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                                ❌ تم الرفض
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 bg-[#F4991A] text-[#344F1F] text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                                <Heart size={10} fill="currentColor" /> مسجّل
                                            </span>
                                        )}
                                    </div>

                                    {/* Event Image */}
                                    <div className="md:w-64 h-48 md:h-auto overflow-hidden">
                                        <img
                                            src={reg.image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600'}
                                            alt={reg.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-black text-[#344F1F] group-hover:text-[#F4991A] transition-colors">{reg.title}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="flex items-center gap-2 text-sm text-[#F4991A] font-bold">
                                                    <Calendar size={14} />
                                                    {new Date(reg.date).toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#F4991A] font-bold">
                                                    <MapPin size={14} />
                                                    {reg.location_name}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#F4991A] font-bold">
                                                    <Clock size={14} />
                                                    {reg.duration_hours} ساعات تطوع
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#344F1F] font-bold">
                                                    <Users size={14} />
                                                    {reg.neighborhood_name || 'كل الأحياء'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-[#F2EAD3] flex justify-between items-center">
                                            <Link to={`/events/${reg.event_id}`} className="text-[#344F1F] font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                                <ArrowRight size={16} /> عرض التفاصيل
                                            </Link>

                                            {reg.status !== 'attended' && (
                                                <button
                                                    onClick={() => handleCancel(reg.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors"
                                                >
                                                    إلغاء التسجيل
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                <ConfirmModal
                    isOpen={confirmModal.show}
                    onClose={() => setConfirmModal({ ...confirmModal, show: false })}
                    onConfirm={confirmCancel}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText="إلغاء التسجيل"
                    cancelText="رجوع"
                />
            </div>
        </div>
    );
}
