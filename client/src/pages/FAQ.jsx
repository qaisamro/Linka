import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle, Users, Calendar, Briefcase, GraduationCap, Shield, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqData = [
  {
    category: 'عام',
    icon: HelpCircle,
    questions: [
      {
        q: 'ما هي منصة لينكا؟',
        a: 'منصة لينكا (Linka) هي أول منصة فلسطينية تفاعلية تربط الشباب بالفعاليات التطوعية، فرص العمل، والتدريب الميداني المعتمد أكاديمياً. تهدف المنصة لتمكين الشباب الفلسطيني وتعزيز مشاركتهم المجتمعية.'
      },
      {
        q: 'هل المنصة مجانية؟',
        a: 'نعم! منصة لينكا مجانية بالكامل للمستخدمين. يمكنك إنشاء حساب والتسجيل في الفعاليات والوصول لجميع الميزات دون أي رسوم.'
      },
      {
        q: 'كيف أنشئ حساباً في المنصة؟',
        a: 'اضغط على زر "انضم الآن" في أعلى الصفحة، ثم أدخل بياناتك الأساسية (الاسم، البريد الإلكتروني، كلمة المرور). سيصلك إيميل ترحيبي فور إنشاء الحساب بنجاح.'
      },
    ]
  },
  {
    category: 'الفعاليات',
    icon: Calendar,
    questions: [
      {
        q: 'كيف أسجّل في فعالية؟',
        a: 'تصفّح قائمة الفعاليات من الصفحة الرئيسية أو من قسم "الفعاليات"، اختر الفعالية المناسبة واضغط على "انضم الآن". يجب أن تكون مسجّل دخولك للتسجيل.'
      },
      {
        q: 'هل يمكنني إلغاء تسجيلي في فعالية؟',
        a: 'حالياً يمكنك التواصل مع فريق الدعم لإلغاء التسجيل. نعمل على إضافة ميزة الإلغاء التلقائي قريباً.'
      },
      {
        q: 'ماذا أحصل عند المشاركة في فعالية؟',
        a: 'تحصل على نقاط تُضاف لملفك الشخصي، ساعات تطوع معتمدة، وشهادة مشاركة. كلما زادت مشاركاتك، ارتفع ترتيبك في لوحة الشرف!'
      },
    ]
  },
  {
    category: 'فرص العمل',
    icon: Briefcase,
    questions: [
      {
        q: 'كيف يعمل نظام التوصيات الذكي؟',
        a: 'يحلل الذكاء الاصطناعي مهاراتك المكتسبة من الفعاليات التطوعية ويرشّح لك فرص العمل التي تتوافق مع خبراتك واهتماماتك بنسبة توافق محسوبة.'
      },
      {
        q: 'ما هو مسار التطوير المهني؟',
        a: 'هو خارطة طريق شخصية يبنيها لك النظام بناءً على نشاطك ومهاراتك، ترشدك لخطوات عملية لتطوير مسيرتك المهنية.'
      },
    ]
  },
  {
    category: 'التدريب الميداني',
    icon: GraduationCap,
    questions: [
      {
        q: 'كيف يعمل نظام التدريب الميداني؟',
        a: 'تتقدم لعروض التدريب المتاحة من الشركات عبر المنصة. بعد القبول، تسجّل حضورك وانصرافك عبر نظام GPS ذكي، وتتابع ساعاتك المعتمدة من الجامعة.'
      },
      {
        q: 'هل ساعات التدريب معتمدة أكاديمياً؟',
        a: 'نعم! النظام مصمم بالتعاون مع الجامعات الفلسطينية. يتم اعتماد الجلسات من قبل الجامعة ويمكن تصدير تقارير رسمية بالساعات المكتملة.'
      },
      {
        q: 'ماذا يعني "التحقق المكاني"؟',
        a: 'عند تسجيل الحضور (Check-in) والانصراف (Check-out)، يتحقق النظام من موقعك الجغرافي عبر GPS للتأكد من تواجدك الفعلي في مكان التدريب.'
      },
    ]
  },
  {
    category: 'الحساب والأمان',
    icon: Shield,
    questions: [
      {
        q: 'نسيت كلمة المرور، ماذا أفعل؟',
        a: 'تواصل مع فريق الدعم عبر البريد الإلكتروني وسنساعدك في استعادة حسابك بأسرع وقت.'
      },
      {
        q: 'هل بياناتي آمنة على المنصة؟',
        a: 'نعم! نستخدم أحدث معايير التشفير لحماية بياناتك. يمكنك الاطلاع على سياسة الخصوصية الخاصة بنا لمزيد من التفاصيل.'
      },
    ]
  },
  {
    category: 'النقاط والمكافآت',
    icon: Star,
    questions: [
      {
        q: 'كيف أجمع النقاط؟',
        a: 'تحصل على نقاط عند المشاركة في الفعاليات التطوعية، إتمام التدريبات الميدانية، والمساهمة في أنشطة المنصة المختلفة.'
      },
      {
        q: 'ما فائدة النقاط؟',
        a: 'النقاط تعزز ملفك الشخصي وترفع ترتيبك في لوحة الشرف. كما تساعد في تحسين توصيات فرص العمل المناسبة لك عبر نظام الذكاء الاصطناعي.'
      },
    ]
  },
];

function FAQItem({ q, a, isOpen, onClick }) {
  return (
    <div className="border border-[#F2EAD3] rounded-2xl overflow-hidden transition-all hover:border-[#F4991A]/40">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-right bg-white hover:bg-[#F9F5F0]/50 transition-colors"
      >
        <span className="font-bold text-[#344F1F] text-sm sm:text-base leading-relaxed">{q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-[#F4991A] flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-[#344F1F]/80 text-sm leading-relaxed border-t border-[#F2EAD3] pt-3 bg-[#F9F5F0]/30">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');

  const categories = ['الكل', ...faqData.map(c => c.category)];

  const filteredData = faqData
    .map(cat => ({
      ...cat,
      questions: cat.questions.filter(item =>
        item.q.includes(search) || item.a.includes(search)
      )
    }))
    .filter(cat => activeCategory === 'الكل' || cat.category === activeCategory)
    .filter(cat => cat.questions.length > 0);

  let globalIndex = 0;

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
              <span className="text-[#F4991A] text-sm font-black uppercase tracking-widest">الدعم والمساعدة</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#F9F5F0] mb-4 leading-tight">
              الأسئلة <span className="text-[#F4991A]">الشائعة</span>
            </h1>
            <p className="text-[#F9F5F0]/80 text-lg font-bold max-w-xl mx-auto">
              إجابات فورية لأكثر الأسئلة شيوعاً حول منصة لينكا وخدماتها
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative mb-8">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F4991A]" size={20} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الأسئلة الشائعة..."
            className="w-full pr-12 pl-5 py-4 bg-white border-2 border-[#F2EAD3] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F4991A]/50 focus:border-[#F4991A] font-bold text-sm text-[#344F1F] placeholder:text-[#344F1F]/30 transition-all shadow-sm"
          />
        </motion.div>

        {/* Category Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === cat
                ? 'bg-[#344F1F] text-[#F9F5F0] shadow-md'
                : 'bg-white text-[#344F1F] border border-[#F2EAD3] hover:bg-[#F2EAD3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* FAQ Groups */}
        {filteredData.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle size={48} className="mx-auto text-[#F4991A]/30 mb-4" />
            <p className="text-[#344F1F]/50 font-bold">لا توجد نتائج مطابقة لبحثك</p>
          </div>
        ) : (
          filteredData.map((cat, ci) => {
            const CatIcon = cat.icon;
            return (
              <motion.div
                key={ci}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + ci * 0.05 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#344F1F] flex items-center justify-center shadow-sm">
                    <CatIcon size={18} className="text-[#F4991A]" />
                  </div>
                  <h2 className="text-lg font-black text-[#344F1F]">{cat.category}</h2>
                  <span className="text-xs font-bold text-[#F4991A] bg-[#F4991A]/10 px-2 py-0.5 rounded-lg">{cat.questions.length} أسئلة</span>
                </div>
                <div className="space-y-3">
                  {cat.questions.map((item, qi) => {
                    const currentIndex = globalIndex++;
                    return (
                      <FAQItem
                        key={qi}
                        q={item.q}
                        a={item.a}
                        isOpen={openIndex === currentIndex}
                        onClick={() => setOpenIndex(openIndex === currentIndex ? null : currentIndex)}
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-gradient-to-l from-[#344F1F] to-[#344F1F] rounded-2xl p-8 text-center mt-10">
          <h3 className="text-xl font-black text-[#F9F5F0] mb-3">لم تجد إجابتك؟</h3>
          <p className="text-[#F9F5F0]/70 font-bold mb-5">تواصل معنا مباشرة وسنرد عليك في أسرع وقت</p>
          <Link to="/help" className="inline-block bg-[#F4991A] text-[#344F1F] px-8 py-3 rounded-full font-black shadow-lg hover:shadow-xl transition-all">
            مركز المساعدة
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
