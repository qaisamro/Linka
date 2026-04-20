const pool = require('../db/pool');
const bcrypt = require('bcryptjs');

async function seed() {
  const PASS = await bcrypt.hash('Demo@2026', 10);

  // ─── 1. ENTITIES ─────────────────────────────────────────────────
  const entities = [
    {
      name: 'بلدية الخليل',
      name_en: 'Hebron Municipality',
      type: 'municipality',
      email: 'municipality.khalil@linka-demo.com',
      contact_name: 'م. يوسف أبو غوش',
      phone: '02-2220001',
      city: 'الخليل',
      code: 'MUN-KHL',
      description: 'بلدية مدينة الخليل — الجهة التنفيذية المحلية المسؤولة عن الخدمات والبنية التحتية.',
      website: 'https://hebronmunicipality.ps',
    },
    {
      name: 'مصنع الزجاج الخليلي',
      name_en: 'Khalil Glass Factory',
      type: 'company',
      email: 'glassfactory@linka-demo.com',
      contact_name: 'نادر الجعبري',
      phone: '02-2225500',
      city: 'الخليل',
      code: 'KGF-001',
      description: 'أحد أعرق مصانع الزجاج اليدوي في فلسطين، نُصدّر للعالم منذ 1962.',
      website: 'https://khalilglass.ps',
    },
    {
      name: 'شركة بلكون للتطوير التقني',
      name_en: 'Balcon Tech Development',
      type: 'company',
      email: 'balcon@linka-demo.com',
      contact_name: 'سارة ناصر',
      phone: '059-1234567',
      city: 'الخليل',
      code: 'BLT-002',
      description: 'شركة متخصصة في تطوير البرمجيات وحلول التحول الرقمي للشركات والمؤسسات.',
      website: 'https://balcon.tech',
    },
    {
      name: 'جامعة الخليل',
      name_en: 'Hebron University',
      type: 'university',
      email: 'hebronuni@linka-demo.com',
      contact_name: 'د. محمد الشريف',
      phone: '02-2220995',
      city: 'الخليل',
      code: 'HU-001',
      description: 'جامعة الخليل — مؤسسة أكاديمية رائدة في جنوب الضفة الغربية.',
      website: 'https://hebron.edu',
    },
    {
      name: 'مركز شباب الخليل',
      name_en: 'Hebron Youth Center',
      type: 'company',
      email: 'youthcenter@linka-demo.com',
      contact_name: 'لميس عوض',
      phone: '059-9988776',
      city: 'الخليل',
      code: 'HYC-003',
      description: 'مركز متخصص في تمكين الشباب وبناء القدرات وتوفير الفرص المجتمعية.',
      website: 'https://heyouthcenter.ps',
    },
  ];

  const insertedEntities = [];
  for (const e of entities) {
    const [existing] = await pool.query('SELECT id FROM entities WHERE email = ?', [e.email]);
    if (existing.length > 0) {
      insertedEntities.push({ id: existing[0].id, name: e.name, email: e.email });
      console.log(`⏭️  Entity already exists: ${e.name}`);
      continue;
    }
    const [res] = await pool.query(
      `INSERT INTO entities (name, name_en, type, email, password_hash, contact_name, phone, city, code, description, website, is_active, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE) RETURNING id`,
      [e.name, e.name_en, e.type, e.email, PASS, e.contact_name, e.phone, e.city, e.code, e.description, e.website]
    );
    insertedEntities.push({ id: res[0].id, name: e.name, email: e.email });
    console.log(`✅ Inserted entity: ${e.name} (id=${res[0].id})`);
  }

  const eById = {};
  insertedEntities.forEach(e => { eById[e.name] = e.id; });

  // ─── 2. JOBS ─────────────────────────────────────────────────────
  const jobs = [
    {
      title: 'مهندس بنية تحتية',
      organization: 'بلدية الخليل',
      type: 'دوام كامل',
      description: 'نبحث عن مهندس بنية تحتية ذو خبرة لا تقل عن 3 سنوات للعمل على مشاريع الطرق والشبكات.',
      required_skills: JSON.stringify(['هندسة مدنية', 'AutoCAD', 'إدارة المشاريع']),
      location: 'الخليل - المقر الرئيسي',
      deadline: '2026-06-30',
      salary_range: '3500-5000 ₪',
      contact_email: 'hr@hebronmunicipality.ps',
      entity: 'بلدية الخليل',
    },
    {
      title: 'موظف علاقات مجتمعية',
      organization: 'بلدية الخليل',
      type: 'دوام كامل',
      description: 'تنسيق العلاقة بين البلدية والمجتمع المحلي، ومتابعة الشكاوى والاقتراحات.',
      required_skills: JSON.stringify(['التواصل', 'إدارة الشبكات الاجتماعية', 'العلاقات العامة']),
      location: 'الخليل',
      deadline: '2026-05-31',
      salary_range: '2800-3500 ₪',
      contact_email: 'community@hebronmunicipality.ps',
      entity: 'بلدية الخليل',
    },
    {
      title: 'فنّي إنتاج زجاج',
      organization: 'مصنع الزجاج الخليلي',
      type: 'دوام كامل',
      description: 'العمل على خطوط إنتاج الزجاج اليدوي والمزخرف، مع إمكانية التدريب الداخلي.',
      required_skills: JSON.stringify(['عمل يدوي دقيق', 'الصبر', 'الإبداع']),
      location: 'الخليل - المنطقة الصناعية',
      deadline: '2026-07-15',
      salary_range: '2500-3200 ₪',
      contact_email: 'jobs@khalilglass.ps',
      entity: 'مصنع الزجاج الخليلي',
    },
    {
      title: 'مصمم جرافيك وتسويق رقمي',
      organization: 'مصنع الزجاج الخليلي',
      type: 'دوام جزئي',
      description: 'تصميم محتوى تسويقي للسوشيال ميديا، وكتالوجات المنتجات، وعروض التصدير.',
      required_skills: JSON.stringify(['Photoshop', 'Illustrator', 'التسويق الإلكتروني']),
      location: 'الخليل / عن بُعد',
      deadline: '2026-05-20',
      salary_range: '1800-2500 ₪',
      contact_email: 'marketing@khalilglass.ps',
      entity: 'مصنع الزجاج الخليلي',
    },
    {
      title: 'مطوّر تطبيقات موبايل',
      organization: 'شركة بلكون للتطوير التقني',
      type: 'دوام كامل',
      description: 'تطوير تطبيقات موبايل بتقنية React Native لعملاء محليين وإقليميين.',
      required_skills: JSON.stringify(['React Native', 'JavaScript', 'REST APIs', 'Git']),
      location: 'الخليل - المكتب الرئيسي',
      deadline: '2026-06-15',
      salary_range: '4000-6000 ₪',
      contact_email: 'careers@balcon.tech',
      entity: 'شركة بلكون للتطوير التقني',
    },
    {
      title: 'مهندس DevOps',
      organization: 'شركة بلكون للتطوير التقني',
      type: 'دوام كامل',
      description: 'إدارة البنية التحتية السحابية وتأتمة عمليات النشر والاختبار.',
      required_skills: JSON.stringify(['Docker', 'Kubernetes', 'AWS', 'CI/CD']),
      location: 'الخليل / هجين',
      deadline: '2026-07-01',
      salary_range: '5000-8000 ₪',
      contact_email: 'careers@balcon.tech',
      entity: 'شركة بلكون للتطوير التقني',
    },
    {
      title: 'منسق برامج شبابية',
      organization: 'مركز شباب الخليل',
      type: 'دوام كامل',
      description: 'تخطيط وتنفيذ برامج تمكين الشباب، والتواصل مع الجهات الداعمة.',
      required_skills: JSON.stringify(['إدارة البرامج', 'التطوع', 'القيادة']),
      location: 'الخليل',
      deadline: '2026-05-25',
      salary_range: '2600-3400 ₪',
      contact_email: 'jobs@heyouthcenter.ps',
      entity: 'مركز شباب الخليل',
    },
    {
      title: 'معلم لغة إنجليزية',
      organization: 'مركز شباب الخليل',
      type: 'دوام جزئي',
      description: 'تدريس اللغة الإنجليزية لمجموعات شبابية عمر 16-25 عاماً.',
      required_skills: JSON.stringify(['تدريس', 'اللغة الإنجليزية', 'التواصل مع الشباب']),
      location: 'الخليل',
      deadline: '2026-05-15',
      salary_range: '120-150 ₪/ساعة',
      contact_email: 'programs@heyouthcenter.ps',
      entity: 'مركز شباب الخليل',
    },
  ];

  for (const j of jobs) {
    const entityId = eById[j.entity];
    const [existing] = await pool.query('SELECT id FROM jobs WHERE title = ? AND organization = ?', [j.title, j.organization]);
    if (existing.length > 0) { console.log(`⏭️  Job exists: ${j.title}`); continue; }
    await pool.query(
      `INSERT INTO jobs (title, organization, type, description, required_skills, location, deadline, salary_range, contact_email, entity_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [j.title, j.organization, j.type, j.description, j.required_skills, j.location, j.deadline, j.salary_range, j.contact_email, entityId || null]
    );
    console.log(`✅ Inserted job: ${j.title}`);
  }

  // ─── 3. TRAINING OFFERS ──────────────────────────────────────────
  const trainingOffers = [
    {
      company_name: 'شركة بلكون للتطوير التقني',
      entity: 'شركة بلكون للتطوير التقني',
      title: 'تدريب ميداني في تطوير الويب',
      description: 'برنامج تدريب ميداني مدته 3 أشهر في تطوير تطبيقات الويب باستخدام React وNode.js.',
      required_skills: ['HTML', 'CSS', 'JavaScript', 'أساسيات البرمجة'],
      objectives: 'اكتساب خبرة عملية في بيئة عمل احترافية وبناء مشاريع حقيقية.',
      specialization: 'تقنية المعلومات',
      max_trainees: 4,
      location_name: 'الخليل - مكتب بلكون التقني',
      geo_center_lat: 31.5318,
      geo_center_lng: 35.0948,
      geo_radius_m: 500,
      start_date: '2026-06-01',
      end_date: '2026-08-31',
      status: 'active',
    },
    {
      company_name: 'شركة بلكون للتطوير التقني',
      entity: 'شركة بلكون للتطوير التقني',
      title: 'تدريب في الأمن السيبراني',
      description: 'برنامج تدريبي مكثف لمدة شهرين في أساسيات الأمن السيبراني واختبار الاختراق.',
      required_skills: ['شبكات الحاسوب', 'Linux', 'Python'],
      objectives: 'تأهيل المتدربين للحصول على شهادة Security+ وبناء مهارات الحماية الرقمية.',
      specialization: 'أمن المعلومات',
      max_trainees: 3,
      location_name: 'الخليل - مكتب بلكون التقني',
      geo_center_lat: 31.5318,
      geo_center_lng: 35.0948,
      geo_radius_m: 500,
      start_date: '2026-07-01',
      end_date: '2026-08-31',
      status: 'active',
    },
    {
      company_name: 'مصنع الزجاج الخليلي',
      entity: 'مصنع الزجاج الخليلي',
      title: 'تدريب في إدارة سلاسل الإمداد والتصدير',
      description: 'برنامج تدريبي عملي في تنظيم عمليات الإمداد والتصدير لصناعات الحِرف اليدوية.',
      required_skills: ['الإدارة', 'اللغة الإنجليزية', 'التواصل'],
      objectives: 'تأهيل المتدربين لإدارة عمليات التصدير إلى الأسواق الأوروبية.',
      specialization: 'التجارة والتصدير',
      max_trainees: 5,
      location_name: 'مصنع الزجاج - المنطقة الصناعية الخليل',
      geo_center_lat: 31.5220,
      geo_center_lng: 35.0800,
      geo_radius_m: 600,
      start_date: '2026-06-15',
      end_date: '2026-08-15',
      status: 'active',
    },
    {
      company_name: 'جامعة الخليل',
      entity: 'جامعة الخليل',
      title: 'برنامج البحث الأكاديمي لطلاب الدراسات العليا',
      description: 'فرصة للطلاب المتميزين للمشاركة في مشاريع بحثية بإشراف أساتذة متخصصين.',
      required_skills: ['البحث العلمي', 'كتابة الأوراق البحثية', 'التحليل'],
      objectives: 'نشر بحوث في مجلات محكّمة وتطوير مهارات البحث العلمي.',
      specialization: 'أكاديمي',
      max_trainees: 6,
      location_name: 'حرم جامعة الخليل',
      geo_center_lat: 31.5480,
      geo_center_lng: 35.0900,
      geo_radius_m: 1000,
      start_date: '2026-09-01',
      end_date: '2026-12-31',
      status: 'active',
    },
    {
      company_name: 'مركز شباب الخليل',
      entity: 'مركز شباب الخليل',
      title: 'تدريب في القيادة المجتمعية وريادة الأعمال الاجتماعية',
      description: 'برنامج تدريبي متكامل يجمع بين مهارات القيادة وريادة الأعمال وخدمة المجتمع.',
      required_skills: ['العمل الجماعي', 'التخطيط', 'الإبداع'],
      objectives: 'تأهيل قادة شباب قادرين على إطلاق مبادرات مجتمعية مؤثرة.',
      specialization: 'تنمية بشرية',
      max_trainees: 10,
      location_name: 'مركز شباب الخليل',
      geo_center_lat: 31.5340,
      geo_center_lng: 35.0960,
      geo_radius_m: 300,
      start_date: '2026-06-01',
      end_date: '2026-07-31',
      status: 'active',
    },
  ];

  for (const t of trainingOffers) {
    const entityId = eById[t.entity];
    if (!entityId) { console.error(`❌ Entity not found for training: ${t.entity}`); continue; }
    const [existing] = await pool.query('SELECT id FROM training_offers WHERE title = ? AND company_name = ?', [t.title, t.company_name]);
    if (existing.length > 0) { console.log(`⏭️  Training offer exists: ${t.title}`); continue; }
    const skillsJson = JSON.stringify(t.required_skills);
    const objectivesJson = JSON.stringify(t.objectives);
    await pool.query(
      `INSERT INTO training_offers
         (company_entity_id, company_name, title, description, required_skills, objectives, specialization, max_trainees,
          location_name, geo_center_lat, geo_center_lng, geo_radius_m, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [entityId, t.company_name, t.title, t.description, skillsJson, objectivesJson,
       t.specialization, t.max_trainees, t.location_name, t.geo_center_lat, t.geo_center_lng,
       t.geo_radius_m, t.start_date, t.end_date, t.status]
    );
    console.log(`✅ Inserted training offer: ${t.title}`);
  }

  // ─── 4. ADDITIONAL EVENTS ────────────────────────────────────────
  const events = [
    {
      title: 'ملتقى شباب الخليل للتوظيف',
      type: 'تعليمية',
      description: 'ملتقى توظيفي يجمع الشباب الباحث عن عمل مع كبرى الشركات والمؤسسات في محافظة الخليل.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      duration_hours: 6,
      location_name: 'فندق أنتر كونتيننتال — الخليل',
      max_participants: 200,
      current_participants: 0,
      status: 'active',
    },
    {
      title: 'ورشة ريادة الأعمال والابتكار',
      type: 'تعليمية',
      description: 'ورشة عمل تفاعلية يقدمها خبراء في ريادة الأعمال لمساعدة الشباب على تحويل أفكارهم إلى مشاريع ناجحة.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      duration_hours: 8,
      location_name: 'جامعة الخليل — قاعة المؤتمرات',
      max_participants: 80,
      current_participants: 0,
      status: 'active',
    },
    {
      title: 'بطولة كرة القدم الجامعية',
      type: 'رياضية',
      description: 'بطولة كروية تجمع فرق من جامعات المحافظة، تهدف لتعزيز الروح الرياضية والتنافس البنّاء.',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      duration_hours: 5,
      location_name: 'ملعب حديقة الأمل — الخليل',
      max_participants: 120,
      current_participants: 0,
      status: 'active',
    },
    {
      title: 'معرض الصناعات التراثية الخليلية',
      type: 'ثقافية',
      description: 'معرض يبرز المنتجات التراثية من زجاج وفخار وخزف وجلود، مع ورش تعليمية للزوار.',
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      duration_hours: 7,
      location_name: 'البلدة القديمة — الخليل',
      max_participants: 300,
      current_participants: 0,
      status: 'active',
    },
    {
      title: 'يوم التطوع في الحدائق العامة',
      type: 'تطوعية',
      description: 'نشاط تطوعي جماعي لصيانة وتجميل الحدائق العامة في المدينة، مع توزيع نباتات وأشجار.',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      duration_hours: 4,
      location_name: 'حديقة المدينة العامة — الخليل',
      max_participants: 150,
      current_participants: 0,
      status: 'active',
    },
    {
      title: 'دورة إنتاج المحتوى الرقمي',
      type: 'تعليمية',
      description: 'تدريب مكثف على إنتاج وتحرير الفيديو والبودكاست وكتابة المحتوى للمنصات الرقمية.',
      date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      duration_hours: 6,
      location_name: 'مركز شباب الخليل',
      max_participants: 40,
      current_participants: 0,
      status: 'active',
    },
    {
      title: 'مسابقة برمجة هاكاثون الخليل',
      type: 'تعليمية',
      description: 'مسابقة برمجية تنافسية لمدة 24 ساعة لتطوير حلول تقنية لتحديات مجتمعية محلية.',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      duration_hours: 24,
      location_name: 'شركة بلكون التقني — الخليل',
      max_participants: 60,
      current_participants: 0,
      status: 'active',
    },
  ];

  for (const ev of events) {
    const [existing] = await pool.query('SELECT id FROM events WHERE title = ?', [ev.title]);
    if (existing.length > 0) { console.log(`⏭️  Event exists: ${ev.title}`); continue; }
    await pool.query(
      `INSERT INTO events (title, type, description, date, duration_hours, location_name, max_participants, current_participants, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ev.title, ev.type, ev.description, ev.date, ev.duration_hours, ev.location_name,
       ev.max_participants, ev.current_participants, ev.status]
    );
    console.log(`✅ Inserted event: ${ev.title}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed completed! Entity Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const e of insertedEntities) {
    console.log(`  ${e.name}`);
    console.log(`    Email: ${e.email}`);
    console.log(`    Pass:  Demo@2026`);
    console.log('');
  }

  process.exit(0);
}

seed().catch(e => { console.error('Seed failed:', e.message, e.detail || '', e.hint || ''); process.exit(1); });
