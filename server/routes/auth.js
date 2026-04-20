const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyOTP } = require('../controllers/authController');
const verifyToken = require('../middleware/auth');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { emailHeader, emailFooter } = require('../utils/emailHelpers');

// In-memory store for reset codes (code → {email, expires})
const resetCodes = new Map();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.get('/me', verifyToken, getMe);

// ─── POST /api/auth/forgot-password ─────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني' });

  try {
    const [rows] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'لا يوجد حساب مسجّل بهذا البريد الإلكتروني' });
    }

    const userName = rows[0].name;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodes.set(code, { email: email.toLowerCase(), expires: Date.now() + 10 * 60 * 1000 }); // 10 min

    const emailUser = process.env.EMAIL_USER || 'linka.palestine@gmail.com';
    const emailPass = process.env.EMAIL_PASS || '';

    if (!emailPass) return res.status(500).json({ error: 'خدمة البريد غير مهيأة' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });

    await transporter.sendMail({
      from: `"منصة لينكا Linka" <${emailUser}>`,
      to: email.toLowerCase(),
      subject: '🔐 رمز إعادة تعيين كلمة المرور — لينكا',
      html: emailHeader('إعادة تعيين كلمة المرور') + `
        <p style="font-size:15px;">مرحباً <b>${userName.split(' ')[0]}</b>،</p>
        <p style="font-size:15px;">لقد طلبت إعادة تعيين كلمة المرور. استخدم الرمز التالي:</p>
        <div style="text-align:center;margin:25px 0;">
          <div style="display:inline-block;background:#344F1F;color:#F9F5F0;font-size:34px;font-weight:900;letter-spacing:8px;padding:16px 35px;border-radius:16px;">${code}</div>
        </div>
        <p style="font-size:13px;color:#999;text-align:center;">⏰ ينتهي هذا الرمز خلال 10 دقائق</p>
        <p style="font-size:13px;color:#999;text-align:center;">إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
      ` + emailFooter()
    });

    res.json({ message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء إرسال الرمز. حاول مرة أخرى.' });
  }
});

// ─── POST /api/auth/reset-password ──────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { code, newPassword } = req.body;
  if (!code || !newPassword) return res.status(400).json({ error: 'يرجى إدخال الرمز وكلمة المرور الجديدة' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

  const entry = resetCodes.get(code);
  if (!entry) return res.status(400).json({ error: 'رمز التحقق غير صحيح' });
  if (Date.now() > entry.expires) {
    resetCodes.delete(code);
    return res.status(400).json({ error: 'انتهت صلاحية رمز التحقق. أعد المحاولة.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, entry.email]);
    resetCodes.delete(code);
    res.json({ message: 'تم تغيير كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تغيير كلمة المرور' });
  }
});

module.exports = router;
