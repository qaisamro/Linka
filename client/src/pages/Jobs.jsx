import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Star, Sparkles, Search, Filter, Clock, MapPin,
    ChevronLeft, X, TrendingUp, Award, BookOpen, Loader2, Target
} from 'lucide-react';
import { jobsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
    'وظيفة': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', bar: '#3b82f6' },
    'تدريب': { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', bar: '#8b5cf6' },
    'تطوع مدفوع': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', bar: '#10b981' },
};

const SKILL_ICONS = {
    'القيادة': '👑', 'التعلم الذاتي': '📚', 'التقنية': '💻', 'البحث العلمي': '🔬',
    'العمل الجماعي': '🤝', 'الخدمة المجتمعية': '🌍', 'المبادرة': '🚀', 'التعاطف': '❤️',
    'الاستدامة': '🌱', 'التنظيم': '📋', 'التواصل': '💬', 'إدارة الفعاليات': '🎯',
    'الإنجاز': '🏆', 'الصحة': '💪', 'الإبداع': '🎨', 'التراث': '🏛️',
};

function MatchBadge({ score }) {
    const color = score >= 75 ? 'from-emerald-500 to-teal-600'
        : score >= 50 ? 'from-amber-500 to-orange-500'
            : 'from-slate-400 to-slate-500';
    return (
        <div className={`flex items-center gap-1.5 bg-gradient-to-r ${color} text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-sm`}>
            <Target size={11} />
            <span dir="ltr">{score}% توافق</span>
        </div>
    );
}

function JobCard({ job, index, featured = false }) {
    const [expanded, setExpanded] = useState(false);
    const typeStyle = TYPE_COLORS[job.type] || TYPE_COLORS['وظيفة'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.06, 0.6) }}
            className={`card p-5 hover:-translate-y-0.5 transition-all ${featured ? 'ring-2 ring-amber-400 ring-offset-2 relative overflow-hidden' : ''
                }`}
        >
            {featured && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-orange-400 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1">
                    <Star size={9} fill="currentColor" /> مناسبة لك
                </div>
            )}

            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 flex-shrink-0 bg-gradient-to-br from-brand-600 to-blue-800 rounded-xl flex items-center justify-center text-xl shadow-md">
                        {job.type === 'وظيفة' ? '💼' : job.type === 'تدريب' ? '🎓' : '🌍'}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-base leading-tight truncate">{job.title}</h3>
                        <p className="text-slate-500 text-sm">{job.organization}</p>
                    </div>
                </div>
                {job.match_score > 0 && <MatchBadge score={job.match_score} />}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
                    {job.type}
                </span>
                {job.location && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={11} /> {job.location}
                    </span>
                )}
                {job.salary_range && (
                    <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200">
                        {job.salary_range}
                    </span>
                )}
                {job.deadline && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> حتى {new Date(job.deadline).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>

            {/* Match progress bar */}
            {job.match_score > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>نسبة التوافق</span>
                        <span className="font-bold">{job.match_score}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }} animate={{ width: `${job.match_score}%` }}
                            transition={{ delay: 0.3, duration: 0.7 }}
                            className="h-full rounded-full"
                            style={{ background: job.match_score >= 75 ? '#10b981' : job.match_score >= 50 ? '#f59e0b' : '#94a3b8' }}
                        />
                    </div>
                </div>
            )}

            {/* Required skills */}
            {job.required_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.required_skills.map((sk, i) => (
                        <span key={i} className="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {SKILL_ICONS[sk] || '✨'} {sk}
                        </span>
                    ))}
                </div>
            )}

            {/* Description toggle */}
            {job.description && (
                <div>
                    <AnimatePresence>
                        {expanded && (
                            <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="text-slate-600 text-sm leading-relaxed mb-2 overflow-hidden">
                                {job.description}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <button onClick={() => setExpanded(!expanded)}
                        className="text-brand-600 text-xs font-semibold hover:underline flex items-center gap-1">
                        {expanded ? <><X size={11} /> إخفاء التفاصيل</> : <><ChevronLeft size={11} /> قراءة المزيد</>}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default function Jobs() {
    const { isAuth } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [userSkills, setUserSkills] = useState([]);
    const [careerPath, setCareerPath] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [jobsRes] = await Promise.all([
                jobsAPI.list(),
            ]);
            setJobs(jobsRes.data.jobs || []);
            setUserSkills(jobsRes.data.user_skills || []);

            if (isAuth) {
                const [recRes, careerRes] = await Promise.all([
                    jobsAPI.getRecommend().catch(() => ({ data: { recommendations: [] } })),
                    jobsAPI.getCareerPath().catch(() => ({ data: null })),
                ]);
                setRecommended(recRes.data.recommendations || []);
                setCareerPath(careerRes.data);
            }
        } catch {
            toast.error('خطأ في تحميل فرص العمل');
        } finally { setLoading(false); }
    };

    const filtered = jobs.filter(job => {
        if (filterType && job.type !== filterType) return false;
        if (search && !job.title.includes(search) && !job.organization.includes(search)) return false;
        return true;
    });

    const TABS = [
        { key: 'all', label: 'جميع الفرص', count: filtered.length },
        ...(isAuth ? [{ key: 'recommended', label: 'مناسبة لك ⭐', count: recommended.length }] : []),
        ...(isAuth ? [{ key: 'career', label: 'مسار التطوير 🗺️', count: null }] : []),
    ];

    const LEVEL_COLOR = { 'مبتدئ': 'bg-blue-100 text-blue-700', 'متوسط': 'bg-amber-100 text-amber-700', 'متقدم': 'bg-emerald-100 text-emerald-700' };
    const PRIORITY_COLOR = { 'عالية': 'from-red-500 to-rose-600', 'متوسطة': 'from-amber-500 to-orange-500', 'قريبة': 'from-violet-500 to-purple-600', 'منجزة': 'from-emerald-500 to-teal-600', 'معلومة': 'from-slate-400 to-slate-500' };

    if (loading) return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <Briefcase size={48} className="text-brand-500 animate-pulse" />
                <p className="font-semibold">جاري تحميل فرص العمل...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-16">
            {/* ── Hero ──────────────────────────────────────────────────── */}
            <div className="bg-gradient-to-l from-blue-900 to-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="hero-glow-orb w-64 h-64 -top-20 -right-20 bg-blue-500/20" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-amber-400" />
                            <span className="text-amber-400 text-sm font-bold uppercase tracking-widest">قسم فرص العمل</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black mb-3">تطوّعك يفتح أبواب المستقبل</h1>
                        <p className="text-white/70 text-base leading-relaxed">
                            حوّل ساعات تطوعك إلى مهارات حقيقية وفرص عمل مناسبة. نظامنا يحلل نشاطك ويرشّح لك أفضل الفرص.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* ── Sidebar: Skills Profile ──────────────────────────── */}
                    {isAuth && userSkills.length > 0 && (
                        <div className="lg:w-72 flex-shrink-0 space-y-4">
                            <div className="card p-5">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Award size={16} className="text-violet-600" /> ملف مهاراتك
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {userSkills.map((sk, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-1.5 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl px-3 py-2 hover:border-brand-300 hover:bg-brand-50 transition-colors cursor-default">
                                            <span className="text-sm">{sk.icon}</span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{sk.name}</p>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${LEVEL_COLOR[sk.level] || 'bg-slate-100 text-slate-600'}`}>{sk.level}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                {userSkills.length === 0 && (
                                    <p className="text-slate-400 text-sm text-center py-4">شارك في فعاليات لبناء ملف مهاراتك</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Main Content ─────────────────────────────────────── */}
                    <div className="flex-1 min-w-0 space-y-6">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-2xl shadow-sm">
                            {TABS.map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.key ? 'text-brand-700 border-brand-700 bg-brand-50' : 'text-slate-500 border-transparent hover:bg-slate-50'
                                        }`}>
                                    {tab.label}
                                    {tab.count !== null && <span className="bg-brand-100 text-brand-700 text-xs rounded-full px-2 py-0.5 font-bold">{tab.count}</span>}
                                </button>
                            ))}
                        </div>

                        {/* ── All Jobs ───────────────────────────────────────── */}
                        {activeTab === 'all' && (
                            <div className="space-y-4">
                                {/* Filters */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="relative flex-1 min-w-[180px]">
                                        <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                                        <input value={search} onChange={e => setSearch(e.target.value)}
                                            className="input-field pr-9 text-sm py-2" placeholder="ابحث عن وظيفة..." />
                                    </div>
                                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                        className="input-field text-sm py-2 appearance-none">
                                        <option value="">كل الأنواع</option>
                                        <option value="وظيفة">وظيفة</option>
                                        <option value="تدريب">تدريب</option>
                                        <option value="تطوع مدفوع">تطوع مدفوع</option>
                                    </select>
                                    {(search || filterType) && (
                                        <button onClick={() => { setSearch(''); setFilterType(''); }}
                                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm border border-slate-200 rounded-xl px-3 py-2">
                                            <X size={13} /> مسح
                                        </button>
                                    )}
                                </div>

                                {filtered.length === 0 ? (
                                    <div className="card p-16 text-center text-slate-400">
                                        <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>لا توجد فرص مطابقة</p>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {filtered.map((job, i) => <JobCard key={job.id} job={job} index={i} />)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Recommended ────────────────────────────────────── */}
                        {activeTab === 'recommended' && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                    <Sparkles size={20} className="text-amber-500 flex-shrink-0" />
                                    <p className="text-amber-800 text-sm font-semibold">
                                        هذه الفرص مُختارة بناءً على مهاراتك المكتسبة من فعالياتك التطوعية
                                    </p>
                                </div>
                                {recommended.length === 0 ? (
                                    <div className="card p-16 text-center text-slate-400">
                                        <Star size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>شارك في فعاليات أكثر لنتمكن من توصية فرص مناسبة لك</p>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {recommended.map((job, i) => <JobCard key={job.id} job={job} index={i} featured={i === 0} />)}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Career Path ────────────────────────────────────── */}
                        {activeTab === 'career' && careerPath && (
                            <div className="space-y-4">
                                {/* Summary */}
                                <div className="card p-5">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {[
                                            { label: 'إجمالي ساعاتك', value: `${parseFloat(careerPath.summary?.total_hours || 0).toFixed(1)}h`, icon: '⏱️' },
                                            { label: 'نقاطك', value: careerPath.summary?.points || 0, icon: '⭐' },
                                            { label: 'مستواك', value: careerPath.summary?.level || '—', icon: '🏆' },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                                                <span className="text-xl">{s.icon}</span>
                                                <div>
                                                    <p className="font-black text-slate-800">{s.value}</p>
                                                    <p className="text-xs text-slate-500">{s.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="space-y-3">
                                    {careerPath.career_path?.map((step, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="card p-5 flex items-start gap-4">
                                            <div className={`w-10 h-10 flex-shrink-0 bg-gradient-to-br ${PRIORITY_COLOR[step.priority] || 'from-slate-400 to-slate-500'} rounded-xl flex items-center justify-center text-xl shadow-md`}>
                                                {step.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h4 className="font-bold text-slate-800">{step.title}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${PRIORITY_COLOR[step.priority]} text-white`}>
                                                        {step.priority}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 text-sm leading-relaxed mb-2">{step.desc}</p>
                                                {step.action && (
                                                    <p className="text-brand-600 text-xs font-semibold flex items-center gap-1">
                                                        <TrendingUp size={12} /> {step.action}
                                                    </p>
                                                )}
                                                {/* Progress bar if has target */}
                                                {step.target_hours && (
                                                    <div className="mt-2">
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(100, (step.current_hours / step.target_hours) * 100)}%` }}
                                                                transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                                                                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500" />
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1 text-left" dir="ltr">
                                                            {step.current_hours?.toFixed(1)} / {step.target_hours}h
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'career' && !careerPath && (
                            <div className="card p-16 text-center text-slate-400">
                                <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                                <p>شارك في فعاليات لتفعيل مسار التطوير المهني</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
