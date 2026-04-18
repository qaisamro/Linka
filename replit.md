# Hebron Youth Interaction Map (منصة شباب الخليل)

## Overview
A civic engagement platform connecting Hebron Municipality youth with local events on an interactive map. Includes gamification (points, badges, leaderboards), AI chatbot, and role-based dashboards.

## Architecture
- **Frontend**: React + Vite (port 5000)
- **Backend**: Node.js + Express (port 3001)
- **Database**: PostgreSQL (Replit built-in)

## Running the App
Single workflow "Start application" runs both:
- `cd server && npm start` → API on localhost:3001
- `cd client && npm run dev` → Frontend on 0.0.0.0:5000

The Vite dev server proxies `/api` requests to the backend on port 3001.

## Key Features
- Interactive map (react-leaflet) showing events across Hebron neighborhoods
- Role-based access: youth, admin, super_admin, entity (university/company), sub_admin
- Gamification: points, volunteer hours, badges
- University academic hour tracking system
- Job/training matching with skill scoring
- Real-time notifications system
- Analytics heatmap dashboard
- AI chatbot for event suggestions

## Database
Uses Replit's built-in PostgreSQL. Connection via `DATABASE_URL` env var.
Schema tables: neighborhoods, universities, entities, users, events, registrations, badges, user_badges, notifications, admin_audit_log, system_settings, admin_alerts, blocked_ips, entity_audit_log, university_students, verification_codes, hour_approvals, academic_submissions, jobs, training_offers, training_applications, training_programs, training_attendance_sessions, training_audit_log.

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiry (default: 7d)

## Admin Credentials (dev)
- Admin: `admin@hebron.ps` / password: `admin123`
- Super Admin: `super@hebron.ps` / password: `admin123`

## Deployment
- Build: `cd client && npm install && npm run build`
- Run: `node server/index.js & npx serve -s client/dist -l 5000`
- Target: autoscale

## Notes
- Backend was originally MySQL, converted to PostgreSQL for Replit compatibility
- MySQL `?` placeholders are converted to `$N` via pool.js wrapper
- MySQL-specific functions replaced: `DATE_SUB` → `NOW() - INTERVAL`, `CURDATE()` → `CURRENT_DATE`, `GROUP_CONCAT` → `STRING_AGG`, `INSERT IGNORE` → `ON CONFLICT DO NOTHING`
