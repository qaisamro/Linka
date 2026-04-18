-- ============================================
-- Hebron Youth Interaction Map — MySQL Database Schema
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS neighborhoods;
DROP TABLE IF EXISTS universities;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Neighborhoods (أحياء الخليل)
-- ============================================
CREATE TABLE neighborhoods (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
-- Universities (الجامعات)
-- ============================================
CREATE TABLE universities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  name_en VARCHAR(150),
  code VARCHAR(20),
  city VARCHAR(100) DEFAULT 'الخليل',
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO universities (name, name_en, code) VALUES
  ('جامعة الخليل', 'Hebron University', 'HU'),
  ('جامعة بوليتكنك فلسطين', 'Palestine Polytechnic University', 'PPU'),
  ('جامعة القدس المفتوحة', 'Al-Quds Open University', 'QOU'),
  ('كلية الدراسات التكنولوجية', 'Palestine Technical College', 'PTC');

-- ============================================
-- Users
-- ============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  neighborhood_id INTEGER,
  is_university_student BOOLEAN DEFAULT FALSE,
  university VARCHAR(100),
  student_id VARCHAR(50),
  points INTEGER DEFAULT 0,
  total_hours DECIMAL(6,2) DEFAULT 0,
  role ENUM('youth', 'admin') DEFAULT 'youth',
  avatar_url VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id)
);

-- ============================================
-- Events (الفعاليات)
-- ============================================
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type ENUM('تطوعية', 'ثقافية', 'رياضية', 'تعليمية', 'بيئية', 'اجتماعية'),
  neighborhood_id INTEGER,
  location_name VARCHAR(200),
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  date TIMESTAMP NOT NULL,
  duration_hours DECIMAL(4,1) DEFAULT 2,
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  image_url VARCHAR(255),
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- Registrations (التسجيلات في الفعاليات)
-- ============================================
CREATE TABLE registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INTEGER,
  event_id INTEGER,
  status ENUM('registered', 'attended', 'absent') DEFAULT 'registered',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  UNIQUE(user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ============================================
-- Badges (الشارات)
-- ============================================
CREATE TABLE badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  icon VARCHAR(10),
  condition_type ENUM('participations', 'hours', 'points', 'streak'),
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
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INTEGER,
  badge_id INTEGER,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- ============================================
-- Sample Admin User (password: admin123)
-- ============================================
INSERT INTO users (name, email, password_hash, role) VALUES
  ('مدير البلدية', 'admin@hebron.ps', '$2a$10$GDn7PI1X2i8mzEc7cQiNB.fjtoDCtnuAkbuIaMcJE4s3S8nlHHgx6', 'admin');

-- ============================================
-- Sample Events (بيانات تجريبية)
-- ============================================
-- Note: NOW() in MySQL works similarly to NOW() in PostgreSQL for INSERT
INSERT INTO events (title, description, type, neighborhood_id, location_name, lat, lng, date, duration_hours, max_participants, image_url) VALUES
  (
    'تنظيف حديقة المنتزه العام',
    'حملة تطوعية لتنظيف وتجميل حديقة المنتزه العام في وسط المدينة. انضم إلينا لتجعل مدينتك أجمل!',
    'بيئية', 1, 'حديقة المنتزه العام - وسط المدينة',
    31.5326, 35.0998,
    DATE_ADD(NOW(), INTERVAL 3 DAY), 3, 30,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
  ),
  (
    'ورشة مهارات القيادة الشبابية',
    'ورشة عمل تفاعلية لتطوير مهارات القيادة والتواصل لدى الشباب. سيقدمها خبراء متخصصون.',
    'تعليمية', 2, 'مركز الشباب - باب الزاوية',
    31.5280, 35.1050,
    DATE_ADD(NOW(), INTERVAL 5 DAY), 4, 40,
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400'
  );
