import React, { forwardRef } from 'react';
import { Mail, Phone, MapPin, Award, Clock, Star, Zap, GraduationCap, Users, Github, Linkedin, Twitter, Globe, Briefcase, FileCheck, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const ProfessionalCV = forwardRef(({ data, color = '#1d4ed8' }, ref) => {
    if (!data) return null;

    const { user, badges, skills, transcript, volunteerScore, summary, customInfo = {} } = data;
    const userImage = customInfo.image || user.avatar_url;

    const SocialIcon = ({ type, size = 12 }) => {
        const icons = {
            linkedin: <Linkedin size={size} />,
            github: <Github size={size} />,
            twitter: <Twitter size={size} />,
            portfolio: <Globe size={size} />,
        };
        return icons[type] || null;
    };

    return (
        <div
            ref={ref}
            className="bg-white p-10 font-cairo shadow-2xl relative overflow-hidden text-right leading-relaxed"
            dir="rtl"
            style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', unicodeBidi: 'plaintext' }}
        >
            {/* ── Background decoration ── */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30" />
            <div className="absolute top-0 right-0 w-full h-1" style={{ backgroundColor: color }} />

            {/* ── Header ── */}
            <header className="flex justify-between items-start mb-10">
                <div className="flex items-start gap-8 flex-1">
                    {/* Profile Image */}
                    <div
                        className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 bg-slate-100 shadow-xl flex-shrink-0 flex items-center justify-center text-slate-300"
                        style={{ borderColor: color }}
                    >
                        {userImage ? (
                            <img src={userImage} alt={user.name} className="w-full h-full object-cover" />
                        ) : <Users size={40} />}
                    </div>

                    <div className="flex-1 pt-2">
                        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">{user.name}</h1>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-slate-500 text-xs font-bold">
                            <span className="flex items-center gap-1.5"><Mail size={13} style={{ color }} /> {user.email}</span>
                            <span className="flex items-center gap-1.5"><Phone size={13} style={{ color }} /> {customInfo.phone || user.phone || '059XXXXXXX'}</span>
                            <span className="flex items-center gap-1.5"><MapPin size={13} style={{ color }} /> {customInfo.address || user.neighborhood_name || 'الخليل، فلسطين'}</span>
                            {(customInfo.education || user.university) && (
                                <span className="flex items-center gap-1.5"><GraduationCap size={13} style={{ color }} /> {customInfo.education || user.university}</span>
                            )}
                        </div>

                        {/* Social Links Chips */}
                        {customInfo.socialLinks && Object.values(customInfo.socialLinks).some(v => v) && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {Object.entries(customInfo.socialLinks).map(([key, value]) => value && (
                                    <div key={key} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg text-[10px] text-slate-600 border border-slate-100">
                                        <SocialIcon type={key} style={{ color }} />
                                        <span className="font-bold opacity-70" dir="ltr">{value.replace(/https?:\/\/(www\.)?/, '')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm border border-slate-100">
                        <QRCodeSVG value={`https://linka.ps/profile/${user.id}`} size={70} fgColor={color} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">تـوثـيـق رقـمـي</span>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-10">
                {/* ── Sidebar (Right side in RTL) ── */}
                <div className="col-span-4 space-y-10 border-r border-slate-100 pr-0">

                    {/* Volunteer Score */}
                    <section>
                        <h3 className="text-[11px] font-black text-slate-400 mb-5 uppercase tracking-widest block text-right">
                            <Zap size={14} className="inline-block align-baseline ml-2" style={{ color }} />
                            <span className="inline-block align-middle">مؤشر النشاط Linka</span>
                        </h3>
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-2xl font-black" style={{ color }}>{volunteerScore}%</span>
                                <span className="text-[10px] text-slate-400 font-bold">نسبة التأثير</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                                <div className="h-full transition-all duration-1000" style={{ width: `${volunteerScore}%`, backgroundColor: color }} />
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold leading-relaxed">يعكس هذا المؤشر قوة التزام المتطوع وتفاعله مع احتياجات المجتمع المحلي.</p>
                        </div>
                    </section>

                    {/* Stats */}
                    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-inner">
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-amber-500"><Star size={18} /></div>
                                <div><p className="text-[10px] text-slate-500 font-bold">النقاط</p><p className="font-black text-white text-base">{user.points}</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-brand-400"><Clock size={18} /></div>
                                <div><p className="text-[10px] text-slate-500 font-bold">ساعات التطوع</p><p className="font-black text-white text-base">{user.total_hours}h</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400"><CheckCircle2 size={18} /></div>
                                <div><p className="text-[10px] text-slate-500 font-bold">الفعاليات</p><p className="font-black text-white text-base">{user.participations}</p></div>
                            </div>
                        </div>
                    </section>

                    {/* Languages */}
                    {customInfo.languages && customInfo.languages.length > 0 && (
                        <section>
                            <h3 className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-widest block text-right">
                                <Globe size={14} className="inline-block align-baseline ml-2" style={{ color }} />
                                <span className="inline-block align-middle">اللغات</span>
                            </h3>
                            <div className="space-y-2">
                                {customInfo.languages.map((lang, i) => (
                                    <div key={i} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
                                        <span>{lang}</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4].map(dot => (
                                                <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= (i === 0 ? 4 : 3) ? 'bg-slate-400' : 'bg-slate-200'}`} style={{ backgroundColor: dot <= (i === 0 ? 4 : 3) ? color : '' }} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skills Breakdown */}
                    <section>
                        <h3 className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-widest block text-right">
                            <Star size={14} className="inline-block align-baseline ml-2" style={{ color }} />
                            <span className="inline-block align-middle">المهارات الموثقة</span>
                        </h3>
                        <div className="space-y-4">
                            {skills.map((skill, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-[10px] font-black mb-1.5 uppercase">
                                        <span className="text-slate-700">{skill.icon} {skill.name}</span>
                                        <span style={{ color }}>{skill.level}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full" style={{ width: `${Math.min(100, (skill.score || 0) * 10)}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── Main Content ── */}
                <div className="col-span-8 space-y-10">

                    {/* Summary */}
                    <section>
                        <h3 className="text-base font-black text-slate-800 mb-4 block">
                            <span className="w-1.5 h-6 rounded-full inline-block align-middle ml-3" style={{ backgroundColor: color }} />
                            <span className="inline-block align-middle">النبذة الشخصية</span>
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-[13px] font-medium">
                            {summary}
                        </p>
                    </section>

                    {/* Experience Section (Auto + Custom) */}
                    <section>
                        <h3 className="text-base font-black text-slate-800 mb-6 block">
                            <span className="w-1.5 h-6 rounded-full inline-block align-middle ml-3" style={{ backgroundColor: color }} />
                            <span className="inline-block align-middle">الخبرات والنشاطات</span>
                        </h3>
                        <div className="space-y-6">
                            {/* Custom Experiences first */}
                            {customInfo.experiences && customInfo.experiences.map((exp, i) => (exp.title && (
                                <div key={`exp-${i}`} className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-black text-slate-800 text-[13px]">{exp.title}</h4>
                                            <p className="text-slate-500 text-[11px] font-bold mt-0.5">{exp.company}</p>
                                        </div>
                                        <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-400">{exp.duration}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-bold opacity-80">{exp.desc}</p>
                                </div>
                            )))}

                            {/* Auto Transcript (Top 3) */}
                            {transcript.slice(0, 3).map((job, i) => (
                                <div key={`job-${i}`} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100">
                                        <Briefcase size={16} />
                                    </div>
                                    <div className="flex-1 pb-4 border-b border-slate-50 last:border-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-black text-slate-800 text-[13px]">{job.title}</h4>
                                            <span className="text-[10px] font-bold text-slate-400" dir="ltr">{new Date(job.date).getFullYear()}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-bold mb-1 opacity-75">{job.type} · {job.location_name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">إنجاز {job.volunteer_hours} ساعة عمل تطوعي معتمد وموثق.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Projects Section */}
                    {customInfo.projects && customInfo.projects.length > 0 && (
                        <section>
                            <h3 className="text-base font-black text-slate-800 mb-6 block">
                                <span className="w-1.5 h-6 rounded-full inline-block align-middle ml-3" style={{ backgroundColor: color }} />
                                <span className="inline-block align-middle">المشاريع والمبادرات</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {customInfo.projects.map((proj, i) => (
                                    <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 mb-3"><Globe size={16} /></div>
                                            <h4 className="font-black text-slate-800 text-xs mb-2">{proj.title}</h4>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold mb-3">{proj.desc}</p>
                                        </div>
                                        {proj.link && (
                                            <div className="text-[9px] font-black text-brand-600 bg-brand-50/50 px-2 py-1 rounded-md self-start" dir="ltr">
                                                {proj.link}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Achievements & Badges */}
                    <div className="grid grid-cols-2 gap-8">
                        {(customInfo.achievements?.length > 0 || badges.length > 0) && (
                            <section>
                                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                    <Award size={16} style={{ color }} /> الأوسمة والإنجازات
                                </h3>
                                <div className="space-y-2">
                                    {customInfo.achievements?.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                            {a}
                                        </div>
                                    ))}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {badges.map(b => (
                                            <div key={b.id} className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg border border-slate-100 shadow-sm" title={b.name}>
                                                {b.icon}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {customInfo.certificates?.length > 0 && (
                            <section>
                                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                                    <FileCheck size={16} style={{ color }} /> الشهادات
                                </h3>
                                <div className="space-y-3">
                                    {customInfo.certificates.map((cert, i) => (
                                        <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center" style={{ color }}><Award size={14} /></div>
                                            <span className="text-[11px] font-black text-slate-700">{cert}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-[9px] text-slate-300 font-bold border-t pt-4 border-slate-50">
                <span className="flex items-center gap-1.5">تم التوليد ذكياً بواسطة Linka Auto CV Hub · {new Date().getFullYear()}</span>
                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md text-slate-400">كود التحقق الرقمي الموحد: {Math.random().toString(36).substring(7).toUpperCase()}</span>
            </div>
        </div>
    );
});

ProfessionalCV.displayName = 'ProfessionalCV';
export default ProfessionalCV;
