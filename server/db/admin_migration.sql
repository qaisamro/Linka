-- ─── Admin Management Migration ─────────────────────────────────────────────
-- Run this against your MySQL database after the main schema and notifications migration.

-- 1. Add is_active flag to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1
    COMMENT '1 = active, 0 = disabled by admin';

-- Index for fast active-user queries
ALTER TABLE users
  ADD INDEX IF NOT EXISTS idx_is_active (is_active);

-- 2. Admin Audit Log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  admin_id      INT          NOT NULL,
  admin_name    VARCHAR(100) NOT NULL DEFAULT '',
  action        VARCHAR(100) NOT NULL
    COMMENT 'e.g. USER_DELETED, USER_DISABLED, USER_ENABLED, REG_CANCELLED, REG_STATUS_CHANGED',
  target_type   VARCHAR(50)  NOT NULL
    COMMENT 'user | registration | event',
  target_id     INT          NULL,
  target_name   VARCHAR(255) NULL
    COMMENT 'Human-readable name of the target for display purposes',
  details       TEXT         NULL
    COMMENT 'JSON or free-text extra context',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_admin_id   (admin_id),
  INDEX idx_action     (action),
  INDEX idx_created_at (created_at),
  INDEX idx_target     (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
