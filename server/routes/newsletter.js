const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const pool = require('../db/pool');
const path = require('path');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

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
    const emailUser = process.env.EMAIL_USER || 'linka.palestine@gmail.com';
    const emailPass = process.env.EMAIL_PASS || '';

    if (!emailPass) {
      console.warn('⚠️ EMAIL_PASS not set in .env. Email is saved, but welcome email will not be sent.');
      return res.status(200).json({ message: 'تم الاشتراك بنجاح! (تنبيه للمسؤول: يرجى إضافة كلمة مرور الإيميل في .env لإرسال الرسائل)' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // Generate absolute HTTP URL pointing to the live Replit URL so Gmail always renders it without attachments
    const isLocal = req.get('host').includes('localhost');
    const baseUrl = 'https://linka2026.replit.app';
    
    // Use the already-live favicon for local testing. Once deployed, use the high-res 2.jpg.png from /public-assets.
    const logoUrl = isLocal ? baseUrl + '/favicon.jpeg' : baseUrl + '/public-assets/2.jpg.png';

    const mailOptions = {
      from: `"منصة لينكا Linka" <${emailUser}>`,
      to: email,
      subject: 'مرحباً بك في مجتمع لينكا 🚀',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; text-align: right; color: #344F1F; padding: 20px; background-color: #f9f5f0;">
          <div style="background: white; border-radius: 16px; padding: 35px 30px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); max-width: 600px; margin: 0 auto; position: relative;">
            
            <div style="text-align: center; margin-bottom: 25px;">
              <img src="${logoUrl}" alt="Linka Logo" style="max-width: 140px; height: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); padding: 5px; background: white; border: 2px solid #F9F5F0; display: inline-block;" />
            </div>

            <h2 style="color: #F4991A; margin-top: 0; text-align: center; font-size: 26px; font-weight: 900;">
              أهلاً بك في منصة لينكا!
            </h2>
            
            <div style="text-align: right; line-height: 1.8; font-size: 15px; margin-top: 20px;">
              <p>يسعدنا انضمامك إلى النشرة الإخبارية الخاصة بنا.</p>
              <p>من الآن فصاعداً، ستصلك أحدث الفعاليات، فرص التطوع، وتحديثات المنصة فور صدورها لضمان بقائك على اطلاع دائم.</p>
              <p>شكراً لثقتك بنا، ونتمنى لك رحلة ممتعة ومثمرة معنا في بناء المجتمع وتطوير المسار المهني.</p>
              <br>
              <div style="border-top: 2px dashed #eee; padding-top: 20px;">
                <p style="font-size: 13px; color: #777; margin: 0; text-align: center;">
                  <strong>— فريق لينكا  —</strong><br>
                  فلسطين
                </p>
              </div>
            </div>
          </div>
        </div>
      `
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
      html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; color: #344F1F; padding: 20px; background-color: #f9f5f0;">
            <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              ${messageHtml}
              <br><br><hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 11px; color: #999;">
                تصلك هذه الرسالة ضمن المراسلات الرسمية عبر منصة لينكا.
              </p>
            </div>
          </div>
        `
    };

    transporter.sendMail(mailOptions).catch(err => console.error('Broadcast Error:', err));

    res.json({ message: `جاري إرسال الرسالة إلى ${emails.length} مشتركين بنجاح.` });
  } catch (error) {
    console.error('Broadcast Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء محاولة الإرسال الجماعي.' });
  }
});

module.exports = router;
