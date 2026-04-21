const pool = require('../db/pool');
const { createNotificationForUser } = require('./notificationsController');
const { writeAdminAudit } = require('../utils/auditLog');
const { emailHeader, emailFooter } = require('../utils/emailHelpers');

// ─── Skill mapping from event types ─────────────────────────────
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
    'الاستدامة': '🌱', 'التنظيم': '📋', 'المسؤولية البيئية': '♻️',
    'التواصل': '💬', 'إدارة الفعاليات': '🎯', 'بناء العلاقات': '🌐', 'المرونة': '⚡',
    'الإنجاز': '🏆', 'الصحة': '💪', 'روح الفريق': '⭐', 'الانضباط': '🎖️',
    'الإبداع': '🎨', 'التراث': '🏛️', 'التقديم': '🎤', 'التنوع الثقافي': '🌏',
};

// ─── Helper: get user skills from event history ───────────────────
async function computeUserSkills(userId) {
    const [events] = await pool.query(`
    SELECT e.type, COUNT(*) AS count, SUM(e.duration_hours) AS total_hours
    FROM registrations r JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ? AND r.status = 'attended'
    GROUP BY e.type ORDER BY count DESC
  `, [userId]);

    const skillScore = {};
    events.forEach(ev => {
        const skills = SKILL_MAP[ev.type] || [];
        const weight = parseFloat(ev.count) + parseFloat(ev.total_hours || 0) * 0.5;
        skills.forEach(skill => {
            skillScore[skill] = (skillScore[skill] || 0) + weight;
        });
    });

    // Return top 8 skills sorted by score
    return Object.entries(skillScore)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, score]) => ({
            name,
            icon: SKILL_ICONS[name] || '✨',
            level: score >= 10 ? 'متقدم' : score >= 5 ? 'متوسط' : 'مبتدئ',
            score: Math.round(score),
        }));
}

// ─── GET /api/jobs ────────────────────────────────────────────────
const listJobs = async (req, res) => {
    const { type, search, my } = req.query;
    const userId = req.user?.id;

    try {
        let query = `SELECT * FROM jobs WHERE is_active = TRUE`;
        const params = [];

        // Entity users requesting only their own jobs
        if (my === 'true' && req.user?.role === 'entity') {
            const entityId = req.user.entity_id ?? req.user.id;
            query += ` AND entity_id = ?`;
            params.push(entityId);
        }

        if (type) { query += ` AND type = ?`; params.push(type); }
        if (search) { query += ` AND (title LIKE ? OR organization LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
        query += ` ORDER BY created_at DESC`;

        const [jobs] = await pool.query(query, params);

        let userSkills = [];
        if (userId) {
            userSkills = await computeUserSkills(userId);
        }
        const userSkillNames = userSkills.map(s => s.name);

        const jobsWithScore = jobs.map(job => {
            const requiredSkills = typeof job.required_skills === 'string'
                ? JSON.parse(job.required_skills || '[]')
                : (job.required_skills || []);

            let matchScore = 0;
            if (userSkillNames.length && requiredSkills.length) {
                const matches = requiredSkills.filter(s => userSkillNames.includes(s)).length;
                matchScore = Math.round((matches / requiredSkills.length) * 100);
            }

            return { ...job, required_skills: requiredSkills, match_score: matchScore };
        });

        // Sort by match score descending if user is logged in
        if (userId) jobsWithScore.sort((a, b) => b.match_score - a.match_score);

        res.json({ jobs: jobsWithScore, user_skills: userSkills });
    } catch (err) {
        console.error('listJobs error:', err.message);
        res.status(500).json({ error: 'خطأ في جلب فرص العمل' });
    }
};

// ─── POST /api/jobs ───────────────────────────────────────
const createJob = async (req, res) => {
    const { title, organization, type, description, required_skills, location, deadline, salary_range, contact_email } = req.body;
    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' });

    // Organization name defaults to user entity name if not provided
    const orgName = organization || req.user.entity_name || req.user.name;
    const entityId = req.user.entity_id || null;

    try {
        const [result] = await pool.query(
            `INSERT INTO jobs (title, organization, type, description, required_skills, location, deadline, salary_range, contact_email, created_by, entity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [title, orgName, type || 'وظيفة',
                description, JSON.stringify(required_skills || []),
                location || 'الخليل', deadline || null, salary_range || null,
                contact_email || null, req.user.id, entityId]
        );
        await writeAdminAudit(
            req.user.id,
            req.user.name,
            'JOB_CREATED',
            'job',
            result.insertId,
            title,
            { organization: orgName }
        );

        res.status(201).json({ message: 'تم إضافة الفرصة بنجاح', id: result.insertId });
    } catch (err) {
        console.error('createJob error:', err.message);
        res.status(500).json({ error: 'خطأ في إضافة الفرصة' });
    }
};

// ─── GET /api/jobs/skills ─────────────────────────────────────────
const getUserSkills = async (req, res) => {
    try {
        const skills = await computeUserSkills(req.user.id);
        res.json({ skills });
    } catch (err) {
        console.error('getUserSkills error:', err.message);
        res.status(500).json({ error: 'خطأ في جلب المهارات' });
    }
};

// ─── GET /api/jobs/recommend ──────────────────────────────────────
const getRecommendations = async (req, res) => {
    try {
        const [jobs] = await pool.query('SELECT * FROM jobs WHERE is_active = TRUE');
        const userSkills = await computeUserSkills(req.user.id);
        const userSkillNames = userSkills.map(s => s.name);

        const scored = jobs.map(job => {
            const requiredSkills = typeof job.required_skills === 'string'
                ? JSON.parse(job.required_skills || '[]')
                : (job.required_skills || []);
            const matches = requiredSkills.filter(s => userSkillNames.includes(s)).length;
            const matchScore = requiredSkills.length
                ? Math.round((matches / requiredSkills.length) * 100) : 0;
            return { ...job, required_skills: requiredSkills, match_score: matchScore };
        });

        const top3 = scored.sort((a, b) => b.match_score - a.match_score).slice(0, 3);
        res.json({ recommendations: top3, user_skills: userSkills });
    } catch (err) {
        console.error('getRecommendations error:', err.message);
        res.status(500).json({ error: 'خطأ في جلب التوصيات' });
    }
};

// ─── GET /api/jobs/career-path ────────────────────────────────────
const getCareerPath = async (req, res) => {
    try {
        const [stats] = await pool.query(`
      SELECT e.type, COUNT(*) AS count, SUM(e.duration_hours) AS total_hours
      FROM registrations r JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ? AND r.status = 'attended'
      GROUP BY e.type
    `, [req.user.id]);

        const [userRow] = await pool.query(
            'SELECT total_hours, points FROM users WHERE id = ?', [req.user.id]
        );
        const totalHours = parseFloat(userRow[0]?.total_hours || 0);
        const points = parseInt(userRow[0]?.points || 0);

        const typeMap = {};
        stats.forEach(s => { typeMap[s.type] = { count: s.count, hours: parseFloat(s.total_hours || 0) }; });

        const steps = [];

        if (totalHours < 10) {
            steps.push({
                icon: '⏱️', priority: 'عالية',
                title: 'أكمل 10 ساعات تطوع',
                desc: `لديك ${totalHours.toFixed(1)} ساعة، تحتاج ${(10 - totalHours).toFixed(1)} ساعة إضافية للحصول على شهادتك الأولى`,
                action: 'شارك في فعاليات تطوعية مدفوعة',
                target_hours: 10,
                current_hours: totalHours,
            });
        }

        if (!typeMap['تعليمية'] || typeMap['تعليمية'].count < 3) {
            steps.push({
                icon: '💻', priority: 'متوسطة',
                title: 'شارك في 3 فعاليات تعليمية',
                desc: 'الفعاليات التعليمية تضيف مهارات القيادة والتقنية وتؤهلك لوظائف التدريب والتقنية',
                action: 'ابحث عن ورش وفعاليات تعليمية',
                target_count: 3,
                current_count: typeMap['تعليمية']?.count || 0,
            });
        }

        if (!typeMap['اجتماعية'] || typeMap['اجتماعية'].count < 2) {
            steps.push({
                icon: '🎯', priority: 'متوسطة',
                title: 'شارك في 2 فعاليات اجتماعية',
                desc: 'الفعاليات الاجتماعية تطوّر مهارات التواصل وإدارة الفعاليات المطلوبة في سوق العمل',
                action: 'ابحث عن فعاليات اجتماعية ومجتمعية',
                target_count: 2,
                current_count: typeMap['اجتماعية']?.count || 0,
            });
        }

        if (totalHours >= 20) {
            steps.push({
                icon: '🏆', priority: 'منجزة',
                title: 'مستوى محترف: 20+ ساعة',
                desc: 'أنت في الفئة العليا من المتطوعين. مؤهل للتقدم لوظائف قيادية ومناصب إشرافية',
                action: 'راجع قسم فرص العمل للوظائف القيادية',
                current_hours: totalHours,
            });
        } else if (totalHours >= 10) {
            steps.push({
                icon: '⭐', priority: 'قريبة',
                title: `اوصل إلى 20 ساعة (${totalHours.toFixed(1)}/20)`,
                desc: `تبقى ${(20 - totalHours).toFixed(1)} ساعة للوصول لمستوى المحترف وفتح فرص عمل إضافية`,
                action: 'واصل مشاركتك في الفعاليات المتنوعة',
                target_hours: 20,
                current_hours: totalHours,
            });
        }

        const skills = await computeUserSkills(req.user.id);
        const topSkill = skills[0];

        if (topSkill) {
            steps.push({
                icon: '🎓', priority: 'معلومة',
                title: `مهارتك الأقوى: ${topSkill.name}`,
                desc: `بناءً على نشاطك، لديك مستوى ${topSkill.level} في ${topSkill.name}. ابحث عن وظائف تحتاج هذه المهارة`,
                action: 'فلتر وظائف العمل باستخدام هذه المهارة',
            });
        }

        res.json({
            career_path: steps,
            summary: {
                total_hours: totalHours,
                points,
                top_activity: stats[0]?.type || null,
                level: totalHours >= 20 ? 'محترف' : totalHours >= 10 ? 'متوسط' : 'مبتدئ',
            }
        });
    } catch (err) {
        console.error('getCareerPath error:', err.message);
        res.status(500).json({ error: 'خطأ في جلب مسار التطوير' });
    }
};

const getJobApplications = async (req, res) => {
    const { id } = req.params; // Job ID
    const userId = req.user.id;
    const isEntity = req.user.role === 'entity';

    try {
        // Verify job owner
        const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
        if (!job.length) return res.status(404).json({ error: 'الفرصة غير موجودة' });

        if (!isEntity || (job[0].created_by !== userId && job[0].entity_id !== req.user.entity_id)) {
            // Check if super admin
            if (req.user.role !== 'super_admin') {
                return res.status(403).json({ error: 'غير مصرح لك بمشاهدة الطلبات' });
            }
        }

        const [apps] = await pool.query(`
      SELECT a.*, u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone
      FROM job_applications a
      JOIN users u ON a.user_id = u.id
      WHERE a.job_id = ?
      ORDER BY a.applied_at DESC
    `, [id]);

        res.json({ applications: apps });
    } catch (err) {
        console.error('getJobApplications error:', err.message);
        res.status(500).json({ error: 'خطأ في جلب الطلبات' });
    }
};

const applyToJob = async (req, res) => {
    const { id } = req.params; // Job ID
    const userId = req.user.id;
    const { profileData, coverLetter } = req.body;

    try {
        // 1. Check job existence
        const [jobRows] = await pool.query('SELECT * FROM jobs WHERE id = ? AND is_active = TRUE', [id]);
        if (!jobRows.length) return res.status(404).json({ error: 'الفرصة غير موجودة أو غير نشطة' });
        const job = jobRows[0];

        // 2. Check if already applied
        const [existing] = await pool.query(
            'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ?',
            [id, userId]
        );
        if (existing.length) return res.status(400).json({ error: 'لقد قمت بالتقدم لهذه الفرصة مسبقاً' });

        // 3. Compute skills for the snapshot securely from the backend
        const skills = await computeUserSkills(userId);

        // 4. Combine user-provided data with backend skills
        const snapshot = {
            name: profileData?.name,
            email: profileData?.email,
            phone: profileData?.phone,
            bio: profileData?.bio,
            university: profileData?.university,
            student_id: profileData?.student_id,
            cover_letter: coverLetter,
            skills: skills
        };

        // 5. Insert application
        await pool.query(
            'INSERT INTO job_applications (job_id, user_id, resume_snapshot) VALUES (?, ?, ?)',
            [id, userId, JSON.stringify(snapshot)]
        );

        // 6. Send confirmation email
        const transporter = require('nodemailer').createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Linka Team" <${process.env.EMAIL_USER}>`,
            to: snapshot.email || req.user.email,
            subject: `تأكيد التقديم: ${job.title}`,
            html: emailHeader('تم استلام طلبك بنجاح! 🎉') + `
              <p style="font-size:15px;">عزيزي <b>${snapshot.name}</b>،</p>
              <p style="font-size:15px;">لقد قدّمت بنجاح على فرصة العمل:</p>
              <div style="background:#F9F5F0;border-right:5px solid #344F1F;padding:15px 20px;border-radius:10px;margin:20px 0;">
                <p style="margin:0;font-size:16px;font-weight:bold;color:#344F1F;">${job.title}</p>
                <p style="margin:5px 0 0;color:#555;">${job.organization}</p>
              </div>
              <p style="font-size:15px;">سيتواصل معك فريق التوظيف قريباً في حال اختيارك للمرحلة التالية.</p>
              <p style="font-size:15px;">نتمنى لك كل التوفيق في مسيرتك المهنية.</p>
            ` + emailFooter()
        };

        transporter.sendMail(mailOptions).catch(err => console.error('Email error:', err.message));

        res.json({ message: 'تم التقديم للفرصة بنجاح وسيصلك إيميل تأكيد' });
    } catch (err) {
        console.error('applyToJob error:', err.message);
        res.status(500).json({ error: 'خطأ في عملية التقديم' });
    }
};

const getMyJobApplications = async (req, res) => {
    const userId = req.user.id;
    try {
        const [apps] = await pool.query(`
            SELECT a.id as application_id, a.status as application_status, a.applied_at, 
                   j.id, j.title, j.organization, j.type, j.location, j.salary_range, j.contact_email
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
            ORDER BY a.applied_at DESC
        `, [userId]);

        res.json({ applications: apps });
    } catch (err) {
        console.error('getMyJobApplications error:', err.message);
        res.status(500).json({ error: 'خطأ في جلب طلبات التوظيف' });
    }
};

const updateJob = async (req, res) => {
    const jobId = req.params.id;
    const { title, description, type, required_skills, location, deadline, salary_range, contact_email } = req.body;

    // Allow either super admin, or the entity that created the job
    try {
        const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (job.length === 0) return res.status(404).json({ error: 'فرصة العمل غير موجودة' });

        if (!req.user.is_super_admin && job[0].entity_id !== req.user.entity_id && job[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه الفرصة' });
        }

        await pool.query(
            `UPDATE jobs SET title = COALESCE(?, title), type = COALESCE(?, type), 
             description = COALESCE(?, description), required_skills = COALESCE(?, required_skills), 
             location = COALESCE(?, location), deadline = COALESCE(?, deadline), 
             salary_range = COALESCE(?, salary_range), contact_email = COALESCE(?, contact_email) 
             WHERE id = ?`,
            [title, type, description, required_skills ? JSON.stringify(required_skills) : null, location, deadline, salary_range, contact_email, jobId]
        );
        await writeAdminAudit(
            req.user.id,
            req.user.name,
            'JOB_UPDATED',
            'job',
            parseInt(jobId),
            job[0].title,
            { fields: Object.keys(req.body) }
        );

        res.json({ message: 'تم تحديث الفرصة بنجاح' });
    } catch (err) {
        console.error('updateJob error:', err.message);
        res.status(500).json({ error: 'خطأ في تحديث الفرصة' });
    }
};

const deleteJob = async (req, res) => {
    const jobId = req.params.id;
    try {
        const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (job.length === 0) return res.status(404).json({ error: 'فرصة العمل غير موجودة' });

        if (!req.user.is_super_admin && job[0].entity_id !== req.user.entity_id && job[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'غير مصرح لك بحذف هذه الفرصة' });
        }

        await pool.query('DELETE FROM jobs WHERE id = ?', [jobId]);

        await writeAdminAudit(
            req.user.id,
            req.user.name,
            'JOB_DELETED',
            'job',
            parseInt(jobId),
            job[0].title
        );

        res.json({ message: 'تم حذف الفرصة بنجاح' });
    } catch (err) {
        console.error('deleteJob error:', err.message);
        res.status(500).json({ error: 'خطأ في حذف الفرصة' });
    }
};

const deleteJobApplication = async (req, res) => {
    const { id, appId } = req.params;
    try {
        const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
        if (job.length === 0) return res.status(404).json({ error: 'فرصة العمل غير موجودة' });

        if (!req.user.is_super_admin && job[0].entity_id !== req.user.entity_id && job[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'غير مصرح لك بحذف هذا الطلب' });
        }

        await pool.query('DELETE FROM job_applications WHERE id = ? AND job_id = ?', [appId, id]);

        await writeAdminAudit(
            req.user.id,
            req.user.name,
            'JOB_APP_DELETED',
            'job_application',
            parseInt(appId),
            `طلب #${appId} ← ${job[0].title}`
        );

        res.json({ message: 'تم حذف طلب التوظيف بنجاح' });
    } catch (err) {
        console.error('deleteJobApplication error:', err.message);
        res.status(500).json({ error: 'خطأ في حذف الطلب' });
    }
};

const updateApplicationStatus = async (req, res) => {
    const { id, appId } = req.params;
    const { status } = req.body;

    try {
        const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
        if (!job.length) return res.status(404).json({ error: 'الفرصة غير موجودة' });

        if (!req.user.is_super_admin && job[0].entity_id !== req.user.entity_id && job[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'غير مصرح لك بتحديث هذا الطلب' });
        }

        const [appRows] = await pool.query(`
            SELECT a.*, u.name as applicant_name, u.email as applicant_email
            FROM job_applications a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ? AND a.job_id = ?
        `, [appId, id]);

        if (!appRows.length) return res.status(404).json({ error: 'الطلب غير موجود' });
        const application = appRows[0];

        await pool.query('UPDATE job_applications SET status = ? WHERE id = ?', [status, appId]);

        // Create platform notification
        let emoji = status === 'accepted' ? '✅' : (status === 'rejected' ? '❌' : 'ℹ️');
        let statusText = status === 'accepted' ? 'مقبول' : (status === 'rejected' ? 'مرفوض' : status);

        await createNotificationForUser(
            application.user_id,
            `تحديث حالة طلبك: ${job[0].title} ${emoji}`,
            `تم تحديث حالة طلب التقديم الخاص بك لتصبح: ${statusText}.`,
            'system'
        );

        // Send Email
        const transporter = require('nodemailer').createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let emailSubject = `تحديث بخصوص طلبك في ${job[0].organization}`;
        let emailHtml = emailHeader('تحديث حالة طلب التوظيف') + `
            <p style="font-size:15px;">مرحباً <b>${application.applicant_name}</b>،</p>
            <p style="font-size:15px;">نود إعلامك بأن جهة العمل <b>${job[0].organization}</b> قامت بتحديث حالة طلبك لفرصة: <b>${job[0].title}</b>.</p>
            <div style="background:#F9F5F0;padding:15px 20px;border-radius:10px;margin:20px 0;border-right:5px solid ${status === 'accepted' ? '#344F1F' : '#F4991A'};">
              <p style="margin:0;font-size:15px;"><b>الحالة الجديدة: </b><span style="color:${status === 'accepted' ? '#344F1F' : '#F4991A'};font-size:17px;font-weight:bold;">${statusText}</span></p>
            </div>
            <p style="font-size:15px;">${status === 'accepted' ? 'سيتواصل معك فريق التوظيف قريباً لمتابعة الإجراءات.' : 'نشكرك على اهتمامك ونتمنى لك التوفيق في فرص أخرى.'}</p>
        ` + emailFooter();

        const mailOptions = {
            from: `"Linka Jobs" <${process.env.EMAIL_USER}>`,
            to: application.applicant_email,
            subject: emailSubject,
            html: emailHtml
        };

        transporter.sendMail(mailOptions).catch(err => console.error('Email status notification failed:', err));

        res.json({ message: 'تم تحديث الحالة وإرسال إشعار للمتقدم بنجاح' });
    } catch (err) {
        console.error('updateApplicationStatus error:', err.message);
        res.status(500).json({ error: 'خطأ في تحديث الحالة' });
    }
};

const contactApplicant = async (req, res) => {
    const { id, appId } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) return res.status(400).json({ error: 'الموضوع والرسالة مطالبان' });

    try {
        const [job] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
        if (!job.length) return res.status(404).json({ error: 'الفرصة غير موجودة' });

        if (!req.user.is_super_admin && job[0].entity_id !== req.user.entity_id && job[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'غير مصرح لك بمراسلة هذا المتقدم' });
        }

        const [appRows] = await pool.query(`
            SELECT a.*, u.name as applicant_name, u.email as applicant_email
            FROM job_applications a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ? AND a.job_id = ?
        `, [appId, id]);

        if (!appRows.length) return res.status(404).json({ error: 'الطلب غير موجود' });
        const application = appRows[0];

        // Send Email
        const transporter = require('nodemailer').createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"${job[0].organization} via Linka" <${process.env.EMAIL_USER}>`,
            to: application.applicant_email,
            subject: subject,
            html: emailHeader(`رسالة من: ${job[0].organization}`) + `
              <p style="font-size:15px;">عزيزي <b>${application.applicant_name}</b>،</p>
              <p style="font-size:15px;">استلمت رسالة بخصوص طلبك لفرصة: <b>${job[0].title}</b>:</p>
              <div style="background:#F9F5F0;padding:20px;border-radius:10px;border-right:5px solid #F4991A;margin:20px 0;color:#333;line-height:1.8;font-size:15px;">
                ${body.replace(/\n/g, '<br>')}
              </div>
              <p style="font-size:14px;color:#666;">يمكنك الرد مباشرةً على هذا الإيميل للتواصل مع جهة العمل.</p>
            ` + emailFooter()
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'تم إرسال الرسالة إلى المتقدم بنجاح' });
    } catch (err) {
        console.error('contactApplicant error:', err.message);
        res.status(500).json({ error: 'خطأ في إرسال الرسالة' });
    }
};

module.exports = {
    listJobs, createJob, getUserSkills, getRecommendations, getCareerPath,
    applyToJob, getJobApplications, getMyJobApplications,
    updateJob, deleteJob, deleteJobApplication, updateApplicationStatus,
    contactApplicant
};
