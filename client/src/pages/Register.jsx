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
  const [universities, setUniversities] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', neighborhood: '',
    is_university_student: false, university: '', university_id: '', student_id: ''
  });

  useEffect(() => {
    universityAPI.getUniversities().then((uRes) => {
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
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#F9F5F0] font-vazir overflow-y-auto lg:overflow-hidden">
      {/* ── Left Panel: Branding & Marketing ────────────────────────── */}
      <div className="hidden lg:flex lg:w-[40%] bg-[#344F1F] animated-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#344F1F]/40 pointer-events-none" />
        <div className="absolute inset-0 dot-pattern opacity-10" />

        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="relative z-10 w-full max-w-sm text-center">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 bg-[#F9F5F0] rounded-[1.8rem] p-4 shadow-2xl mx-auto mb-8">
            <img src="/favicon.png" alt="Linka" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-3xl font-black text-[#F9F5F0] mb-4">انضم لمجتمع Linka</h1>
          <p className="text-[#F9F5F0]/80 text-base font-bold mb-10">أنشئ حسابك في ثوانٍ وابدأ تأثيرك الإيجابي في المجتمع</p>

          <div className="space-y-4">
            {STEPS_INFO.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-right backdrop-blur-sm">
                <span className="text-2xl mt-1">{step.icon}</span>
                <div>
                  <h4 className="text-sm font-black text-[#F9F5F0]">{step.title}</h4>
                  <p className="text-xs text-[#F9F5F0]/60 font-medium mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel: Registration Form ──────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-10 lg:py-4">
        <div className="w-full max-w-xl pr-0 lg:pr-8 xl:pr-20 pt-16 lg:pt-0">
          {/* Mobile-only Branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 bg-[#344F1F] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl border-2 border-white">
              <img src="/favicon.png" alt="Linka" className="w-7 h-7 object-contain invert" />
            </div>
            <h1 className="text-2xl font-black text-[#344F1F]">إنشاء حساب جديد</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <header className="mb-6 hidden lg:block">
              <h2 className="text-3xl font-black text-[#344F1F]">إنشاء حساب جديد 🚀</h2>
              <p className="text-[#344F1F]/60 text-base font-medium mt-1">انضم لأكثر من 1,200 شاب يغيرون المجتمع</p>
            </header>

            <div className="bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(52,79,31,0.12)] p-6 lg:p-8 border border-[#F2EAD3]/50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#344F1F] px-1">الاسم الكامل *</label>
                    <div className="relative">
                      <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                      <input
                        type="text" name="name" value={form.name} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-3 pr-10 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/30"
                        placeholder="أحمد محمد" required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#344F1F] px-1">رقم الهاتف</label>
                    <div className="relative">
                      <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                      <input
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-3 pr-10 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/30"
                        placeholder="059xxxxxxx"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#344F1F] px-1">البريد الإلكتروني *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                      <input
                        type="email" name="email" value={form.email} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-3 pr-10 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/30"
                        placeholder="your@email.com" required style={{ direction: 'ltr', textAlign: 'right' }}
                      />
                    </div>
                  </div>

                  {/* Residence (Neighborhood) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#344F1F] px-1">مكان السكن</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                      <input
                        type="text" name="neighborhood" value={form.neighborhood} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-3 pr-10 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/30"
                        placeholder="اسم الحي أو المدينة"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Student Toggle Row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#344F1F] px-1">كلمة المرور *</label>
                    <div className="relative">
                      <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F4991A]" />
                      <input
                        type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-3 pr-10 pl-10 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/30"
                        placeholder="6 أحرف على الأقل" required style={{ direction: 'ltr', textAlign: 'right' }}
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F4991A] hover:text-[#344F1F] p-1">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* University Student Toggle Card */}
                  <div className="p-3 bg-[#344F1F]/5 rounded-xl border border-transparent hover:border-[#344F1F]/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow border border-[#F2EAD3]">
                        <GraduationCap size={16} className="text-[#344F1F]" />
                      </div>
                      <p className="text-xs font-black text-[#344F1F]">طالب جامعي؟</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="is_university_student" checked={form.is_university_student} onChange={handleChange} className="sr-only peer" />
                      <div className="w-12 h-6 bg-[#F2EAD3] rounded-full peer peer-checked:bg-[#344F1F] after:content-[''] after:absolute after:top-[3px] after:left-[3px] peer-checked:after:translate-x-6 after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all shadow-inner"></div>
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {form.is_university_student && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3 pt-2 border-t border-[#F2EAD3]"
                    >
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#344F1F] px-1">اختر جامعتك</label>
                          <select
                            name="university_id" value={form.university_id}
                            onChange={(e) => {
                              const id = e.target.value;
                              const name = universities.find(u => String(u.id) === String(id))?.name || '';
                              setForm(p => ({ ...p, university_id: id, university: name }));
                            }}
                            className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                            required={form.is_university_student}
                          >
                            <option value="">اختر الجامعة</option>
                            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#344F1F] px-1">الرقم الجامعي</label>
                          <input
                            type="text" name="student_id" value={form.student_id} onChange={handleChange}
                            className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                            placeholder="202xxxxx" required={form.is_university_student}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#344F1F] text-[#F9F5F0] font-black py-3.5 rounded-xl shadow-xl shadow-[#344F1F]/20 hover:bg-[#2a4019] transition-all flex items-center justify-center gap-3 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-[#F9F5F0]/20 border-t-[#F9F5F0] rounded-full animate-spin" />
                  ) : (
                    <><Zap size={18} /> انضم الآن مجاناً</>
                  )}
                </motion.button>
              </form>

              <div className="mt-4 pt-4 border-t border-[#F2EAD3]/50 text-center text-[#344F1F]/60 text-xs font-bold">
                لديك حساب بالفعل؟{' '}
                <Link to="/login" className="text-[#F4991A] hover:underline decoration-2 underline-offset-4">تسجيل الدخول</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
