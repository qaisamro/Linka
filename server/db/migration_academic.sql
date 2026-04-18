-- ============================================================
-- Migration: Academic Volunteering Recognition System
-- Run AFTER the main schema.sql
-- ============================================================

-- 1. Extend users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS university    VARCHAR(150)    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS student_id    VARCHAR(60)     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS academic_hours DECIMAL(7,2)   DEFAULT 0.00;

-- Update role CHECK to include new roles
-- (MySQL doesn't enforce CHECK on older versions; the app enforces it)

-- 2. Extend registrations table
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS academic_hours_earned DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS is_academic_approved  BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approved_by           INT          DEFAULT NULL;

-- 3. Universities registry
CREATE TABLE IF NOT EXISTS universities (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(200) NOT NULL,
  name_en         VARCHAR(200),
  code            VARCHAR(20)  UNIQUE NOT NULL,
  city            VARCHAR(100) DEFAULT 'الخليل',
  logo_url        VARCHAR(255),
  coordinator_id  INT          REFERENCES users(id),
  is_active       BOOLEAN      DEFAULT TRUE,
  created_at      TIMESTAMP    DEFAULT NOW()
);

-- 4. Academic submissions (student → university approval flow)
CREATE TABLE IF NOT EXISTS academic_submissions (
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  user_id               INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id         INT NOT NULL REFERENCES universities(id),
  total_volunteer_hours DECIMAL(7,2) NOT NULL DEFAULT 0,
  total_academic_hours  DECIMAL(7,2) NOT NULL DEFAULT 0,
  activities_summary    JSON,          -- { "تطوعية": 3, "تعليمية": 2, ... }
  status                VARCHAR(20)  DEFAULT 'pending',  -- pending|approved|rejected
  submitted_at          TIMESTAMP    DEFAULT NOW(),
  reviewed_at           TIMESTAMP    DEFAULT NULL,
  reviewed_by           INT          REFERENCES users(id),
  certificate_code      VARCHAR(64)  UNIQUE,  -- UUID for verification
  notes                 TEXT
);

-- 5. Seed universities
INSERT IGNORE INTO universities (name, name_en, code, city) VALUES
  ('جامعة الخليل',              'Hebron University',              'HU',   'الخليل'),
  ('جامعة القدس المفتوحة',       'Al-Quds Open University',        'QOU',  'الخليل'),
  ('كلية الدراسات التكنولوجية',   'Palestine Technical College',    'PTC',  'الخليل'),
  ('كلية فلسطين التقنية',        'Palestine Polytechnic University','PPU',  'الخليل');

-- 6. Recalculate academic_hours for existing registrations
--    (using the multiplier table below)
-- Run manually if needed:
-- UPDATE users u
-- SET academic_hours = (
--   SELECT COALESCE(SUM(
--     e.duration_hours *
--     CASE e.type
--       WHEN 'تعليمية'  THEN 1.50
--       WHEN 'بيئية'    THEN 1.00
--       WHEN 'تطوعية'   THEN 1.00
--       WHEN 'رياضية'   THEN 0.75
--       WHEN 'اجتماعية' THEN 0.75
--       WHEN 'ثقافية'   THEN 0.50
--       ELSE 1.00
--     END
--   ), 0)
--   FROM registrations r JOIN events e ON r.event_id = e.id
--   WHERE r.user_id = u.id AND r.status = 'attended'
-- );
