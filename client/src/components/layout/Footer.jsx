import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, Calendar, Users, Award, Facebook, 
  Instagram, Twitter, Linkedin, Mail, Phone, 
  MapPin, ArrowLeft, Send
} from 'lucide-react';
import logo from '../../assets/2.jpg.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: 'الرئيسية', to: '/' },
      { label: 'الفعاليات', to: '/events' },
      { label: 'فرص التطوع', to: '/jobs' },
      { label: 'من نحن', to: '/about' },
    ],
    community: [
      { label: 'الأحياء والخرائط', to: '/map' },
      { label: 'التدريب الميداني', to: '/training' },
      { label: 'قصص النجاح', to: '/stories' },
      { label: 'لوحة الشرف', to: '/badges' },
    ],
    support: [
      { label: 'مركز المساعدة', to: '/help' },
      { label: 'سياسة الخصوصية', to: '/privacy' },
      { label: 'اتصل بنا', to: '/contact' },
      { label: 'الأسئلة الشائعة', to: '/faq' },
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'فيسبوك' },
    { icon: Twitter, href: '#', label: 'تويتر' },
    { icon: Instagram, href: '#', label: 'إنستغرام' },
    { icon: Linkedin, href: '#', label: 'لينكد إن' },
  ];

  return (
    <footer className="bg-[#344F1F] text-[#F9F5F0] pt-20 pb-10 border-t border-[#F4991A]/30 relative overflow-hidden font-vazir">
      {/* ── Background Decorative Elements ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F4991A]/10 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#F2EAD3]/10 rounded-full blur-[100px] -ml-40 -mb-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* ── Top Section: Newsletter ── */}
        <div className="bg-[#F9F5F0]/5 backdrop-blur-md rounded-[3rem] p-8 sm:p-12 mb-20 border border-[#F9F5F0]/10 flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-[#F4991A]/30 transition-all duration-500">
          <div className="text-center lg:text-right">
            <h3 className="text-2xl sm:text-3xl font-black text-[#F4991A] mb-2 px-2">ابقَ على اتصال بنبض المجتمع 🚀</h3>
            <p className="text-[#F9F5F0]/70 font-bold max-w-md">اشترك في نشرتنا الإخبارية لتصلك أحدث الفعاليات والفرص فور صدورها.</p>
          </div>
          <div className="w-full lg:max-w-md">
            <form className="relative flex items-center" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="بريدك الإلكتروني" 
                className="w-full bg-[#344F1F]/50 border-2 border-[#F9F5F0]/10 rounded-2xl py-4 pr-6 pl-16 focus:outline-none focus:border-[#F4991A] text-[#F9F5F0] font-bold transition-all placeholder:text-[#F9F5F0]/30"
              />
              <button className="absolute left-2 p-2 bg-[#F4991A] text-[#344F1F] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg">
                <Send size={24} />
              </button>
            </form>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16">
          
          {/* Branding Column */}
          <div className="space-y-6 text-center sm:text-right">
            <Link to="/" className="inline-block group">
              <div className="bg-white p-4 rounded-3xl shadow-xl border border-[#F2EAD3]/20 transform group-hover:rotate-2 transition-transform duration-500">
                <img src={logo} alt="Linka Logo" className="h-12 sm:h-14 w-auto object-contain" />
              </div>
            </Link>
            <p className="text-[#F9F5F0]/70 text-sm leading-relaxed font-medium">
              لينكا هي المنصة الشبابية الأولى التي تربط طاقات الشباب باحتياجات المجتمع، موظفةً التكنولوجيا الذكية لبناء مستقبل أكثر استدامة وتفاعلاً.
            </p>
            <div className="flex justify-center sm:justify-start gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ y: -5, scale: 1.1 }}
                  className="w-10 h-10 bg-[#F9F5F0]/5 rounded-xl flex items-center justify-center border border-[#F9F5F0]/10 hover:border-[#F4991A] text-[#F9F5F0]/60 hover:text-[#F4991A] transition-all"
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="text-center sm:text-right">
            <h4 className="text-[#F4991A] font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F4991A]" /> المنصة
            </h4>
            <ul className="space-y-4">
              {footerLinks.platform.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-[#F9F5F0]/60 hover:text-[#F4991A] transition-all font-bold text-sm flex items-center justify-center sm:justify-start group gap-0 hover:gap-2">
                    <ArrowLeft size={16} className="opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-right">
            <h4 className="text-[#F4991A] font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F4991A]" /> المجتمع
            </h4>
            <ul className="space-y-4">
              {footerLinks.community.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-[#F9F5F0]/60 hover:text-[#F4991A] transition-all font-bold text-sm flex items-center justify-center sm:justify-start group gap-0 hover:gap-2">
                    <ArrowLeft size={16} className="opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-right">
            <h4 className="text-[#F4991A] font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F4991A]" /> الدعم القانوني
            </h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-[#F9F5F0]/60 hover:text-[#F4991A] transition-all font-bold text-sm flex items-center justify-center sm:justify-start group gap-0 hover:gap-2">
                    <ArrowLeft size={16} className="opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Stats Pill ── */}
        <div className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-8 py-8 border-y border-[#F9F5F0]/5 bg-[#F9F5F0]/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F4991A]/10 rounded-2xl flex items-center justify-center text-[#F4991A]">
                <Users size={22} />
              </div>
              <div>
                <p className="text-lg font-black text-[#F9F5F0]">1,200+</p>
                <p className="text-[10px] uppercase font-bold text-[#F9F5F0]/40">متطوع معتمد</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#F9F5F0]/10" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F4991A]/10 rounded-2xl flex items-center justify-center text-[#F4991A]">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-lg font-black text-[#F9F5F0]">450+</p>
                <p className="text-[10px] uppercase font-bold text-[#F9F5F0]/40">فعالية منجزة</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#F9F5F0]/10" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F4991A]/10 rounded-2xl flex items-center justify-center text-[#F4991A]">
                <Award size={22} />
              </div>
              <div>
                <p className="text-lg font-black text-[#F9F5F0]">4,500+</p>
                <p className="text-[10px] uppercase font-bold text-[#F9F5F0]/40">ساعة تدريب</p>
              </div>
            </div>
        </div>

        {/* ── Copyright Bar ── */}
        <div className="mt-16 flex flex-col sm:flex-row justify-between items-center gap-6 text-[#F9F5F0]/30 text-[11px] font-bold">
          <p>© {currentYear} Linka Platform · جميع الحقوق محفوظة لشباب فلسطين 🇵🇸</p>
          <div className="flex items-center gap-2">
            صُنع بحب <Heart size={14} className="text-[#F4991A] animate-pulse" fill="currentColor" /> لدعم مستقبلنا
          </div>
        </div>
      </div>
    </footer>
  );
}
