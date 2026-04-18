const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const isSuperAdmin = require('../middleware/isSuperAdmin');
const ctrl = require('../controllers/superAdminController');

router.use(verifyToken, isSuperAdmin);

router.get('/overview', ctrl.getOverview);
router.get('/alerts', ctrl.listAlerts);
router.patch('/alerts/:id/read', ctrl.markAlertRead);

router.get('/blocked-ips', ctrl.listBlockedIps);
router.post('/blocked-ips', ctrl.addBlockedIp);
router.patch('/blocked-ips/:id/disable', ctrl.removeBlockedIp);

router.get('/events', ctrl.listAllEvents);

router.patch('/users/:id', ctrl.patchUser);

router.get('/export/audit-log.csv', ctrl.exportAuditCsv);
router.get('/export/users.csv', ctrl.exportUsersCsv);

module.exports = router;
