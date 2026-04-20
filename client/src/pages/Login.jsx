import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Shield, Users, Star, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`مرحباً ${user.name}! 👋`);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'super_admin') navigate('/super-admin');
      else if (user.role === 'university' || (user.role === 'entity' && user.entity_type === 'university')) navigate('/university-portal');
      else if (user.role === 'entity' && user.entity_type === 'company') navigate('/company-portal');
      else if (user.role === 'entity') navigate('/entity-portal');
      else navigate('/');
    } catch (err) {
      if (err.response?.data?.mustVerify) {
        toast.error(err.response?.data?.error || 'يرجى تفعيل البريد الإلكتروني');
        navigate('/verify-email', { state: { email: err.response.data.email } });
      } else {
        toast.error(err.response?.data?.error || 'خطأ في تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'شاب مسجّل', val: '1,200+', color: '#F4991A' },
    { label: 'فعالية منجزة', val: '85+', color: '#F4991A' },
    { label: 'ساعة تطوعية', val: '15.4k', color: '#F4991A' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F9F5F0] font-cairo selection:bg-[#344F1F]/10 overflow-x-hidden pt-20">

      {/* ── Branding Panel (Desktop Only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#344F1F] relative overflow-hidden flex-col justify-between p-16">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#F4991A]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        </div>

        {/* Top: Logo & Platform Identity */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full"
        >
          <div className="max-w-2xl">
            <h2 className="text-white text-3xl xl:text-5xl font-black leading-[1.2] mb-6">بوابتك الرقمية نحو <span className="text-[#F4991A]">التأثير المجتمعي</span></h2>
            <p className="text-white/70 text-base xl:text-lg font-medium leading-relaxed">سجل دخولك الآن لتصل إلى مئات الفرص التطوعية والفعاليات الحصرية في فلسطين.</p>
          </div>
        </motion.div>

        {/* Bottom: Glassmorphism Stats */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group"
              >
                <div className="text-white text-2xl font-black mb-1 group-hover:scale-110 transition-transform origin-right">{s.val}</div>
                <div className="text-white/50 text-[11px] font-bold uppercase tracking-widest leading-none">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-3">
            <div className="flex -space-x-3 space-x-reverse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#344F1F] bg-slate-300" />
              ))}
            </div>
            <p className="text-white/40 text-[11px] font-bold">انضم لأكثر من ١٢٠٠ شاب فلسطيني ملهم</p>
          </div>
        </div>
      </div>

      {/* ── Form Panel (Mobile + Desktop) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-20 relative bg-[#F9F5F0]">
        {/* Navigation back for mobile */}
        <div className="lg:hidden w-full flex justify-between items-center mb-12">
          <Link to="/" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#344F1F] shadow-sm border border-[#F2EAD3]">
            <ArrowLeft size={18} />
          </Link>
        </div>

        <div className="w-full max-w-[580px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <header className="mb-10 text-center lg:text-right">
              <h2 className="text-4xl font-black text-[#344F1F] mb-3">سجل دخولك 👋</h2>
              <p className="text-[#344F1F]/50 text-lg font-medium">سعداء برؤيتك مرة أخرى في مجتمعنا</p>
            </header>

            <div className="bg-white shadow-[0_40px_80px_-15px_rgba(52,79,31,0.08)] rounded-[2.5rem] p-8 lg:p-12 border border-[#F2EAD3]/40">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#F4991A] uppercase tracking-widest mr-1">البريد الإلكتروني</label>
                  <div className="group relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#344F1F]/40 group-focus-within:text-[#F4991A] transition-colors">
                      <Mail size={19} />
                    </div>
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange}
                      className="w-full bg-[#F9F5F0] border-2 border-[#F9F5F0] focus:border-[#F4991A] focus:bg-white rounded-2xl py-4 pr-12 pl-4 text-[#344F1F] font-bold outline-none transition-all placeholder-[#344F1F]/20"
                      placeholder="name@example.com" required style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black text-[#F4991A] uppercase tracking-widest">كلمة المرور</label>
                    <Link to="/forgot-password" size="sm" className="text-[10px] text-[#344F1F]/40 hover:text-[#F4991A] font-black transition-colors">نسيت كلمة المرور؟</Link>
                  </div>
                  <div className="group relative">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#344F1F]/40 group-focus-within:text-[#F4991A] transition-colors">
                      <Lock size={19} />
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                      className="w-full bg-[#F9F5F0] border-2 border-[#F9F5F0] focus:border-[#F4991A] focus:bg-white rounded-2xl py-4 pr-12 pl-14 text-[#344F1F] font-bold outline-none transition-all placeholder-[#344F1F]/20"
                      placeholder="••••••••" required style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#344F1F]/30 hover:text-[#344F1F] transition-colors p-1">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#344F1F] text-[#F9F5F0] font-black text-lg py-5 rounded-2xl shadow-2xl shadow-[#344F1F]/20 hover:bg-[#2a4019] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Zap size={20} className="text-[#F4991A]" /> تسجيل الدخول</>
                  )}
                </button>
              </form>

              <div className="mt-12 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#F2EAD3]"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white px-4 text-[#344F1F]/30 tracking-[0.3em]">أو انضم إلينا</span></div>
                </div>

                <p className="text-[#344F1F]/60 font-bold text-sm">
                  ليس لديك حساب حتى الآن؟{' '}
                  <Link to="/register" className="text-[#344F1F] underline decoration-[#F4991A] decoration-2 underline-offset-8 hover:text-[#F4991A] transition-colors ml-1">ابدأ رحلتك معنا</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}

