-- ============================================================
-- MVP: Training Field Management (Offers, Programs, Tracking, Reviews)
-- Run this after all previous migrations.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1) Training Offers created by companies/entities
CREATE TABLE IF NOT EXISTS training_offers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_entity_id INT NOT NULL,
  company_name VARCHAR(150) NULL,

  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- company-defined matching criteria
  required_skills JSON,
  objectives JSON, -- { skills:[], tasks:[], outcomes:[] } snapshot by offer
  specialization VARCHAR(150) NULL,

  -- desired capacity
  max_trainees INT DEFAULT 10,

  -- geo constraints for check-in/out
  location_name VARCHAR(200) NULL,
  geo_center_lat DECIMAL(10,7) NULL,
  geo_center_lng DECIMAL(10,7) NULL,
  geo_radius_m INT NULL,

  start_date DATE NULL,
  end_date DATE NULL,

  status ENUM('draft','active','completed','cancelled') DEFAULT 'active',

  created_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_offer_company (company_entity_id),
  INDEX idx_offer_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Applications by students to offers
CREATE TABLE IF NOT EXISTS training_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offer_id INT NOT NULL,
  student_user_id INT NOT NULL,
  company_entity_id INT NOT NULL,

  status ENUM('pending','accepted','rejected','withdrawn') DEFAULT 'pending',
  match_score INT DEFAULT 0,

  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at TIMESTAMP NULL,

  decided_by_user_id INT NULL,
  notes TEXT NULL,

  UNIQUE KEY uq_offer_student (offer_id, student_user_id),
  INDEX idx_app_offer (offer_id),
  INDEX idx_app_student (student_user_id),
  INDEX idx_app_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Training programs (one per accepted student/application)
CREATE TABLE IF NOT EXISTS training_programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offer_id INT NOT NULL,
  application_id INT NOT NULL UNIQUE,

  student_user_id INT NOT NULL,
  company_entity_id INT NOT NULL,

  -- set from university_students at acceptance time (same "universityId" used by universityController)
  university_id INT NULL,

  status ENUM('in_progress','completed','rejected') DEFAULT 'in_progress',

  supervisor_user_id INT NULL, -- university supervisor (future: group assignment)

  objectives_snapshot JSON NULL, -- snapshot from offer.objectives for this student

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_prog_student (student_user_id),
  INDEX idx_prog_offer (offer_id),
  INDEX idx_prog_uni (university_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Attendance / Tracking Sessions with Geo Check-in/out
CREATE TABLE IF NOT EXISTS training_attendance_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  student_user_id INT NOT NULL,

  check_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_in_lat DECIMAL(10,7) NULL,
  check_in_lng DECIMAL(10,7) NULL,
  check_in_location_name VARCHAR(200) NULL,

  check_out_at TIMESTAMP NULL,
  check_out_lat DECIMAL(10,7) NULL,
  check_out_lng DECIMAL(10,7) NULL,
  check_out_location_name VARCHAR(200) NULL,

  computed_hours DECIMAL(7,2) DEFAULT 0.00,

  geo_verified TINYINT(1) DEFAULT 0,

  -- university approval stage
  status ENUM('pending','university_approved','rejected') DEFAULT 'pending',
  approved_by_user_id INT NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,

  supervisor_signature_url VARCHAR(255) NULL,
  supervisor_notes TEXT NULL,

  INDEX idx_sessions_program (program_id),
  INDEX idx_sessions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Reviews (student reviews company, optionally company reviews student later)
CREATE TABLE IF NOT EXISTS training_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT NOT NULL,
  offer_id INT NOT NULL,

  company_entity_id INT NOT NULL,
  target_user_id INT NOT NULL, -- student_user_id for company rating, or company entity for student rating (kept user_id-style for simplicity)

  reviewer_role ENUM('student','company') NOT NULL,
  reviewer_user_id INT NULL,
  reviewer_company_entity_id INT NULL,

  rating INT NOT NULL,
  comment TEXT,
  is_public TINYINT(1) DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reviews_target (target_user_id),
  INDEX idx_reviews_program (program_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Training audit log
CREATE TABLE IF NOT EXISTS training_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  actor_role ENUM('super_admin','university','company','student','system') NOT NULL DEFAULT 'system',
  actor_user_id INT NULL,
  actor_company_entity_id INT NULL,

  action VARCHAR(100) NOT NULL,
  offer_id INT NULL,
  program_id INT NULL,
  application_id INT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_training_audit_action (action),
  INDEX idx_training_audit_program (program_id),
  INDEX idx_training_audit_offer (offer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

