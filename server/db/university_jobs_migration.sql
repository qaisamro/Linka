-- ============================================================
-- Migration: University Login Accounts + Job Matching System
-- Run AFTER mysql_schema.sql and migration_academic.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Extend universities table with login credentials
ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS email          VARCHAR(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS password_hash  VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_name   VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS phone          VARCHAR(30)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS website        VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description    TEXT         DEFAULT NULL;

-- 2. Extend users role to include 'university'
-- MySQL ENUM: we modify the column to include the new value
ALTER TABLE users MODIFY COLUMN role ENUM('youth','admin','university') DEFAULT 'youth';

-- 3. University–Student link table
CREATE TABLE IF NOT EXISTS university_students (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  university_id   INT NOT NULL,
  user_id         INT,                          -- NULL if student not yet registered on platform
  student_id      VARCHAR(60) NOT NULL,          -- university-assigned student number
  student_name    VARCHAR(100),                  -- name if not linked yet
  major           VARCHAR(150),
  joined_at       TIMESTAMP DEFAULT NOW(),
  is_verified     BOOLEAN DEFAULT FALSE,
  UNIQUE KEY uniq_uni_student (university_id, student_id),
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Verification codes for event attendance
CREATE TABLE IF NOT EXISTS verification_codes (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  event_id        INT NOT NULL,
  university_id   INT,                           -- NULL = valid for any university
  code            VARCHAR(80) NOT NULL UNIQUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  expires_at      TIMESTAMP,
  is_used         BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- 5. Hour approvals (university approves a student's event attendance)
CREATE TABLE IF NOT EXISTS hour_approvals (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  user_id         INT NOT NULL,
  university_id   INT NOT NULL,
  event_id        INT NOT NULL,
  approved_hours  DECIMAL(5,2) NOT NULL DEFAULT 0,
  approved_at     TIMESTAMP DEFAULT NOW(),
  notes           TEXT,
  UNIQUE KEY uniq_approval (user_id, university_id, event_id),
  FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id)      REFERENCES events(id) ON DELETE CASCADE
);

-- 6. Jobs and internship opportunities
CREATE TABLE IF NOT EXISTS jobs (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  title             VARCHAR(200) NOT NULL,
  organization      VARCHAR(150) NOT NULL,
  type              ENUM('وظيفة','تدريب','تطوع مدفوع') DEFAULT 'وظيفة',
  description       TEXT,
  required_skills   JSON,                        -- ["القيادة","العمل الجماعي",...]
  location          VARCHAR(150) DEFAULT 'الخليل',
  deadline          DATE,
  salary_range      VARCHAR(80),
  contact_email     VARCHAR(150),
  is_active         BOOLEAN DEFAULT TRUE,
  created_by        INT,
  created_at        TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Seed sample university accounts (password: uni123)
-- bcrypt hash of 'uni123': $2a$10$N.zmdr9zkRRUB.hJqVVcI.PNtMDx6DwNGqMbI1svYFqFvnI6D.pmu
UPDATE universities SET
  email = 'hu@hebron.ps',
  password_hash = '$2a$10$N.zmdr9zkRRUB.hJqVVcI.PNtMDx6DwNGqMbI1svYFqFvnI6D.pmu',
  contact_name = 'مسؤول جامعة الخليل',
  phone = '02-2220995'
WHERE code = 'HU';

UPDATE universities SET
  email = 'ppu@hebron.ps',
  password_hash = '$2a$10$N.zmdr9zkRRUB.hJqVVcI.PNtMDx6DwNGqMbI1svYFqFvnI6D.pmu',
  contact_name = 'مسؤول بوليتكنك فلسطين',
  phone = '02-2233050'
WHERE code = 'PPU';

UPDATE universities SET
  email = 'qou@hebron.ps',
  password_hash = '$2a$10$N.zmdr9zkRRUB.hJqVVcI.PNtMDx6DwNGqMbI1svYFqFvnI6D.pmu',
  contact_name = 'مسؤول القدس المفتوحة',
  phone = '02-2984444'
WHERE code = 'QOU';

-- 8. Seed sample jobs
INSERT IGNORE INTO jobs (title, organization, type, description, required_skills, location, deadline, salary_range) VALUES
  (
    'منسق فعاليات شبابية',
    'بلدية الخليل',
    'وظيفة',
    'نبحث عن منسق فعاليات متحمس للعمل مع فريق شباب المدينة لتنظيم وتنفيذ الأنشطة المجتمعية.',
    '["إدارة الفعاليات","القيادة","التواصل","العمل الجماعي"]',
    'الخليل',
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    '1500-2000 ₪'
  ),
  (
    'متطوع بيئي متميز',
    'مؤسسة البيئة الخليلية',
    'تطوع مدفوع',
    'فرصة للمشاركة في مشاريع تنظيف وتشجير المدينة مع بدل رمزي شهري.',
    '["الاستدامة","التنظيم","العمل الجماعي","الخدمة المجتمعية"]',
    'الخليل',
    DATE_ADD(NOW(), INTERVAL 20 DAY),
    '500 ₪/شهر'
  ),
  (
    'مدرب ورش تقنية',
    'مركز تطوير المهارات',
    'تدريب',
    'تدريب مدفوع لتأهيل الشباب لتدريب أقرانهم على المهارات التقنية والرقمية.',
    '["التقنية","القيادة","التعلم الذاتي","التواصل"]',
    'الخليل',
    DATE_ADD(NOW(), INTERVAL 45 DAY),
    '800 ₪/شهر'
  ),
  (
    'مساعد إداري في مركز شبابي',
    'وزارة الشباب والرياضة',
    'تدريب',
    'تدريب إداري في مراكز الشباب في محافظة الخليل لمدة 3 أشهر.',
    '["الإدارة","التواصل","المبادرة","العمل الجماعي"]',
    'الخليل',
    DATE_ADD(NOW(), INTERVAL 15 DAY),
    NULL
  ),
  (
    'مشرف أنشطة رياضية',
    'الاتحاد الرياضي الخليلي',
    'وظيفة',
    'إشراف على البرامج الرياضية للشباب وتنظيم البطولات المحلية.',
    '["القيادة","الإنجاز","الصحة","إدارة الفعاليات"]',
    'الخليل',
    DATE_ADD(NOW(), INTERVAL 60 DAY),
    '2000-2500 ₪'
  ),
  (
    'منسق ثقافي وإبداعي',
    'دائرة الثقافة - بلدية الخليل',
    'وظيفة',
    'تنسيق الفعاليات الثقافية والفنية وإدارة المحتوى الإبداعي للمنصات الرقمية.',
    '["الإبداع","التراث","التواصل","إدارة الفعاليات"]',
    'الخليل',
    DATE_ADD(NOW(), INTERVAL 25 DAY),
    '1800 ₪'
  );

SET FOREIGN_KEY_CHECKS = 1;
