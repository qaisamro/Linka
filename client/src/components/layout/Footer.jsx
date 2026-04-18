import { Link } from 'react-router-dom';
import { Heart, Calendar, Users, Award } from 'lucide-react';
import logo from '../../assets/2.jpg.png';

export default function Footer() {
    return (
        <footer className="bg-[#344F1F] text-[#F9F5F0] py-16 border-t border-[#F4991A]/30 relative overflow-hidden">
            {/* Decorative Orbs for background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4991A]/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F2EAD3]/5 rounded-full blur-3xl -ml-32 -mb-32" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">

                    {/* Logo & Branding Area */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-right gap-4">
                        <div className="relative group">
                            {/* Premium White Container for Logo visibility */}
                            <div className="w-48 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-xl transform group-hover:scale-105 transition-all duration-500 border border-[#F2EAD3]/20">
                                <img src={logo} alt="Linka" className="w-full h-full object-contain" />
                            </div>
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-white/20 blur-xl -z-10 rounded-2xl group-hover:bg-white/30 transition-all" />
                        </div>

                        <div className="mt-2 text-center md:text-right">
                            <p className="font-black text-2xl text-[#F4991A] tracking-tight">Linka</p>
                            <p className="text-[#F9F5F0]/70 text-sm font-medium mt-1">منصة الشباب التفاعلية الحديثة</p>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="grid grid-cols-2 sm:flex sm:gap-12 gap-8 text-center md:text-right">
                        <div className="space-y-4">
                            <h4 className="text-[#F4991A] font-black text-xs uppercase tracking-widest mb-6">الروابط السريعة</h4>
                            <ul className="space-y-3">
                                {[
                                    { label: 'الرئيسية', to: '/' },
                                    { label: 'من نحن', to: '/about' },
                                    { label: 'الفعاليات', to: '/events' },
                                ].map(({ label, to }) => (
                                    <li key={to}>
                                        <Link to={to} className="text-[#F9F5F0]/80 hover:text-[#F4991A] transition-colors font-bold text-sm">
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>

                    {/* Impact Stats / CTA */}
                    <div className="bg-[#F9F5F0]/5 backdrop-blur-sm p-6 rounded-[2rem] border border-[#F9F5F0]/10 flex flex-col items-center gap-4 w-full md:w-auto">
                        <div className="flex gap-6">
                            <div className="text-center">
                                <p className="text-[#F4991A] font-black text-lg">1,200+</p>
                                <p className="text-[10px] uppercase font-bold text-[#F9F5F0]/60">شاب مسجل</p>
                            </div>
                            <div className="w-px h-8 bg-[#F9F5F0]/10" />
                            <div className="text-center">
                                <p className="text-[#F4991A] font-black text-lg">4,500+</p>
                                <p className="text-[10px] uppercase font-bold text-[#F9F5F0]/60">ساعة تطوع</p>
                            </div>
                        </div>
                        <p className="text-[#F9F5F0]/60 text-xs flex items-center gap-1 font-bold">
                            صُنع بـ <Heart size={12} fill="currentColor" className="text-[#F4991A] animate-pulse" /> لمستقبل أفضل
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-[#F9F5F0]/10 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#F9F5F0]/40 text-xs font-bold">
                    <p>© 2026 Linka · جميع الحقوق محفوظة</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="hover:text-[#F4991A] transition-colors">سياسة الخصوصية</Link>
                        <a href="#" className="hover:text-[#F4991A] transition-colors">اتصل بنا</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
