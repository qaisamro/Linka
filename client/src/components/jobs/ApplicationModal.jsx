import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, BookOpen, GraduationCap, FileText, Loader2, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { jobsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function ApplicationModal({ isOpen, onClose, job, onApplySuccess }) {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
        university: '',
        student_id: '',
        coverLetter: ''
    });

    useEffect(() => {
        if (user && isOpen) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                university: user.university || '',
                student_id: user.student_id || '',
                coverLetter: ''
            }));
        }
    }, [user, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await jobsAPI.apply(job.id, {
                profileData: formData,
                coverLetter: formData.coverLetter
            });
            toast.success(res.data.message || 'تم التقديم للفرصة بنجاح');
            onApplySuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'حدث خطأ أثناء التقديم');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && job && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#344F1F]/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#F9F5F0] rounded-3xl p-6 md:p-8 w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto"
                    >
                        <button onClick={onClose} className="absolute top-6 left-6 text-gray-400 hover:text-[#F4991A] p-2 hover:bg-[#F2EAD3] rounded-full transition-colors">
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black text-[#344F1F] mb-6 flex items-center gap-3">
                            <Target className="text-[#F4991A]" />
                            طلب تقديم لفرصة: {job.title}
                        </h2>

                        <div className="bg-[#white] border-2 border-[#F2EAD3] rounded-2xl p-4 mb-6">
                            <p className="text-sm text-[#344F1F] opacity-80 mb-2">جهة العمل: {job.organization}</p>
                            <p className="text-xs text-[#F4991A] font-medium p-2 bg-[#F2EAD3] rounded-lg inline-block">
                                قم بمراجعة معلوماتك قبل التقديم. سيتم إرسال هذه النسخة إلى جهة العمل.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-[#344F1F] mb-1">الاسم الكامل</label>
                                    <div className="relative">
                                        <User size={18} className="absolute right-3 top-3.5 text-gray-400" />
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white border-2 border-[#F2EAD3] rounded-xl py-3 pr-10 pl-4 focus:ring-0 focus:border-[#F4991A] transition-all outline-none text-[#344F1F] font-medium" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#344F1F] mb-1">البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute right-3 top-3.5 text-gray-400" />
                                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white border-2 border-[#F2EAD3] rounded-xl py-3 pr-10 pl-4 focus:ring-0 focus:border-[#F4991A] transition-all outline-none text-[#344F1F] font-medium" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#344F1F] mb-1">رقم الهاتف</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute right-3 top-3.5 text-gray-400" />
                                        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-white border-2 border-[#F2EAD3] rounded-xl py-3 pr-10 pl-4 focus:ring-0 focus:border-[#F4991A] transition-all outline-none text-[#344F1F] font-medium" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#344F1F] mb-1">الجامعة (إن وجد)</label>
                                    <div className="relative">
                                        <GraduationCap size={18} className="absolute right-3 top-3.5 text-gray-400" />
                                        <input type="text" value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })}
                                            className="w-full bg-white border-2 border-[#F2EAD3] rounded-xl py-3 pr-10 pl-4 focus:ring-0 focus:border-[#F4991A] transition-all outline-none text-[#344F1F] font-medium" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#344F1F] mb-1">نبذة عنك (Bio)</label>
                                <div className="relative">
                                    <BookOpen size={18} className="absolute right-3 top-3.5 text-gray-400" />
                                    <textarea rows="2" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-white border-2 border-[#F2EAD3] rounded-xl py-3 pr-10 pl-4 focus:ring-0 focus:border-[#F4991A] transition-all outline-none text-[#344F1F] font-medium resize-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#344F1F] mb-1">رسالة التقديم (Cover Letter)</label>
                                <div className="relative">
                                    <FileText size={18} className="absolute right-3 top-3.5 text-gray-400" />
                                    <textarea rows="4" required placeholder="اكتب نبذة عن سبب تقديمك وخبراتك التي تؤهلك لهذه الفرصة..." value={formData.coverLetter} onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                                        className="w-full bg-white border-2 border-[#F2EAD3] rounded-xl py-3 pr-10 pl-4 focus:ring-0 focus:border-[#F4991A] transition-all outline-none text-[#344F1F] font-medium resize-none" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={onClose} disabled={submitting}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                    إلغاء
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-8 py-3 bg-[#344F1F] text-[#F9F5F0] rounded-xl font-black shadow-lg shadow-[#344F1F]/20 hover:shadow-xl hover:-translate-y-0.5 hover:bg-[#F4991A] hover:text-[#344F1F] transition-all flex items-center gap-2">
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Target size={18} />}
                                    تأكيد التقديم
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
