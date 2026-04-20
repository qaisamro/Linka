const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const pool = require('../db/pool');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const { emailHeader, emailFooter } = require('../utils/emailHelpers');

function buildTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'linka.palestine@gmail.com',
      pass: process.env.EMAIL_PASS || ''
    }
  });
}

function welcomeHtml() {
  return emailHeader('أهلاً بك في منصة لينكا! 🎉') + `
    <div style="line-height:1.8;font-size:15px;">
      <p>يسعدنا انضمامك إلى النشرة الإخبارية الخاصة بنا.</p>
      <p>من الآن فصاعداً، ستصلك أحدث الفعاليات، فرص التطوع، وتحديثات المنصة فور صدورها.</p>
      <p>شكراً لثقتك بنا، ونتمنى لك رحلة ممتعة ومثمرة في بناء المجتمع وتطوير مسارك المهني.</p>
    </div>
  ` + emailFooter();
}

router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح' });
  }

  try {
    // 1. Check if email already exists
    const [existing] = await pool.query('SELECT * FROM newsletter_subscribers WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'هذا البريد مسجل مسبقاً في النشرة الإخبارية.' });
    }

    // 2. Insert into DB
    await pool.query('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email]);

    // 3. Send email using Nodemailer
    const emailPass = process.env.EMAIL_PASS || '';
    const emailUser = process.env.EMAIL_USER || 'linka.palestine@gmail.com';

    if (!emailPass) {
      console.warn('⚠️ EMAIL_PASS not set. Email saved but welcome email will not be sent.');
      return res.status(200).json({ message: 'تم الاشتراك بنجاح!' });
    }

    const transporter = buildTransporter();

    const mailOptions = {
      from: `"منصة لينكا Linka" <${emailUser}>`,
      to: email,
      subject: 'مرحباً بك في مجتمع لينكا 🚀',
      html: welcomeHtml()
    };

    transporter.sendMail(mailOptions).catch(err => console.error('Nodemailer Error:', err));

    res.status(200).json({ message: 'تم الاشتراك بنجاح! راجع بريدك الإلكتروني.' });
  } catch (error) {
    console.error('Newsletter Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء الاشتراك. يرجى المحاولة لاحقاً.' });
  }
});

// ── Get Subscribers (Admins Only) ──────────────────────────────────
router.get('/subscribers', verifyToken, isAdmin, async (req, res) => {
  try {
    const [subscribers] = await pool.query('SELECT id, email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC');
    res.json({ subscribers });
  } catch (error) {
    console.error('Fetch Subscribers Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب قائمة المشتركين' });
  }
});

// ── Get All Contacts (Admins Only) ──────────────────────────────────
router.get('/contacts', verifyToken, isAdmin, async (req, res) => {
  try {
    const [subscribers] = await pool.query('SELECT id, email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC');
    const [users] = await pool.query('SELECT id, name, email, is_active FROM users WHERE is_active = true ORDER BY created_at DESC');
    res.json({ subscribers, users });
  } catch (error) {
    console.error('Fetch Contacts Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب قائمة المستخدمين والمشتركين' });
  }
});

// ── Delete Subscriber (Admins Only) ────────────────────────────────
router.delete('/subscribers/:email', verifyToken, isAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    await pool.query('DELETE FROM newsletter_subscribers WHERE email = ?', [email]);
    res.json({ message: 'تم إزالة المشترك بنجاح.' });
  } catch (error) {
    console.error('Delete Subscriber Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة الحذف.' });
  }
});

// ── Broadcast Route (Admins Only) ──────────────────────────────────
router.post('/broadcast', verifyToken, isAdmin, async (req, res) => {
  const { subject, messageHtml, audience = 'subscribers', customEmails = [] } = req.body;
  if (!subject || !messageHtml) {
    return res.status(400).json({ error: 'الموضوع ونص الرسالة مطلوبان' });
  }

  try {
    let emails = [];

    if (audience === 'subscribers') {
      const [subs] = await pool.query('SELECT email FROM newsletter_subscribers');
      emails = subs.map(s => s.email);
    } else if (audience === 'users') {
      const [users] = await pool.query('SELECT email FROM users WHERE is_active = true');
      emails = users.map(u => u.email);
    } else if (audience === 'custom') {
      emails = customEmails;
    } else if (audience === 'all') {
      const [subs] = await pool.query('SELECT email FROM newsletter_subscribers');
      const [users] = await pool.query('SELECT email FROM users WHERE is_active = true');
      const combined = [...subs.map(s => s.email), ...users.map(u => u.email)];
      emails = [...new Set(combined)]; // Unique emails
    }

    if (!emails || emails.length === 0) {
      return res.status(400).json({ error: 'لا يوجد مستلمون للرسالة في هذه الفئة' });
    }

    const emailUser = process.env.EMAIL_USER || 'linka.palestine@gmail.com';
    const emailPass = process.env.EMAIL_PASS || '';
    if (!emailPass) {
      return res.status(500).json({ error: 'حساب البريد غير مهيأ (EMAIL_PASS غير موجود).' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });


    const mailOptions = {
      from: `"منصة لينكا Linka" <${emailUser}>`,
      to: emailUser,
      bcc: emails, // Use BCC to hide emails from each other
      subject: subject,
      html: emailHeader() + `
          <div style="font-size:15px;line-height:1.8;color:#344F1F;">
            ${messageHtml}
          </div>
          <p style="font-size:11px;color:#aaa;margin-top:20px;text-align:center;">تصلك هذه الرسالة ضمن المراسلات الرسمية عبر منصة لينكا.</p>
        ` + emailFooter()
    };

    transporter.sendMail(mailOptions).catch(err => console.error('Broadcast Error:', err));

    res.json({ message: `جاري إرسال الرسالة إلى ${emails.length} مشتركين بنجاح.` });
  } catch (error) {
    console.error('Broadcast Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة الإرسال الجماعي.' });
  }
});

// ─── POST /api/newsletter/contact ── Contact Form ──────────────
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول المطلوبة' });
  }

  const emailUser = process.env.EMAIL_USER || 'linka.palestine@gmail.com';
  const emailPass = process.env.EMAIL_PASS || '';

  if (!emailPass) {
    return res.status(500).json({ error: 'لم يتم تهيئة خدمة البريد الإلكتروني' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });

    await transporter.sendMail({
      from: `"مركز المساعدة - لينكا" <${emailUser}>`,
      to: emailUser,
      replyTo: email,
      subject: `📩 رسالة جديدة من مركز المساعدة: ${subject || 'بدون عنوان'}`,
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #344F1F; padding: 20px;">
          <div style="background: white; border-radius: 16px; padding: 30px; max-width: 500px; margin: 0 auto; border: 2px solid #F2EAD3;">
            <h2 style="color: #F4991A; margin-top: 0;">📩 رسالة جديدة من مركز المساعدة</h2>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #344F1F;">الاسم:</td><td style="padding: 8px 0;">${name}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #344F1F;">البريد:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #344F1F;">الموضوع:</td><td style="padding: 8px 0;">${subject || '—'}</td></tr>
            </table>
            <div style="margin-top: 15px; padding: 15px; background: #F9F5F0; border-radius: 12px; border-right: 4px solid #F4991A;">
              <p style="margin: 0; font-weight: bold; color: #344F1F; margin-bottom: 8px;">الرسالة:</p>
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="font-size: 11px; color: #999; margin-top: 20px; text-align: center;">تم الإرسال عبر مركز المساعدة — منصة لينكا</p>
          </div>
        </div>
      `
    });

    res.json({ message: 'تم إرسال رسالتك بنجاح! سنرد عليك قريباً.' });
  } catch (error) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.' });
  }
});

module.exports = router;
