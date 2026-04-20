import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LifeBuoy, MessageCircle, Mail, Phone, Clock, MapPin,
  HelpCircle, BookOpen, Shield, AlertTriangle, Send, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const helpTopics = [
  {
    icon: HelpCircle,
    title: 'الأسئلة الشائعة',
    desc: 'إجابات فورية لأكثر الأسئلة شيوعاً',
    link: '/faq',
    color: '#F4991A',
  },
  {
    icon: BookOpen,
    title: 'كيف أبدأ؟',
    desc: 'دليل شامل للبدء باستخدام المنصة',
    steps: [
      'أنشئ حسابك مجاناً عبر صفحة التسجيل',
      'أكمل بياناتك الشخصية في الملف الشخصي',
      'تصفّح الفعاليات والفرص المتاحة',
      'سجّل في أول فعالية واحصد النقاط!',
    ],
    color: '#344F1F',
  },
  {
    icon: Shield,
    title: 'الأمان والخصوصية',
    desc: 'كيف نحمي بياناتك ونحافظ على خصوصيتك',
    link: '/privacy',
    color: '#344F1F',
  },
  {
    icon: AlertTriangle,
    title: 'الإبلاغ عن مشكلة',
    desc: 'واجهت خطأ تقني؟ أخبرنا وسنحله فوراً',
    color: '#F4991A',
  },
];

export default function HelpCenter() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/newsletter/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');
      setSent(true);
      toast.success(data.message || 'تم إرسال رسالتك بنجاح!');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] pt-16">
      {/* Hero */}
      <div className="animated-gradient dot-pattern relative overflow-hidden">
        <div className="absolute inset-0 bg-[#344F1F]/65" />
        <div className="hero-glow-orb w-80 h-80 -top-20 -right-20 bg-[#F4991A]/20" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4 justify-center">
              <span className="w-8 h-px bg-[#F4991A]" />
              <span className="text-[#F4991A] text-sm font-black uppercase tracking-widest">نحن هنا لمساعدتك</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#F9F5F0] mb-4 leading-tight">
              مركز <span className="text-[#F4991A]">المساعدة</span>
            </h1>
            <p className="text-[#F9F5F0]/80 text-lg font-bold max-w-xl mx-auto">
              هل تحتاج مساعدة؟ فريق لينكا جاهز لدعمك في أي وقت
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Help Topics Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {helpTopics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {topic.link ? (
                  <Link to={topic.link} className="block card p-6 hover:-translate-y-1 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0" style={{ backgroundColor: topic.color + '15' }}>
                        <Icon size={22} style={{ color: topic.color }} />
                      </div>
                      <div>
                        <h3 className="font-black text-[#344F1F] mb-1 group-hover:text-[#F4991A] transition-colors">{topic.title}</h3>
                        <p className="text-sm text-[#344F1F]/60 font-medium">{topic.desc}</p>
                      </div>
                    </div>
                  </Link>
                ) : topic.steps ? (
                  <div className="card p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0" style={{ backgroundColor: topic.color + '15' }}>
                        <Icon size={22} style={{ color: topic.color }} />
                      </div>
                      <div>
                        <h3 className="font-black text-[#344F1F] mb-1">{topic.title}</h3>
                        <p className="text-sm text-[#344F1F]/60 font-medium">{topic.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 mr-4">
                      {topic.steps.map((step, si) => (
                        <div key={si} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#344F1F] text-[#F9F5F0] text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{si + 1}</span>
                          <p className="text-sm text-[#344F1F] font-medium">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="card p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0" style={{ backgroundColor: topic.color + '15' }}>
                        <Icon size={22} style={{ color: topic.color }} />
                      </div>
                      <div>
                        <h3 className="font-black text-[#344F1F] mb-1">{topic.title}</h3>
                        <p className="text-sm text-[#344F1F]/60 font-medium">{topic.desc}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-xl font-black text-[#344F1F] mb-6">تواصل معنا</h2>

            {[
              { icon: Mail, label: 'البريد الإلكتروني', value: 'linka.palestine@gmail.com', color: '#F4991A' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#F2EAD3] hover:border-[#F4991A]/30 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '15' }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#F4991A]">{item.label}</p>
                  <p className="text-sm font-black text-[#344F1F]">{item.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-3"
          >
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#344F1F] flex items-center justify-center">
                  <MessageCircle size={18} className="text-[#F4991A]" />
                </div>
                <div>
                  <h2 className="font-black text-[#344F1F]">أرسل لنا رسالة</h2>
                  <p className="text-xs text-[#F4991A] font-bold">سنرد عليك في أقرب فرصة</p>
                </div>
              </div>

              {sent ? (
                <div className="text-center py-10">
                  <CheckCircle size={56} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-lg font-black text-[#344F1F] mb-2">تم إرسال رسالتك بنجاح! ✅</h3>
                  <p className="text-[#F4991A] font-bold text-sm">سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>
                  <button onClick={() => setSent(false)} className="mt-6 text-sm font-bold text-[#344F1F] hover:underline">
                    إرسال رسالة جديدة
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[#F4991A] mb-1.5">الاسم *</label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="اسمك الكامل"
                        className="w-full px-4 py-3 bg-[#F9F5F0] border-0 rounded-xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm text-[#344F1F] placeholder:text-[#344F1F]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#F4991A] mb-1.5">البريد الإلكتروني *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 bg-[#F9F5F0] border-0 rounded-xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm text-[#344F1F] placeholder:text-[#344F1F]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#F4991A] mb-1.5">الموضوع</label>
                    <input
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="مثال: مشكلة في التسجيل"
                      className="w-full px-4 py-3 bg-[#F9F5F0] border-0 rounded-xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm text-[#344F1F] placeholder:text-[#344F1F]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-[#F4991A] mb-1.5">الرسالة *</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      placeholder="اكتب رسالتك هنا..."
                      className="w-full px-4 py-3 bg-[#F9F5F0] border-0 rounded-xl focus:ring-2 focus:ring-[#F4991A] font-bold text-sm text-[#344F1F] placeholder:text-[#344F1F]/30 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-4 btn-primary rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-lg"
                  >
                    {sending ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <><Send size={18} /> إرسال الرسالة</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
