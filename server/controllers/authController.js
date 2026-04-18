const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { clientIp } = require('../middleware/checkBlockedIp');
const { writeAdminAudit } = require('../utils/auditLog');

// ─── Helper: generate JWT ───────────────────────────────────────
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ─── POST /api/auth/register ────────────────────────────────────
const register = async (req, res) => {
  const {
    name, email, password, phone, neighborhood_id,
    is_university_student, university, university_id, student_id
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
  }

  try {
    const [existingUserRows] = await pool.query(
      'SELECT id FROM users WHERE email = ?', [email.toLowerCase()]
    );
    if (existingUserRows.length > 0) {
      return res.status(409).json({ error: 'البريد الإلكتروني مسجّل مسبقاً' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [insertResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, neighborhood_id, is_university_student, university, student_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email.toLowerCase(), password_hash, phone || null,
        neighborhood_id || null, is_university_student || false,
        university || null, student_id || null]
    );

    const newUserId = insertResult.insertId;

    // Automatic linking to university_students if student details provided
    if (is_university_student && (university_id || university) && student_id) {
      try {
        let finalUniId = university_id;
        if (!finalUniId && university) {
          const [ents] = await pool.query("SELECT id FROM entities WHERE type = 'university' AND name = ? LIMIT 1", [university]);
          finalUniId = ents[0]?.id;
        }

        if (finalUniId) {
          await pool.query(
            `INSERT INTO university_students (university_id, user_id, student_id, student_name)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), student_name = VALUES(student_name)`,
            [finalUniId, newUserId, student_id, name]
          );
        }
      } catch (linkErr) {
        console.warn('Auto-link to university failed:', linkErr.message);
      }
    }

    const [userRows] = await pool.query(
      'SELECT id, name, email, role, points, total_hours, created_at, is_university_student, university FROM users WHERE id = ?',
      [newUserId]
    );

    const newUser = userRows[0];
    const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });
    await writeAdminAudit(
      newUser.id,
      newUser.name,
      'USER_REGISTERED',
      'user',
      newUser.id,
      newUser.email,
      { neighborhood_id }
    );

    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح', token, user: newUser });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'خطأ في الخادم، حاول مرة أخرى' });
  }
};

// ─── POST /api/auth/login ───────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' });
  }

  try {
    // 1. Check regular users table
    const [userRows] = await pool.query(
      `SELECT u.*, n.name as neighborhood_name
       FROM users u
       LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE u.email = ?`,
      [email.toLowerCase()]
    );

    if (userRows.length > 0) {
      const user = userRows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }
      const ip = clientIp(req);
      try {
        await pool.query(
          'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
          [ip || null, user.id]
        );
      } catch (_) { /* أعمدة اختيارية قبل الهجرة */ }
      await writeAdminAudit(user.id, user.name, 'USER_LOGIN', 'session', user.id, user.email, { ip });
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const { password_hash, ...safeUser } = user;
      return res.json({ message: 'تم تسجيل الدخول بنجاح', token, user: safeUser });
    }

    // 2. Check entities table (University, Company, Municipality accounts)
    const [entRows] = await pool.query(
      'SELECT * FROM entities WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase()]
    );

    if (entRows.length > 0) {
      const ent = entRows[0];
      if (!ent.password_hash) {
        return res.status(401).json({ error: 'لم يتم تفعيل هذا الحساب بعد' });
      }
      const isMatch = await bcrypt.compare(password, ent.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }
      const token = generateToken({
        id: ent.id,
        email: ent.email,
        role: 'entity',
        entity_id: ent.id,
        entity_name: ent.name,
        entity_type: ent.type
      });
      await writeAdminAudit(ent.id, ent.name, 'ENTITY_LOGIN', 'entity', ent.id, ent.email, { ip: clientIp(req) });
      return res.json({
        message: 'تم تسجيل الدخول بنجاح',
        token,
        user: {
          id: ent.id,
          name: ent.name,
          email: ent.email,
          role: 'entity',
          entity_id: ent.id,
          entity_type: ent.type,
          contact_name: ent.contact_name,
          code: ent.code,
        },
      });
    }

    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'خطأ في الخادم، حاول مرة أخرى' });
  }
};

// ─── GET /api/auth/me ───────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    if (req.user.role === 'entity' || req.user.role === 'university') {
      const [entRows] = await pool.query(
        'SELECT id, name, email, contact_name, phone, code, city, is_active, type FROM entities WHERE id = ?',
        [req.user.entity_id || req.user.university_id || req.user.id]
      );
      if (!entRows.length) return res.status(404).json({ error: 'الجهة غير موجودة' });
      return res.json({
        user: { ...entRows[0], role: req.user.role, entity_id: entRows[0].id, entity_type: entRows[0].type }
      });
    }

    const [userRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.points, u.total_hours,
              u.avatar_url, u.bio, u.created_at, n.name as neighborhood_name,
              (SELECT COUNT(*) FROM registrations WHERE user_id = u.id AND status = 'attended') as participations
       FROM users u
       LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!userRows.length) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ user: userRows[0] });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

module.exports = { register, login, getMe };
