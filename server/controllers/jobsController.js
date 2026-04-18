const pool = require('../db/pool');

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
    const { type, search } = req.query;
    const userId = req.user?.id;

    try {
        let query = `SELECT * FROM jobs WHERE is_active = TRUE`;
        const params = [];
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, orgName, type || 'وظيفة',
                description, JSON.stringify(required_skills || []),
                location || 'الخليل', deadline || null, salary_range || null,
                contact_email || null, req.user.id, entityId]
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

module.exports = { listJobs, createJob, getUserSkills, getRecommendations, getCareerPath };
