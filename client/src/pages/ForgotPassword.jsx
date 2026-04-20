import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, Key, ArrowRight, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: Code & New Pass
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('يرجى إدخال البريد الإلكتروني');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل إرسال الرمز');
            toast.success(data.message);
            setStep(2);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!code || !newPassword) return toast.error('يرجى تعبئة جميع الحقول');
        if (newPassword.length < 6) return toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل إعادة التعيين');
            toast.success(data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F5F0] flex items-center justify-center p-4 py-20 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="hero-glow-orb w-96 h-96 -top-20 -right-20 bg-[#F4991A]/10" />
            <div className="hero-glow-orb w-80 h-80 -bottom-20 -left-20 bg-[#344F1F]/10" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Branding */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-block group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-16 h-16 bg-[#344F1F] rounded-2xl p-3 shadow-xl border-2 border-white mx-auto mb-4"
                        >
                            <img src="/favicon.jpeg" alt="Linka" className="w-full h-full object-contain rounded-lg" />
                        </motion.div>
                    </Link>
                    <h1 className="text-3xl font-black text-[#344F1F]">إعادة تعيين <span className="text-[#F4991A]">كلمة المرور</span></h1>
                    <p className="text-[#344F1F]/60 font-bold mt-2">استعد الوصول إلى حسابك في ثوانٍ</p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(52,79,31,0.12)] p-8 lg:p-10 border border-[#F2EAD3]/50">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center gap-3 mb-6 bg-[#F9F5F0] p-4 rounded-2xl border border-[#F2EAD3]">
                                    <div className="w-10 h-10 rounded-xl bg-[#F4991A]/20 flex items-center justify-center flex-shrink-0">
                                        <Mail size={20} className="text-[#F4991A]" />
                                    </div>
                                    <p className="text-xs font-bold text-[#344F1F]">أدخل بريدك الإلكتروني المسجّل لنرسل لك رمز التحقق.</p>
                                </div>

                                <form onSubmit={handleSendCode} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#344F1F] px-1">البريد الإلكتروني</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="name@example.com"
                                                className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-2xl py-3.5 pr-12 pl-4 text-[#344F1F] font-bold outline-none transition-all"
                                                required
                                                style={{ direction: 'ltr', textAlign: 'right' }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-primary py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>إرسال الرمز <Zap size={20} /></>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center gap-3 mb-6 bg-[#E8F5E9] p-4 rounded-2xl border border-emerald-100">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <ShieldCheck size={20} className="text-emerald-600" />
                                    </div>
                                    <p className="text-xs font-bold text-emerald-800">تم إرسال الرمز إلى <strong>{email}</strong>. يرجى التحقق من بريدك.</p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#344F1F] px-1">رمز التحقق (6 أرقام)</label>
                                        <div className="relative">
                                            <Key size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                                            <input
                                                type="text"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="000000"
                                                className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-2xl py-3.5 pr-12 pl-4 text-[#344F1F] font-black text-center tracking-[0.5em] outline-none transition-all"
                                                required
                                                style={{ direction: 'ltr' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[#344F1F] px-1">كلمة المرور الجديدة</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="أدخل كلمة مرور قوية"
                                                className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-2xl py-3.5 pr-12 pl-4 text-[#344F1F] font-bold outline-none transition-all"
                                                required
                                                style={{ direction: 'ltr', textAlign: 'right' }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#344F1F] text-[#F9F5F0] py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-[#2a4019] flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>تحديث كلمة المرور <CheckCircle size={20} /></>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-full text-[#344F1F]/50 font-bold text-sm hover:text-[#344F1F] transition-colors"
                                    >
                                        أريد تغيير البريد الإلكتروني
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-6 border-t border-[#F2EAD3]/50 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-[#F4991A] font-black hover:underline decoration-2 underline-offset-4">
                            <ArrowRight size={16} /> العودة لتسجيل الدخول
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
