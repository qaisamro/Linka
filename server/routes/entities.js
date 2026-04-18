const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const isSuperAdmin = require('../middleware/isSuperAdmin');
const ctrl = require('../controllers/entityController');

// All entity management routes require Super Admin role
router.use(verifyToken, isSuperAdmin);

router.get('/stats', ctrl.getSystemOverview);
router.get('/', ctrl.listEntities);
router.post('/', ctrl.createEntity);
router.patch('/:id/toggle', ctrl.toggleEntity);
router.put('/:id', ctrl.updateEntity);
router.delete('/:id', ctrl.deleteEntity);

module.exports = router;
