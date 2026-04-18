import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Plus, Users, Search, MapPin, 
  Calendar, Trash2, Edit, ChevronRight, 
  CheckCircle2, AlertCircle, BarChart3, TrendingUp,
  Mail, ExternalLink, Activity
} from 'lucide-react';
import { jobsAPI, trainingAPI } from '../api';
import toast from 'react-hot-toast';

export default function CompanyPortal() {
  const [activeTab, setActiveTab] = useState('jobs'); // jobs | training
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trainingOffers, setTrainingOffers] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '', description: '', type: 'وظيفة', 
    location: 'الخليل', deadline: '', 
    required_skills: [], salary_range: '', contact_email: ''
  });

  const [newTraining, setNewTraining] = useState({
    title: '',
    description: '',
    required_skills: [],
    objectives: { skills: [], tasks: [], outcomes: [] },
    max_trainees: 10,
    location_name: 'الخليل',
    geo_radius_m: 200,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (activeTab === 'training') fetchTrainingOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Future: filter by created_by or entity_id
      const res = await jobsAPI.list();
      setJobs(res.data.jobs); // Filtered manually for demo
    } catch (err) {
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingOffers = async () => {
    setTrainingLoading(true);
    try {
      const res = await trainingAPI.listCompanyOffers();
      setTrainingOffers(res.data.offers || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في جلب عروض التدريب');
    } finally {
      setTrainingLoading(false);
    }
  };

  const openApplications = async (offer) => {
    setSelectedOffer(offer);
    setAppsLoading(true);
    try {
      const res = await trainingAPI.listOfferApplications(offer.id);
      setApplications(res.data.applications || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في جلب الطلبات');
    } finally {
      setAppsLoading(false);
    }
  };

  const decide = async (appId, accept) => {
    try {
      if (accept) await trainingAPI.acceptApplication(appId);
      else await trainingAPI.rejectApplication(appId, { notes: 'لم يتم القبول لهذه الدفعة' });
      toast.success(accept ? 'تم القبول' : 'تم الرفض');
      if (selectedOffer) await openApplications(selectedOffer);
      await fetchTrainingOffers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذر تنفيذ الإجراء');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await jobsAPI.create(newJob);
      toast.success('تم نشر الفرصة بنجاح 🚀');
      setIsModalOpen(false);
      setNewJob({ 
        title: '', description: '', type: 'وظيفة', 
        location: 'الخليل', deadline: '', 
        required_skills: [], salary_range: '', contact_email: '' 
      });
      fetchJobs();
    } catch (err) {
      toast.error('خطأ في النشر');
    }
  };

  const handleCreateTraining = async (e) => {
    e.preventDefault();
    try {
      await trainingAPI.createOffer({
        ...newTraining,
        status: 'active',
      });
      toast.success('تم نشر عرض التدريب ✅');
      setTrainingModalOpen(false);
      setNewTraining({
        title: '',
        description: '',
        required_skills: [],
        objectives: { skills: [], tasks: [], outcomes: [] },
        max_trainees: 10,
        location_name: 'الخليل',
        geo_radius_m: 200,
      });
      fetchTrainingOffers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في النشر');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Company Header */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-brand-500 to-emerald-500" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center text-3xl border border-violet-100 shadow-sm">
                🏢
              </div>
              <div className="text-center md:text-right">
                <h1 className="text-3xl font-black text-slate-800">بوابة التوظيف والشركات</h1>
                <p className="text-slate-500 mt-1">أهلاً بك! انشر فرصك واستقطب أفضل الكفاءات الشبابية في الخليل.</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (activeTab === 'training' ? setTrainingModalOpen(true) : setIsModalOpen(true))}
              className="flex items-center gap-2 px-8 py-3.5 bg-violet-600 text-white rounded-2xl font-black shadow-lg shadow-violet-600/20"
            >
              <Plus size={20} />
              {activeTab === 'training' ? 'نشر تدريب جديد' : 'نشر فرصة جديدة'}
            </motion.button>
          </div>
        </div>

        {/* Dash Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <DashCard label="الفرص المنشورة" value={jobs.length} icon={Briefcase} color="violet" />
           <DashCard label="إجمالي المشاهدات" value="1.2K" icon={Activity} color="emerald" />
           <DashCard label="مرشحون مقترحون" value="24" icon={Users} color="brand" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('jobs')} className={`px-5 py-3 rounded-2xl font-black text-sm border ${activeTab === 'jobs' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-white text-slate-600 border-slate-200'}`}>
            فرص العمل
          </button>
          <button onClick={() => setActiveTab('training')} className={`px-5 py-3 rounded-2xl font-black text-sm border ${activeTab === 'training' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200'}`}>
            التدريب الميداني
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="text-violet-600" size={20} />
                {activeTab === 'training' ? 'عروض التدريب الخاصة بالشركة' : 'قائمة الفرص الحالية'}
              </h3>
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={activeTab === 'training' ? 'بحث في عروض التدريب...' : 'بحث في فرصك...'} 
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border-0 rounded-xl text-sm" 
                />
              </div>
           </div>

           <div className="space-y-4">
             {activeTab === 'jobs' && loading ? (
               <div className="h-40 flex items-center justify-center">
                 <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
               </div>
             ) : activeTab === 'jobs' && jobs.length === 0 ? (
               <div className="text-center py-12 bg-slate-50 rounded-2xl">
                 <p className="text-slate-400 font-bold">لم تقم بنشر أي فرص بعد.</p>
               </div>
             ) : activeTab === 'jobs' ? (
               jobs.map(job => (
                 <div key={job.id} className="group p-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 transition-all flex flex-col md:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
                        <Briefcase size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{job.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-slate-400 text-xs">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="px-4 py-2 rounded-xl bg-violet-50 text-violet-700 text-xs font-black">
                        {job.type}
                      </div>
                      <button className="p-2 text-slate-400 hover:text-brand-600 transition-all">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 transition-all">
                        <Trash2 size={18} />
                      </button>
                   </div>
                 </div>
               ))
             ) : trainingLoading ? (
               <div className="h-40 flex items-center justify-center">
                 <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
               </div>
             ) : trainingOffers.length === 0 ? (
               <div className="text-center py-12 bg-slate-50 rounded-2xl">
                 <p className="text-slate-400 font-bold">لم تقم بنشر عروض تدريب بعد.</p>
               </div>
             ) : (
               trainingOffers.map(o => (
                 <div key={o.id} className="group p-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 transition-all flex flex-col md:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all font-black">
                       🎓
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-800">{o.title}</h4>
                       <div className="flex items-center gap-4 mt-1 text-slate-400 text-xs font-bold">
                         <span className="flex items-center gap-1"><MapPin size={12} /> {o.location_name || '—'}</span>
                         <span className="flex items-center gap-1"><Users size={12} /> طلبات: {o.applications_count || 0} · مقبول: {o.accepted_count || 0}</span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 w-full md:w-auto">
                     <button type="button" onClick={() => openApplications(o)} className="px-5 py-2 rounded-xl bg-amber-500 text-white font-black text-xs">
                       إدارة المتدربين
                     </button>
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-violet-50/20">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Plus className="text-violet-600" />
                نشر فرصة عمل/تدريب جديدة 💼
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                <Trash2 size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 mb-1 block">عنوان الفرصة</label>
                  <input
                    required
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    placeholder="مثال: مطور ويب جونيور، مصمم جرافيك متدرب..."
                    className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">نوع الفرصة</label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="وظيفة">وظيفة كاملة</option>
                    <option value="تدريب">تدريب (Internship)</option>
                    <option value="عمل حر">عمل حر (Freelance)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">الموقع</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                    placeholder="مثال: الخليل - رأس الجورة"
                    className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">وصف الفرصة ومتطلباتها</label>
                <textarea
                  rows="3"
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-violet-500"
                  placeholder="اكتب نبذة عن الفرصة والمهارات المطلوبة..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">بريد التواصل</label>
                  <input
                    type="email"
                    value={newJob.contact_email}
                    onChange={(e) => setNewJob({...newJob, contact_email: e.target.value})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">آخر موعد للتقديم</label>
                   <input
                     type="date"
                     value={newJob.deadline}
                     onChange={(e) => setNewJob({...newJob, deadline: e.target.value})}
                     className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-violet-500"
                   />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 py-4 bg-violet-600 text-white rounded-2xl font-black shadow-lg shadow-violet-600/20">
                  انشر الفرصة الآن
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Training Modal */}
      {trainingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-amber-50/20">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Plus className="text-amber-600" />
                نشر عرض تدريب ميداني 🎓
              </h3>
              <button onClick={() => setTrainingModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                <Trash2 size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateTraining} className="p-8 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">عنوان التدريب</label>
                <input required value={newTraining.title} onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">وصف التدريب</label>
                <textarea rows="3" value={newTraining.description} onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">عدد المتدربين</label>
                  <input type="number" value={newTraining.max_trainees} onChange={(e) => setNewTraining({ ...newTraining, max_trainees: parseInt(e.target.value, 10) || 1 })} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">نطاق التواجد (متر)</label>
                  <input type="number" value={newTraining.geo_radius_m} onChange={(e) => setNewTraining({ ...newTraining, geo_radius_m: parseInt(e.target.value, 10) || 200 })} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">مكان التدريب</label>
                <input value={newTraining.location_name} onChange={(e) => setNewTraining({ ...newTraining, location_name: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border-0 rounded-2xl font-bold focus:ring-2 focus:ring-amber-500" />
                <p className="text-[10px] text-slate-400 font-bold mt-2">مركز الموقع الجغرافي (lat/lng) يمكن إضافته لاحقاً من لوحة النظام أو بالـ API.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTrainingModalOpen(false)} className="px-6 py-3 rounded-xl font-black text-slate-500">إلغاء</button>
                <button type="submit" className="px-10 py-3 rounded-xl bg-amber-600 text-white font-black">نشر</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Applications Drawer */}
      {selectedOffer && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-3xl rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">طلبات المتدربين: {selectedOffer.title}</h3>
                <p className="text-xs text-slate-500 font-bold">قبول الطلب ينشئ مسار تدريبي + يربطه بجامعة الطالب إن وجدت.</p>
              </div>
              <button onClick={() => { setSelectedOffer(null); setApplications([]); }} className="p-2 rounded-xl hover:bg-slate-100">
                <Trash2 size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {appsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <p className="text-slate-400 font-bold text-center py-10">لا توجد طلبات بعد.</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((a) => (
                    <div key={a.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{a.student_name}</p>
                        <p className="text-xs text-slate-500 font-bold">{a.student_email} · رقم جامعي: {a.student_id || '—'}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Match: {a.match_score || 0}% · الحالة: {a.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={a.status !== 'pending'} onClick={() => decide(a.id, true)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs disabled:opacity-50 flex items-center gap-1">
                          <CheckCircle2 size={14} /> قبول
                        </button>
                        <button disabled={a.status !== 'pending'} onClick={() => decide(a.id, false)} className="px-4 py-2 rounded-xl bg-red-600 text-white font-black text-xs disabled:opacity-50 flex items-center gap-1">
                          <AlertCircle size={14} /> رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function DashCard({ label, value, icon: Icon, color }) {
  const colors = {
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    brand: 'text-brand-600 bg-brand-50 border-brand-100',
  };
  return (
    <div className={`p-6 rounded-3xl border bg-white shadow-sm flex items-center gap-4`}>
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>
         <Icon size={28} />
       </div>
       <div>
         <p className="text-xs font-bold text-slate-400">{label}</p>
         <p className="text-2xl font-black text-slate-800">{value}</p>
       </div>
    </div>
  );
}
