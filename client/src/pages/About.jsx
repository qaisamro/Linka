import { motion } from 'framer-motion';
import {
    Target, Heart, Users, Sparkles, Zap,
    MapPin, Award, BookOpen, Shield, ArrowLeft,
    ChevronLeft, Star, TrendingUp, Bot, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/2.jpg.png';
import coverImg from '../assets/33.jpg';

export default function About() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const PILLARS = [
        {
            icon: <Sparkles className="text-[#F4991A]" />,
            title: "التكنولوجيا الذكية",
            desc: "نستخدم الذكاء الاصطناعي لربط مهارات الشباب بالفرص التي تناسبهم بدقة متناهية.",
            color: "from-[#F4991A]/20 to-[#344F1F]/10"
        },
        {
            icon: <Heart className="text-[#F4991A]" />,
            title: "الأثر المجتمعي",
            desc: "كل ساعة تطوع هي لبنة في بناء مجتمع أقوى وأكثر ترابطاً واستدامة.",
            color: "from-[#344F1F]/20 to-[#F4991A]/10"
        },
        {
            icon: <TrendingUp className="text-[#F4991A]" />,
            title: "النمو المهني",
            desc: "نحوّل العمل التطوعي إلى رصيد مهني وأكاديمي معتمد يفتح آفاق المستقبل.",
            color: "from-[#F4991A]/20 to-[#F4991A]/5"
        }
    ];

    return (
        <div className="min-h-screen bg-[#F9F5F0]">
            {/* ── Hero Section ─────────────────────────────────────────── */}
            <section className="animated-gradient relative overflow-hidden py-24 sm:py-32">
                <div className="absolute inset-0 bg-[#344F1F]/65 pointer-events-none" />
                <div className="absolute inset-0 dot-pattern-sm opacity-30 pointer-events-none" />

                {/* Animated Orbs */}
                <div className="hero-glow-orb w-96 h-96 -top-20 -right-20 bg-[#F4991A]/20" style={{ animationDuration: '10s' }} />
                <div className="hero-glow-orb w-80 h-80 -bottom-10 -left-10 bg-[#344F1F]/20" style={{ animationDuration: '12s', animationDelay: '2s' }} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#F9F5F0] rounded-[2.5rem] p-4 shadow-2xl border-4 border-white/20 backdrop-blur-3xl animate-float">
                            <img src={logo} alt="Linka Logo" className="w-full h-full object-contain" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-5xl sm:text-7xl font-black text-[#F9F5F0] mb-6 tracking-tight drop-shadow-2xl"
                    >
                        Linka: <span className="text-gradient-hero">نبض الشباب</span>
                        <br />
                        روح المجتمع
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-[#F9F5F0] text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed drop-shadow-xl font-bold italic"
                    >
                        "مبادرة شبابية تهدف إلى إعادة صياغة العمل المجتمعي في عصر التكنولوجيا"
                    </motion.p>
                </div>
            </section>

            {/* ── Story Section ────────────────────────────────────────── */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 bg-[#F2EAD3] text-[#344F1F] px-4 py-2 rounded-2xl text-sm font-black shadow-sm">
                                <Globe size={16} /> برؤية عالمية، وبصمة عربية
                            </div>
                            <h2 className="text-4xl font-black text-[#344F1F] leading-tight">
                                ما هي منصة <span className="text-[#F4991A]">Linka</span>؟
                            </h2>
                            <div className="space-y-6 text-[#344F1F] text-lg leading-relaxed font-medium">
                                <p>
                                    لينكا (Linka) هي أكثر من مجرد منصة رقمية؛ إنها جسر يربط بين طاقات الشباب وبين احتياجات المجتمع. ولدت هذه المبادرة من إيماننا العميق بأن الشباب هم المحرك الحقيقي للتغيير، وأن التكنولوجيا هي الأداة الأمثل لتعظيم أثرهم.
                                </p>
                                <p>
                                    نحن نؤمن بأن كل فعل تطوعي، مهما كان صغيراً، يساهم في بناء مستقبل أفضل. لذلك صممنا نظاماً ذكياً يوثق هذه الجهود، ويكافئ القائمين عليها، ويحوّل ساعات العطاء إلى رصيد يعزز من مسارهم المهني والأكاديمي.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#F2EAD3]">
                                    <p className="text-4xl font-black text-[#344F1F] mb-2">+1200</p>
                                    <p className="text-[#F4991A] font-bold text-sm">متطوع نشط</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#F2EAD3]">
                                    <p className="text-4xl font-black text-[#344F1F] mb-2">+4K</p>
                                    <p className="text-[#F4991A] font-bold text-sm">ساعة تطوعية</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="aspect-square bg-[#344F1F] rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <img
                                    src={coverImg}
                                    alt="Linka Power"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-[#344F1F]/40 group-hover:bg-[#344F1F]/20 transition-all duration-500" />
                                <div className="absolute inset-0 flex items-center justify-center p-12">
                                    <div className="text-center">
                                        <Zap size={80} className="text-[#F9F5F0] mx-auto mb-6 animate-pulse" />
                                        <p className="text-[#F9F5F0] text-2xl font-black drop-shadow-2xl">قوة الشباب في شاشة واحدة</p>
                                    </div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                                <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                            </div>

                            {/* Floating Badge */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -bottom-8 -right-8 bg-white p-6 rounded-3xl shadow-2xl border-4 border-[#F9F5F0] z-20 hidden sm:block"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#F4991A] rounded-2xl flex items-center justify-center text-[#F9F5F0]">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[#344F1F] font-black leading-none">معتمد رسمياً</p>
                                        <p className="text-[#F4991A] text-xs font-bold mt-1">بشهادات جامعية</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Pillars Section ──────────────────────────────────────── */}
            <section className="py-20 bg-[#344F1F] relative overflow-hidden">
                <div className="absolute inset-0 dot-pattern-sm opacity-10 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-[#F9F5F0] text-4xl font-black mb-4">ركائز ريادتنا</h2>
                        <p className="text-[#F9F5F0]/60 text-lg max-w-2xl mx-auto">
                            نقوم على ثلاث ركائز أساسية تضمن استمرارية العطاء وفعالية الأثر
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {PILLARS.map((pillar, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className={`bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/15 transition-all group`}
                            >
                                <div className="w-16 h-16 bg-[#F9F5F0] rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                                    {pillar.icon}
                                </div>
                                <h3 className="text-[#F9F5F0] text-2xl font-black mb-4">{pillar.title}</h3>
                                <p className="text-[#F9F5F0]/70 leading-relaxed font-medium">
                                    {pillar.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Visual Explanation Section ───────────────────────────── */}
            <section className="py-24 px-4 bg-[#F2EAD3]/30">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-[#344F1F] text-4xl font-black mb-6 italic">"لأن لكل ثانية قيمة.."</h2>
                        <div className="w-24 h-1.5 bg-[#F4991A] mx-auto rounded-full" />
                    </div>

                    <div className="space-y-12">
                        {[
                            {
                                title: "التوثيق الذكي",
                                desc: "نظام تتبع جغرافي وزمني يضمن دقة تسجيل ساعات العمل التطوعي والتدريب الميداني بالتعاون مع الجامعات والشركات.",
                                icon: <Bot className="text-[#344F1F]" size={28} />
                            },
                            {
                                title: "بوابة الفرص",
                                desc: "محرك بحث متطور يطرح فرص العمل والتدريب بناءً على تاريخ النشاط التطوعي والمهارات التي تم اكتسابها فعلياً.",
                                icon: <Zap className="text-[#344F1F]" size={28} />
                            },
                            {
                                title: "خريطة التفاعل",
                                desc: "عرض مرئي وتفاعلي للفعاليات والفرص في منطقتك، مما يسهل الوصول والمشاركة الفورية.",
                                icon: <MapPin className="text-[#344F1F]" size={28} />
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="flex gap-6 items-start"
                            >
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-[#F2EAD3]">
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="text-[#344F1F] text-xl font-bold mb-2">{item.title}</h4>
                                    <p className="text-[#344F1F]/70 leading-relaxed font-medium">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ──────────────────────────────────────────── */}
            <section className="py-20 bg-[#344F1F] relative overflow-hidden text-center text-[#F9F5F0]">
                <div className="max-w-xl mx-auto px-4 relative z-10">
                    <h2 className="text-4xl font-black mb-6">هل أنت مستعد لصناعة التغيير؟</h2>
                    <p className="text-[#F9F5F0]/80 mb-10 font-medium text-lg">
                        انضم لآلاف الشباب وباشر رحلتك التطوعية اليوم.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="btn-white py-4 px-10 text-lg">
                            <Users size={20} /> انضم إلينا الآن
                        </Link>
                        <Link to="/events" className="glass-strong text-[#F9F5F0] font-bold py-4 px-10 rounded-2xl hover:bg-white/10 transition-all">
                            استكشف الفعاليات
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Simple Footer ────────────────────────────────────────── */}
            <footer className="py-12 bg-[#344F1F] text-center border-t border-white/5">
                <img src={logo} alt="L" className="w-12 h-12 mx-auto mb-4 opacity-50 grayscale hover:grayscale-0 transition-all" />
                <p className="text-[#F9F5F0]/40 text-sm font-bold">Linka © 2026 · منصة الشباب الأولى</p>
            </footer>
        </div>
    );
}
