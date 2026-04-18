-- ============================================
-- Notifications System — Migration
-- Run this after mysql_schema.sql
-- ============================================

DROP TABLE IF EXISTS notifications;

CREATE TABLE notifications (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  title         VARCHAR(200) NOT NULL,
  message       TEXT,
  type          ENUM('registration', 'new_event', 'attendance', 'badge', 'system', 'announcement')
                DEFAULT 'system',
  related_id    INT          NULL,          -- event_id / badge_id
  related_type  VARCHAR(50)  NULL,          -- 'event' | 'badge'
  is_read       TINYINT(1)   DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read  (user_id, is_read),
  INDEX idx_created_at (created_at)
);
