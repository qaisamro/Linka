const STORAGE_KEY = 'hebron_mock_backend_v1';

const MULTIPLIERS = {
  'تعليمية': 1.5,
  'بيئية': 1,
  'تطوعية': 1,
  'رياضية': 0.75,
  'اجتماعية': 0.75,
  'ثقافية': 0.5,
};

const SKILL_MAP = {
  'تعليمية': ['القيادة', 'التعلم الذاتي', 'التقنية', 'البحث العلمي'],
  'تطوعية': ['العمل الجماعي', 'الخدمة المجتمعية', 'المبادرة', 'التعاطف'],
  'بيئية': ['الاستدامة', 'التنظيم', 'العمل الجماعي', 'المسؤولية البيئية'],
  'اجتماعية': ['التواصل', 'إدارة الفعاليات', 'بناء العلاقات', 'المرونة'],
  'رياضية': ['الإنجاز', 'الصحة', 'روح الفريق', 'الانضباط'],
  'ثقافية': ['الإبداع', 'التراث', 'التقديم', 'التنوع الثقافي'],
};

const SKILL_ICONS = {
  'القيادة': '👑', 'التعلم الذاتي': '📚', 'التقنية': '💻', 'البحث العلمي': '🔬',
  'العمل الجماعي': '🤝', 'الخدمة المجتمعية': '🌍', 'المبادرة': '🚀', 'التعاطف': '❤️',
  'الاستدامة': '🌱', 'التنظيم': '📋', 'المسؤولية البيئية': '♻️', 'التواصل': '💬',
  'إدارة الفعاليات': '🎯', 'بناء العلاقات': '🌐', 'المرونة': '⚡', 'الإنجاز': '🏆',
  'الصحة': '💪', 'روح الفريق': '⭐', 'الانضباط': '🎖️', 'الإبداع': '🎨',
  'التراث': '🏛️', 'التقديم': '🎤', 'التنوع الثقافي': '🌏',
};

const BADGES = [
  { id: 1, name: 'المبادر', icon: '🌱', description: 'أول مشاركة لك في فعالية', condition_type: 'participations', condition_value: 1 },
  { id: 2, name: 'الناشط', icon: '⭐', description: 'شاركت في 5 فعاليات', condition_type: 'participations', condition_value: 5 },
  { id: 3, name: 'البطل', icon: '🏆', description: 'شاركت في 10 فعاليات', condition_type: 'participations', condition_value: 10 },
  { id: 4, name: 'المتطوع', icon: '🤝', description: 'أتممت 5 ساعات تطوع', condition_type: 'hours', condition_value: 5 },
  { id: 5, name: 'المحترف', icon: '🎖️', description: 'أتممت 20 ساعة تطوع', condition_type: 'hours', condition_value: 20 },
  { id: 6, name: 'القائد', icon: '👑', description: 'جمعت 100 نقطة', condition_type: 'points', condition_value: 100 },
];

function isoDaysFromNow(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function seedState() {
  return {
    counters: { user: 7, registration: 12, notification: 7, event: 8, audit: 4, universityStudent: 5, job: 6, verificationCode: 3 },
    neighborhoods: [
      { id: 1, name: 'وسط المدينة', name_en: 'City Center', city: 'الخليل', lat: 31.5326, lng: 35.0998 },
      { id: 2, name: 'باب الزاوية', name_en: 'Bab Al-Zawiya', city: 'الخليل', lat: 31.5280, lng: 35.1050 },
      { id: 3, name: 'حي الشيخ', name_en: 'Sheikh Neighborhood', city: 'الخليل', lat: 31.5290, lng: 35.0920 },
      { id: 4, name: 'جبل جوهر', name_en: 'Jabal Jawhar', city: 'الخليل', lat: 31.5350, lng: 35.1020 },
      { id: 5, name: 'الحي اليهودي', name_en: 'Jewish Quarter', city: 'الخليل', lat: 31.5260, lng: 35.1160 },
      { id: 6, name: 'رأس الجورة', name_en: 'Ras Al-Jawra', city: 'الخليل', lat: 31.5260, lng: 35.1160 },
      { id: 7, name: 'القصبة', name_en: 'Old City', city: 'الخليل', lat: 31.5234, lng: 35.1134 },
      { id: 8, name: 'حي النزهة', name_en: 'Al-Nuzha', city: 'الخليل', lat: 31.5420, lng: 35.1080 },
    ],
    users: [
      { id: 1, name: 'مدير البلدية', email: 'admin@hebron.ps', password: 'admin123', phone: '0599000000', role: 'admin', neighborhood_id: 1, is_university_student: false, university: null, student_id: null, avatar_url: null, bio: 'مدير المنصة.', is_active: 1, created_at: isoDaysFromNow(-60) },
      { id: 2, name: 'أحمد حسن', email: 'ahmad@hebron.ps', password: 'test123', phone: '0597000001', role: 'youth', neighborhood_id: 1, is_university_student: true, university: 'جامعة الخليل', student_id: 'HU2023001', avatar_url: null, bio: 'أهتم بالمبادرات البيئية والتعليمية.', is_active: 1, created_at: isoDaysFromNow(-45) },
      { id: 3, name: 'مريم علي', email: 'maryam@hebron.ps', password: 'test123', phone: '0597000002', role: 'youth', neighborhood_id: 2, is_university_student: false, university: null, student_id: null, avatar_url: null, bio: 'أحب الفعاليات الثقافية.', is_active: 1, created_at: isoDaysFromNow(-35) },
      { id: 4, name: 'سامر ناصر', email: 'samer@hebron.ps', password: 'test123', phone: '0597000003', role: 'youth', neighborhood_id: 4, is_university_student: true, university: 'جامعة بوليتكنك فلسطين', student_id: 'PPU2023017', avatar_url: null, bio: 'رياضي وناشط.', is_active: 1, created_at: isoDaysFromNow(-30) },
      { id: 5, name: 'لانا خليل', email: 'lana@hebron.ps', password: 'test123', phone: '0597000004', role: 'youth', neighborhood_id: 7, is_university_student: false, university: null, student_id: null, avatar_url: null, bio: 'أهوى العمل المجتمعي.', is_active: 1, created_at: isoDaysFromNow(-22) },
      { id: 6, name: 'يوسف التميمي', email: 'yousef@hebron.ps', password: 'test123', phone: '0597000005', role: 'youth', neighborhood_id: 8, is_university_student: true, university: 'جامعة القدس المفتوحة', student_id: 'QOU2023104', avatar_url: null, bio: 'أجمع بين التطوع والتعليم.', is_active: 1, created_at: isoDaysFromNow(-18) },
    ],
    universityAccounts: [
      { id: 101, name: 'جامعة الخليل', email: 'hu@hebron.ps', password: 'uni123', contact_name: 'د. سامي أبو سنينة', phone: '022222222', code: 'HU', city: 'الخليل', is_active: true },
      { id: 102, name: 'جامعة بوليتكنك فلسطين', email: 'ppu@hebron.ps', password: 'uni123', contact_name: 'د. ريم الجعبري', phone: '022233333', code: 'PPU', city: 'الخليل', is_active: true },
    ],
    events: [
      { id: 1, title: 'تنظيف حديقة المنتزه العام', description: 'حملة تطوعية لتنظيف الحديقة العامة.', type: 'بيئية', neighborhood_id: 1, location_name: 'حديقة المنتزه العام', lat: 31.5326, lng: 35.0998, date: isoDaysFromNow(3, 16), duration_hours: 3, max_participants: 30, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', status: 'active', created_by: 1, created_at: isoDaysFromNow(-2) },
      { id: 2, title: 'ورشة مهارات القيادة الشبابية', description: 'ورشة عملية لتطوير مهارات القيادة.', type: 'تعليمية', neighborhood_id: 2, location_name: 'مركز الشباب - باب الزاوية', lat: 31.5280, lng: 35.1050, date: isoDaysFromNow(5, 17), duration_hours: 4, max_participants: 40, image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400', status: 'active', created_by: 1, created_at: isoDaysFromNow(-3) },
      { id: 3, title: 'دوري كرة قدم للأحياء', description: 'نشاط رياضي يجمع الشباب.', type: 'رياضية', neighborhood_id: 4, location_name: 'الملعب البلدي', lat: 31.5350, lng: 35.1020, date: isoDaysFromNow(7, 18), duration_hours: 2, max_participants: 24, image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400', status: 'active', created_by: 1, created_at: isoDaysFromNow(-3) },
      { id: 4, title: 'أمسية تراثية في القصبة', description: 'فعالية ثقافية للاحتفاء بتراث الخليل.', type: 'ثقافية', neighborhood_id: 7, location_name: 'ساحة القصبة', lat: 31.5234, lng: 35.1134, date: isoDaysFromNow(10, 19), duration_hours: 2.5, max_participants: 60, image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400', status: 'active', created_by: 1, created_at: isoDaysFromNow(-4) },
      { id: 5, title: 'مختبر مهارات رقمية', description: 'فعالية تعليمية لمهارات الحاسوب.', type: 'تعليمية', neighborhood_id: 3, location_name: 'مركز التدريب المجتمعي', lat: 31.5290, lng: 35.0920, date: isoDaysFromNow(-18, 11), duration_hours: 4, max_participants: 35, image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', status: 'completed', created_by: 1, created_at: isoDaysFromNow(-22) },
      { id: 6, title: 'مبادرة دعم كبار السن', description: 'نشاط تطوعي لخدمة كبار السن.', type: 'تطوعية', neighborhood_id: 8, location_name: 'مركز النشاط المجتمعي', lat: 31.5420, lng: 35.1080, date: isoDaysFromNow(-11, 12), duration_hours: 3, max_participants: 25, image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400', status: 'completed', created_by: 1, created_at: isoDaysFromNow(-13) },
      { id: 7, title: 'زراعة أشجار في حي النزهة', description: 'يوم بيئي لزراعة الأشجار.', type: 'بيئية', neighborhood_id: 8, location_name: 'حديقة حي النزهة', lat: 31.5420, lng: 35.1080, date: isoDaysFromNow(-6, 10), duration_hours: 4, max_participants: 40, image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', status: 'completed', created_by: 1, created_at: isoDaysFromNow(-8) },
    ],
    registrations: [
      { id: 1, user_id: 2, event_id: 5, status: 'attended', registered_at: isoDaysFromNow(-19), confirmed_at: isoDaysFromNow(-18) },
      { id: 2, user_id: 2, event_id: 7, status: 'attended', registered_at: isoDaysFromNow(-7), confirmed_at: isoDaysFromNow(-6) },
      { id: 3, user_id: 3, event_id: 5, status: 'attended', registered_at: isoDaysFromNow(-19), confirmed_at: isoDaysFromNow(-18) },
      { id: 4, user_id: 4, event_id: 6, status: 'attended', registered_at: isoDaysFromNow(-12), confirmed_at: isoDaysFromNow(-11) },
      { id: 5, user_id: 4, event_id: 7, status: 'attended', registered_at: isoDaysFromNow(-7), confirmed_at: isoDaysFromNow(-6) },
      { id: 6, user_id: 5, event_id: 6, status: 'attended', registered_at: isoDaysFromNow(-12), confirmed_at: isoDaysFromNow(-11) },
      { id: 7, user_id: 6, event_id: 5, status: 'attended', registered_at: isoDaysFromNow(-19), confirmed_at: isoDaysFromNow(-18) },
      { id: 8, user_id: 6, event_id: 6, status: 'attended', registered_at: isoDaysFromNow(-12), confirmed_at: isoDaysFromNow(-11) },
      { id: 9, user_id: 6, event_id: 7, status: 'attended', registered_at: isoDaysFromNow(-7), confirmed_at: isoDaysFromNow(-6) },
      { id: 10, user_id: 2, event_id: 1, status: 'registered', registered_at: isoDaysFromNow(-1), confirmed_at: null },
      { id: 11, user_id: 3, event_id: 2, status: 'registered', registered_at: isoDaysFromNow(-1), confirmed_at: null },
      { id: 12, user_id: 5, event_id: 3, status: 'registered', registered_at: isoDaysFromNow(-1), confirmed_at: null },
    ],
    notifications: [
      { id: 1, user_id: 2, title: 'تم استلام طلب انضمامك في "تنظيف حديقة المنتزه العام" 📋', message: 'طلبك قيد المراجعة حالياً، سيصلك إشعار فور تأكيد الطلب.', type: 'registration', related_id: 1, related_type: 'event', is_read: 0, created_at: isoDaysFromNow(-1) },
      { id: 2, user_id: 2, title: 'حصلت على شارة "المتطوع" 🤝', message: 'أنجزت أكثر من 5 ساعات تطوع', type: 'badge', related_id: 4, related_type: 'badge', is_read: 1, created_at: isoDaysFromNow(-5) },
      { id: 3, user_id: 1, title: 'تسجيل جديد في "تنظيف حديقة المنتزه العام"', message: 'أحمد حسن انضم للفعالية', type: 'registration', related_id: 1, related_type: 'event', is_read: 0, created_at: isoDaysFromNow(-1) },
      { id: 4, user_id: 1, title: 'إعلان هام للمنصة', message: 'تم إضافة قسم فرص العمل بنجاح', type: 'announcement', related_id: null, related_type: null, is_read: 1, created_at: isoDaysFromNow(-2) },
      { id: 5, user_id: 4, title: 'تم تأكيد حضورك في "زراعة أشجار في حي النزهة" 🎉', message: 'حصلت على 10 نقاط و4 ساعات تطوع', type: 'attendance', related_id: 7, related_type: 'event', is_read: 0, created_at: isoDaysFromNow(-6) },
      { id: 6, user_id: 6, title: 'تم تسجيلك في المنصة بنجاح', message: 'ابدأ رحلتك التطوعية الآن', type: 'system', related_id: null, related_type: null, is_read: 1, created_at: isoDaysFromNow(-18) },
      { id: 7, user_id: 3, title: 'فعالية جديدة: "ورشة مهارات القيادة الشبابية" 🎉', message: 'سجل الآن وطور مهاراتك', type: 'new_event', related_id: 2, related_type: 'event', is_read: 0, created_at: isoDaysFromNow(-2) },
    ],
    universityStudents: [
      { id: 1, university_id: 101, user_id: 2, student_id: 'HU2023001', student_name: 'أحمد حسن', major: 'هندسة حاسوب', joined_at: isoDaysFromNow(-45), is_verified: 1 },
      { id: 2, university_id: 101, user_id: null, student_id: 'HU2023999', student_name: 'نور سدر', major: 'إدارة أعمال', joined_at: isoDaysFromNow(-10), is_verified: 0 },
      { id: 3, university_id: 102, user_id: 4, student_id: 'PPU2023017', student_name: 'سامر ناصر', major: 'هندسة صناعية', joined_at: isoDaysFromNow(-30), is_verified: 1 },
      { id: 4, university_id: 102, user_id: null, student_id: 'PPU2023888', student_name: 'هديل الجعبري', major: 'وسائط رقمية', joined_at: isoDaysFromNow(-7), is_verified: 0 },
      { id: 5, university_id: 101, user_id: 6, student_id: 'QOU2023104', student_name: 'يوسف التميمي', major: 'إدارة أعمال رقمية', joined_at: isoDaysFromNow(-18), is_verified: 1 },
    ],
    jobs: [
      { id: 1, title: 'منسق مبادرات شبابية', organization: 'بلدية الخليل', type: 'وظيفة', description: 'متابعة تنفيذ البرامج الشبابية.', required_skills: ['القيادة', 'إدارة الفعاليات', 'التواصل'], location: 'الخليل', deadline: isoDaysFromNow(14), salary_range: '3500 - 4500 شيكل', contact_email: 'jobs@hebron.ps', is_active: true, created_at: isoDaysFromNow(-2) },
      { id: 2, title: 'متدرب دعم تقني', organization: 'مركز التكنولوجيا المجتمعي', type: 'تدريب', description: 'برنامج تدريبي عملي للشباب.', required_skills: ['التقنية', 'التعلم الذاتي'], location: 'الخليل', deadline: isoDaysFromNow(20), salary_range: 'بدل مواصلات', contact_email: 'tech@community.ps', is_active: true, created_at: isoDaysFromNow(-4) },
      { id: 3, title: 'مساعد برامج مجتمعية', organization: 'جمعية شباب الخليل', type: 'تطوع مدفوع', description: 'إدارة المبادرات المجتمعية.', required_skills: ['الخدمة المجتمعية', 'العمل الجماعي', 'المبادرة'], location: 'الخليل', deadline: isoDaysFromNow(10), salary_range: '1200 شيكل / شهر', contact_email: 'apply@youth.ps', is_active: true, created_at: isoDaysFromNow(-1) },
      { id: 4, title: 'منشط ثقافي', organization: 'مركز التراث الفلسطيني', type: 'وظيفة', description: 'تصميم برامج ثقافية للشباب.', required_skills: ['الإبداع', 'التراث', 'التقديم'], location: 'القصبة', deadline: isoDaysFromNow(16), salary_range: '3000 - 3800 شيكل', contact_email: 'culture@hebron.ps', is_active: true, created_at: isoDaysFromNow(-3) },
      { id: 5, title: 'مساعد تنسيق أنشطة رياضية', organization: 'نادي شباب الخليل', type: 'تدريب', description: 'دعم تنظيم البطولات.', required_skills: ['روح الفريق', 'الانضباط', 'الصحة'], location: 'الخليل', deadline: isoDaysFromNow(12), salary_range: 'بدل تدريب', contact_email: 'sports@hebron.ps', is_active: true, created_at: isoDaysFromNow(-2) },
      { id: 6, title: 'باحث ميداني للبيانات المجتمعية', organization: 'مختبر الابتكار المدني', type: 'وظيفة', description: 'جمع وتحليل بيانات ميدانية.', required_skills: ['البحث العلمي', 'التنظيم', 'التواصل'], location: 'الخليل', deadline: isoDaysFromNow(18), salary_range: '4000 شيكل', contact_email: 'lab@civic.ps', is_active: true, created_at: isoDaysFromNow(-2) },
    ],
    auditLog: [
      { id: 1, admin_id: 1, admin_name: 'مدير البلدية', action: 'USER_DISABLED', target_type: 'user', target_id: 99, target_name: 'حساب تجريبي', details: { previous_status: 1, new_status: 0 }, created_at: isoDaysFromNow(-9) },
      { id: 2, admin_id: 1, admin_name: 'مدير البلدية', action: 'REG_STATUS_CHANGED', target_type: 'registration', target_id: 4, target_name: 'سامر ناصر ← مبادرة دعم كبار السن', details: { from: 'registered', to: 'attended' }, created_at: isoDaysFromNow(-8) },
      { id: 3, admin_id: 1, admin_name: 'مدير البلدية', action: 'USER_ENABLED', target_type: 'user', target_id: 99, target_name: 'حساب تجريبي', details: { previous_status: 0, new_status: 1 }, created_at: isoDaysFromNow(-5) },
      { id: 4, admin_id: 1, admin_name: 'مدير البلدية', action: 'REG_CANCELLED', target_type: 'registration', target_id: 20, target_name: 'طالب تجريبي ← ورشة قديمة', details: { previous_status: 'registered' }, created_at: isoDaysFromNow(-3) },
    ],
    verificationCodes: [
      { id: 1, event_id: 6, university_id: 101, code: 'HU-ATTEND-01', is_used: false, expires_at: isoDaysFromNow(5) },
      { id: 2, event_id: 7, university_id: 102, code: 'PPU-ATTEND-01', is_used: false, expires_at: isoDaysFromNow(5) },
      { id: 3, event_id: 5, university_id: null, code: 'OPEN-CODE-01', is_used: true, expires_at: isoDaysFromNow(-1) },
    ],
  };
}

let stateCache;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  if (stateCache) return stateCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      stateCache = JSON.parse(raw);
      return stateCache;
    }
  } catch { }
  stateCache = seedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCache));
  return stateCache;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCache));
}

function updateState(mutator) {
  const state = loadState();
  mutator(state);
  saveState();
  return state;
}

function nextId(counterKey) {
  const state = loadState();
  state.counters[counterKey] += 1;
  saveState();
  return state.counters[counterKey];
}

function createHttpError(status, error) {
  const err = new Error(error);
  err.response = { status, data: { error } };
  return err;
}

function response(data, status = 200) {
  return Promise.resolve({ data, status });
}

function getNeighborhoodById(id) {
  return loadState().neighborhoods.find((item) => item.id === Number(id));
}

function getUserById(id) {
  return loadState().users.find((item) => item.id === Number(id));
}

function getUniversityById(id) {
  return loadState().universityAccounts.find((item) => item.id === Number(id));
}

function getEventById(id) {
  return loadState().events.find((item) => item.id === Number(id));
}

function getRegistrationsForEvent(eventId) {
  return loadState().registrations.filter((item) => item.event_id === Number(eventId) && item.status !== 'cancelled');
}

function getAttendedRegistrationsForUser(userId) {
  return loadState().registrations.filter((item) => item.user_id === Number(userId) && item.status === 'attended');
}

function getParticipationCount(userId) {
  return getAttendedRegistrationsForUser(userId).length;
}

function getVolunteerHours(userId) {
  return getAttendedRegistrationsForUser(userId).reduce((sum, reg) => sum + Number(getEventById(reg.event_id)?.duration_hours || 0), 0);
}

function getAcademicHours(userId) {
  return getAttendedRegistrationsForUser(userId).reduce((sum, reg) => {
    const event = getEventById(reg.event_id);
    return sum + Number(event?.duration_hours || 0) * (MULTIPLIERS[event?.type] || 1);
  }, 0);
}

function getPoints(userId) {
  return getParticipationCount(userId) * 10;
}

function getActivityBreakdown(userId) {
  return getAttendedRegistrationsForUser(userId).reduce((acc, reg) => {
    const type = getEventById(reg.event_id)?.type;
    if (type) acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

function getRegisteredCount(eventId) {
  return getRegistrationsForEvent(eventId).length;
}

function getEarnedBadges(userId) {
  const points = getPoints(userId);
  const hours = getVolunteerHours(userId);
  const participations = getParticipationCount(userId);
  return BADGES.filter((badge) => {
    if (badge.condition_type === 'points') return points >= badge.condition_value;
    if (badge.condition_type === 'hours') return hours >= badge.condition_value;
    if (badge.condition_type === 'participations') return participations >= badge.condition_value;
    return false;
  }).map((badge, index) => ({ ...badge, earned_at: isoDaysFromNow(-(index + 1)) }));
}

function requireAuth() {
  const raw = localStorage.getItem('user');
  if (!raw) throw createHttpError(401, 'يجب تسجيل الدخول أولاً');
  const saved = JSON.parse(raw);
  const state = loadState();
  if (saved.role === 'university') {
    const university = state.universityAccounts.find((item) => item.id === saved.university_id);
    if (!university || !university.is_active) throw createHttpError(401, 'الحساب الجامعي غير متاح');
    return {
      id: university.id,
      role: 'university',
      university_id: university.id,
      name: university.name,
      email: university.email,
      code: university.code,
    };
  }
  const user = state.users.find((item) => item.id === saved.id);
  if (!user || user.is_active === 0) throw createHttpError(401, 'الحساب غير متاح');
  return user;
}

function requireAdmin() {
  const user = requireAuth();
  if (user.role !== 'admin') throw createHttpError(403, 'صلاحية المدير مطلوبة');
  return user;
}

function requireUniversityOrAdmin() {
  const user = requireAuth();
  if (user.role !== 'university' && user.role !== 'admin') throw createHttpError(403, 'صلاحية الجامعة مطلوبة');
  return user;
}

function sanitizeUser(user) {
  const neighborhood = getNeighborhoodById(user.neighborhood_id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    points: getPoints(user.id),
    total_hours: Number(getVolunteerHours(user.id).toFixed(1)),
    external_hours: Number(getAcademicHours(user.id).toFixed(2)),
    avatar_url: user.avatar_url,
    bio: user.bio,
    created_at: user.created_at,
    is_university_student: Boolean(user.is_university_student),
    university: user.university,
    student_id: user.student_id,
    neighborhood_name: neighborhood?.name || null,
    participations: getParticipationCount(user.id),
    is_active: user.is_active,
  };
}

function sanitizeUniversityAccount(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: 'university',
    university_id: account.id,
    contact_name: account.contact_name,
    code: account.code,
    city: account.city,
    phone: account.phone,
    is_active: account.is_active,
  };
}

function enrichEvent(event) {
  if (!event) return null;
  return {
    ...event,
    current_participants: getRegisteredCount(event.id),
    neighborhood_name: getNeighborhoodById(event.neighborhood_id)?.name || null,
    created_by_name: getUserById(event.created_by)?.name || 'الإدارة',
  };
}

function getUserSkills(userId) {
  const scores = {};
  getAttendedRegistrationsForUser(userId).forEach((registration) => {
    const event = getEventById(registration.event_id);
    const skills = SKILL_MAP[event?.type] || [];
    const weight = 1 + Number(event?.duration_hours || 0) * 0.5;
    skills.forEach((skill) => {
      scores[skill] = (scores[skill] || 0) + weight;
    });
  });
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, score]) => ({
      name,
      icon: SKILL_ICONS[name] || '✨',
      level: score >= 10 ? 'متقدم' : score >= 5 ? 'متوسط' : 'مبتدئ',
      score: Math.round(score),
    }));
}

function getNotificationsForUser(userId) {
  return loadState().notifications
    .filter((item) => item.user_id === Number(userId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function addNotification(userId, payload) {
  updateState((state) => {
    state.notifications.push({
      id: nextId('notification'),
      user_id: Number(userId),
      is_read: 0,
      created_at: new Date().toISOString(),
      related_id: null,
      related_type: null,
      ...payload,
    });
  });
}

function createCertificateCode(userId, hours) {
  const base = `HY${String(userId).padStart(4, '0')}H${Math.round(Number(hours) * 10)}`;
  const checksum = [...base].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 97;
  return `${base}-${String(checksum).padStart(2, '0')}`;
}

function buildTranscript(userId) {
  return getAttendedRegistrationsForUser(userId)
    .map((registration) => {
      const event = getEventById(registration.event_id);
      const multiplier = MULTIPLIERS[event?.type] || 1;
      return {
        title: event.title,
        type: event.type,
        date: event.date,
        location_name: event.location_name,
        volunteer_hours: Number(event.duration_hours).toFixed(1),
        academic_hours: (Number(event.duration_hours) * multiplier).toFixed(2),
        multiplier: multiplier.toFixed(2),
        status: registration.status,
        confirmed_at: registration.confirmed_at,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getUniversityStudents(universityId, search = '') {
  const query = search.trim();
  return loadState().universityStudents
    .filter((item) => item.university_id === Number(universityId))
    .map((item) => {
      const linkedUser = item.user_id ? getUserById(item.user_id) : null;
      const academicHours = linkedUser ? getAcademicHours(linkedUser.id) : 0;
      return {
        link_id: item.id,
        student_id: item.student_id,
        major: item.major,
        joined_at: item.joined_at,
        is_verified: item.is_verified,
        user_id: linkedUser?.id || null,
        name: linkedUser?.name || item.student_name,
        email: linkedUser?.email || null,
        total_hours: linkedUser ? Number(getVolunteerHours(linkedUser.id).toFixed(1)) : 0,
        points: linkedUser ? getPoints(linkedUser.id) : 0,
        total_participations: linkedUser ? getParticipationCount(linkedUser.id) : 0,
        academic_hours: academicHours.toFixed(2),
        activities_raw: linkedUser ? Object.keys(getActivityBreakdown(linkedUser.id)).join(',') : '',
        certificate_eligible: academicHours >= 10,
      };
    })
    .filter((item) => {
      if (!query) return true;
      return [item.name, item.student_id, item.email].filter(Boolean).some((value) => value.includes(query));
    })
    .sort((a, b) => Number(b.academic_hours) - Number(a.academic_hours));
}

function getMockCurrentUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildJobsForUser(userId) {
  const jobs = loadState().jobs.filter((job) => job.is_active);
  const skills = userId ? getUserSkills(userId) : [];
  const skillNames = skills.map((item) => item.name);
  const jobsWithScores = jobs.map((job) => {
    const matches = job.required_skills.filter((skill) => skillNames.includes(skill)).length;
    const matchScore = job.required_skills.length ? Math.round((matches / job.required_skills.length) * 100) : 0;
    return { ...job, match_score: matchScore };
  });
  if (userId) jobsWithScores.sort((a, b) => b.match_score - a.match_score);
  return { jobs: jobsWithScores, userSkills: skills };
}

const mockAPI = {
  auth: {},
  events: {},
  registrations: {},
  users: {},
  neighborhoods: {},
  analytics: {},
  notifications: {},
  jobs: {},
  university: {},
  admin: {},
  chat: {},
};

mockAPI.auth.login = async (payload) => {
  const state = loadState();
  const email = payload.email?.toLowerCase().trim();
  const password = payload.password || '';
  const user = state.users.find((item) => item.email === email);
  if (user) {
    if (user.is_active === 0) throw createHttpError(403, 'تم تعطيل حسابك من قبل الإدارة');
    if (user.password !== password) throw createHttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    return response({ message: 'تم تسجيل الدخول بنجاح', token: `mock-token-user-${user.id}`, user: sanitizeUser(user) });
  }
  const university = state.universityAccounts.find((item) => item.email === email && item.is_active);
  if (university) {
    if (university.password !== password) throw createHttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    return response({ message: 'تم تسجيل الدخول بنجاح', token: `mock-token-university-${university.id}`, user: sanitizeUniversityAccount(university) });
  }
  throw createHttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
};

mockAPI.auth.register = async (payload) => {
  const state = loadState();
  const email = payload.email?.toLowerCase().trim();
  if (!payload.name || !email || !payload.password) throw createHttpError(400, 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة');
  if (state.users.some((item) => item.email === email)) throw createHttpError(409, 'البريد الإلكتروني مسجل مسبقاً');
  const created = {
    id: nextId('user'),
    name: payload.name,
    email,
    password: payload.password,
    phone: payload.phone || null,
    role: 'youth',
    neighborhood_id: payload.neighborhood_id ? Number(payload.neighborhood_id) : null,
    is_university_student: Boolean(payload.is_university_student),
    university: payload.university || null,
    student_id: payload.student_id || null,
    avatar_url: null,
    bio: 'عضو جديد في منصة شباب الخليل.',
    is_active: 1,
    created_at: new Date().toISOString(),
  };
  updateState((inner) => {
    inner.users.push(created);
  });
  if (created.is_university_student && created.student_id) {
    const university = state.universityAccounts.find((item) => item.name === created.university);
    if (university) {
      updateState((inner) => {
        const existingLink = inner.universityStudents.find((item) => item.university_id === university.id && item.student_id === created.student_id);
        if (existingLink) {
          existingLink.user_id = created.id;
          existingLink.student_name = created.name;
          existingLink.is_verified = 1;
        } else {
          inner.universityStudents.push({
            id: nextId('universityStudent'),
            university_id: university.id,
            user_id: created.id,
            student_id: created.student_id,
            student_name: created.name,
            major: null,
            joined_at: new Date().toISOString(),
            is_verified: 1,
          });
        }
      });
    }
  }
  addNotification(created.id, { title: 'تم إنشاء الحساب بنجاح', message: 'مرحباً بك في منصة شباب الخليل', type: 'system' });
  return response({ message: 'تم إنشاء الحساب بنجاح', token: `mock-token-user-${created.id}`, user: sanitizeUser(created) }, 201);
};

mockAPI.auth.getMe = async () => {
  const current = getMockCurrentUser();
  if (!current) throw createHttpError(401, 'لا يوجد مستخدم مسجل');
  if (current.role === 'university') {
    const university = getUniversityById(current.university_id || current.id);
    if (!university) throw createHttpError(404, 'الجامعة غير موجودة');
    return response({ user: sanitizeUniversityAccount(university) });
  }
  const user = getUserById(current.id);
  if (!user) throw createHttpError(404, 'المستخدم غير موجود');
  return response({ user: sanitizeUser(user) });
};

mockAPI.events.getAll = async (params = {}) => {
  let events = loadState().events.map(enrichEvent);
  if (params.type) events = events.filter((item) => item.type === params.type);
  if (params.neighborhood_id) events = events.filter((item) => Number(item.neighborhood_id) === Number(params.neighborhood_id));
  if (params.date_from) events = events.filter((item) => new Date(item.date) >= new Date(params.date_from));
  if (params.date_to) events = events.filter((item) => new Date(item.date) <= new Date(params.date_to));
  if (params.status) events = events.filter((item) => item.status === params.status);
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  return response({ events, count: events.length });
};

mockAPI.events.getById = async (id) => {
  const event = getEventById(id);
  if (!event) throw createHttpError(404, 'الفعالية غير موجودة');
  return response({ event: { ...enrichEvent(event), registered_count: getRegisteredCount(id) } });
};

mockAPI.events.create = async (data) => {
  requireAdmin();
  if (!data.title || !data.date) throw createHttpError(400, 'عنوان الفعالية والتاريخ مطلوبان');
  const created = {
    id: nextId('event'),
    title: data.title,
    description: data.description || '',
    type: data.type || 'تطوعية',
    neighborhood_id: data.neighborhood_id ? Number(data.neighborhood_id) : null,
    location_name: data.location_name || 'الخليل',
    lat: data.lat ? Number(data.lat) : null,
    lng: data.lng ? Number(data.lng) : null,
    date: new Date(data.date).toISOString(),
    duration_hours: Number(data.duration_hours || 2),
    max_participants: Number(data.max_participants || 50),
    image_url: data.image_url || null,
    status: data.status || 'active',
    created_by: 1,
    created_at: new Date().toISOString(),
  };
  updateState((state) => {
    state.events.push(created);
    state.users.filter((item) => item.role === 'youth').forEach((user) => {
      state.notifications.push({
        id: nextId('notification'),
        user_id: user.id,
        title: `فعالية جديدة: "${created.title}" 🎉`,
        message: created.location_name || 'سجل الآن',
        type: 'new_event',
        related_id: created.id,
        related_type: 'event',
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    });
  });
  return response({ message: 'تم إنشاء الفعالية بنجاح', event: enrichEvent(created) }, 201);
};

mockAPI.events.update = async (id, data) => {
  requireAdmin();
  const event = getEventById(id);
  if (!event) throw createHttpError(404, 'الفعالية غير موجودة');
  updateState((state) => {
    const target = state.events.find((item) => item.id === Number(id));
    Object.assign(target, {
      title: data.title ?? target.title,
      description: data.description ?? target.description,
      type: data.type ?? target.type,
      neighborhood_id: data.neighborhood_id ? Number(data.neighborhood_id) : target.neighborhood_id,
      location_name: data.location_name ?? target.location_name,
      lat: data.lat ?? target.lat,
      lng: data.lng ?? target.lng,
      date: data.date ? new Date(data.date).toISOString() : target.date,
      duration_hours: data.duration_hours ? Number(data.duration_hours) : target.duration_hours,
      max_participants: data.max_participants ? Number(data.max_participants) : target.max_participants,
      image_url: data.image_url ?? target.image_url,
      status: data.status ?? target.status,
    });
  });
  return response({ message: 'تم تحديث الفعالية', event: enrichEvent(getEventById(id)) });
};

mockAPI.events.remove = async (id) => {
  requireAdmin();
  const event = getEventById(id);
  if (!event) throw createHttpError(404, 'الفعالية غير موجودة');
  updateState((state) => {
    state.events = state.events.filter((item) => item.id !== Number(id));
    state.registrations = state.registrations.filter((item) => item.event_id !== Number(id));
  });
  return response({ message: 'تم حذف الفعالية بنجاح' });
};

mockAPI.registrations.register = async (eventId) => {
  const user = requireAuth();
  if (user.role === 'university') throw createHttpError(403, 'هذا الحساب غير مخصص للتسجيل في الفعاليات');
  const event = getEventById(eventId);
  if (!event || event.status !== 'active') throw createHttpError(404, 'الفعالية غير موجودة أو غير متاحة');
  if (getRegisteredCount(eventId) >= Number(event.max_participants)) throw createHttpError(400, 'عذراً، الفعالية ممتلئة');
  if (loadState().registrations.find((item) => item.user_id === user.id && item.event_id === Number(eventId))) {
    throw createHttpError(409, 'أنت مسجل في هذه الفعالية مسبقاً');
  }
  const registration = { id: nextId('registration'), user_id: user.id, event_id: Number(eventId), status: 'registered', registered_at: new Date().toISOString(), confirmed_at: null };
  updateState((state) => {
    state.registrations.push(registration);
    state.notifications.push({ id: nextId('notification'), user_id: user.id, title: `تم استلام طلب انضمامك في "${event.title}" 📋`, message: `طلبك قيد المراجعة حالياً، سيصلك إشعار فور تأكيد الطلب.`, type: 'registration', related_id: event.id, related_type: 'event', is_read: 0, created_at: new Date().toISOString() });
    state.notifications.push({ id: nextId('notification'), user_id: 1, title: `تسجيل جديد في "${event.title}"`, message: `${user.name} انضم للفعالية`, type: 'registration', related_id: event.id, related_type: 'event', is_read: 0, created_at: new Date().toISOString() });
  });
  return response({ message: 'تم التسجيل في الفعالية بنجاح! 🎉', registration: { ...registration, title: event.title, date: event.date, location_name: event.location_name } }, 201);
};

mockAPI.registrations.getMy = async () => {
  const user = requireAuth();
  if (user.role === 'university') return response({ registrations: [] });
  const registrations = loadState().registrations
    .filter((item) => item.user_id === user.id)
    .map((item) => {
      const event = enrichEvent(getEventById(item.event_id));
      return { ...item, title: event.title, date: event.date, location_name: event.location_name, type: event.type, image_url: event.image_url, duration_hours: event.duration_hours, neighborhood_name: event.neighborhood_name };
    })
    .sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
  return response({ registrations });
};

mockAPI.registrations.getByEvent = async (eventId) => {
  requireAdmin();
  const registrations = loadState().registrations
    .filter((item) => item.event_id === Number(eventId))
    .map((item) => {
      const user = getUserById(item.user_id);
      return { ...item, user_name: user?.name || 'مستخدم', email: user?.email || null, phone: user?.phone || null, neighborhood_name: getNeighborhoodById(user?.neighborhood_id)?.name || null, duration_hours: Number(getEventById(item.event_id)?.duration_hours || 0) };
    });
  return response({ registrations, count: registrations.length });
};

mockAPI.registrations.confirm = async (id) => {
  requireAdmin();
  const target = loadState().registrations.find((item) => item.id === Number(id));
  if (!target) throw createHttpError(404, 'التسجيل غير موجود');
  if (target.status === 'attended') throw createHttpError(400, 'تم تأكيد الحضور مسبقاً');
  updateState((state) => {
    const registration = state.registrations.find((item) => item.id === Number(id));
    registration.status = 'attended';
    registration.confirmed_at = new Date().toISOString();
  });
  const event = getEventById(target.event_id);
  addNotification(target.user_id, { title: `تم تأكيد حضورك في "${event.title}" 🎉`, message: `حصلت على 10 نقاط و${event.duration_hours} ساعة تطوع`, type: 'attendance', related_id: event.id, related_type: 'event' });
  return response({ message: `تم تأكيد حضور المستخدم وإضافة 10 نقاط و${event.duration_hours} ساعة` });
};

mockAPI.users.getCVData = async () => {
  const current = requireAuth();
  if (current.role === 'university') throw createHttpError(403, 'هذا المسار مخصص للمستخدمين');
  const userId = current.id;
  const user = sanitizeUser(current);
  const badges = getEarnedBadges(userId);
  const skills = getUserSkills(userId);
  const transcript = buildTranscript(userId);

  // High participation -> Commitment, Team events -> Teamwork
  const participationCount = getParticipationCount(userId);
  if (participationCount >= 5) {
    if (!skills.find(s => s.name === 'الالتزام والمسؤولية')) {
      skills.push({ name: 'الالتزام والمسؤولية', icon: '✅', level: 'عالي', score: 10 });
    }
  }

  // Calculate volunteer score
  const volunteerScore = Math.min(100, Math.round((user.points / 200) * 100));

  return response({
    user,
    badges,
    skills,
    transcript,
    volunteerScore,
    summary: user.bio || `طالب ناشط في منصة Linka، مهتم بالعمل التطوعي والمجتمعي. شارك في ${user.participations} فعالية وأتم ${user.total_hours} ساعة تطوعية.`,
    qrCodeUrl: `https://linka.ps/profile/${userId}`
  });
};

mockAPI.users.updateProfile = async (updates) => {
  const current = requireAuth();
  updateState((state) => {
    const user = state.users.find((u) => u.id === current.id);
    if (user) {
      Object.assign(user, updates);
    }
  });
  return response({ message: 'تم تحديث البيانات بنجاح' });
};

mockAPI.users.getProfile = async () => {
  const current = requireAuth();
  if (current.role === 'university') throw createHttpError(403, 'هذا المسار مخصص للمستخدمين');
  return response({ user: sanitizeUser(current), badges: getEarnedBadges(current.id) });
};

mockAPI.users.getLeaderboard = async () => {
  const leaderboard = loadState().users
    .filter((item) => item.role === 'youth' && item.is_active === 1)
    .map((item) => sanitizeUser(item))
    .sort((a, b) => b.points - a.points)
    .slice(0, 20);
  return response({ leaderboard });
};

mockAPI.users.getAdminStats = async () => {
  requireAdmin();
  const state = loadState();
  const youthUsers = state.users.filter((item) => item.role === 'youth' && item.is_active === 1);
  const activeEvents = state.events.filter((item) => item.status === 'active');
  const attended = state.registrations.filter((item) => item.status === 'attended');
  const topNeighborhoodsMap = {};
  attended.forEach((registration) => {
    const neighborhood = getNeighborhoodById(getUserById(registration.user_id)?.neighborhood_id);
    if (neighborhood) topNeighborhoodsMap[neighborhood.name] = (topNeighborhoodsMap[neighborhood.name] || 0) + 1;
  });
  const eventsByTypeMap = {};
  state.events.forEach((event) => { eventsByTypeMap[event.type] = (eventsByTypeMap[event.type] || 0) + 1; });
  return response({
    stats: {
      total_users: youthUsers.length,
      active_events: activeEvents.length,
      total_attendances: attended.length,
      total_volunteer_hours: Number(youthUsers.reduce((sum, user) => sum + getVolunteerHours(user.id), 0).toFixed(1)),
    },
    topNeighborhoods: Object.entries(topNeighborhoodsMap).map(([name, registrations]) => ({ name, registrations })).sort((a, b) => b.registrations - a.registrations).slice(0, 5),
    eventsByType: Object.entries(eventsByTypeMap).map(([type, count]) => ({ type, count })),
  });
};

mockAPI.neighborhoods.getAll = async () => response({ neighborhoods: clone(loadState().neighborhoods) });

mockAPI.analytics.getHeatmap = async () => {
  const state = loadState();
  const points = state.events.filter((event) => event.lat && event.lng && event.status !== 'cancelled').map((event) => {
    const regs = getRegistrationsForEvent(event.id);
    const attended = regs.filter((item) => item.status === 'attended').length;
    return {
      lat: Number(event.lat),
      lng: Number(event.lng),
      intensity: Math.max(0.2, Math.min(1, regs.length / Math.max(1, event.max_participants))),
      title: event.title,
      type: event.type,
      participants: regs.length,
      attended,
      hours: Number((attended * Number(event.duration_hours)).toFixed(1)),
      neighborhood: getNeighborhoodById(event.neighborhood_id)?.name || null,
    };
  });
  const neighborhoods = state.neighborhoods.map((neighborhood) => {
    const residents = state.users.filter((user) => user.neighborhood_id === neighborhood.id);
    const registrations = state.registrations.filter((registration) => residents.some((resident) => resident.id === registration.user_id));
    const totalHours = registrations.filter((registration) => registration.status === 'attended').reduce((sum, registration) => sum + Number(getEventById(registration.event_id)?.duration_hours || 0), 0);
    return { ...neighborhood, total_registrations: registrations.length, unique_participants: new Set(registrations.map((registration) => registration.user_id)).size, total_hours: Number(totalHours.toFixed(1)) };
  });
  return response({ points, neighborhoods, meta: { total_events: points.length, total_points: points.length, generated_at: new Date().toISOString() } });
};

mockAPI.notifications.getAll = async (params = {}) => {
  const user = requireAuth();
  const list = getNotificationsForUser(user.id).slice(0, Number(params.limit || 40));
  return response({ notifications: list, total: list.length, unread: list.filter((item) => !item.is_read).length });
};

mockAPI.notifications.getCount = async () => {
  const user = requireAuth();
  return response({ count: getNotificationsForUser(user.id).filter((item) => !item.is_read).length });
};

mockAPI.notifications.markAsRead = async (id) => {
  const user = requireAuth();
  updateState((state) => {
    const target = state.notifications.find((item) => item.id === Number(id) && item.user_id === user.id);
    if (target) target.is_read = 1;
  });
  return response({ message: 'تم تحديد الإشعار كمقروء' });
};

mockAPI.notifications.markAllAsRead = async () => {
  const user = requireAuth();
  updateState((state) => {
    state.notifications.forEach((item) => { if (item.user_id === user.id) item.is_read = 1; });
  });
  return response({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
};

mockAPI.notifications.delete = async (id) => {
  const user = requireAuth();
  updateState((state) => {
    state.notifications = state.notifications.filter((item) => !(item.id === Number(id) && item.user_id === user.id));
  });
  return response({ message: 'تم حذف الإشعار' });
};

mockAPI.notifications.clearRead = async () => {
  const user = requireAuth();
  updateState((state) => {
    state.notifications = state.notifications.filter((item) => !(item.user_id === user.id && item.is_read));
  });
  return response({ message: 'تم حذف الإشعارات المقروءة' });
};

mockAPI.notifications.broadcast = async (payload) => {
  requireAdmin();
  const audience = loadState().users
    .filter((user) => (payload.target === 'admin' ? user.role === 'admin' : payload.target === 'youth' ? user.role === 'youth' : true))
    .filter((user) => (!payload.neighborhood_id ? true : Number(user.neighborhood_id) === Number(payload.neighborhood_id)));
  updateState((state) => {
    audience.forEach((user) => {
      state.notifications.push({
        id: nextId('notification'),
        user_id: user.id,
        title: payload.title,
        message: payload.message || '',
        type: payload.type || 'announcement',
        related_id: null,
        related_type: null,
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    });
  });
  return response({ message: `تم إرسال الإشعار بنجاح لـ ${audience.length} مستخدم`, count: audience.length });
};

mockAPI.notifications.getAdminRecent = async () => response({ notifications: getNotificationsForUser(1).slice(0, 20) });

mockAPI.jobs.getAll = async () => {
  const current = getMockCurrentUser();
  const userId = current?.role === 'youth' ? current.id : null;
  const data = buildJobsForUser(userId);
  return response({ jobs: data.jobs, user_skills: data.userSkills });
};

mockAPI.jobs.create = async (payload) => {
  requireAdmin();
  if (!payload.title || !payload.organization) throw createHttpError(400, 'العنوان والجهة مطلوبان');
  const job = {
    id: nextId('job'),
    title: payload.title,
    organization: payload.organization,
    type: payload.type || 'وظيفة',
    description: payload.description || '',
    required_skills: payload.required_skills || [],
    location: payload.location || 'الخليل',
    deadline: payload.deadline || null,
    salary_range: payload.salary_range || null,
    contact_email: payload.contact_email || null,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  updateState((state) => { state.jobs.push(job); });
  return response({ message: 'تم إضافة الفرصة بنجاح', id: job.id }, 201);
};

mockAPI.jobs.getRecommend = async () => {
  const user = requireAuth();
  if (user.role !== 'youth') return response({ recommendations: [], user_skills: [] });
  const data = buildJobsForUser(user.id);
  return response({ recommendations: data.jobs.slice(0, 3), user_skills: data.userSkills });
};

mockAPI.jobs.getSkills = async () => {
  const user = requireAuth();
  return response({ skills: user.role === 'youth' ? getUserSkills(user.id) : [] });
};

mockAPI.jobs.getCareerPath = async () => {
  const user = requireAuth();
  if (user.role !== 'youth') return response({ career_path: [], summary: { total_hours: 0, points: 0, level: 'مبتدئ' } });
  const totalHours = getVolunteerHours(user.id);
  const points = getPoints(user.id);
  const topSkill = getUserSkills(user.id)[0];
  const steps = [];
  if (totalHours < 10) {
    steps.push({ icon: '⏱️', priority: 'عالية', title: 'أكمل 10 ساعات تطوع', desc: `لديك ${totalHours.toFixed(1)} ساعة، تحتاج ${(10 - totalHours).toFixed(1)} ساعة إضافية لتفعيل شهادتك الأولى`, action: 'شارك في فعاليات تطوعية أو بيئية خلال هذا الشهر', target_hours: 10, current_hours: totalHours });
  } else if (totalHours < 20) {
    steps.push({ icon: '⭐', priority: 'قريبة', title: 'الوصول إلى مستوى متقدم', desc: `تبقى ${(20 - totalHours).toFixed(1)} ساعة للوصول إلى مستوى متقدم في المنصة`, action: 'استمر بالمشاركة في فعاليات متنوعة', target_hours: 20, current_hours: totalHours });
  } else {
    steps.push({ icon: '🏆', priority: 'منجزة', title: 'مستوى محترف', desc: 'أنت مؤهل للتقديم على الفرص ذات الطابع القيادي والإشرافي.', action: 'راجع قائمة الفرص الموصى بها في الأعلى' });
  }
  if (topSkill) steps.push({ icon: topSkill.icon, priority: 'معلومة', title: `مهارتك الأقوى: ${topSkill.name}`, desc: `مستواك الحالي في ${topSkill.name} هو ${topSkill.level}.`, action: 'ابحث عن فرصة تستثمر هذه المهارة بشكل مباشر' });
  return response({ career_path: steps, summary: { total_hours: Number(totalHours.toFixed(1)), points, top_activity: Object.keys(getActivityBreakdown(user.id))[0] || null, level: totalHours >= 20 ? 'محترف' : totalHours >= 10 ? 'متوسط' : 'مبتدئ' } });
};

mockAPI.university.getUniversities = async () => response({
  universities: loadState().universityAccounts.filter((item) => item.is_active).map((item) => ({ id: item.id, name: item.name, code: item.code, city: item.city })),
});

mockAPI.university.getReport = async (params = {}) => {
  requireAdmin();
  const universityFilter = params.university;
  const minHours = Number(params.min_hours || 0);
  const students = loadState().users
    .filter((user) => user.role === 'youth' && (!universityFilter || user.university === universityFilter))
    .map((user) => {
      const academicHours = getAcademicHours(user.id);
      const volunteerHours = getVolunteerHours(user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        university: user.university || 'غير محدد',
        student_id: user.student_id || '—',
        neighborhood_id: user.neighborhood_id,
        neighborhood: getNeighborhoodById(user.neighborhood_id)?.name || null,
        total_participations: getParticipationCount(user.id),
        volunteer_hours: volunteerHours.toFixed(1),
        academic_hours: academicHours.toFixed(2),
        activities_breakdown: getActivityBreakdown(user.id),
        certificate_eligible: academicHours >= 10,
        certificate_code: academicHours >= 10 ? createCertificateCode(user.id, academicHours) : null,
      };
    })
    .filter((student) => Number(student.volunteer_hours) >= minHours)
    .sort((a, b) => Number(b.academic_hours) - Number(a.academic_hours));
  const activityDistributionMap = {};
  const topNeighborhoodMap = {};
  students.forEach((student) => {
    Object.entries(student.activities_breakdown).forEach(([type, count]) => {
      activityDistributionMap[type] = activityDistributionMap[type] || { type, total_participations: 0, volunteer_hours: 0, academic_hours: 0, avg_multiplier: MULTIPLIERS[type] || 1 };
      activityDistributionMap[type].total_participations += count;
      activityDistributionMap[type].volunteer_hours += count * 2;
      activityDistributionMap[type].academic_hours += count * 2 * (MULTIPLIERS[type] || 1);
    });
    if (student.neighborhood) {
      topNeighborhoodMap[student.neighborhood] = topNeighborhoodMap[student.neighborhood] || { name: student.neighborhood, students: 0, academic_hours: 0 };
      topNeighborhoodMap[student.neighborhood].students += 1;
      topNeighborhoodMap[student.neighborhood].academic_hours += Number(student.academic_hours);
    }
  });
  return response({
    students,
    summary: {
      total_students: students.length,
      total_volunteer_hours: students.reduce((sum, item) => sum + Number(item.volunteer_hours), 0).toFixed(1),
      total_academic_hours: students.reduce((sum, item) => sum + Number(item.academic_hours), 0).toFixed(2),
      total_attended_events: loadState().registrations.filter((item) => item.status === 'attended').length,
    },
    activity_distribution: Object.values(activityDistributionMap).map((item) => ({ ...item, volunteer_hours: item.volunteer_hours.toFixed(1), academic_hours: item.academic_hours.toFixed(2), avg_multiplier: Number(item.avg_multiplier).toFixed(2) })).sort((a, b) => Number(b.academic_hours) - Number(a.academic_hours)),
    top_neighborhoods: Object.values(topNeighborhoodMap).map((item) => ({ ...item, academic_hours: item.academic_hours.toFixed(2) })).sort((a, b) => Number(b.academic_hours) - Number(a.academic_hours)).slice(0, 5),
    multipliers: MULTIPLIERS,
    generated_at: new Date().toISOString(),
  });
};

mockAPI.university.getTranscript = async (userId) => {
  requireAdmin();
  const user = getUserById(userId);
  if (!user) throw createHttpError(404, 'المستخدم غير موجود');
  const academicHours = getAcademicHours(user.id);
  return response({
    user: { ...sanitizeUser(user), total_volunteer_hours: getVolunteerHours(user.id).toFixed(1), total_academic_hours: academicHours.toFixed(2), certificate_eligible: academicHours >= 10, certificate_code: academicHours >= 10 ? createCertificateCode(user.id, academicHours) : null, neighborhood: getNeighborhoodById(user.neighborhood_id)?.name || null },
    transcript: buildTranscript(user.id),
    multipliers: MULTIPLIERS,
  });
};

mockAPI.university.getDashboardStats = async () => {
  const account = requireUniversityOrAdmin();
  const universityId = account.role === 'admin' ? 101 : account.university_id || account.id;
  const students = getUniversityStudents(universityId);
  const linked = students.filter((item) => item.user_id);
  const activityDistributionMap = {};
  linked.forEach((student) => {
    const breakdown = getActivityBreakdown(student.user_id);
    Object.entries(breakdown).forEach(([type, count]) => {
      activityDistributionMap[type] = activityDistributionMap[type] || { type, count: 0, volunteer_hours: 0 };
      activityDistributionMap[type].count += count;
      activityDistributionMap[type].volunteer_hours += count * 2;
    });
  });
  return response({
    stats: {
      total_students: students.length,
      linked_students: linked.length,
      total_academic_hours: linked.reduce((sum, item) => sum + Number(item.academic_hours), 0).toFixed(1),
      cert_eligible: linked.filter((item) => item.certificate_eligible).length,
    },
    top_students: [...students].sort((a, b) => Number(b.academic_hours) - Number(a.academic_hours)).slice(0, 5),
    activity_distribution: Object.values(activityDistributionMap),
  });
};

mockAPI.university.getMyStudents = async (params = {}) => {
  const account = requireUniversityOrAdmin();
  const universityId = account.role === 'admin' ? 101 : account.university_id || account.id;
  const students = getUniversityStudents(universityId, params.search || '');
  return response({
    students,
    total: students.length,
    stats: { total_students: students.length, total_hours: students.reduce((sum, item) => sum + Number(item.total_hours), 0).toFixed(1), cert_eligible: students.filter((item) => item.certificate_eligible).length },
  });
};

mockAPI.university.addStudent = async (payload) => {
  const account = requireUniversityOrAdmin();
  const universityId = account.role === 'admin' ? 101 : account.university_id || account.id;
  if (!payload.student_id) throw createHttpError(400, 'الرقم الجامعي مطلوب');
  if (loadState().universityStudents.find((item) => item.university_id === universityId && item.student_id === payload.student_id)) throw createHttpError(409, 'هذا الطالب مضاف مسبقاً');
  const linkedUser = loadState().users.find((item) => item.student_id === payload.student_id);
  updateState((state) => {
    state.universityStudents.push({ id: nextId('universityStudent'), university_id: universityId, user_id: linkedUser?.id || null, student_id: payload.student_id, student_name: linkedUser?.name || payload.student_name || 'طالب جديد', major: payload.major || null, joined_at: new Date().toISOString(), is_verified: linkedUser ? 1 : 0 });
  });
  return response({ message: linkedUser ? 'تم ربط الطالب بنجاح' : 'تم إضافة الطالب (سيتم ربطه عند تسجيله)', linked: Boolean(linkedUser) }, 201);
};

mockAPI.university.verifyAttendance = async (payload) => {
  const account = requireUniversityOrAdmin();
  const universityId = account.role === 'admin' ? 101 : account.university_id || account.id;
  const code = loadState().verificationCodes.find((item) => item.code === payload.verification_code && !item.is_used && (item.university_id === null || item.university_id === universityId));
  if (!code) throw createHttpError(404, 'رمز التحقق غير صحيح أو منتهي الصلاحية');
  const link = loadState().universityStudents.find((item) => item.university_id === universityId && item.student_id === payload.student_id);
  if (!link) throw createHttpError(404, 'الطالب غير موجود في قائمتكم');
  if (!link.user_id) throw createHttpError(404, 'الطالب غير مرتبط بحساب في المنصة');
  const existing = loadState().registrations.find((item) => item.user_id === link.user_id && item.event_id === code.event_id);
  updateState((state) => {
    const verification = state.verificationCodes.find((item) => item.id === code.id);
    verification.is_used = true;
    if (existing) {
      existing.status = 'attended';
      existing.confirmed_at = new Date().toISOString();
    } else {
      state.registrations.push({ id: nextId('registration'), user_id: link.user_id, event_id: code.event_id, status: 'attended', registered_at: new Date().toISOString(), confirmed_at: new Date().toISOString() });
    }
  });
  const event = getEventById(code.event_id);
  const student = getUserById(link.user_id);
  const approvedHours = (Number(event.duration_hours) * (MULTIPLIERS[event.type] || 1)).toFixed(2);
  addNotification(student.id, { title: `تم اعتماد حضورك في "${event.title}"`, message: `أضيفت ${approvedHours} ساعة أكاديمية إلى سجلك`, type: 'attendance', related_id: event.id, related_type: 'event' });
  return response({ message: `تم اعتماد ${approvedHours} ساعة للطالب ${student.name}`, student: student.name, event: event.title, approved_hours: approvedHours });
};

mockAPI.university.getCertificate = async (userId) => {
  const account = requireUniversityOrAdmin();
  const universityId = account.role === 'admin' ? 101 : account.university_id || account.id;
  const link = loadState().universityStudents.find((item) => item.university_id === universityId && item.user_id === Number(userId));
  if (!link) throw createHttpError(404, 'الطالب غير موجود في سجلات جامعتكم');
  const user = getUserById(userId);
  const academicHours = getAcademicHours(user.id);
  if (academicHours < 10) throw createHttpError(422, `الطالب لديه ${academicHours.toFixed(1)} ساعة فقط. يحتاج 10 ساعات على الأقل للشهادة`);
  return response({ certificate: { student_name: user.name, student_id: link.student_id, major: link.major, academic_hours: academicHours.toFixed(2), total_participations: getParticipationCount(user.id), university_name: getUniversityById(universityId)?.name || 'الجامعة', certificate_code: createCertificateCode(user.id, academicHours), issued_at: new Date().toISOString() } });
};

mockAPI.university.generateCode = async (payload) => {
  requireAdmin();
  const event = getEventById(payload.event_id);
  if (!event) throw createHttpError(404, 'الفعالية غير موجودة');
  const code = `EV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const expiresAt = isoDaysFromNow(7);
  updateState((state) => {
    state.verificationCodes.push({ id: nextId('verificationCode'), event_id: event.id, university_id: null, code, is_used: false, expires_at: expiresAt });
  });
  return response({ code, event: event.title, expires_at: expiresAt, qr_url: `https://api.qrserver.com/v1/create-qr-code/?data=${code}&size=200x200` });
};

mockAPI.admin.listUsers = async (params = {}) => {
  requireAdmin();
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 20);
  let users = loadState().users.map((user) => ({ ...sanitizeUser(user), total_regs: loadState().registrations.filter((item) => item.user_id === user.id).length, attended_count: getParticipationCount(user.id) }));
  if (params.q) users = users.filter((user) => [user.name, user.email, user.phone].filter(Boolean).some((value) => value.includes(params.q)));
  if (params.role) users = users.filter((user) => user.role === params.role);
  if (params.status === 'active') users = users.filter((user) => user.is_active === 1);
  if (params.status === 'inactive') users = users.filter((user) => user.is_active === 0);
  return response({ users: users.slice((page - 1) * limit, page * limit), pagination: { total: users.length, page, limit, pages: Math.max(1, Math.ceil(users.length / limit)) } });
};

mockAPI.admin.toggleUser = async (id) => {
  const admin = requireAdmin();
  const user = getUserById(id);
  if (!user) throw createHttpError(404, 'المستخدم غير موجود');
  if (user.id === admin.id) throw createHttpError(400, 'لا يمكنك تعطيل حسابك الخاص');
  if (user.role === 'admin') throw createHttpError(403, 'لا يمكن تعطيل حساب مدير آخر');
  updateState((state) => {
    const target = state.users.find((item) => item.id === Number(id));
    target.is_active = target.is_active === 1 ? 0 : 1;
    state.auditLog.unshift({ id: nextId('audit'), admin_id: admin.id, admin_name: admin.name, action: target.is_active ? 'USER_ENABLED' : 'USER_DISABLED', target_type: 'user', target_id: target.id, target_name: target.name, details: { new_status: target.is_active }, created_at: new Date().toISOString() });
  });
  return response({ message: getUserById(id).is_active ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح', is_active: getUserById(id).is_active });
};

mockAPI.admin.deleteUser = async (id) => {
  const admin = requireAdmin();
  const user = getUserById(id);
  if (!user) throw createHttpError(404, 'المستخدم غير موجود');
  if (user.id === admin.id) throw createHttpError(400, 'لا يمكنك حذف حسابك الخاص');
  if (user.role === 'admin') throw createHttpError(403, 'لا يمكن حذف حساب مدير');
  updateState((state) => {
    state.users = state.users.filter((item) => item.id !== Number(id));
    state.registrations = state.registrations.filter((item) => item.user_id !== Number(id));
    state.notifications = state.notifications.filter((item) => item.user_id !== Number(id));
    state.universityStudents.forEach((item) => { if (item.user_id === Number(id)) item.user_id = null; });
    state.auditLog.unshift({ id: nextId('audit'), admin_id: admin.id, admin_name: admin.name, action: 'USER_DELETED', target_type: 'user', target_id: user.id, target_name: user.name, details: { email: user.email }, created_at: new Date().toISOString() });
  });
  return response({ message: `تم حذف المستخدم "${user.name}" بشكل نهائي` });
};

mockAPI.admin.getEventRegs = async (eventId, params = {}) => {
  requireAdmin();
  const event = enrichEvent(getEventById(eventId));
  if (!event) throw createHttpError(404, 'الفعالية غير موجودة');
  let registrations = loadState().registrations.filter((item) => item.event_id === Number(eventId)).map((item) => {
    const user = getUserById(item.user_id);
    return { id: item.id, status: item.status, registered_at: item.registered_at, confirmed_at: item.confirmed_at, user_id: user?.id || null, user_name: user?.name || 'مستخدم', email: user?.email || null, phone: user?.phone || null, points: user ? getPoints(user.id) : 0, is_active: user?.is_active || 0, neighborhood_name: getNeighborhoodById(user?.neighborhood_id)?.name || null };
  });
  if (params.status) registrations = registrations.filter((item) => item.status === params.status);
  return response({ event, registrations, count: registrations.length });
};

mockAPI.admin.cancelReg = async (id) => {
  const admin = requireAdmin();
  const registration = loadState().registrations.find((item) => item.id === Number(id));
  if (!registration) throw createHttpError(404, 'التسجيل غير موجود');
  const event = getEventById(registration.event_id);
  const user = getUserById(registration.user_id);
  updateState((state) => {
    state.registrations = state.registrations.filter((item) => item.id !== Number(id));
    state.auditLog.unshift({ id: nextId('audit'), admin_id: admin.id, admin_name: admin.name, action: 'REG_CANCELLED', target_type: 'registration', target_id: registration.id, target_name: `${user?.name || 'مستخدم'} ← ${event?.title || 'فعالية'}`, details: { previous_status: registration.status }, created_at: new Date().toISOString() });
  });
  addNotification(registration.user_id, { title: `تم إلغاء تسجيلك في "${event.title}"`, message: 'تواصل مع الإدارة إذا كنت تعتقد أن هذا الإجراء غير مقصود', type: 'system', related_id: event.id, related_type: 'event' });
  return response({ message: `تم إلغاء تسجيل "${user?.name || 'المستخدم'}" من الفعالية` });
};

mockAPI.admin.changeRegStatus = async (id, status) => {
  const admin = requireAdmin();
  const valid = ['registered', 'cancelled', 'attended', 'absent'];
  if (!valid.includes(status)) throw createHttpError(400, `حالة غير صالحة. القيم المقبولة: ${valid.join(', ')}`);
  const registration = loadState().registrations.find((item) => item.id === Number(id));
  if (!registration) throw createHttpError(404, 'التسجيل غير موجود');
  const event = getEventById(registration.event_id);
  const user = getUserById(registration.user_id);
  const previous = registration.status;
  if (previous === status) throw createHttpError(400, 'الحالة لم تتغير');
  updateState((state) => {
    const target = state.registrations.find((item) => item.id === Number(id));
    target.status = status;
    if (status === 'attended') target.confirmed_at = new Date().toISOString();
    state.auditLog.unshift({ id: nextId('audit'), admin_id: admin.id, admin_name: admin.name, action: 'REG_STATUS_CHANGED', target_type: 'registration', target_id: registration.id, target_name: `${user?.name || 'مستخدم'} ← ${event?.title || 'فعالية'}`, details: { from: previous, to: status }, created_at: new Date().toISOString() });
  });
  if (status === 'attended') addNotification(registration.user_id, { title: `تم تأكيد حضورك في "${event.title}" ✅`, message: `حصلت على 10 نقاط و${event.duration_hours} ساعة`, type: 'attendance', related_id: event.id, related_type: 'event' });
  return response({ message: `تم تغيير حالة التسجيل إلى "${status}"`, previous, current: status });
};

mockAPI.admin.getAuditLog = async (params = {}) => {
  requireAdmin();
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 30);
  let logs = [...loadState().auditLog];
  if (params.action) logs = logs.filter((item) => item.action === params.action);
  if (params.target_type) logs = logs.filter((item) => item.target_type === params.target_type);
  return response({ logs: logs.slice((page - 1) * limit, page * limit), pagination: { total: logs.length, page, limit, pages: Math.max(1, Math.ceil(logs.length / limit)) } });
};

mockAPI.chat.send = async (message) => {
  const text = (message || '').trim();
  let reply = 'أستطيع مساعدتك في العثور على الفعاليات والتسجيل فيها ومتابعة نقاطك.';
  if (text.includes('فعالية') || text.includes('events')) reply = 'أقرب فعالية حالياً هي "تنظيف حديقة المنتزه العام" وبعدها "ورشة مهارات القيادة الشبابية".';
  else if (text.includes('جامعة') || text.includes('شهادة')) reply = 'يمكنك من بوابة الجامعة متابعة الطلاب، التحقق من الحضور، وإصدار الشهادات عند إكمال 10 ساعات أكاديمية.';
  else if (text.includes('عمل') || text.includes('وظيفة')) reply = 'قسم فرص العمل يعرض وظائف وتدريبات مقترحة بناءً على مهاراتك المكتسبة من الأنشطة التطوعية.';
  return response({ reply });
};

mockAPI.training = {};

mockAPI.training.listOffers = async (params = {}) => {
  const offers = [
    { id: 1, title: 'التدريب الميداني: هندسة البرمجيات', company_name: 'شركة جوال', location_name: 'الخليل', start_date: '2026-06-01', end_date: '2026-08-01', required_skills: ['React', 'Node.js'], match_score: 95, description: 'تدريب عملي على تطوير تطبيقات الويب الحديثة.', is_applied: false },
    { id: 2, title: 'تدريب التصميم الجرافيكي', company_name: 'وكالة رؤية', location_name: 'رام الله', start_date: '2026-07-01', end_date: '2026-09-01', required_skills: ['Photoshop', 'Illustrator'], match_score: 80, description: 'فرصة للتدريب على تصميم الهويات البصرية والاعلانات.', is_applied: true }
  ];
  return response({ offers });
};

mockAPI.training.createOffer = async (data) => response({ message: 'تم إنشاء العرض بنجاح' });
mockAPI.training.listCompanyOffers = async () => response({ offers: [] });

mockAPI.training.applyToOffer = async (offerId) => response({ message: 'تم التقديم بنجاح' });
mockAPI.training.listMyApplications = async () => {
  const applications = [
    { id: 1, offer_title: 'تدريب التصميم الجرافيكي', company_name: 'وكالة رؤية', status: 'pending', match_score: 80 }
  ];
  return response({ applications });
};
mockAPI.training.getMyPrograms = async () => response({ programs: [], total_training_hours: 0 });
mockAPI.training.listProgramSessions = async (programId) => response({ sessions: [] });
mockAPI.training.checkIn = async (programId, payload) => response({ message: 'تم تسجيل الدخول بنجاح' });
mockAPI.training.checkOut = async (programId, payload) => response({ message: 'تم تسجيل الخروج بنجاح' });
mockAPI.training.approveSession = async (sessionId, payload) => response({ message: 'تم اعتماد الجلسة' });
mockAPI.training.listUniversitySessions = async (params) => response({ sessions: [] });
mockAPI.training.completeProgram = async (programId) => response({ message: 'تم إنهاء البرنامج بنجاح' });
mockAPI.training.submitReview = async (programId, payload) => response({ message: 'تم تقييم البرنامج' });
mockAPI.training.listOfferReviews = async (offerId) => response({ reviews: [] });
mockAPI.training.listOfferApplications = async (offerId) => response({ applications: [] });
mockAPI.training.acceptApplication = async (applicationId) => response({ message: 'تم القبول' });
mockAPI.training.rejectApplication = async (applicationId, payload) => response({ message: 'تم الرفض' });
mockAPI.training.exportReport = async (params) => response({ report: [] });

export default mockAPI;

