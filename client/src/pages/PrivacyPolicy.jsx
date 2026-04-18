import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#F9F5F0] pt-32 pb-20 font-vazir">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 bg-[#F2EAD3] text-[#344F1F] px-4 py-2 rounded-full text-xs font-black mb-6 uppercase tracking-widest shadow-sm">
                        <Shield size={14} className="text-[#F4991A]" />
                        مركز الأمان والخصوصية
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-[#344F1F] mb-6 leading-tight">سياسة الخصوصية 📜</h1>
                    <p className="text-[#F4991A] text-lg font-bold max-w-2xl mx-auto leading-relaxed">
                        في Linka، نعتبر خصوصيتك أولوية قصوى. نحن ملتزمون بشفافية كاملة حول كيفية حماية بياناتك الشخصية واستخدامها.
                    </p>
                </motion.div>

                {/* Navigation Breadcrumb */}
                <div className="flex items-center gap-2 text-xs font-bold text-[#F4991A]/60 mb-12">
                    <Link to="/" className="hover:text-[#344F1F] transition-colors">الرئيسية</Link>
                    <ChevronRight size={14} />
                    <span className="text-[#344F1F]">سياسة الخصوصية</span>
                </div>

                {/* Content Section */}
                <div className="space-y-12">

                    <PolicySection
                        icon={Lock}
                        title="حماية البيانات"
                        content="نحن نستخدم أحدث تقنيات التشفير الصناعي (AES-256) وبروتوكولات الأمان المتقدمة لضمان بقاء معلوماتك الشخصية آمنة ومحمية من أي وصول غير مصرح به. يتم تخزين كافة البيانات الحساسة في خوادم مشفرة ومؤمنة."
                    />

                    <PolicySection
                        icon={Eye}
                        title="جمع المعلومات"
                        content="نقوم بجمع الحد الأدنى من المعلومات اللازمة لتقديم تجربة أفضل لك في منصة Linka، ويشمل ذلك: الاسم، البريد الإلكتروني، والنشاط التطوعي. نحن لا نقوم بجمع أي بيانات بيومترية أو تتبع لموقعك الجغرافي خارج نطاق الفعاليات."
                    />

                    <PolicySection
                        icon={FileText}
                        title="استخدام البيانات"
                        content="بياناتك تُستخدم فقط لغايات تنظيم الفعاليات، احتساب ساعات التطوع، والتواصل الرسمي معك بخصوص حسابك. نحن نضمن لك عدم بيع أو مشاركة بياناتك مع أي طرف ثالث لأهداف تسويقية أو تجارية."
                    />

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="p-8 bg-white rounded-[2.5rem] border border-[#F2EAD3] shadow-sm relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4991A]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <h3 className="text-xl font-black text-[#344F1F] mb-4">حقوقك كمستخدم</h3>
                        <ul className="space-y-4">
                            {[
                                'الحق في الوصول إلى بياناتك الشخصية وتصحيحها في أي وقت.',
                                'الحق في طلب حذف حسابك وكافة البيانات المرتبطة به نهائياً.',
                                'الحق في الاعتراض على كيفية معالجة أنواع معينة من البيانات.',
                                'الحق في سحب موافقتك على معالجة البيانات في أي وقت.'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-bold text-[#344F1F]/70 leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#F4991A] mt-2 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <div className="text-center pt-8">
                        <p className="text-[#344F1F]/50 text-xs font-bold mb-6">
                            آخر تحديث: 19 أبريل 2026 · نسخة v1.2
                        </p>
                        <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20 hover:scale-105 transition-all">
                            العودة للرئيسية
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PolicySection({ icon: Icon, title, content }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-6 group"
        >
            <div className="shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#F2EAD3] group-hover:shadow-md transition-shadow">
                <Icon size={24} className="text-[#F4991A]" />
            </div>
            <div>
                <h2 className="text-xl font-black text-[#344F1F] mb-3">{title}</h2>
                <p className="text-sm font-bold text-[#344F1F]/60 leading-relaxed text-justify">
                    {content}
                </p>
            </div>
        </motion.div>
    );
}
