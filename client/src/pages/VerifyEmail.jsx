import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const email = location.state?.email || '';

    useEffect(() => {
        if (!email) {
            toast.error('البريد الإلكتروني مفقود');
            navigate('/login');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (code.length < 6) return toast.error('يرجى إدخال كود التحقق كاملاً');

        setLoading(true);
        try {
            const res = await authAPI.verifyOTP({ email, code });
            toast.success('تم تفعيل الحساب بنجاح!');

            // Auto login after verification
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            window.location.href = '/'; // Refresh to load state
        } catch (err) {
            toast.error(err.response?.data?.error || 'كود غير صحيح');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F5F0] flex items-center justify-center p-4 pt-24 sm:pt-32 pb-12 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-200/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F4991A]/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[500px] relative z-10"
            >
                <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F4991A]/10 rounded-3xl mb-8 relative">
                        <ShieldCheck className="w-10 h-10 text-[#F4991A]" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-[#F4991A] rounded-full border-2 border-white"
                        />
                    </div>

                    <h1 className="text-3xl font-black text-[#344F1F] mb-3" style={{ fontFamily: 'Cairo' }}>
                        تفعيل الحساب
                    </h1>
                    <p className="text-[#344F1F]/60 text-lg mb-10 leading-relaxed">
                        تم إرسال كود التحقق إلى <br />
                        <span className="font-bold text-[#344F1F]">{email}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="relative group">
                            <input
                                type="text"
                                maxLength="6"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full bg-white/50 border-2 border-brand-200/30 rounded-2xl px-6 py-5 text-center text-4xl tracking-[1em] font-black text-[#344F1F] placeholder:text-brand-200/50 outline-none transition-all duration-300 focus:border-[#F4991A] focus:bg-white focus:shadow-[0_0_20px_rgba(244,153,26,0.1)]"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length < 6}
                            className="w-full bg-[#344F1F] text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all duration-300 hover:bg-[#2A3F19] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>تأكيد الكود</span>
                                    <ArrowRight className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-brand-200/20">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[#344F1F]/60 hover:text-[#F4991A] font-bold transition-colors"
                        >
                            تغيير البريد الإلكتروني أو تسجيل الدخول
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
