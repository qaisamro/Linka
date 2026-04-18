const pool = require('../db/pool');
const { createNotificationForUser } = require('./notificationsController');

// Reuse the same idea as jobsController: map attended events -> user skills
const SKILL_MAP = {
  'تعليمية': ['القيادة', 'التعلم الذاتي', 'التقنية', 'البحث العلمي'],
  'تطوعية': ['العمل الجماعي', 'الخدمة المجتمعية', 'المبادرة', 'التعاطف'],
  'بيئية': ['الاستدامة', 'التنظيم', 'العمل الجماعي', 'المسؤولية البيئية'],
  'اجتماعية': ['التواصل', 'إدارة الفعاليات', 'بناء العلاقات', 'المرونة'],
  'رياضية': ['الإنجاز', 'الصحة', 'روح الفريق', 'الانضباط'],
  'ثقافية': ['الإبداع', 'التراث', 'التقديم', 'التنوع الثقافي'],
};

function parseJsonMaybe(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v || '[]');
    } catch {
      return [];
    }
  }
  return [];
}

async function computeUserSkillNames(userId) {
  const [rows] = await pool.query(`
    SELECT e.type, COUNT(*) AS count, SUM(e.duration_hours) AS total_hours
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ? AND r.status = 'attended'
    GROUP BY e.type
  `, [userId]);

  const skillScore = {};
  for (const ev of rows) {
    const skills = SKILL_MAP[ev.type] || [];
    const weight = Number(ev.count) + Number(ev.total_hours || 0) * 0.5;
    for (const s of skills) {
      skillScore[s] = (skillScore[s] || 0) + weight;
    }
  }

  return Object.keys(skillScore).sort((a, b) => (skillScore[b] - skillScore[a]));
}

function computeMatchScore(requiredSkills, userSkillNames) {
  const req = requiredSkills || [];
  if (!req.length || !userSkillNames.length) return 0;
  const matchCount = req.filter(s => userSkillNames.includes(s)).length;
  return Math.round((matchCount / req.length) * 100);
}

// Haversine distance in meters
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius (m)
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getOfferForProgram(programId) {
  const [rows] = await pool.query(`
    SELECT p.*, o.geo_center_lat, o.geo_center_lng, o.geo_radius_m, o.location_name,
           o.company_entity_id, o.company_name, o.title AS offer_title
    FROM training_programs p
    JOIN training_offers o ON p.offer_id = o.id
    WHERE p.id = ?
  `, [programId]);
  return rows[0] || null;
}

async function writeTrainingAudit(actorRole, actorUserId, actorCompanyEntityId, action, payload = {}) {
  try {
    await pool.query(`
      INSERT INTO training_audit_log (actor_role, actor_user_id, actor_company_entity_id, action, offer_id, program_id, application_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      actorRole,
      actorUserId ?? null,
      actorCompanyEntityId ?? null,
      action,
      payload.offer_id ?? null,
      payload.program_id ?? null,
      payload.application_id ?? null,
      payload.details ? JSON.stringify(payload.details) : null,
    ]);
  } catch (err) {
    // audit must not break main flows
    console.warn('writeTrainingAudit failed:', err.message);
  }
}

const isStudentUser = (req) => req.user?.role === 'youth';
const isCompanyUser = (req) => req.user?.role === 'entity' && req.user?.entity_type === 'company';

// ──────────────────────────────────────────────────────────────
// Offers
// ──────────────────────────────────────────────────────────────
const listMyCompanyOffers = async (req, res) => {
  try {
    if (!isCompanyUser(req)) return res.status(403).json({ error: 'Company access required.' });
    const company_entity_id = req.user.entity_id ?? req.user.id;

    const [offers] = await pool.query(`
      SELECT o.*,
        (SELECT COUNT(*) FROM training_applications a WHERE a.offer_id = o.id) AS applications_count,
        (SELECT COUNT(*) FROM training_applications a WHERE a.offer_id = o.id AND a.status = 'accepted') AS accepted_count
      FROM training_offers o
      WHERE o.company_entity_id = ?
      ORDER BY o.created_at DESC
      LIMIT 200
    `, [company_entity_id]);

    const enriched = offers.map((o) => ({
      ...o,
      required_skills: parseJsonMaybe(o.required_skills),
      objectives: (() => {
        try { return typeof o.objectives === 'string' ? JSON.parse(o.objectives || '{}') : (o.objectives || {}); } catch { return {}; }
      })(),
    }));

    res.json({ offers: enriched });
  } catch (err) {
    console.error('listMyCompanyOffers error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب عروض الشركة' });
  }
};

const createOffer = async (req, res) => {
  try {
    if (!isCompanyUser(req)) return res.status(403).json({ error: 'Company access required.' });

    const company_entity_id = req.user.entity_id ?? req.user.id;
    const company_name = req.user.entity_name ?? null;

    const {
      title,
      description,
      required_skills,
      objectives,
      specialization,
      max_trainees,
      location_name,
      geo_center_lat,
      geo_center_lng,
      geo_radius_m,
      start_date,
      end_date,
      status,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required' });

    await pool.query(`
      INSERT INTO training_offers
        (company_entity_id, company_name, title, description, required_skills, objectives, specialization,
         max_trainees, location_name, geo_center_lat, geo_center_lng, geo_radius_m,
         start_date, end_date, status, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      company_entity_id,
      company_name,
      title,
      description || null,
      JSON.stringify(required_skills || []),
      JSON.stringify(objectives || {}),
      specialization || null,
      Number(max_trainees || 10),
      location_name || null,
      geo_center_lat ?? null,
      geo_center_lng ?? null,
      geo_radius_m ?? null,
      start_date || null,
      end_date || null,
      status || 'active',
      req.user.id,
    ]);

    const [rows] = await pool.query(`SELECT * FROM training_offers WHERE company_entity_id = ? ORDER BY id DESC LIMIT 1`, [company_entity_id]);
    res.status(201).json({ message: 'تم إنشاء عرض التدريب', offer: rows[0] });
  } catch (err) {
    console.error('createOffer error:', err.message);
    res.status(500).json({ error: 'خطأ في إنشاء عرض التدريب' });
  }
};

const listOffers = async (req, res) => {
  try {
    // Only students get match_score; otherwise return offers as-is
    const userId = req.user?.id;
    const student = isStudentUser(req);
    const userSkillNames = student ? await computeUserSkillNames(userId) : [];

    const { search = '' } = req.query;
    const like = `%${search.trim()}%`;

    const [offers] = await pool.query(`
      SELECT o.*,
        (SELECT COUNT(*) FROM training_applications ta WHERE ta.offer_id = o.id AND ta.student_user_id = ?) as is_applied
      FROM training_offers o
      WHERE o.status = 'active'
        ${search.trim() ? 'AND (o.title LIKE ? OR o.company_name LIKE ?)' : ''}
      ORDER BY o.created_at DESC
      LIMIT 100
    `, search.trim() ? [userId, like, like] : [userId]);

    const enriched = offers.map((o) => {
      const requiredSkills = parseJsonMaybe(o.required_skills);
      const match_score = student ? computeMatchScore(requiredSkills, userSkillNames) : 0;
      return { ...o, required_skills: requiredSkills, match_score, is_applied: !!o.is_applied };
    });

    res.json({ offers: enriched });
  } catch (err) {
    console.error('listOffers error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب عروض التدريب' });
  }
};

// ──────────────────────────────────────────────────────────────
// Applications + Programs
// ──────────────────────────────────────────────────────────────
const listMyApplications = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });
    const student_user_id = req.user.id;

    const [apps] = await pool.query(`
      SELECT
        a.*,
        o.title AS offer_title,
        o.company_name,
        o.location_name,
        o.start_date,
        o.end_date
      FROM training_applications a
      JOIN training_offers o ON o.id = a.offer_id
      WHERE a.student_user_id = ?
      ORDER BY a.applied_at DESC
      LIMIT 200
    `, [student_user_id]);

    res.json({ applications: apps });
  } catch (err) {
    console.error('listMyApplications error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الطلبات' });
  }
};

const applyToOffer = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });

    const student_user_id = req.user.id;
    const offerId = parseInt(req.params.offerId, 10);

    const [offerRows] = await pool.query(`SELECT * FROM training_offers WHERE id = ? AND status = 'active'`, [offerId]);
    if (!offerRows.length) return res.status(404).json({ error: 'Training offer not found' });
    const offer = offerRows[0];

    const requiredSkills = parseJsonMaybe(offer.required_skills);
    const userSkillNames = await computeUserSkillNames(student_user_id);
    const match_score = computeMatchScore(requiredSkills, userSkillNames);

    const [existing] = await pool.query(
      `SELECT id FROM training_applications WHERE offer_id = ? AND student_user_id = ?`,
      [offerId, student_user_id]
    );
    if (existing.length) return res.status(409).json({ error: 'أنت تقدمت لهذا العرض مسبقاً' });

    await pool.query(`
      INSERT INTO training_applications
        (offer_id, student_user_id, company_entity_id, status, match_score, applied_at, decided_at)
      VALUES (?, ?, ?, 'pending', ?, NOW(), NULL)
    `, [offerId, student_user_id, offer.company_entity_id, match_score]);

    const [app] = await pool.query(`
      SELECT * FROM training_applications WHERE offer_id = ? AND student_user_id = ? ORDER BY id DESC LIMIT 1
    `, [offerId, student_user_id]);

    await writeTrainingAudit(
      'student',
      student_user_id,
      offer.company_entity_id,
      'APPLICATION_CREATED',
      { offer_id: offerId, application_id: app[0]?.id, program_id: null, details: { match_score } }
    );

    res.status(201).json({ message: 'تم إرسال طلب التدريب', application: app[0] });
  } catch (err) {
    console.error('applyToOffer error:', err.message);
    res.status(500).json({ error: 'خطأ في إرسال الطلب' });
  }
};

const getMyPrograms = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });

    const student_user_id = req.user.id;
    const [rows] = await pool.query(`
      SELECT
        p.*,
        o.title AS offer_title,
        o.description AS offer_description,
        o.company_name,
        a.status AS application_status,
        a.match_score
      FROM training_programs p
      JOIN training_offers o ON p.offer_id = o.id
      JOIN training_applications a ON p.application_id = a.id
      WHERE p.student_user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [student_user_id]);

    const [stats] = await pool.query(`
      SELECT COALESCE(SUM(ts.computed_hours), 0) as total_training_hours
      FROM training_sessions ts
      JOIN training_programs tp ON ts.program_id = tp.id
      WHERE tp.student_user_id = ? AND ts.status = 'university_approved'
    `, [student_user_id]);

    res.json({
      programs: rows,
      total_training_hours: parseFloat(stats[0]?.total_training_hours || 0).toFixed(2)
    });
  } catch (err) {
    console.error('getMyPrograms error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب مسارات التدريب' });
  }
};

// Company: view applications for an offer
const listOfferApplications = async (req, res) => {
  try {
    if (!isCompanyUser(req)) return res.status(403).json({ error: 'Company access required.' });

    const company_entity_id = req.user.entity_id ?? req.user.id;
    const offerId = parseInt(req.params.offerId, 10);

    const [offer] = await pool.query(`SELECT id, company_entity_id FROM training_offers WHERE id = ?`, [offerId]);
    if (!offer.length) return res.status(404).json({ error: 'Offer not found' });
    if (offer[0].company_entity_id !== company_entity_id) return res.status(403).json({ error: 'Not allowed' });

    const [apps] = await pool.query(`
      SELECT
        a.*,
        u.name AS student_name,
        u.email AS student_email,
        u.student_id
      FROM training_applications a
      JOIN users u ON u.id = a.student_user_id
      WHERE a.offer_id = ?
      ORDER BY a.applied_at DESC
    `, [offerId]);

    res.json({ applications: apps });
  } catch (err) {
    console.error('listOfferApplications error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب طلبات التدريب' });
  }
};

const acceptApplication = async (req, res) => {
  try {
    if (!isCompanyUser(req)) return res.status(403).json({ error: 'Company access required.' });

    const company_entity_id = req.user.entity_id ?? req.user.id;
    const applicationId = parseInt(req.params.applicationId, 10);

    const [appRows] = await pool.query(`
      SELECT a.*, o.title, o.objectives, o.company_entity_id
      FROM training_applications a
      JOIN training_offers o ON o.id = a.offer_id
      WHERE a.id = ?
    `, [applicationId]);

    if (!appRows.length) return res.status(404).json({ error: 'Application not found' });
    const app = appRows[0];

    if (app.company_entity_id !== company_entity_id) return res.status(403).json({ error: 'Not allowed' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Application is not pending' });

    // Determine student's university link (same table universityController uses)
    const university_student_query = `
      SELECT university_id
      FROM university_students
      WHERE user_id = ?
      ORDER BY joined_at DESC
      LIMIT 1
    `;
    const [uniRows] = await pool.query(university_student_query, [app.student_user_id]);
    const university_id = uniRows[0]?.university_id ?? null;

    await pool.query(`
      UPDATE training_applications
      SET status = 'accepted', decided_at = NOW(), decided_by_user_id = ?
      WHERE id = ?
    `, [req.user.id, applicationId]);

    await pool.query(`
      INSERT INTO training_programs (offer_id, application_id, student_user_id, company_entity_id, university_id, status, objectives_snapshot, created_at)
      VALUES (?, ?, ?, ?, ?, 'in_progress', ?, NOW())
    `, [
      app.offer_id,
      applicationId,
      app.student_user_id,
      app.company_entity_id,
      university_id,
      JSON.stringify(app.objectives || {}),
    ]);

    const [programRows] = await pool.query(`
      SELECT * FROM training_programs WHERE application_id = ? ORDER BY id DESC LIMIT 1
    `, [applicationId]);

    await createNotificationForUser(
      app.student_user_id,
      `تم قبولك في تدريب: "${app.title}" ✅`,
      `تهانينا! يرجى البدء بالمتابعة مع الشركة والجامعة واعتماد الساعات لاحقاً.`,
      'system',
      app.offer_id,
      'offer'
    );

    await writeTrainingAudit(
      'company',
      null,
      company_entity_id,
      'APPLICATION_ACCEPTED',
      { offer_id: app.offer_id, application_id: applicationId, program_id: programRows[0]?.id, details: { match_score: app.match_score } }
    );

    res.json({ message: 'تم قبول الطلب', program: programRows[0] });
  } catch (err) {
    console.error('acceptApplication error:', err.message);
    res.status(500).json({ error: 'خطأ في قبول الطلب' });
  }
};

const rejectApplication = async (req, res) => {
  try {
    if (!isCompanyUser(req)) return res.status(403).json({ error: 'Company access required.' });

    const company_entity_id = req.user.entity_id ?? req.user.id;
    const applicationId = parseInt(req.params.applicationId, 10);
    const { notes } = req.body || {};

    const [appRows] = await pool.query(`
      SELECT a.*, o.company_entity_id, o.title
      FROM training_applications a
      JOIN training_offers o ON o.id = a.offer_id
      WHERE a.id = ?
    `, [applicationId]);
    if (!appRows.length) return res.status(404).json({ error: 'Application not found' });
    const app = appRows[0];

    if (app.company_entity_id !== company_entity_id) return res.status(403).json({ error: 'Not allowed' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Application is not pending' });

    await pool.query(`
      UPDATE training_applications
      SET status = 'rejected', decided_at = NOW(), decided_by_user_id = ?, notes = ?
      WHERE id = ?
    `, [req.user.id, notes || null, applicationId]);

    await createNotificationForUser(
      app.student_user_id,
      `تم رفض طلب التدريب: "${app.title}" ❌`,
      notes ? `ملاحظات: ${notes}` : 'تواصل مع الشركة إذا لديك أي أسئلة.',
      'system',
      app.offer_id,
      'offer'
    );

    await writeTrainingAudit(
      'company',
      null,
      company_entity_id,
      'APPLICATION_REJECTED',
      { offer_id: app.offer_id, application_id: applicationId, details: { notes: notes || null } }
    );

    res.json({ message: 'تم رفض الطلب' });
  } catch (err) {
    console.error('rejectApplication error:', err.message);
    res.status(500).json({ error: 'خطأ في رفض الطلب' });
  }
};

// ──────────────────────────────────────────────────────────────
// Smart Tracking
// ──────────────────────────────────────────────────────────────
const checkIn = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });
    const programId = parseInt(req.params.programId, 10);
    const student_user_id = req.user.id;

    const { lat, lng, location_name } = req.body || {};
    if (lat == null || lng == null) return res.status(400).json({ error: 'lat/lng are required' });

    const [programRows] = await pool.query(`
      SELECT p.*, o.geo_center_lat, o.geo_center_lng, o.geo_radius_m
      FROM training_programs p
      JOIN training_offers o ON o.id = p.offer_id
      WHERE p.id = ? AND p.student_user_id = ?
    `, [programId, student_user_id]);
    if (!programRows.length) return res.status(404).json({ error: 'Program not found' });
    const program = programRows[0];

    const [openSessions] = await pool.query(`
      SELECT id FROM training_sessions
      WHERE program_id = ? AND student_user_id = ? AND check_out_at IS NULL
      ORDER BY check_in_at DESC LIMIT 1
    `, [programId, student_user_id]);
    if (openSessions.length) return res.status(409).json({ error: 'يوجد جلسة مفتوحة حالياً' });

    let geo_verified = 0;
    if (program.geo_center_lat != null && program.geo_center_lng != null && program.geo_radius_m != null) {
      const dist = distanceMeters(Number(program.geo_center_lat), Number(program.geo_center_lng), Number(lat), Number(lng));
      geo_verified = dist <= Number(program.geo_radius_m) ? 1 : 0;
    } else {
      geo_verified = 1;
    }

    await pool.query(`
      INSERT INTO training_sessions
        (program_id, student_user_id, check_in_at, check_in_lat, check_in_lng, check_in_location_name, geo_verified, status)
      VALUES (?, ?, NOW(), ?, ?, ?, ?, 'pending')
    `, [programId, student_user_id, lat, lng, location_name || null, geo_verified]);

    const [s] = await pool.query(`
      SELECT * FROM training_sessions
      WHERE program_id = ? AND student_user_id = ?
      ORDER BY id DESC LIMIT 1
    `, [programId, student_user_id]);

    await writeTrainingAudit(
      'student',
      student_user_id,
      program.company_entity_id,
      'CHECKIN',
      { program_id: programId, offer_id: program.offer_id, details: { geo_verified } }
    );

    res.status(201).json({ message: 'تم تسجيل الدخول للموقع', session: s[0] });
  } catch (err) {
    console.error('checkIn error:', err.message);
    res.status(500).json({ error: 'خطأ في تسجيل الحضور' });
  }
};

const checkOut = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });
    const programId = parseInt(req.params.programId, 10);
    const student_user_id = req.user.id;

    const { lat, lng, location_name } = req.body || {};
    if (lat == null || lng == null) return res.status(400).json({ error: 'lat/lng are required' });

    const [programRows] = await pool.query(`
      SELECT p.*, o.geo_center_lat, o.geo_center_lng, o.geo_radius_m
      FROM training_programs p
      JOIN training_offers o ON o.id = p.offer_id
      WHERE p.id = ? AND p.student_user_id = ?
    `, [programId, student_user_id]);
    if (!programRows.length) return res.status(404).json({ error: 'Program not found' });
    const program = programRows[0];

    const [sessions] = await pool.query(`
      SELECT *
      FROM training_sessions
      WHERE program_id = ? AND student_user_id = ? AND check_out_at IS NULL
      ORDER BY check_in_at DESC LIMIT 1
    `, [programId, student_user_id]);
    if (!sessions.length) return res.status(404).json({ error: 'لا توجد جلسة مفتوحة' });
    const session = sessions[0];

    // hours = (checkout - checkin) in hours
    const hours = Math.max(0, (Date.now() - new Date(session.check_in_at).getTime()) / 3600000);

    let geo_verified = session.geo_verified ? 1 : 0;
    if (program.geo_center_lat != null && program.geo_center_lng != null && program.geo_radius_m != null) {
      const dist = distanceMeters(Number(program.geo_center_lat), Number(program.geo_center_lng), Number(lat), Number(lng));
      geo_verified = dist <= Number(program.geo_radius_m) ? geo_verified : 0;
    }

    await pool.query(`
      UPDATE training_sessions
      SET check_out_at = NOW(),
          check_out_lat = ?,
          check_out_lng = ?,
          check_out_location_name = ?,
          computed_hours = ?,
          geo_verified = ?,
          status = 'pending'
      WHERE id = ?
    `, [lat, lng, location_name || null, hours.toFixed(2), geo_verified, session.id]);

    const [updated] = await pool.query(`SELECT * FROM training_sessions WHERE id = ?`, [session.id]);

    await writeTrainingAudit(
      'student',
      student_user_id,
      program.company_entity_id,
      'CHECKOUT',
      { program_id: programId, offer_id: program.offer_id, details: { computed_hours: hours.toFixed(2), geo_verified } }
    );

    res.json({ message: 'تم تسجيل الخروج وحساب الساعات', session: updated[0] });
  } catch (err) {
    console.error('checkOut error:', err.message);
    res.status(500).json({ error: 'خطأ في تسجيل الخروج' });
  }
};

const universityApproveSession = async (req, res) => {
  try {
    // verifyToken + isUniversity should already protect, but we enforce ownership via university_id
    const universityId = req.user.entity_id || req.user.university_id || req.user.id;

    const sessionId = parseInt(req.params.sessionId, 10);
    const { signature_url, notes } = req.body || {};

    const [rows] = await pool.query(`
      SELECT s.*, p.university_id
      FROM training_sessions s
      JOIN training_programs p ON p.id = s.program_id
      WHERE s.id = ?
    `, [sessionId]);
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    const s = rows[0];
    if (s.university_id == null || Number(s.university_id) !== Number(universityId)) {
      return res.status(403).json({ error: 'لا يمكنك اعتماد جلسات هذه الجامعة' });
    }

    if (!s.check_out_at) return res.status(400).json({ error: 'لا يمكن الاعتماد قبل تسجيل الخروج' });
    if (s.status === 'university_approved') return res.status(400).json({ error: 'تم الاعتماد مسبقاً' });

    await pool.query(`
      UPDATE training_sessions
      SET status = 'university_approved',
          approved_by_user_id = ?,
          approved_at = NOW(),
          supervisor_signature_url = ?,
          supervisor_notes = ?
      WHERE id = ?
    `, [req.user.id, signature_url || null, notes || null, sessionId]);

    await writeTrainingAudit(
      'university',
      req.user.id,
      null,
      'SESSION_APPROVED',
      { session_id: sessionId, program_id: s.program_id, offer_id: null, details: { computed_hours: s.computed_hours } }
    );

    res.json({ message: 'تم اعتماد الجلسة', session_id: sessionId });
  } catch (err) {
    console.error('universityApproveSession error:', err.message);
    res.status(500).json({ error: 'خطأ في اعتماد الجلسة' });
  }
};

const universityListPendingSessions = async (req, res) => {
  try {
    const universityId = req.user.entity_id || req.user.university_id || req.user.id;
    const { status = 'pending', limit = 100 } = req.query;

    const [rows] = await pool.query(`
      SELECT
        s.*,
        p.offer_id,
        o.title AS offer_title,
        o.company_name,
        u.name AS student_name,
        u.student_id
      FROM training_sessions s
      JOIN training_programs p ON p.id = s.program_id
      JOIN training_offers o ON o.id = p.offer_id
      JOIN users u ON u.id = s.student_user_id
      WHERE p.university_id = ?
        AND s.status = ?
      ORDER BY s.check_in_at DESC
      LIMIT ?
    `, [universityId, status, Math.min(300, parseInt(limit, 10) || 100)]);

    res.json({ sessions: rows });
  } catch (err) {
    console.error('universityListPendingSessions error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الجلسات' });
  }
};

// ──────────────────────────────────────────────────────────────
// Completion + Reviews (MVP)
// ──────────────────────────────────────────────────────────────
const completeProgram = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });
    const programId = parseInt(req.params.programId, 10);
    const student_user_id = req.user.id;

    const [pRows] = await pool.query(`
      SELECT * FROM training_programs
      WHERE id = ? AND student_user_id = ?
    `, [programId, student_user_id]);
    if (!pRows.length) return res.status(404).json({ error: 'Program not found' });
    const program = pRows[0];
    if (program.status !== 'in_progress') return res.status(400).json({ error: 'Program cannot be completed' });

    const [sessions] = await pool.query(`
      SELECT id, status FROM training_sessions
      WHERE program_id = ? AND student_user_id = ?
    `, [programId, student_user_id]);

    if (!sessions.length) return res.status(400).json({ error: 'لا توجد جلسات' });
    const allApproved = sessions.every(s => s.status === 'university_approved');
    if (!allApproved) return res.status(400).json({ error: 'يجب اعتماد جميع الجلسات أولاً' });

    await pool.query(`
      UPDATE training_programs SET status = 'completed'
      WHERE id = ?
    `, [programId]);

    await writeTrainingAudit(
      'student',
      student_user_id,
      program.company_entity_id,
      'PROGRAM_COMPLETED',
      { program_id: programId, offer_id: program.offer_id }
    );

    res.json({ message: 'تم إنهاء التدريب بنجاح' });
  } catch (err) {
    console.error('completeProgram error:', err.message);
    res.status(500).json({ error: 'خطأ في إنهاء التدريب' });
  }
};

const submitStudentReview = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });

    const programId = parseInt(req.params.programId, 10);
    const student_user_id = req.user.id;

    const { rating, comment, is_public = 1 } = req.body || {};
    const r = parseInt(rating, 10);
    if (!r || r < 1 || r > 5) return res.status(400).json({ error: 'rating must be 1..5' });

    const [pRows] = await pool.query(`
      SELECT p.*, o.id AS offer_id, o.company_entity_id
      FROM training_programs p
      JOIN training_offers o ON o.id = p.offer_id
      WHERE p.id = ? AND p.student_user_id = ?
    `, [programId, student_user_id]);
    if (!pRows.length) return res.status(404).json({ error: 'Program not found' });
    const p = pRows[0];
    if (p.status !== 'completed') return res.status(400).json({ error: 'لا يمكن التقييم قبل إنهاء التدريب' });

    await pool.query(`
      INSERT INTO training_reviews
        (program_id, offer_id, company_entity_id, target_user_id,
         reviewer_role, reviewer_user_id, reviewer_company_entity_id,
         rating, comment, is_public)
      VALUES (?, ?, ?, ?, 'student', ?, NULL, ?, ?, ?)
    `, [programId, p.offer_id, p.company_entity_id, p.company_entity_id, student_user_id, r, comment || null, is_public ? 1 : 0]);

    await writeTrainingAudit(
      'student',
      student_user_id,
      p.company_entity_id,
      'REVIEW_SUBMITTED',
      { program_id: programId, offer_id: p.offer_id }
    );

    res.status(201).json({ message: 'تم إرسال التقييم' });
  } catch (err) {
    console.error('submitStudentReview error:', err.message);
    res.status(500).json({ error: 'خطأ في إرسال التقييم' });
  }
};

const listPublicReviewsForOffer = async (req, res) => {
  try {
    const offerId = parseInt(req.params.offerId, 10);
    const [rows] = await pool.query(`
      SELECT tr.*, u.name AS reviewer_name
      FROM training_reviews tr
      LEFT JOIN users u ON u.id = tr.reviewer_user_id
      WHERE tr.offer_id = ? AND tr.is_public = 1
      ORDER BY tr.created_at DESC
      LIMIT 50
    `, [offerId]);
    res.json({ reviews: rows });
  } catch (err) {
    console.error('listPublicReviewsForOffer error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب المراجعات' });
  }
};

// Student view: list sessions for a program
const listProgramSessions = async (req, res) => {
  try {
    if (!isStudentUser(req)) return res.status(403).json({ error: 'Student access required.' });
    const programId = parseInt(req.params.programId, 10);
    const student_user_id = req.user.id;

    const [rows] = await pool.query(`
      SELECT *
      FROM training_sessions
      WHERE program_id = ? AND student_user_id = ?
      ORDER BY check_in_at DESC
    `, [programId, student_user_id]);
    res.json({ sessions: rows });
  } catch (err) {
    console.error('listProgramSessions error:', err.message);
    res.status(500).json({ error: 'خطأ في جلب الجلسات' });
  }
};

const exportTrainingReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    console.log('Exporting report for user:', userId, 'Role:', role, 'Entity Type:', req.user.entity_type);
    const { student_user_id } = req.query;

    let query = `
      SELECT
        s.id AS session_id,
        u.name AS student_name,
        u.student_id AS student_code,
        o.title AS training_title,
        o.company_name AS company,
        s.check_in_at,
        s.check_out_at,
        s.computed_hours,
        s.check_in_location_name AS location,
        s.status AS session_status,
        s.geo_verified
      FROM training_sessions s
      JOIN training_programs p ON s.program_id = p.id
      JOIN training_offers o ON p.offer_id = o.id
      JOIN users u ON s.student_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    const isUni = role === 'university' || (role === 'entity' && req.user.entity_type === 'university');
    const isStudent = role === 'student' || role === 'user' || role === 'youth';
    const isSuper = role === 'super_admin' || role === 'admin';

    if (isUni) {
      const universityId = req.user.entity_id || req.user.university_id || req.user.id;
      query += ` AND p.university_id = ? `;
      params.push(universityId);

      if (student_user_id) {
        query += ` AND s.student_user_id = ? `;
        params.push(student_user_id);
      }
    } else if (isStudent) {
      // Students can only see their own sessions
      query += ` AND s.student_user_id = ? `;
      params.push(userId);
    } else if (!isSuper) {
      console.warn('Forbidden report access attempt:', { userId, role, entityType: req.user.entity_type });
      return res.status(403).json({ error: 'غير مصرح لك بالوصول لهذا التقرير' });
    }

    query += ` ORDER BY s.check_in_at DESC `;

    const [rows] = await pool.query(query, params);
    res.json({ report: rows });
  } catch (err) {
    console.error('exportTrainingReport error:', err.message);
    res.status(500).json({ error: 'خطأ في تصدير التقرير' });
  }
};

module.exports = {
  listMyCompanyOffers,
  createOffer,
  listOffers,
  listMyApplications,
  applyToOffer,
  getMyPrograms,
  listOfferApplications,
  acceptApplication,
  rejectApplication,
  checkIn,
  checkOut,
  universityListPendingSessions,
  universityApproveSession,
  completeProgram,
  submitStudentReview,
  listPublicReviewsForOffer,
  listProgramSessions,
  exportTrainingReport,
};

