import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, Users, Search, MapPin,
  Calendar, Trash2, Edit, ChevronRight,
  CheckCircle2, AlertCircle, BarChart3, TrendingUp,
  Mail, ExternalLink, Activity, X, FileText, Check
} from 'lucide-react';
import { jobsAPI, trainingAPI } from '../api';
import toast from 'react-hot-toast';

const EmailModal = ({ isOpen, onClose, onSend, applicantName }) => {
  const [subject, setSubject] = useState(`بخصوص طلب التقديم الخاص بك - لينكا`);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await onSend(subject, body);
    setSending(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#344F1F]/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden z-10 border border-[#F2EAD3]"
          >
            <div className="bg-[#344F1F] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">مراسلة المتقدم</h3>
                <p className="text-xs text-white/70 mt-1">إرسال بريد إلكتروني إلى: {applicantName}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#344F1F] mb-1.5">موضوع الرسالة</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F2EAD3] focus:border-[#F4991A] outline-none transition-all font-bold text-[#344F1F]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#344F1F] mb-1.5">نص الرسالة</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F2EAD3] focus:border-[#F4991A] outline-none transition-all h-40 resize-none font-medium text-[#344F1F]"
                  required
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-[#344F1F] text-[#F9F5F0] py-4 rounded-xl font-black transition-all hover:bg-[#2A3F19] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? 'جاري الإرسال...' : (
                    <><Mail size={18} /> إرسال الرسالة الآن</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 rounded-xl border-2 border-[#F2EAD3] text-[#344F1F] font-black hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function CompanyPortal() {
  const [activeTab, setActiveTab] = useState('jobs'); // jobs | training
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trainingOffers, setTrainingOffers] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [targetApplicant, setTargetApplicant] = useState(null);

  const [newJob, setNewJob] = useState({
    title: '', description: '', type: 'وظيفة',
    location: 'وسط المدينة', deadline: '',
    required_skills: [], salary_range: '', contact_email: ''
  });

  const [newTraining, setNewTraining] = useState({
    title: '',
    description: '',
    required_skills: [],
    objectives: { skills: [], tasks: [], outcomes: [] },
    max_trainees: 10,
    location_name: 'منطقتك',
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
    setSelectedJob(null);
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

  const openJobApplications = async (job) => {
    setSelectedJob(job);
    setSelectedOffer(null);
    setAppsLoading(true);
    try {
      const res = await jobsAPI.listApplications(job.id);
      setApplications(res.data.applications || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في جلب المتقدمين');
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
      if (editingJobId) {
        await jobsAPI.update(editingJobId, newJob);
        toast.success('تم تحديث الفرصة بنجاح 🚀');
      } else {
        await jobsAPI.create(newJob);
        toast.success('تم نشر الفرصة بنجاح 🚀');
      }
      setIsModalOpen(false);
      setEditingJobId(null);
      setNewJob({
        title: '', description: '', type: 'وظيفة',
        location: 'وسط المدينة', deadline: '',
        required_skills: [], salary_range: '', contact_email: ''
      });
      fetchJobs();
    } catch (err) {
      toast.error('خطأ في العملية');
    }
  };

  const handleEditJob = (job) => {
    setEditingJobId(job.id);
    setNewJob({
      title: job.title || '',
      description: job.description || '',
      type: job.type || 'وظيفة',
      location: job.location || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      required_skills: typeof job.required_skills === 'string' ? JSON.parse(job.required_skills) : (job.required_skills || []),
      salary_range: job.salary_range || '',
      contact_email: job.contact_email || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفرصة نهائياً؟')) return;
    try {
      await jobsAPI.delete(jobId);
      toast.success('تم حذف الفرصة بنجاح');
      fetchJobs();
    } catch (err) {
      toast.error('لم يتم الحذف');
    }
  };

  const handleDeleteJobApplication = async (appId) => {
    if (!window.confirm('هل تريد حذف هذا المتقدم من القائمة؟')) return;
    try {
      await jobsAPI.deleteApplication(selectedJob.id, appId);
      toast.success('تم إزالة المتقدم بنجاح');
      openJobApplications(selectedJob);
    } catch (err) {
      toast.error('خطأ أثناء إزالة المتقدم');
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      await jobsAPI.updateApplicationStatus(selectedJob.id, appId, status);
      toast.success('تم تحديث حالة الطلب وإرسال إشعار');
      openJobApplications(selectedJob);
    } catch (err) {
      toast.error('خطأ في تحديث الحالة');
    }
  };

  const handleSendCustomEmail = async (subject, body) => {
    try {
      await jobsAPI.contactApplicant(selectedJob.id, targetApplicant.id, { subject, body });
      toast.success('تم إرسال البريد الإلكتروني للمتقدم');
    } catch (err) {
      toast.error('خطأ في إرسال البريد');
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
        location_name: 'منطقتك',
        geo_radius_m: 200,
      });
      fetchTrainingOffers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في النشر');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F5F0] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Company Header */}
        <div className="bg-[#F9F5F0] rounded-[2.5rem] p-8 shadow-sm border border-[#F9F5F0] mb-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F4991A] via-brand-500 to-[#F4991A]" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#F9F5F0] rounded-3xl flex items-center justify-center text-3xl border border-[#F9F5F0] shadow-sm">
                🏢
              </div>
              <div className="text-center md:text-right">
                <h1 className="text-3xl font-black text-[#344F1F]">بوابة التوظيف والشركات</h1>
                <p className="text-[#F4991A] mt-1">أهلاً بك! انشر فرصك واستقطب أفضل الكفاءات الشبابية في منطقتك.</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => (activeTab === 'training' ? setTrainingModalOpen(true) : setIsModalOpen(true))}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20"
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
          <button onClick={() => setActiveTab('jobs')} className={`px-5 py-3 rounded-2xl font-black text-sm border ${activeTab === 'jobs' ? 'bg-[#F9F5F0] text-[#344F1F] border-[#F2EAD3]' : 'bg-[#F9F5F0] text-[#344F1F] border-[#F2EAD3]'}`}>
            فرص العمل
          </button>
          <button onClick={() => setActiveTab('training')} className={`px-5 py-3 rounded-2xl font-black text-sm border ${activeTab === 'training' ? 'bg-[#F9F5F0] text-[#344F1F] border-[#F2EAD3]' : 'bg-[#F9F5F0] text-[#344F1F] border-[#F2EAD3]'}`}>
            التدريب الميداني
          </button>
        </div>

        {/* Content */}
        <div className="bg-[#F9F5F0] rounded-3xl p-8 shadow-sm border border-[#F9F5F0]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-[#344F1F] flex items-center gap-2">
              <Briefcase className="text-[#344F1F]" size={20} />
              {activeTab === 'training' ? 'عروض التدريب الخاصة بالشركة' : 'قائمة الفرص الحالية'}
            </h3>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F4991A]" size={16} />
              <input
                type="text"
                placeholder={activeTab === 'training' ? 'بحث في عروض التدريب...' : 'بحث في فرصك...'}
                className="w-full pr-10 pl-4 py-2 bg-[#F9F5F0] border-0 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            {activeTab === 'jobs' && loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#F2EAD3] border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : activeTab === 'jobs' && jobs.length === 0 ? (
              <div className="text-center py-12 bg-[#F9F5F0] rounded-2xl">
                <p className="text-[#F4991A] font-bold">لم تقم بنشر أي فرص بعد.</p>
              </div>
            ) : activeTab === 'jobs' ? (
              jobs.map(job => (
                <div key={job.id} className="group p-6 rounded-2xl bg-[#F9F5F0] hover:bg-[#F9F5F0] border border-[#F9F5F0] transition-all flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F9F5F0] rounded-xl flex items-center justify-center text-[#344F1F] group-hover:bg-[#344F1F] group-hover:text-[#F9F5F0] transition-all">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#344F1F]">{job.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-[#F4991A] text-xs">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => openJobApplications(job)} className="px-4 py-2 rounded-xl bg-[#F4991A] text-[#F9F5F0] text-xs font-black">
                      المتقدمين
                    </button>
                    <button onClick={() => handleEditJob(job)} className="p-2 text-[#344F1F]/40 hover:text-[#344F1F] transition-all">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-[#344F1F]/40 hover:text-red-500 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : trainingLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#F2EAD3] border-t-amber-600 rounded-full animate-spin" />
              </div>
            ) : trainingOffers.length === 0 ? (
              <div className="text-center py-12 bg-[#F9F5F0] rounded-2xl">
                <p className="text-[#F4991A] font-bold">لم تقم بنشر عروض تدريب بعد.</p>
              </div>
            ) : (
              trainingOffers.map(o => (
                <div key={o.id} className="group p-6 rounded-2xl bg-[#F9F5F0] hover:bg-[#F9F5F0] border border-[#F9F5F0] transition-all flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F9F5F0] rounded-xl flex items-center justify-center text-[#344F1F] group-hover:bg-[#344F1F] group-hover:text-[#F9F5F0] transition-all font-black">
                      🎓
                    </div>
                    <div>
                      <h4 className="font-bold text-[#344F1F]">{o.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-[#F4991A] text-xs font-bold">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {o.location_name || '—'}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> طلبات: {o.applications_count || 0} · مقبول: {o.accepted_count || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button type="button" onClick={() => openApplications(o)} className="px-5 py-2 rounded-xl bg-[#F4991A] text-[#F9F5F0] font-black text-xs">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#344F1F]/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#F9F5F0] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-[#F9F5F0] flex justify-between items-center bg-[#F9F5F0]/20">
              <h3 className="text-2xl font-black text-[#344F1F] flex items-center gap-3">
                <Plus className="text-[#344F1F]" />
                {editingJobId ? 'تعديل فرصة العمل' : 'نشر فرصة عمل/تدريب جديدة 💼'}
              </h3>
              <button onClick={() => {
                setIsModalOpen(false);
                setEditingJobId(null);
                setNewJob({
                  title: '', description: '', type: 'وظيفة',
                  location: 'وسط المدينة', deadline: '',
                  required_skills: [], salary_range: '', contact_email: ''
                });
              }} className="p-2 hover:bg-[#F9F5F0] rounded-xl transition-all">
                <X size={24} className="text-[#F4991A]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-[#F4991A] mb-1 block">عنوان الفرصة</label>
                  <input
                    required
                    type="text"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="مثال: مطور ويب جونيور، مصمم جرافيك متدرب..."
                    className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F4991A] mb-1 block">نوع الفرصة</label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]"
                  >
                    <option value="وظيفة">وظيفة كاملة</option>
                    <option value="تدريب">تدريب (Internship)</option>
                    <option value="عمل حر">عمل حر (Freelance)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F4991A] mb-1 block">الموقع</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="مثال: وسط المدينة - الشارع الرئيسي"
                    className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#F4991A] mb-1 block">وصف الفرصة ومتطلباتها</label>
                <textarea
                  rows="3"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]"
                  placeholder="اكتب نبذة عن الفرصة والمهارات المطلوبة..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#F4991A] mb-1 block">بريد التواصل</label>
                  <input
                    type="email"
                    value={newJob.contact_email}
                    onChange={(e) => setNewJob({ ...newJob, contact_email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F4991A] mb-1 block">آخر موعد للتقديم</label>
                  <input
                    type="date"
                    value={newJob.deadline}
                    onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button type="submit" className="flex-1 py-4 bg-[#344F1F] text-[#F9F5F0] rounded-2xl font-black shadow-lg shadow-[#344F1F]/20">
                  {editingJobId ? 'حفظ التعديلات' : 'انشر الفرصة الآن'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingJobId(null);
                    setNewJob({
                      title: '', description: '', type: 'وظيفة',
                      location: 'وسط المدينة', deadline: '',
                      required_skills: [], salary_range: '', contact_email: ''
                    });
                  }}
                  className="px-8 py-4 bg-[#F9F5F0] text-[#344F1F] rounded-2xl font-bold hover:bg-[#F2EAD3] transition-all"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#344F1F]/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#F9F5F0] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-[#F9F5F0] flex justify-between items-center bg-[#F9F5F0]/20">
              <h3 className="text-2xl font-black text-[#344F1F] flex items-center gap-3">
                <Plus className="text-[#344F1F]" />
                نشر عرض تدريب ميداني 🎓
              </h3>
              <button onClick={() => setTrainingModalOpen(false)} className="p-2 hover:bg-[#F9F5F0] rounded-xl transition-all">
                <Trash2 size={24} className="text-[#F4991A]" />
              </button>
            </div>
            <form onSubmit={handleCreateTraining} className="p-8 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#F4991A] mb-1 block">عنوان التدريب</label>
                <input required value={newTraining.title} onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })} className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#F4991A] mb-1 block">وصف التدريب</label>
                <textarea rows="3" value={newTraining.description} onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })} className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#F4991A] mb-1 block">عدد المتدربين</label>
                  <input type="number" value={newTraining.max_trainees} onChange={(e) => setNewTraining({ ...newTraining, max_trainees: parseInt(e.target.value, 10) || 1 })} className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#F4991A] mb-1 block">نطاق التواجد (متر)</label>
                  <input type="number" value={newTraining.geo_radius_m} onChange={(e) => setNewTraining({ ...newTraining, geo_radius_m: parseInt(e.target.value, 10) || 200 })} className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#F4991A] mb-1 block">مكان التدريب</label>
                <input value={newTraining.location_name} onChange={(e) => setNewTraining({ ...newTraining, location_name: e.target.value })} className="w-full px-5 py-3.5 bg-[#F9F5F0] border-0 rounded-2xl font-bold focus:ring-2 focus:ring-[#F4991A]" />
                <p className="text-[10px] text-[#F4991A] font-bold mt-2">مركز الموقع الجغرافي (lat/lng) يمكن إضافته لاحقاً من لوحة النظام أو بالـ API.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTrainingModalOpen(false)} className="px-6 py-3 rounded-xl font-black text-[#F4991A]">إلغاء</button>
                <button type="submit" className="px-10 py-3 rounded-xl bg-[#344F1F] text-[#F9F5F0] font-black">نشر</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Applications Drawer (Training) */}
      {selectedOffer && (
        <div className="fixed inset-0 z-[110] bg-[#344F1F]/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#F9F5F0] w-full max-w-3xl rounded-[2rem] border border-[#F9F5F0] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#F9F5F0] flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#344F1F]">طلبات المتدربين: {selectedOffer.title}</h3>
                <p className="text-xs text-[#F4991A] font-bold">قبول الطلب ينشئ مسار تدريبي + يربطه بجامعة الطالب إن وجدت.</p>
              </div>
              <button onClick={() => { setSelectedOffer(null); setApplications([]); }} className="p-2 rounded-xl hover:bg-[#F9F5F0]">
                <Trash2 size={20} className="text-[#F4991A]" />
              </button>
            </div>
            <div className="p-6">
              {appsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#F2EAD3] border-t-slate-600 rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <p className="text-[#F4991A] font-bold text-center py-10">لا توجد طلبات بعد.</p>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {applications.map((a) => (
                    <div key={a.id} className="p-4 rounded-2xl bg-[#F9F5F0] border border-[#F2EAD3] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-[#344F1F]">{a.student_name}</p>
                        <p className="text-xs text-[#F4991A] font-bold">{a.student_email} · رقم جامعي: {a.student_id || '—'}</p>
                        <p className="text-[10px] text-[#F4991A] font-bold mt-1">Match: {a.match_score || 0}% · الحالة: {a.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <button disabled={a.status !== 'pending'} onClick={() => decide(a.id, true)} className="px-4 py-2 rounded-xl bg-[#344F1F] text-[#F9F5F0] font-black text-xs disabled:opacity-50 flex items-center gap-1">
                          <CheckCircle2 size={14} /> قبول
                        </button>
                        <button disabled={a.status !== 'pending'} onClick={() => decide(a.id, false)} className="px-4 py-2 rounded-xl bg-[#344F1F] text-[#F9F5F0] font-black text-xs disabled:opacity-50 flex items-center gap-1">
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

      {/* Job Applications Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-[110] bg-[#344F1F]/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#F9F5F0] w-full max-w-4xl rounded-[2rem] border border-[#F9F5F0] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#F9F5F0] flex items-center justify-between">
              <div>
                <h3 className="font-black text-[#344F1F]">المتقدمون للوظيفة: {selectedJob.title}</h3>
                <p className="text-xs text-[#F4991A] font-bold">مراجعة بيانات المتقدمين وسيرهم الذاتية الرقمية.</p>
              </div>
              <button onClick={() => { setSelectedJob(null); setApplications([]); }} className="p-2 rounded-xl hover:bg-[#F9F5F0]">
                <Trash2 size={20} className="text-[#F4991A]" />
              </button>
            </div>
            <div className="p-6">
              {appsLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-[#F2EAD3] border-t-slate-600 rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <p className="text-[#F4991A] font-bold text-center py-10">لم يتم التقديم لهذه الوظيفة بعد.</p>
              ) : (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                  {applications.map((a) => {
                    const snap = a.resume_snapshot || {};
                    return (
                      <div key={a.id} className="p-6 rounded-3xl bg-[#F9F5F0] border border-[#F2EAD3] flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#344F1F] rounded-2xl flex items-center justify-center text-[#F9F5F0] text-xl font-black">
                              {snap.name?.charAt(0) || '👤'}
                            </div>
                            <div>
                              <p className="font-black text-[#344F1F] text-lg">{snap.name}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-[#F4991A] font-bold mt-1">
                                <span className="flex items-center gap-1"><Mail size={12} /> {snap.email}</span>
                                {snap.phone && <span className="flex items-center gap-1">📞 {snap.phone}</span>}
                                {snap.university && <span className="flex items-center gap-1">🎓 {snap.university}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${a.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-200' :
                              a.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                'bg-[#F9F5F0] border-[#F2EAD3] text-[#344F1F]'
                              }`}>
                              الحالة: {a.status === 'accepted' ? 'مقبول ✅' : a.status === 'rejected' ? 'مرفوض ❌' : 'قيد الانتظار ⏳'}
                            </div>
                            <div className="text-[10px] text-[#F4991A] font-bold">
                              التاريخ: {new Date(a.applied_at).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                        </div>

                        {snap.bio && (
                          <div className="bg-white rounded-xl p-4 border border-[#F2EAD3]">
                            <p className="text-sm font-bold text-[#344F1F] mb-1">النبذة (Bio):</p>
                            <p className="text-sm text-[#344F1F]/80 leading-relaxed italic pr-2">
                              "{snap.bio}"
                            </p>
                          </div>
                        )}

                        {snap.cover_letter && (
                          <div className="bg-[#F9F5F0] rounded-xl p-4 border-l-4 border-l-[#F4991A] border border-[#F2EAD3] shadow-inner">
                            <p className="text-sm font-black text-[#F4991A] mb-2 flex items-center gap-2">
                              <FileText size={16} /> خطاب التقديم (Cover Letter)
                            </p>
                            <p className="text-sm text-[#344F1F] leading-relaxed whitespace-pre-wrap">
                              {snap.cover_letter}
                            </p>
                          </div>
                        )}

                        {snap.skills && snap.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {snap.skills.map((sk, i) => (
                              <span key={i} className="text-[10px] bg-[#344F1F]/5 text-[#344F1F] px-2.5 py-1 rounded-lg font-black border border-[#344F1F]/10">
                                {sk.icon} {sk.name} ({sk.level})
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#F2EAD3]/30">
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateStatus(a.id, 'accepted')} className="px-5 py-2.5 rounded-xl bg-[#344F1F] text-[#F9F5F0] font-black text-xs flex items-center gap-2 hover:bg-green-700 transition-all">
                                <Check size={14} /> قبول الطلب
                              </button>
                              <button onClick={() => handleUpdateStatus(a.id, 'rejected')} className="px-5 py-2.5 rounded-xl border-2 border-red-500 text-red-500 font-black text-xs flex items-center gap-2 hover:bg-red-50 transition-all">
                                <X size={14} /> رفض الطلب
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDeleteJobApplication(a.id)} className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 transition-all" title="حذف الطلب">
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              // Ensure we have applicant information for the modal
                              setTargetApplicant({ ...a, applicant_name: snap.name });
                              setEmailModalOpen(true);
                            }}
                            className="px-6 py-2.5 rounded-xl bg-[#F4991A] text-[#F9F5F0] font-black text-xs flex items-center gap-2 hover:bg-[#D48415] transition-all"
                          >
                            <Mail size={14} /> تواصل بالبريد
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendCustomEmail}
        applicantName={targetApplicant?.applicant_name}
      />
    </div>
  );
}

function DashCard({ label, value, icon: Icon, color }) {
  const colors = {
    violet: 'text-[#344F1F] bg-[#F9F5F0] border-[#F9F5F0]',
    emerald: 'text-[#344F1F] bg-[#F9F5F0] border-[#F9F5F0]',
    brand: 'text-[#344F1F] bg-[#F9F5F0] border-[#F9F5F0]',
  };
  return (
    <div className={`p-6 rounded-3xl border bg-[#F9F5F0] shadow-sm flex items-center gap-4`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-xs font-bold text-[#F4991A]">{label}</p>
        <p className="text-2xl font-black text-[#344F1F]">{value}</p>
      </div>
    </div>
  );
}
