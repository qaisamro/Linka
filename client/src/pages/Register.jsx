import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, GraduationCap, CheckCircle, Zap, ArrowLeft, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { neighborhoodsAPI, universityAPI } from '../api';
import toast from 'react-hot-toast';

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
      const res = await register(form);

      if (res?.mustVerify) {
        toast.success(res.message || 'يرجى تفعيل البريد الإلكتروني');
        navigate('/verify-email', { state: { email: res.email } });
      } else {
        toast.success(`مرحباً ${res.name}! انضممت لمجتمع Linka 🎉`);
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: <ShieldCheck className="text-[#F4991A]" />, title: 'انضم لمجتمعك', desc: 'كن جزءاً من مجتمع Linka النشط والمؤثر' },
    { icon: <Sparkles className="text-[#F4991A]" />, title: 'شارك في الفعاليات', desc: 'اختر من عشرات الفعاليات التطوعية الموثقة' },
    { icon: <Trophy className="text-[#F4991A]" />, title: 'اكسب وسامك', desc: 'تنافس واجمع النقاط لرفع تصنيفك الرقمي' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F9F5F0] font-cairo selection:bg-[#344F1F]/10 overflow-x-hidden pt-20">

      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[40%] bg-[#344F1F] relative overflow-hidden flex-col justify-between p-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#F4991A]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">

          <h2 className="text-white text-4xl font-black leading-tight mb-6">ابدأ رحلتك <span className="text-[#F4991A]">المجتمعية</span> الرائدة معنا اليوم</h2>
          <p className="text-white/60 text-base font-medium mb-12">خطوات بسيطة تفصلك عن أكبر شبكة للشباب المؤثر في فلسطين.</p>

          <div className="space-y-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-5 p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform">
                  {b.icon}
                </div>
                <div>
                  <h4 className="text-white text-sm font-black mb-1">{b.title}</h4>
                  <p className="text-white/40 text-xs font-medium leading-relaxed">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-[#F9F5F0]">
        <div className="lg:hidden w-full flex justify-between items-center mb-10">
          <Link to="/login" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#344F1F] shadow-sm border border-[#F2EAD3]">
            <ArrowLeft size={18} />
          </Link>
        </div>

        <div className="w-full max-w-4xl px-0 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <header className="mb-10 text-right">
              <h2 className="text-4xl font-black text-[#344F1F] mb-3">حساب جديد 🚀</h2>
              <p className="text-[#344F1F]/50 text-lg font-medium">انضم لـ ١٢٠٠ شاب يغيرون ملامح المستقبل</p>
            </header>

            <div className="bg-white shadow-[0_40px_80px_-15px_rgba(52,79,31,0.08)] rounded-[2.5rem] p-8 lg:p-12 border border-[#F2EAD3]/40">
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#F4991A] uppercase tracking-widest mr-1">الاسم الكامل *</label>
                    <div className="group relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#344F1F]/40 group-focus-within:text-[#F4991A] transition-colors"><User size={18} /></div>
                      <input
                        type="text" name="name" value={form.name} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-[#F9F5F0] focus:border-[#F4991A] focus:bg-white rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/20"
                        placeholder="أحمد محمد" required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#F4991A] uppercase tracking-widest mr-1">رقم الهاتف</label>
                    <div className="group relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#344F1F]/40 group-focus-within:text-[#F4991A] transition-colors"><Phone size={18} /></div>
                      <input
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-[#F9F5F0] focus:border-[#F4991A] focus:bg-white rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/20"
                        placeholder="059xxxxxxx"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#F4991A] uppercase tracking-widest mr-1">البريد الإلكتروني *</label>
                    <div className="group relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#344F1F]/40 group-focus-within:text-[#F4991A] transition-colors"><Mail size={18} /></div>
                      <input
                        type="email" name="email" value={form.email} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-[#F9F5F0] focus:border-[#F4991A] focus:bg-white rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/20"
                        placeholder="your@email.com" required style={{ direction: 'ltr', textAlign: 'right' }}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#F4991A] uppercase tracking-widest mr-1">مكان السكن</label>
                    <div className="group relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#344F1F]/40 group-focus-within:text-[#F4991A] transition-colors"><MapPin size={18} /></div>
                      <input
                        type="text" name="neighborhood" value={form.neighborhood} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-[#F9F5F0] focus:border-[#F4991A] focus:bg-white rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/20"
                        placeholder="الخليل، فلسطين"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#F4991A] uppercase tracking-widest mr-1">كلمة المرور *</label>
                    <div className="group relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#344F1F]/40 group-focus-within:text-[#F4991A] transition-colors"><Lock size={18} /></div>
                      <input
                        type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                        className="w-full bg-[#F9F5F0] border-2 border-[#F9F5F0] focus:border-[#F4991A] focus:bg-white rounded-2xl py-3.5 pr-12 pl-14 text-sm font-bold outline-none transition-all placeholder-[#344F1F]/20"
                        placeholder="••••••••" required style={{ direction: 'ltr', textAlign: 'right' }}
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#344F1F]/30 hover:text-[#344F1F] p-1">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>

                  {/* Student Toggle Card */}
                  <div className="bg-[#F9F5F0] rounded-[1.5rem] p-4 flex items-center justify-between border-2 border-transparent hover:border-[#344F1F]/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#344F1F] shadow-sm"><GraduationCap size={20} /></div>
                      <span className="text-xs font-black text-[#344F1F]">طالب جامعي؟</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="is_university_student" checked={form.is_university_student} onChange={handleChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-[#F2EAD3] peer-checked:bg-[#F4991A] rounded-full peer after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:after:translate-x-5 transition-all"></div>
                    </label>
                  </div>
                </div>

                <AnimatePresence>
                  {form.is_university_student && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4 pt-4 border-t border-[#F2EAD3]">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#344F1F]/50 uppercase mr-1">اختر جامعتك</label>
                          <select
                            name="university_id" value={form.university_id}
                            onChange={(e) => {
                              const id = e.target.value;
                              const name = universities.find(u => String(u.id) === String(id))?.name || '';
                              setForm(p => ({ ...p, university_id: id, university: name }));
                            }}
                            className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-3 px-3 text-xs font-black outline-none"
                            required={form.is_university_student}
                          >
                            <option value="">اختر من القائمة</option>
                            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#344F1F]/50 uppercase mr-1">الرقم الجامعي</label>
                          <input
                            type="text" name="student_id" value={form.student_id} onChange={handleChange}
                            className="w-full bg-[#F9F5F0] border-2 border-transparent focus:border-[#F4991A] rounded-xl py-3 px-3 text-xs font-black outline-none"
                            placeholder="202xxxxx" required={form.is_university_student}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-[#344F1F] text-[#F9F5F0] font-black text-lg py-5 rounded-2xl shadow-2xl shadow-[#344F1F]/20 hover:bg-[#2a4019] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Zap size={20} className="text-[#F4991A]" /> انضم للمجتمع الآن</>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-[#344F1F]/40 text-[11px] font-bold">
                لديك حساب بالفعل؟{' '}
                <Link to="/login" className="text-[#344F1F] font-black underline decoration-[#F4991A] decoration-2 underline-offset-4 hover:text-[#F4991A] transition-colors">تسجيل الدخول</Link>
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
