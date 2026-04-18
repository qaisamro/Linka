import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Calendar, Clock, Users, Image, FileText, Tag } from 'lucide-react';
import { eventsAPI, neighborhoodsAPI } from '../../api';
import toast from 'react-hot-toast';

const TYPES = ['تطوعية', 'ثقافية', 'رياضية', 'تعليمية', 'بيئية', 'اجتماعية'];

// Preset locations in Hebron for quick fill
const PRESETS = [
  { name: 'حديقة المنتزه العام',   lat: 31.5326, lng: 35.0998, neighborhood: 1 },
  { name: 'مركز الشباب - باب الزاوية', lat: 31.5280, lng: 35.1050, neighborhood: 2 },
  { name: 'الملعب البلدي',          lat: 31.5350, lng: 35.1020, neighborhood: 4 },
  { name: 'ساحة القصبة',            lat: 31.5234, lng: 35.1134, neighborhood: 7 },
  { name: 'حديقة حي النزهة',        lat: 31.5420, lng: 35.1080, neighborhood: 8 },
];

const DEFAULT = {
  title: '', description: '', type: 'تطوعية',
  neighborhood_id: '', location_name: '',
  lat: '', lng: '', date: '', duration_hours: 2,
  max_participants: 30, image_url: '',
};

export default function CreateEventModal({ onClose, onCreated }) {
  const [form, setForm]           = useState(DEFAULT);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState(1); // 2-step form

  useEffect(() => {
    neighborhoodsAPI.getAll().then(r => setNeighborhoods(r.data.neighborhoods || []));
  }, []);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const applyPreset = (preset) => {
    set('location_name', preset.name);
    set('lat', preset.lat);
    set('lng', preset.lng);
    set('neighborhood_id', preset.neighborhood);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) { toast.error('العنوان والتاريخ مطلوبان'); return; }
    setLoading(true);
    try {
      await eventsAPI.create(form);
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'خطأ في الإنشاء');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#344F1F]/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#F9F5F0] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-hero-gradient p-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-[#F9F5F0] font-black text-lg">إنشاء فعالية جديدة</h2>
            <p className="text-[#F9F5F0]/60 text-xs mt-0.5">الخطوة {step} من 2</p>
          </div>
          <button onClick={onClose} className="text-[#F9F5F0]/70 hover:text-[#F9F5F0] bg-[#F9F5F0]/10 rounded-xl p-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-[#F9F5F0] flex-shrink-0">
          {[{ n: 1, label: 'المعلومات الأساسية' }, { n: 2, label: 'الموقع والتفاصيل' }].map(s => (
            <button key={s.n} onClick={() => setStep(s.n)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                step === s.n ? 'text-[#344F1F] border-[#F9F5F0] border-[#344F1F]' : 'text-[#F4991A] hover:text-[#344F1F]'
              }`}>
              {s.n}. {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scroll">
          <div className="p-5 space-y-4">

            {step === 1 && (
              <>
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">
                    <FileText size={13} className="inline ml-1 text-[#F4991A]" />عنوان الفعالية *
                  </label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    className="input-field" placeholder="مثال: حملة تنظيف حديقة المنتزه" required />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">الوصف</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)}
                    className="input-field resize-none" rows={3}
                    placeholder="وصف مختصر للفعالية..." />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">
                    <Tag size={13} className="inline ml-1 text-[#F4991A]" />نوع الفعالية
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map(t => (
                      <button key={t} type="button" onClick={() => set('type', t)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                          form.type === t ? 'bg-[#344F1F] text-[#F9F5F0]' : 'bg-[#F9F5F0] text-[#344F1F] hover:bg-[#F2EAD3]'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">
                      <Calendar size={13} className="inline ml-1 text-[#F4991A]" />التاريخ *
                    </label>
                    <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)}
                      className="input-field text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">
                      <Clock size={13} className="inline ml-1 text-[#F4991A]" />المدة (ساعات)
                    </label>
                    <input type="number" min={0.5} max={12} step={0.5} value={form.duration_hours}
                      onChange={e => set('duration_hours', e.target.value)}
                      className="input-field text-sm" />
                  </div>
                </div>

                {/* Max participants */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">
                    <Users size={13} className="inline ml-1 text-[#F4991A]" />
                    الحد الأقصى للمشاركين: <span className="text-[#344F1F]">{form.max_participants}</span>
                  </label>
                  <input type="range" min={5} max={500} step={5} value={form.max_participants}
                    onChange={e => set('max_participants', e.target.value)}
                    className="w-full accent-brand-600" />
                  <div className="flex justify-between text-xs text-[#F4991A] mt-1">
                    <span>5</span><span>500</span>
                  </div>
                </div>

                <button type="button" onClick={() => setStep(2)}
                  className="btn-primary w-full">
                  التالي: الموقع والتفاصيل ←
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Location presets */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-2">
                    <MapPin size={13} className="inline ml-1 text-[#F4991A]" />اختر موقعاً سريعاً
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PRESETS.map((p, i) => (
                      <button key={i} type="button" onClick={() => applyPreset(p)}
                        className={`text-right px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                          form.location_name === p.name
                            ? 'bg-[#F9F5F0] border-[#F2EAD3] text-[#344F1F]'
                            : 'border-[#F2EAD3] hover:border-[#F2EAD3] text-[#344F1F] hover:bg-[#F9F5F0]'
                        }`}>
                        📍 {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual location */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">اسم المكان (يدوي)</label>
                  <input value={form.location_name} onChange={e => set('location_name', e.target.value)}
                    className="input-field" placeholder="مثال: حديقة المنتزه العام" />
                </div>

                {/* Lat/Lng */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#F4991A] mb-1">خط العرض (Lat)</label>
                    <input type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)}
                      className="input-field text-sm" placeholder="31.532..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#F4991A] mb-1">خط الطول (Lng)</label>
                    <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)}
                      className="input-field text-sm" placeholder="35.099..." />
                  </div>
                </div>

                {/* Neighborhood */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">الحي</label>
                  <select value={form.neighborhood_id} onChange={e => set('neighborhood_id', e.target.value)}
                    className="input-field">
                    <option value="">اختر الحي...</option>
                    {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-[#344F1F] mb-1.5">
                    <Image size={13} className="inline ml-1 text-[#F4991A]" />رابط الصورة (اختياري)
                  </label>
                  <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
                    className="input-field text-sm" placeholder="https://..." style={{ direction: 'ltr' }} />
                  {form.image_url && (
                    <img src={form.image_url} alt="" className="mt-2 h-20 w-full object-cover rounded-xl"
                      onError={e => e.target.style.display = 'none'} />
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                    ← السابق
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : '🚀 إنشاء الفعالية'}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
