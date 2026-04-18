-- ============================================================
-- Migration: Multi-Entity System & Super Admin
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create Entities table
CREATE TABLE IF NOT EXISTS entities (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(150) NOT NULL,
  name_en         VARCHAR(150),
  type            ENUM('university', 'company', 'municipality') NOT NULL,
  email           VARCHAR(150) UNIQUE,
  password_hash   VARCHAR(255),
  contact_name    VARCHAR(100),
  phone           VARCHAR(30),
  website         VARCHAR(255),
  description     TEXT,
  city            VARCHAR(100) DEFAULT 'الخليل',
  code            VARCHAR(20),
  logo_url        VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE,
  is_approved     BOOLEAN DEFAULT FALSE,
  approved_by     INT,
  approved_at     TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrate existing universities to entities table
INSERT INTO entities (name, name_en, type, email, password_hash, contact_name, phone, code, is_active, is_approved)
SELECT name, name_en, 'university', email, password_hash, contact_name, phone, code, is_active, TRUE
FROM universities;

-- 3. Update users role enum
-- Adding 'super_admin' and 'entity'
ALTER TABLE users MODIFY COLUMN role ENUM('youth', 'admin', 'university', 'super_admin', 'entity') DEFAULT 'youth';

-- 4. Add entity_id to users to link entity admins
ALTER TABLE users ADD COLUMN entity_id INT DEFAULT NULL;
ALTER TABLE users ADD FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL;

-- 5. Create Audit Log for Super Admin and Entities
CREATE TABLE IF NOT EXISTS entity_audit_log (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  actor_id        INT NOT NULL,           -- user_id of the person who did the action
  action          VARCHAR(100) NOT NULL,  -- e.g. 'CREATE_ENTITY', 'SUSPEND_ENTITY'
  entity_id       INT,                    -- the entity affected
  target_user_id  INT,                    -- if a user was affected
  details         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- 6. Seed Super Admin (password: super123)
-- bcrypt hash of 'super123': $2a$10$wTf/Y5W7S5pP/R6u.E5Mv.n9v6Y7m8k9l0j1i2h3g4f5e6d7c8b9a 
-- Actually, I'll generate it properly in the next step to be sure.
-- For now, I'll just clear any existing super_admin if I re-run this.
DELETE FROM users WHERE email = 'super@hebron.ps';

SET FOREIGN_KEY_CHECKS = 1;
