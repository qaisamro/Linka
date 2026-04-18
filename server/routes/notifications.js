const express  = require('express');
const router   = express.Router();
const verifyToken = require('../middleware/auth');
const isAdmin     = require('../middleware/isAdmin');
const ctrl        = require('../controllers/notificationsController');

// ─── User routes (any authenticated user) ─────────────────────────────────────
router.get ('/',             verifyToken, ctrl.getMyNotifications);
router.get ('/count',        verifyToken, ctrl.getUnreadCount);
router.patch('/read-all',    verifyToken, ctrl.markAllAsRead);
router.delete('/clear-read', verifyToken, ctrl.clearReadNotifications);
router.patch('/:id/read',    verifyToken, ctrl.markAsRead);
router.delete('/:id',        verifyToken, ctrl.deleteNotification);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.post('/broadcast',    verifyToken, isAdmin, ctrl.broadcastNotification);
router.get ('/admin/recent', verifyToken, isAdmin, ctrl.getAdminNotifications);

module.exports = router;
