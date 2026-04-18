import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Shield, Users, Star, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATS = [
  { icon: Users, value: '1,200+', label: 'شاب مسجّل' },
  { icon: Star, value: '85+', label: 'فعالية منجزة' },
  { icon: Shield, value: '100%', label: 'آمن وموثوق' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('youth'); // 'youth' | 'university'

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
      toast.error(err.response?.data?.error || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-[#F9F5F0]">
      {/* ── Left Panel: Branding & Stats ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#344F1F] animated-gradient-rich relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-[#344F1F]/40 pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        <div className="hero-glow-orb w-[400px] h-[400px] -top-20 -right-20 bg-[#F4991A]/20" />
        <div className="hero-glow-orb w-[300px] h-[300px] bottom-0 -left-20 bg-[#344F1F]/20" style={{ animationDelay: '1s' }} />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-[#F9F5F0] rounded-[2rem] p-4 shadow-2xl mx-auto mb-8 border-4 border-white/10"
          >
            <img src="/favicon.png" alt="Linka" className="w-full h-full object-contain" />
          </motion.div>

          <h1 className="text-3xl font-black text-[#F9F5F0] mb-3 drop-shadow-lg">أهلاً بك في Linka</h1>
          <p className="text-[#F9F5F0]/80 text-base font-bold mb-10 italic">المنصة التفاعلية والفرص التطوعية في مكان واحد</p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'شاب مسجّل', val: '1,200+', color: 'bg-[#F4991A]' },
              { label: 'فعالية منجزة', val: '85+', color: 'bg-white/10' },
              { label: 'آمن وموثوق', val: '100%', color: 'bg-white/10' },
              { label: 'شريك مجتمعي', val: '30+', color: 'bg-white/10' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className={`${stat.color} backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all group`}
              >
                <p className="text-[#F9F5F0] text-xl font-black group-hover:scale-110 transition-transform">{stat.val}</p>
                <p className="text-[#F9F5F0]/70 text-[10px] font-bold mt-1 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel: Login Form ──────────────────────────────── */}
      <div className="w-full lg:w-[55%] flex items-center justify-center bg-premium-mesh p-6 sm:p-12 overflow-hidden">
        <div className="w-full max-w-md pt-20 lg:pt-0">
          {/* Mobile-only Branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-[#344F1F] rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl border-4 border-[#F2EAD3]">
              <img src="/favicon.png" alt="Linka" className="w-12 h-12 object-contain invert" />
            </div>
            <h1 className="text-3xl font-black text-[#344F1F] mb-1">Linka</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <header className="mb-6 lg:mb-8">
              <h2 className="text-3xl font-black text-[#344F1F]">تسجيل الدخول 👋</h2>
              <p className="text-[#344F1F]/60 text-lg font-medium mt-1">سعداء برؤيتك مرة أخرى!</p>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(52,79,31,0.12)] p-8 lg:p-10 border border-[#F2EAD3]/50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#344F1F] px-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange}
                      className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-2xl py-3.5 pr-12 pl-4 text-[#344F1F] font-bold outline-none transition-all placeholder-[#344F1F]/30"
                      placeholder="name@example.com" required style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-bold text-[#344F1F]">كلمة المرور</label>
                    <Link to="/forgot-password" title="استعادة كلمة المرور" className="text-xs text-[#F4991A] font-black hover:underline">نسيت الكلمة؟</Link>
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                    <input
                      type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                      className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-2xl py-3.5 pr-12 pl-12 text-[#344F1F] font-bold outline-none transition-all placeholder-[#344F1F]/30"
                      placeholder="كلمة المرور الخاصة بك" required style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F4991A] hover:text-[#344F1F] p-1">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#344F1F] text-[#F9F5F0] font-black text-lg py-4 rounded-2xl shadow-xl shadow-[#344F1F]/20 hover:bg-[#2a4019] transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-[#F9F5F0]/20 border-t-[#F9F5F0] rounded-full animate-spin" />
                  ) : (
                    <><Zap size={20} /> دخول آمن</>
                  )}
                </motion.button>
              </form>
              <div className="mt-8 pt-6 border-t border-[#F2EAD3]/50 text-center text-[#344F1F]/60 font-bold">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-[#F4991A] hover:underline decoration-2 underline-offset-4">ابدأ الآن مجاناً</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
