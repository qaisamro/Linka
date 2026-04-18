const express    = require('express');
const router     = express.Router();
const verifyToken = require('../middleware/auth');
const isAdmin    = require('../middleware/isAdmin');
const ctrl       = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

// ── Users ──────────────────────────────────────────────────────────────────
router.get   ('/users',                ctrl.listUsers);
router.patch ('/users/:id/toggle',     ctrl.toggleUserStatus);
router.delete('/users/:id',            ctrl.deleteUser);
router.post  ('/users/:id/impersonate',ctrl.impersonateUser);

// ── Event Registrations ────────────────────────────────────────────────────
router.get   ('/events/:eventId/registrations', ctrl.getEventRegistrationsAdmin);
router.delete('/registrations/:id',             ctrl.cancelRegistration);
router.patch ('/registrations/:id/status',      ctrl.changeRegistrationStatus);

// ── System Monitoring & Settings ───────────────────────────────────────────
router.get   ('/monitoring',           ctrl.getSystemMonitoring);
router.get   ('/settings',             ctrl.getSettings);
router.patch ('/settings',             ctrl.updateSetting);

// ── Audit Log ──────────────────────────────────────────────────────────────
router.get   ('/audit-log',            ctrl.getAuditLog);

module.exports = router;
