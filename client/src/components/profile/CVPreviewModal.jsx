import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Palette, FileText, Layout, Check, Loader2, Users, Star } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import ProfessionalCV from './ProfessionalCV';
import { usersAPI } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const COLORS = [
    { name: 'أزرق', value: '#1d4ed8' },
    { name: 'أخضر', value: '#059669' },
    { name: 'بنفسجي', value: '#7c3aed' },
    { name: 'أسود', value: '#0f172a' },
    { name: 'جرافيت', value: '#4b5563' },
];

export default function CVPreviewModal({ onClose }) {
    const { updateUser } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cvColor, setCvColor] = useState('#1d4ed8');
    const [summary, setSummary] = useState('');
    const [customInfo, setCustomInfo] = useState({
        phone: '',
        address: '',
        education: '',
        extraNotes: '',
        image: null,
        socialLinks: { linkedin: '', github: '', twitter: '', portfolio: '' },
        projects: [],
        languages: ['العربية', 'الإنجليزية'],
        certificates: [],
        experiences: [],
        achievements: []
    });
    const [showOptions, setShowOptions] = useState(true);
    const [activeTab, setActiveTab] = useState('basic');
    const [exporting, setExporting] = useState(false);
    const cvRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        usersAPI.getCVData()
            .then(res => {
                setData(res.data);
                setSummary(res.data.summary);
                setCustomInfo(prev => ({
                    ...prev,
                    phone: res.data.user.phone || '',
                    address: res.data.user.neighborhood_name || '',
                    education: res.data.user.university || '',
                    image: res.data.user.avatar_url || null
                }));
            })
            .catch(() => toast.error('تعذر جلب بيانات السيرة الذاتية'))
            .finally(() => setLoading(false));
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                setCustomInfo({ ...customInfo, image: base64 });
                updateUser({ avatar_url: base64 }); // Sync globally
                usersAPI.updateProfile({ avatar_url: base64 })
                    .catch(err => console.error('Failed to sync profile image:', err));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrint = () => {
        if (!cvRef.current) return;

        // Native browser print is the ONLY 100% reliable way for Arabic/RTL PDF
        const printContent = cvRef.current.innerHTML;
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            toast.error('يرجى السماح بالنوافذ المنبثقة (Pop-ups) لتتمكن من تصدير الملف بشكل صحيح');
            return;
        }

        // Inject styles and content
        printWindow.document.write(`
            <html dir="rtl">
                <head>
                    <title>CV - Linka</title>
                    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap');
                        body { 
                            margin: 0; 
                            padding: 0; 
                            font-family: 'Cairo', sans-serif !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .font-cairo { font-family: 'Cairo', sans-serif !important; }
                        @page { size: auto; margin: 0mm; }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">${printContent}</div>
                    <script>
                        // Wait for Tailwind and Fonts to load
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                // window.close(); // Optional: close after print
                            }, 1000);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownload = () => {
        if (!cvRef.current) return;
        setExporting(true);

        const generatePDF = () => {
            const element = cvRef.current;
            const originalScrollY = window.scrollY;
            window.scrollTo(0, 0);

            const opt = {
                margin: 0,
                filename: `CV_Linka_${data.user.name}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: false,
                    backgroundColor: '#ffffff',
                    imageTimeout: 15000,
                    logging: false,
                    scrollX: 0,
                    scrollY: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(element).set(opt).save()
                .then(() => {
                    toast.success('تم تحميل السيرة الذاتية بنجاح');
                    window.scrollTo(0, originalScrollY);
                    setExporting(false);
                })
                .catch(() => {
                    toast.error('خطأ أثناء تصدير PDF');
                    window.scrollTo(0, originalScrollY);
                    setExporting(false);
                });
        };

        if (document.fonts) {
            document.fonts.ready.then(generatePDF);
        } else {
            setTimeout(generatePDF, 1000);
        }
    };

    const handleShare = () => {
        const url = `https://linka.ps/cv/${data.user.id}`;
        navigator.clipboard.writeText(url);
        toast.success('تم نسخ رابط السيرة الذاتية');
    };

    // Form Helpers
    const addItem = (field, template) => {
        setCustomInfo({ ...customInfo, [field]: [...customInfo[field], template] });
    };

    const updateItem = (field, index, value) => {
        const newList = [...customInfo[field]];
        newList[index] = value;
        setCustomInfo({ ...customInfo, [field]: newList });
    };

    const updateObjectItem = (field, index, subField, value) => {
        const newList = [...customInfo[field]];
        newList[index] = { ...newList[index], [subField]: value };
        setCustomInfo({ ...customInfo, [field]: newList });
    };

    const removeItem = (field, index) => {
        setCustomInfo({ ...customInfo, [field]: customInfo[field].filter((_, i) => i !== index) });
    };

    if (loading) return (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md flex items-center justify-center">
            <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
                <Loader2 size={32} className="text-brand-600 animate-spin" />
                <p className="font-bold text-slate-600">جاري معالجة بياناتك لبناء CV احترافي...</p>
            </div>
        </div>
    );

    const tabs = [
        { id: 'basic', label: 'أساسي', icon: <Users size={14} /> },
        { id: 'social', label: 'تواصل', icon: <Share2 size={14} /> },
        { id: 'exp', label: 'خبرات', icon: <Star size={14} /> },
        { id: 'extra', label: 'إضافي', icon: <Palette size={14} /> },
    ];

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-slate-100 sm:rounded-[2.5rem] w-full max-w-6xl h-full sm:h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-white/20"
            >
                {/* Header Toolbar */}
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shadow-inner">
                            <FileText size={20} />
                        </div>
                        <div className="hidden sm:block">
                            <h3 className="font-black text-slate-800 text-base leading-tight">تحرير السيرة الذاتية التلقائية</h3>
                            <p className="text-slate-400 text-[10px] font-bold">تم استخلاص البيانات من نشاطك في المنصة</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 py-2 px-4 rounded-xl shadow-lg shadow-emerald-700/20 text-xs transition-all font-bold"
                            title="استخدم هذا الزر إذا واجهت مشكلة في الخط العربي"
                        >
                            <Download size={14} />
                            تصدير احترافي (حل مشكلة الخط)
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={exporting}
                            className="btn-primary flex items-center gap-2 py-2 px-4 shadow-lg shadow-brand-700/20 text-xs"
                        >
                            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Palette size={14} />}
                            تصدير سريع
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden flex-col sm:flex-row">
                    {/* Customization Sidebar */}
                    <div className="w-full sm:w-[400px] bg-white border-l border-slate-200 flex flex-col overflow-hidden h-1/2 sm:h-full">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-100 p-2 gap-1 bg-slate-50/50">
                            {tabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? 'bg-white text-brand-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {t.icon}
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                            <AnimatePresence mode="wait">
                                {activeTab === 'basic' && (
                                    <motion.div
                                        key="basic"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">المعلومات الشخصية</label>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-200 flex-shrink-0">
                                                        {customInfo.image || data.user.avatar_url ? (
                                                            <img src={customInfo.image || data.user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><Users size={24} /></div>
                                                        )}
                                                    </div>
                                                    <button onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold text-brand-600 underline">تغيير الصورة</button>
                                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500">رقم الهاتف</label>
                                                        <input value={customInfo.phone} onChange={(e) => setCustomInfo({ ...customInfo, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500">العنوان</label>
                                                        <input value={customInfo.address} onChange={(e) => setCustomInfo({ ...customInfo, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500">الجامعة / التعليم</label>
                                                    <input value={customInfo.education} onChange={(e) => setCustomInfo({ ...customInfo, education: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">النبذة الشخصية</label>
                                            <textarea
                                                value={summary}
                                                onChange={(e) => setSummary(e.target.value)}
                                                rows={4}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs leading-relaxed"
                                                placeholder="اكتب نبذة مختصرة عنك..."
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'social' && (
                                    <motion.div
                                        key="social"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">روابط التواصل الاجتماعي</label>
                                        <div className="space-y-4">
                                            {['linkedin', 'github', 'twitter', 'portfolio'].map(key => (
                                                <div key={key} className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 capitalize">{key}</label>
                                                    <input
                                                        value={customInfo.socialLinks[key]}
                                                        onChange={(e) => setCustomInfo({ ...customInfo, socialLinks: { ...customInfo.socialLinks, [key]: e.target.value } })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs"
                                                        placeholder={`رابط ${key}...`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'exp' && (
                                    <motion.div
                                        key="exp"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        {/* Projects */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">المشاريع</label>
                                                <button onClick={() => addItem('projects', { title: '', desc: '', link: '' })} className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">+ إضافة</button>
                                            </div>
                                            <div className="space-y-4">
                                                {customInfo.projects.map((p, i) => (
                                                    <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                                                        <button onClick={() => removeItem('projects', i)} className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                                        <input placeholder="عنوان المشروع" value={p.title} onChange={(e) => updateObjectItem('projects', i, 'title', e.target.value)} className="w-full bg-transparent font-bold text-xs mb-1" />
                                                        <textarea placeholder="وصف المروع" value={p.desc} onChange={(e) => updateObjectItem('projects', i, 'desc', e.target.value)} className="w-full bg-transparent text-[11px] leading-relaxed resize-none" rows={2} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Experiences */}
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">الخبرات العملية</label>
                                                <button onClick={() => addItem('experiences', { title: '', company: '', duration: '', desc: '' })} className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">+ إضافة</button>
                                            </div>
                                            <div className="space-y-4">
                                                {customInfo.experiences.map((exp, i) => (
                                                    <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                                                        <button onClick={() => removeItem('experiences', i)} className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                                        <input placeholder="المسمى الوظيفي" value={exp.title} onChange={(e) => updateObjectItem('experiences', i, 'title', e.target.value)} className="w-full bg-transparent font-bold text-xs mb-1" />
                                                        <input placeholder="الجهة / المؤسسة" value={exp.company} onChange={(e) => updateObjectItem('experiences', i, 'company', e.target.value)} className="w-full bg-transparent text-[11px] mb-1" />
                                                        <input placeholder="المدة (مثلاً: 2023 - الآن)" value={exp.duration} onChange={(e) => updateObjectItem('experiences', i, 'duration', e.target.value)} className="w-full bg-transparent text-[10px] text-slate-400" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'extra' && (
                                    <motion.div
                                        key="extra"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">اللغات</label>
                                                    <button onClick={() => addItem('languages', '')} className="text-brand-600 text-[10px] font-bold">+ أضف</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {customInfo.languages.map((l, i) => (
                                                        <input key={i} value={l} onChange={(e) => updateItem('languages', i, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs" />
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">إنجازات</label>
                                                    <button onClick={() => addItem('achievements', '')} className="text-brand-600 text-[10px] font-bold">+ أضف</button>
                                                </div>
                                                <div className="space-y-2">
                                                    {customInfo.achievements.map((a, i) => (
                                                        <input key={i} value={a} onChange={(e) => updateItem('achievements', i, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">شهادات أخرى</label>
                                            <div className="space-y-2">
                                                {customInfo.certificates.map((c, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <input value={c} onChange={(e) => updateItem('certificates', i, e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs" />
                                                        <button onClick={() => removeItem('certificates', i)} className="text-red-500 p-2">×</button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addItem('certificates', '')} className="w-full border-2 border-dashed border-slate-100 rounded-xl py-2 text-[11px] font-bold text-slate-400 hover:border-slate-200 hover:text-slate-500 transition-all">+ إضافة شهادة جديدة</button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-4">لون التصميم</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {COLORS.map((c) => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => setCvColor(c.value)}
                                                        className={`w-9 h-9 rounded-xl transition-all ${cvColor === c.value ? 'ring-4 ring-offset-2 ring-slate-200 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                                        style={{ backgroundColor: c.value }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* CV Preview Area */}
                    <div className="flex-1 bg-slate-200/50 p-4 sm:p-12 overflow-y-auto flex items-start justify-center">
                        <div className="w-full max-w-[210mm] shadow-2xl origin-top transition-transform duration-500 scale-[0.6] sm:scale-100">
                            <ProfessionalCV
                                ref={cvRef}
                                data={{ ...data, summary, customInfo }}
                                color={cvColor}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
