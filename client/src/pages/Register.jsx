import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, GraduationCap, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { neighborhoodsAPI, universityAPI } from '../api';
import toast from 'react-hot-toast';

const STEPS_INFO = [
  { icon: '🗺️', title: 'انضم لمجتمعك', desc: 'كن جزءاً من مجتمع Linka النشط' },
  { icon: '🎯', title: 'شارك في الفعاليات', desc: 'اختر من عشرات الفعاليات التطوعية' },
  { icon: '🏆', title: 'اكسب نقاطاً وشارات', desc: 'تنافس على لوحة المتصدرين' },
  { icon: '🎓', title: 'احصل على شهادة', desc: 'ساعات تطوع خارجي معترف بها أكاديمياً' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', neighborhood_id: '',
    is_university_student: false, university: '', university_id: '', student_id: ''
  });

  useEffect(() => {
    Promise.all([
      neighborhoodsAPI.getAll(),
      universityAPI.getUniversities(),
    ]).then(([nRes, uRes]) => {
      setNeighborhoods(nRes.data.neighborhoods || []);
      setUniversities(uRes.data.universities || []);
    }).catch(() => { });
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('كلمة المرور 6 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`مرحباً ${user.name}! انضممت لمجتمع Linka 🎉`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel: Branding ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand-900 animated-gradient dot-pattern relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="hero-glow-orb w-80 h-80 top-1/4 -left-20 bg-blue-400/20" style={{ animationDuration: '7s' }} />
        <div className="hero-glow-orb w-64 h-64 bottom-1/4 -right-10 bg-emerald-400/15" style={{ animationDuration: '9s' }} />

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-white"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 bg-white/15 backdrop-blur-sm border border-white/25 rounded-3xl flex items-center justify-center mb-8 text-4xl shadow-2xl"
          >
            🌱
          </motion.div>

          <h1 className="text-3xl font-black mb-2">انضم لمجتمع Linka</h1>
          <p className="text-white text-base mb-10 leading-relaxed font-medium">
            أنشئ حسابك في ثوانٍ وابدأ تأثيرك الإيجابي في المجتمع
          </p>

          <div className="space-y-4">
            {STEPS_INFO.map(({ icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-bold text-sm text-white">{title}</p>
                  <p className="text-white/90 text-xs font-medium">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel: Form ────────────────────────────── */}
      <div className="w-full lg:w-7/12 flex items-start justify-center bg-premium-mesh p-6 sm:p-12 pt-32 lg:pt-24 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-hero-gradient rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl text-3xl">🌱</div>
            <h1 className="text-2xl font-black text-slate-800">انضم لمجتمع Linka</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-800">إنشاء حساب جديد 🚀</h2>
              <p className="text-slate-500 mt-1">أنشئ حسابك وابدأ رحلتك التطوعية اليوم</p>
            </div>

            <div className="bg-white rounded-3xl shadow-card p-8">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل *</label>
                  <div className="relative">
                    <User size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
                    <input type="text" name="name" value={form.name} onChange={handleChange}
                      className="input-field pr-10" placeholder="أحمد محمد" required />
                  </div>
                </div>

                {/* Email + Phone row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
                      <input type="email" name="email" value={form.email} onChange={handleChange}
                        className="input-field pr-10" placeholder="your@email.com" required
                        style={{ direction: 'ltr', textAlign: 'right' }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label>
                    <div className="relative">
                      <Phone size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                        className="input-field pr-10" placeholder="059xxxxxxx" />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
                    <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                      className="input-field pr-10 pl-10" placeholder="6 أحرف على الأقل" required
                      style={{ direction: 'ltr', textAlign: 'right' }} />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute top-1/2 -translate-y-1/2 left-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Neighborhood */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الحي السكني</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400 pointer-events-none" />
                    <select name="neighborhood_id" value={form.neighborhood_id} onChange={handleChange}
                      className="input-field pr-10 appearance-none">
                      <option value="">اختر حيّك (اختياري)</option>
                      {neighborhoods.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* University Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-50 to-emerald-50 rounded-2xl border border-brand-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
                      <GraduationCap size={16} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">طالب جامعي؟</p>
                      <p className="text-xs text-slate-500">احصل على ساعات تطوع خارجي</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="is_university_student" checked={form.is_university_student} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {/* University fields (conditional) */}
                <AnimatePresence>
                  {form.is_university_student && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden grid sm:grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم الجامعة</label>
                        <div className="relative">
                          <GraduationCap size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400 pointer-events-none" />
                          <select name="university_id" value={form.university_id} onChange={(e) => {
                            const id = e.target.value;
                            const name = universities.find(u => String(u.id) === String(id))?.name || '';
                            setForm(p => ({ ...p, university_id: id, university: name }));
                          }}
                            className="input-field pr-10 appearance-none" required={form.is_university_student}>
                            <option value="">اختر جامعتك</option>
                            {universities.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">الرقم الجامعي</label>
                        <div className="relative">
                          <User size={16} className="absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
                          <input type="text" name="student_id" value={form.student_id} onChange={handleChange}
                            className="input-field pr-10" placeholder="202xxxxx" required={form.is_university_student} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="btn-green w-full py-3.5 text-base rounded-2xl mt-2"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <><Zap size={18} /> إنشاء الحساب مجاناً</>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm">
                  لديك حساب؟{' '}
                  <Link to="/login" className="text-brand-700 font-bold hover:underline">تسجيل الدخول</Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
