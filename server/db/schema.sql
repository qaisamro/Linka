-- ============================================
-- Hebron Youth Interaction Map — Database Schema
-- ============================================

-- Drop tables if re-running (for development reset)
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Neighborhoods (أحياء الخليل)
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
-- Users
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  neighborhood_id INTEGER REFERENCES neighborhoods(id),
  points INTEGER DEFAULT 0,
  total_hours NUMERIC(6,2) DEFAULT 0,
  role VARCHAR(20) DEFAULT 'youth' CHECK (role IN ('youth', 'admin')),
  avatar_url VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Events (الفعاليات)
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
-- Registrations (التسجيلات في الفعاليات)
-- ============================================
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'absent')),
  registered_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  UNIQUE(user_id, event_id)
);

-- ============================================
-- Badges (الشارات)
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
-- User Badges (شارات المستخدمين)
-- ============================================
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- Sample Admin User (password: admin123)
-- ============================================
INSERT INTO users (name, email, password_hash, role) VALUES
  ('مدير البلدية', 'admin@hebron.ps', '$2a$10$xQZ5ePBYxqhLrxI1Y4DMIOeFX3bWWZhRoEJj4aCqh7qPaSNY5xBOm', 'admin');

-- ============================================
-- Sample Events (بيانات تجريبية)
-- ============================================
INSERT INTO events (title, description, type, neighborhood_id, location_name, lat, lng, date, duration_hours, max_participants, image_url) VALUES
  (
    'تنظيف حديقة المنتزه العام',
    'حملة تطوعية لتنظيف وتجميل حديقة المنتزه العام في وسط المدينة. انضم إلينا لتجعل مدينتك أجمل!',
    'بيئية', 1, 'حديقة المنتزه العام - وسط المدينة',
    31.5326, 35.0998,
    NOW() + INTERVAL '3 days', 3, 30,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  ),
  (
    'ورشة مهارات القيادة الشبابية',
    'ورشة عمل تفاعلية لتطوير مهارات القيادة والتواصل لدى الشباب. سيقدمها خبراء متخصصون.',
    'تعليمية', 2, 'مركز الشباب - باب الزاوية',
    31.5280, 35.1050,
    NOW() + INTERVAL '5 days', 4, 40,
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400'
  ),
  (
    'دوري كرة القدم الشبابي',
    'بطولة كرة قدم للشباب من 16-25 سنة. سجّل فريقك الآن وانافس على كأس البلدية!',
    'رياضية', 4, 'الملعب البلدي - جبل جوهر',
    31.5350, 35.1020,
    NOW() + INTERVAL '7 days', 6, 100,
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400'
  ),
  (
    'مسرح الشارع في القصبة',
    'عرض مسرحي في قلب المدينة القديمة يحكي تاريخ الخليل. تجربة ثقافية فريدة لكل الأعمار.',
    'ثقافية', 7, 'ساحة القصبة - البلد القديم',
    31.5234, 35.1134,
    NOW() + INTERVAL '10 days', 2, 200,
    'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400'
  ),
  (
    'حملة زراعة أشجار الزيتون',
    'نزرع معاً 500 شجرة زيتون في محيط المدينة. كن جزءاً من إحياء تراث الخليل الزراعي.',
    'بيئية', 8, 'أراضي حي النزهة الشرقية',
    31.5420, 35.1080,
    NOW() + INTERVAL '14 days', 5, 60,
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'
  );
