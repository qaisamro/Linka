-- ─── Super Admin Central Control: settings, alerts, IP blocklist, audit support ───
-- Safe to re-run (uses IF NOT EXISTS / INSERT IGNORE where possible).

-- System settings (feature flags)
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(64) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
  ('certificates_enabled', 'true', 'تفعيل نظام الشهادات والوثائق'),
  ('jobs_integration_enabled', 'true', 'تفعيل الربط مع فرص العمل والمسارات المهنية'),
  ('public_registration_enabled', 'true', 'السماح بتسجيل حسابات جديدة للشباب'),
  ('entity_self_signup_enabled', 'false', 'السماح للجهات بطلب انضمام ذاتي (قريباً)');

-- Administrative alerts (Super Admin inbox)
CREATE TABLE IF NOT EXISTS admin_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
  alert_type VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  metadata JSON NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_alerts_read (is_read),
  INDEX idx_admin_alerts_created (created_at),
  INDEX idx_admin_alerts_type (alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blocked IP addresses (exact match on normalized IP string)
CREATE TABLE IF NOT EXISTS blocked_ips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(64) NOT NULL,
  reason VARCHAR(255) NULL,
  created_by INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_blocked_ip (ip),
  INDEX idx_blocked_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login telemetry (optional columns; migration runner may skip if duplicate)
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(64) NULL;

-- Sub-admin role for delegated operators (لوحة /admin فقط، بدون غرفة السيطرة العليا)
ALTER TABLE users MODIFY COLUMN role ENUM('youth', 'admin', 'university', 'super_admin', 'entity', 'sub_admin') DEFAULT 'youth';
