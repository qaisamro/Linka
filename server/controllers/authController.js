const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { clientIp } = require('../middleware/checkBlockedIp');
const { writeAdminAudit } = require('../utils/auditLog');
const { emailHeader, emailFooter } = require('../utils/emailHelpers');

// ─── Helper: generate JWT ───────────────────────────────────────
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ─── Post /api/auth/verify-otp ──────────────────────────────────
const verifyOTP = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'البريد الإلكتروني والكود مطلوبان' });

  try {
    const [rows] = await pool.query(
      'SELECT id, name, role FROM users WHERE email = ? AND verification_code = ?',
      [email.toLowerCase(), code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'كود التحقق غير صحيح' });
    }

    const user = rows[0];
    await pool.query('UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = ?', [user.id]);

    const token = generateToken({ id: user.id, email: email.toLowerCase(), role: user.role });
    res.json({ message: 'تم تفعيل الحساب بنجاح', token, user });
  } catch (err) {
    console.error('verifyOTP error:', err.message);
    res.status(500).json({ error: 'خطأ في تفعيل الحساب' });
  }
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

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const [insertResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, neighborhood_id, is_university_student, university, student_id, is_verified, verification_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?) RETURNING id`,
      [name, email.toLowerCase(), password_hash, phone || null,
        neighborhood_id || null, is_university_student || false,
        university || null, student_id || null, otp]
    );

    const newUserId = insertResult.insertId;

    // ... automatic linking logic ...
    if (is_university_student && (university_id || university) && student_id) {
      // (Keeping same as before)
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
             ON CONFLICT (university_id, student_id) DO UPDATE SET user_id = EXCLUDED.user_id, student_name = EXCLUDED.student_name`,
            [finalUniId, newUserId, student_id, name]
          );
        }
      } catch (linkErr) { console.warn('Auto-link failed:', linkErr.message); }
    }

    // Send Verification Email
    const emailUser = process.env.EMAIL_USER || 'linka.palestine@gmail.com';
    const emailPass = process.env.EMAIL_PASS || '';
    if (emailPass) {
      const transporter = require('nodemailer').createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass }
      });

      const mailOptions = {
        from: `"منصة لينكا Linka" <${emailUser}>`,
        to: email.toLowerCase(),
        subject: `كود تفعيل حسابك: ${otp} 🚀`,
        html: emailHeader('تفعيل الحساب') + `
          <p style="font-size:15px;">أهلاً بك يا <b>${name.split(' ')[0]}</b>،</p>
          <p style="font-size:15px;">يرجى استخدام الكود التالي لتفعيل حسابك في منصة لينكا:</p>
          <div style="text-align:center;margin:25px 0;">
            <div style="display:inline-block;background:#344F1F;color:#F9F5F0;font-size:34px;font-weight:900;letter-spacing:8px;padding:16px 35px;border-radius:16px;">${otp}</div>
          </div>
          <p style="font-size:13px;color:#999;text-align:center;">⏰ ينتهي هذا الكود خلال 10 دقائق</p>
          <p style="font-size:13px;color:#999;text-align:center;">إذا لم تطلب هذا الكود، يرجى تجاهل الرسالة.</p>
        ` + emailFooter()
      };
      await transporter.sendMail(mailOptions);
    }

    res.status(201).json({
      message: 'تم إرسال كود التفعيل لبريدك الإلكتروني',
      mustVerify: true,
      email: email.toLowerCase()
    });
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
    const [userRows] = await pool.query(
      `SELECT u.*, n.name as neighborhood_name
       FROM users u
       LEFT JOIN neighborhoods n ON u.neighborhood_id = n.id
       WHERE u.email = ?`,
      [email.toLowerCase()]
    );

    if (userRows.length > 0) {
      const user = userRows[0];

      // Check verification
      if (user.is_verified === false || user.is_verified === 0) {
        return res.status(403).json({
          error: 'يرجى تفعيل حسابك أولاً عبر الكود المرسل لبريدك الإلكتروني',
          mustVerify: true,
          email: user.email
        });
      }

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
      } catch (_) { }
      await writeAdminAudit(user.id, user.name, 'USER_LOGIN', 'session', user.id, user.email, { ip });
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const { password_hash, verification_code, ...safeUser } = user;
      return res.json({ message: 'تم تسجيل الدخول بنجاح', token, user: safeUser });
    }

    // 2. Check entities ... (exactly same as before)
    const [entRows] = await pool.query(
      'SELECT * FROM entities WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase()]
    );
    if (entRows.length > 0) {
      const ent = entRows[0];
      if (!ent.password_hash) return res.status(401).json({ error: 'لم يتم تفعيل هذا الحساب بعد' });
      const isMatch = await bcrypt.compare(password, ent.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      const token = generateToken({ id: ent.id, email: ent.email, role: 'entity', entity_id: ent.id, entity_name: ent.name, entity_type: ent.type });
      await writeAdminAudit(ent.id, ent.name, 'ENTITY_LOGIN', 'entity', ent.id, ent.email, { ip: clientIp(req) });
      return res.json({ message: 'تم تسجيل الدخول بنجاح', token, user: { id: ent.id, name: ent.name, email: ent.email, role: 'entity', entity_id: ent.id, entity_type: ent.type, contact_name: ent.contact_name, code: ent.code } });
    }

    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
};

// (Keep getMe as is)
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
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.points, u.total_hours, u.is_verified,
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

module.exports = { register, login, getMe, verifyOTP };
