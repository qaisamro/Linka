import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Shield, Users, Star } from 'lucide-react';
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
    <div className="min-h-screen flex">

      {/* ── Left Panel: Branding ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 animated-gradient dot-pattern relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        {/* Orbs */}
        <div className="hero-glow-orb w-80 h-80 top-1/4 -left-20 bg-blue-400/20" style={{ animationDuration: '7s' }} />
        <div className="hero-glow-orb w-64 h-64 bottom-1/4 -right-10 bg-emerald-400/15" style={{ animationDuration: '9s', animationDelay: '2s' }} />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center text-white"
        >
          {/* Logo */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-24 h-24 bg-white/15 backdrop-blur-sm border border-white/25 rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl shadow-2xl"
          >
            🗺️
          </motion.div>

          <h1 className="text-4xl font-black mb-3">Linka</h1>
          <p className="text-white text-lg max-w-sm mx-auto leading-relaxed mb-12 drop-shadow-sm font-medium">
            أهلاً بك في Linka. المنصة التفاعلية والفرص التطوعية في مكان واحد.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {STATS.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
              >
                <Icon size={20} className="text-emerald-300 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-white/90 text-[11px] mt-0.5 font-bold">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel: Form ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-start justify-center bg-premium-mesh p-6 sm:p-12 pt-32 lg:pt-24 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-hero-gradient rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/30 text-3xl">🗺️</div>
            <h1 className="text-2xl font-black text-slate-800">Linka</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              {/* Login type toggle */}
              <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setLoginType('youth')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${loginType === 'youth' ? 'bg-white shadow-md text-brand-700' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                  👤 شباب
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('university')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${loginType === 'university' ? 'bg-white shadow-md text-violet-700' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                  🏢 جهة / جامعة
                </button>
              </div>
              <h2 className="text-3xl font-black text-slate-800">
                {loginType === 'university' ? 'بوابة الجهات 🏛️' : 'أهلاً بك مجدداً 👋'}
              </h2>
              <p className="text-slate-500 mt-1.5">
                {loginType === 'university' ? 'سجّل دخول جهتك (جامعة/شركة/بلدية)' : 'سجّل دخولك لمتابعة رحلتك التطوعية'}
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-card p-8 space-y-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
                    <input
                      type="email" name="email"
                      value={form.email} onChange={handleChange}
                      className="input-field pr-10" placeholder="your@email.com"
                      required style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'} name="password"
                      value={form.password} onChange={handleChange}
                      className="input-field pr-10 pl-10" placeholder="••••••••"
                      required style={{ direction: 'ltr', textAlign: 'right' }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute top-1/2 -translate-y-1/2 left-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-3.5 text-base rounded-2xl"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <><LogIn size={18} /> تسجيل الدخول</>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="pt-5 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm">
                  ليس لديك حساب؟{' '}
                  <Link to="/register" className="text-brand-700 font-bold hover:underline">
                    انضم الآن مجاناً
                  </Link>
                </p>
              </div>

              {/* Demo hint */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
                <p className="text-amber-700 text-xs font-semibold">
                  {loginType === 'university'
                    ? '🏛️ جهة: hu@hebron.ps / uni123'
                    : '👤 سوبر أدمن: super@hebron.ps / super123'}
                </p>
              </div>

              {loginType === 'university' && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 leading-relaxed text-center">
                    للحصول على حساب جهة (جامعة، شركة، بلدية)، يرجى التواصل مع إدارة المنصة.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
