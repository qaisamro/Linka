import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { trainingAPI } from '../api';
import toast from 'react-hot-toast';
import {
  Target, MapPin, Calendar, CheckCircle2, XCircle, Clock, Search,
  Navigation, LogIn, LogOut, Star, Send, BadgeCheck
} from 'lucide-react';

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
    );
  });
}

function StatusPill({ status }) {
  const map = {
    pending: { label: 'قيد المراجعة', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    accepted: { label: 'مقبول', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'مرفوض', cls: 'bg-red-50 text-red-700 border-red-200' },
    withdrawn: { label: 'منسحب', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
    in_progress: { label: 'جاري', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'مكتمل', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };
  const v = map[status] || { label: status, cls: 'bg-slate-50 text-slate-700 border-slate-200' };
  return <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${v.cls}`}>{v.label}</span>;
}

function MatchBadge({ score }) {
  const cls = score >= 75 ? 'bg-emerald-600' : score >= 50 ? 'bg-amber-500' : 'bg-slate-500';
  return (
    <span className={`inline-flex items-center gap-1 text-white text-[10px] font-black px-2.5 py-1 rounded-xl ${cls}`}>
      <Target size={11} />
      <span dir="ltr">{score}%</span>
    </span>
  );
}

export default function TrainingHub() {
  const { isAuth, user } = useAuth();
  const [activeTab, setActiveTab] = useState('offers'); // offers | apps | programs
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [offers, setOffers] = useState([]);
  const [apps, setApps] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [selectedProgram, setSelectedProgram] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    if (!isAuth) {
      setLoading(false);
      return;
    }
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth, activeTab]);

  const refreshAll = async () => {
    setLoading(true);
    try {
      if (activeTab === 'offers') {
        const res = await trainingAPI.listOffers({ search });
        setOffers(res.data.offers || []);
      } else if (activeTab === 'apps') {
        const res = await trainingAPI.listMyApplications();
        setApps(res.data.applications || []);
      } else if (activeTab === 'programs') {
        const res = await trainingAPI.getMyPrograms();
        setPrograms(res.data.programs || []);
        setTotalHours(res.data.total_training_hours || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في تحميل بيانات التدريب');
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = useMemo(() => {
    const q = search.trim();
    if (!q) return offers;
    return offers.filter((o) => (o.title || '').includes(q) || (o.company_name || '').includes(q));
  }, [offers, search]);

  const handleExportReport = async () => {
    try {
      const res = await trainingAPI.exportReport();
      const data = res.data.report || [];
      if (data.length === 0) {
        toast.error('لا توجد بيانات لتصديرها');
        return;
      }

      const headers = ['Session ID', 'Student Name', 'Student Code', 'Training', 'Company', 'Check In', 'Check Out', 'Hours', 'Location', 'Status', 'Geo Verified'];
      const rows = data.map(s => [
        s.session_id,
        s.student_name,
        s.student_code,
        s.training_title,
        s.company,
        s.check_in_at ? new Date(s.check_in_at).toLocaleString('ar-EG') : '',
        s.check_out_at ? new Date(s.check_out_at).toLocaleString('ar-EG') : '',
        s.computed_hours,
        s.location,
        s.session_status,
        s.geo_verified ? 'Yes' : 'No'
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `training_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('خطأ في تصدير التقرير');
    }
  };

  const apply = async (offerId) => {
    try {
      await trainingAPI.applyToOffer(offerId);
      toast.success('تم إرسال الطلب');
      setActiveTab('apps');
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر إرسال الطلب');
    }
  };

  const openProgram = async (p) => {
    setSelectedProgram(p);
    setSessionLoading(true);
    try {
      const res = await trainingAPI.listProgramSessions(p.id);
      setSessions(res.data.sessions || []);
    } catch (err) {
      toast.error('تعذر جلب الجلسات');
    } finally {
      setSessionLoading(false);
    }
  };

  const doCheckIn = async (programId) => {
    try {
      const pos = await getCurrentPosition();
      const payload = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        location_name: 'موقع التدريب',
      };
      const res = await trainingAPI.checkIn(programId, payload);
      toast.success(res.data.message || 'تم تسجيل الدخول');
      await openProgram(selectedProgram);
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر تسجيل الدخول (تحقق من GPS)');
    }
  };

  const doCheckOut = async (programId) => {
    try {
      const pos = await getCurrentPosition();
      const payload = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        location_name: 'موقع التدريب',
      };
      const res = await trainingAPI.checkOut(programId, payload);
      toast.success(res.data.message || 'تم تسجيل الخروج');
      await openProgram(selectedProgram);
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر تسجيل الخروج (تحقق من GPS)');
    }
  };

  const complete = async (programId) => {
    try {
      const res = await trainingAPI.completeProgram(programId);
      toast.success(res.data.message || 'تم إنهاء التدريب');
      setSelectedProgram(null);
      setActiveTab('programs');
      await refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر إنهاء التدريب');
    }
  };

  const submitReview = async (programId) => {
    try {
      const res = await trainingAPI.submitReview(programId, { rating: review.rating, comment: review.comment, is_public: 1 });
      toast.success(res.data.message || 'تم إرسال التقييم');
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر إرسال التقييم');
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center">
            <h1 className="text-2xl font-black text-slate-900 mb-2">التدريب الميداني الذكي</h1>
            <p className="text-slate-500 font-bold">سجّل دخولك لمشاهدة عروض التدريب والتقديم وإدارة حضورك.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900">بوابة التدريب الميداني</h1>
              <p className="text-slate-500 font-bold mt-1">مرحباً {user?.name?.split(' ')[0]} — قدّم، سجّل حضورك، واطبع تقييماتك.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex flex-col items-center">
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">ساعات منجزة</span>
                <span className="text-xl font-black text-emerald-700 leading-none">{totalHours}</span>
              </div>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
              </div>
              <button onClick={handleExportReport} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center gap-2">
                <BadgeCheck size={16} className="text-emerald-400" /> تقرير (Excel)
              </button>
              <button onClick={refreshAll} className="px-5 py-2.5 rounded-xl bg-brand-700 text-white font-black text-sm">تحديث</button>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            {[
              { key: 'offers', label: 'عروض التدريب' },
              { key: 'apps', label: 'طلباتي' },
              { key: 'programs', label: 'مساراتي' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => { setSelectedProgram(null); setActiveTab(t.key); }}
                className={`px-4 py-2 rounded-xl font-black text-sm border ${activeTab === t.key ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center text-slate-400 font-bold">جاري التحميل...</div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'offers' && (
                  <motion.div key="offers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                    {filteredOffers.length === 0 ? (
                      <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center text-slate-400 font-bold">لا توجد عروض حالياً.</div>
                    ) : filteredOffers.map((o) => (
                      <div key={o.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-brand-200 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{o.title}</h3>
                            <p className="text-slate-500 font-bold text-sm">{o.company_name || 'شركة'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <MatchBadge score={o.match_score || 0} />
                            <button
                              disabled={o.is_applied}
                              onClick={() => apply(o.id)}
                              className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${o.is_applied
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                            >
                              {o.is_applied ? <CheckCircle2 size={16} /> : <Send size={16} />}
                              {o.is_applied ? 'تم التقديم' : 'تقديم'}
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500 font-bold">
                          {o.location_name && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {o.location_name}</span>}
                          {(o.start_date || o.end_date) && <span className="inline-flex items-center gap-1"><Calendar size={12} /> {o.start_date || '—'} → {o.end_date || '—'}</span>}
                          <span className="inline-flex items-center gap-1"><Target size={12} /> مهارات مطلوبة: {Array.isArray(o.required_skills) ? o.required_skills.length : 0}</span>
                        </div>
                        {o.description && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{o.description}</p>}
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'apps' && (
                  <motion.div key="apps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-3">
                    {apps.length === 0 ? (
                      <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center text-slate-400 font-bold">لا يوجد طلبات.</div>
                    ) : apps.map((a) => (
                      <div key={a.id} className="bg-white rounded-[2rem] p-6 border border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-black text-slate-900">{a.offer_title}</p>
                            <p className="text-xs text-slate-500 font-bold">{a.company_name || 'شركة'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill status={a.status} />
                            <MatchBadge score={a.match_score || 0} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'programs' && (
                  <motion.div key="programs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-3">
                    {programs.length === 0 ? (
                      <div className="bg-white rounded-[2rem] p-10 border border-slate-100 text-center text-slate-400 font-bold">لا يوجد مسارات تدريب.</div>
                    ) : programs.map((p) => (
                      <button key={p.id} onClick={() => openProgram(p)} className="w-full text-right bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-brand-200 transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-black text-slate-900">{p.offer_title}</p>
                            <p className="text-xs text-slate-500 font-bold">{p.company_name || 'شركة'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill status={p.status} />
                            <MatchBadge score={p.match_score || 0} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-2">اضغط لفتح الجلسات والحضور</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <BadgeCheck className="text-emerald-600" size={18} /> إدارة الحضور
            </h3>

            {!selectedProgram ? (
              <p className="text-sm text-slate-500 font-bold">اختر مساراً من “مساراتي” لتسجيل الدخول/الخروج ومتابعة الاعتماد.</p>
            ) : (
              <>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                  <p className="font-black text-slate-900 text-sm">{selectedProgram.offer_title}</p>
                  <p className="text-xs text-slate-500 font-bold">{selectedProgram.company_name || 'شركة'}</p>
                  <div className="mt-2"><StatusPill status={selectedProgram.status} /></div>
                </div>

                <div className="flex gap-2 mb-4">
                  <button onClick={() => doCheckIn(selectedProgram.id)} className="flex-1 px-4 py-3 rounded-2xl bg-brand-700 text-white font-black text-sm flex items-center justify-center gap-2">
                    <LogIn size={16} /> Check-in
                  </button>
                  <button onClick={() => doCheckOut(selectedProgram.id)} className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-2">
                    <LogOut size={16} /> Check-out
                  </button>
                </div>

                <div className="mb-4">
                  <button onClick={() => complete(selectedProgram.id)} className="w-full px-4 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> إنهاء التدريب (بعد الاعتماد)
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold mt-2">يُسمح بالإنهاء فقط عندما يتم اعتماد جميع الجلسات من الجامعة.</p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-black text-slate-900 text-sm mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-slate-500" /> الجلسات
                  </h4>
                  {sessionLoading ? (
                    <p className="text-sm text-slate-400 font-bold">جاري تحميل الجلسات...</p>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-slate-400 font-bold">لا توجد جلسات بعد.</p>
                  ) : (
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {sessions.map((s) => (
                        <div key={s.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-800">#{s.id}</p>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${s.status === 'university_approved' ? 'bg-emerald-100 text-emerald-700' : s.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-bold mt-2 space-y-1">
                            <div className="flex items-center gap-1"><Navigation size={12} /> تحقق مكاني: {Number(s.geo_verified) === 1 ? <span className="text-emerald-700">نعم</span> : <span className="text-red-700">لا</span>}</div>
                            <div>ساعات: <span dir="ltr">{s.computed_hours}</span></div>
                            <div className="text-[10px] text-slate-400">دخول: {new Date(s.check_in_at).toLocaleString('ar-EG')}</div>
                            {s.check_out_at && <div className="text-[10px] text-slate-400">خروج: {new Date(s.check_out_at).toLocaleString('ar-EG')}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4">
                  <h4 className="font-black text-slate-900 text-sm mb-2 flex items-center gap-2"><Star size={16} className="text-amber-500" /> تقييم الشركة</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReview((r) => ({ ...r, rating: n }))} className={`w-9 h-9 rounded-xl border font-black ${review.rating >= n ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <textarea value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))} rows={3} placeholder="اكتب مراجعة مختصرة (اختياري)..." className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm" />
                  <button onClick={() => submitReview(selectedProgram.id)} className="w-full mt-2 px-4 py-3 rounded-2xl bg-amber-500 text-white font-black text-sm flex items-center justify-center gap-2">
                    <Send size={16} /> إرسال التقييم
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

