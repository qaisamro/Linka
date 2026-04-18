-- ============================================
-- Hebron Youth Interaction Map — PostgreSQL Schema
-- ============================================

DROP TABLE IF EXISTS training_audit_log CASCADE;
DROP TABLE IF EXISTS training_attendance_sessions CASCADE;
DROP TABLE IF EXISTS training_programs CASCADE;
DROP TABLE IF EXISTS training_applications CASCADE;
DROP TABLE IF EXISTS training_offers CASCADE;
DROP TABLE IF EXISTS hour_approvals CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS university_students CASCADE;
DROP TABLE IF EXISTS academic_submissions CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS entity_audit_log CASCADE;
DROP TABLE IF EXISTS admin_alerts CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS blocked_ips CASCADE;
DROP TABLE IF EXISTS admin_audit_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS entities CASCADE;
DROP TABLE IF EXISTS universities CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Neighborhoods
-- ============================================
CREATE TABLE neighborhoods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  city VARCHAR(100) DEFAULT 'الخليل'
);

INSERT INTO neighborhoods (name, name_en) VALUES
  ('وسط المدينة', 'City Center'),
  ('باب الزاوية', 'Bab Al-Zawiya'),
  ('حي الشيخ', 'Sheikh Neighborhood'),
  ('جبل جوهر', 'Jabal Jawhar'),
  ('الحي اليهودي', 'Jewish Quarter'),
  ('رأس الجورة', 'Ras Al-Jawra'),
  ('القصبة', 'Old City'),
  ('حي النزهة', 'Al-Nuzha');

-- ============================================
-- Universities
-- ============================================
CREATE TABLE universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  code VARCHAR(20) UNIQUE NOT NULL,
  city VARCHAR(100) DEFAULT 'الخليل',
  logo_url VARCHAR(255),
  email VARCHAR(150),
  password_hash VARCHAR(255),
  contact_name VARCHAR(100),
  phone VARCHAR(30),
  website VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO universities (name, name_en, code, city) VALUES
  ('جامعة الخليل', 'Hebron University', 'HU', 'الخليل'),
  ('جامعة القدس المفتوحة', 'Al-Quds Open University', 'QOU', 'الخليل'),
  ('كلية الدراسات التكنولوجية', 'Palestine Technical College', 'PTC', 'الخليل'),
  ('كلية فلسطين التقنية', 'Palestine Polytechnic University', 'PPU', 'الخليل');

-- ============================================
-- Entities (University, Company, Municipality)
-- ============================================
CREATE TABLE entities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  name_en VARCHAR(150),
  type VARCHAR(30) NOT NULL CHECK (type IN ('university', 'company', 'municipality')),
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255),
  contact_name VARCHAR(100),
  phone VARCHAR(30),
  website VARCHAR(255),
  description TEXT,
  city VARCHAR(100) DEFAULT 'الخليل',
  code VARCHAR(20),
  logo_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Users
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  is_university_student BOOLEAN DEFAULT FALSE,
  university VARCHAR(150),
  student_id VARCHAR(60),
  academic_hours NUMERIC(7,2) DEFAULT 0,
  points INTEGER DEFAULT 0,
  total_hours NUMERIC(6,2) DEFAULT 0,
  role VARCHAR(20) DEFAULT 'youth' CHECK (role IN ('youth', 'admin', 'university', 'super_admin', 'entity', 'sub_admin')),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Events
-- ============================================
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('تطوعية', 'ثقافية', 'رياضية', 'تعليمية', 'بيئية', 'اجتماعية')),
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  location_name VARCHAR(200),
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  date TIMESTAMP NOT NULL,
  duration_hours NUMERIC(4,1) DEFAULT 2,
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  image_url VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Registrations
-- ============================================
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'absent', 'cancelled')),
  registered_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  academic_hours_earned NUMERIC(5,2) DEFAULT 0,
  is_academic_approved BOOLEAN DEFAULT FALSE,
  approved_by INTEGER,
  UNIQUE(user_id, event_id)
);

-- ============================================
-- Badges
-- ============================================
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  icon VARCHAR(10),
  condition_type VARCHAR(50) CHECK (condition_type IN ('participations', 'hours', 'points', 'streak')),
  condition_value INTEGER NOT NULL
);

INSERT INTO badges (name, name_en, description, icon, condition_type, condition_value) VALUES
  ('المبادر', 'Pioneer', 'أول مشاركة لك في فعالية', '🌱', 'participations', 1),
  ('الناشط', 'Active', 'شاركت في 5 فعاليات', '⭐', 'participations', 5),
  ('البطل', 'Champion', 'شاركت في 10 فعاليات', '🏆', 'participations', 10),
  ('المتطوع', 'Volunteer', 'أتممت 5 ساعات تطوع', '🤝', 'hours', 5),
  ('المحترف', 'Professional', 'أتممت 20 ساعة تطوع', '🎖️', 'hours', 20),
  ('القائد', 'Leader', 'جمعت 100 نقطة', '👑', 'points', 100);

-- ============================================
-- User Badges
-- ============================================
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- Notifications
-- ============================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(30) DEFAULT 'system' CHECK (type IN ('registration', 'new_event', 'attendance', 'badge', 'system', 'announcement')),
  related_id INTEGER,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);

-- ============================================
-- Admin Audit Log
-- ============================================
CREATE TABLE admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  admin_name VARCHAR(100) NOT NULL DEFAULT '',
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id INTEGER,
  target_name VARCHAR(255),
  details TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_action ON admin_audit_log(action);

-- ============================================
-- System Settings
-- ============================================
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(64) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('certificates_enabled', 'true', 'تفعيل نظام الشهادات والوثائق'),
  ('jobs_integration_enabled', 'true', 'تفعيل الربط مع فرص العمل والمسارات المهنية'),
  ('public_registration_enabled', 'true', 'السماح بتسجيل حسابات جديدة للشباب'),
  ('entity_self_signup_enabled', 'false', 'السماح للجهات بطلب انضمام ذاتي')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- Admin Alerts
-- ============================================
CREATE TABLE admin_alerts (
  id SERIAL PRIMARY KEY,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  alert_type VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Blocked IPs
-- ============================================
CREATE TABLE blocked_ips (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  reason VARCHAR(255),
  created_by INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(ip)
);

-- ============================================
-- Entity Audit Log
-- ============================================
CREATE TABLE entity_audit_log (
  id SERIAL PRIMARY KEY,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  target_user_id INTEGER,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- University Students
-- ============================================
CREATE TABLE university_students (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  student_id VARCHAR(60) NOT NULL,
  student_name VARCHAR(100),
  major VARCHAR(150),
  joined_at TIMESTAMP DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  UNIQUE(university_id, student_id)
);

-- ============================================
-- Verification Codes
-- ============================================
CREATE TABLE verification_codes (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  university_id INTEGER,
  code VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE
);

-- ============================================
-- Hour Approvals
-- ============================================
CREATE TABLE hour_approvals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  approved_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  approved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, university_id, event_id)
);

-- ============================================
-- Academic Submissions
-- ============================================
CREATE TABLE academic_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id),
  total_volunteer_hours NUMERIC(7,2) NOT NULL DEFAULT 0,
  total_academic_hours NUMERIC(7,2) NOT NULL DEFAULT 0,
  activities_summary JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  certificate_code VARCHAR(64) UNIQUE,
  notes TEXT
);

-- ============================================
-- Jobs
-- ============================================
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  organization VARCHAR(150) NOT NULL,
  type VARCHAR(30) DEFAULT 'وظيفة' CHECK (type IN ('وظيفة', 'تدريب', 'تطوع مدفوع')),
  description TEXT,
  required_skills JSONB,
  location VARCHAR(150) DEFAULT 'الخليل',
  deadline DATE,
  salary_range VARCHAR(80),
  contact_email VARCHAR(150),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Training Offers
-- ============================================
CREATE TABLE training_offers (
  id SERIAL PRIMARY KEY,
  company_entity_id INTEGER NOT NULL,
  company_name VARCHAR(150),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  required_skills JSONB,
  objectives JSONB,
  specialization VARCHAR(150),
  max_trainees INTEGER DEFAULT 10,
  location_name VARCHAR(200),
  geo_center_lat NUMERIC(10,7),
  geo_center_lng NUMERIC(10,7),
  geo_radius_m INTEGER,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by_user_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- ============================================
-- Training Applications
-- ============================================
CREATE TABLE training_applications (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES training_offers(id),
  student_user_id INTEGER NOT NULL REFERENCES users(id),
  company_entity_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  match_score INTEGER DEFAULT 0,
  applied_at TIMESTAMP DEFAULT NOW(),
  decided_at TIMESTAMP,
  decided_by_user_id INTEGER,
  notes TEXT,
  UNIQUE(offer_id, student_user_id)
);

-- ============================================
-- Training Programs
-- ============================================
CREATE TABLE training_programs (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES training_offers(id),
  application_id INTEGER NOT NULL UNIQUE REFERENCES training_applications(id),
  student_user_id INTEGER NOT NULL REFERENCES users(id),
  company_entity_id INTEGER NOT NULL,
  university_id INTEGER REFERENCES universities(id),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'rejected')),
  supervisor_user_id INTEGER,
  objectives_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- ============================================
-- Training Attendance Sessions
-- ============================================
CREATE TABLE training_attendance_sessions (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES training_programs(id),
  student_user_id INTEGER NOT NULL REFERENCES users(id),
  check_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  check_in_lat NUMERIC(10,7),
  check_in_lng NUMERIC(10,7),
  check_out_at TIMESTAMP,
  check_out_lat NUMERIC(10,7),
  check_out_lng NUMERIC(10,7),
  duration_minutes INTEGER,
  is_geo_valid BOOLEAN DEFAULT FALSE
);

-- ============================================
-- Training Audit Log
-- ============================================
CREATE TABLE training_audit_log (
  id SERIAL PRIMARY KEY,
  actor_role VARCHAR(30),
  actor_user_id INTEGER,
  actor_company_entity_id INTEGER,
  action VARCHAR(100) NOT NULL,
  offer_id INTEGER,
  program_id INTEGER,
  application_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);


-- ============================================
-- Sample Events
-- ============================================
INSERT INTO events (title, description, type, neighborhood_id, location_name, lat, lng, date, duration_hours, max_participants, image_url) VALUES
  (
    'تنظيف حديقة المنتزه العام',
    'حملة تطوعية لتنظيف وتجميل حديقة المنتزه العام في وسط المدينة.',
    'بيئية', 1, 'حديقة المنتزه العام - وسط المدينة',
    31.5326, 35.0998,
    NOW() + INTERVAL '3 days', 3, 30,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  ),
  (
    'ورشة مهارات القيادة الشبابية',
    'ورشة عمل تفاعلية لتطوير مهارات القيادة والتواصل لدى الشباب.',
    'تعليمية', 2, 'مركز الشباب - باب الزاوية',
    31.5280, 35.1050,
    NOW() + INTERVAL '5 days', 4, 40,
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400'
  ),
  (
    'دوري كرة القدم الشبابي',
    'بطولة كرة قدم للشباب من 16-25 سنة.',
    'رياضية', 4, 'الملعب البلدي - جبل جوهر',
    31.5350, 35.1020,
    NOW() + INTERVAL '7 days', 6, 100,
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400'
  ),
  (
    'مسرح الشارع في القصبة',
    'عرض مسرحي في قلب المدينة القديمة يحكي تاريخ الخليل.',
    'ثقافية', 7, 'ساحة القصبة - البلد القديم',
    31.5234, 35.1134,
    NOW() + INTERVAL '10 days', 2, 200,
    'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400'
  ),
  (
    'حملة زراعة أشجار الزيتون',
    'نزرع معاً 500 شجرة زيتون في محيط المدينة.',
    'بيئية', 8, 'أراضي حي النزهة الشرقية',
    31.5420, 35.1080,
    NOW() + INTERVAL '14 days', 5, 60,
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
  );
