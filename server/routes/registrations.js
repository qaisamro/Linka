const express = require('express');
const router = express.Router();
const {
  registerToEvent, getMyRegistrations,
  getEventRegistrations, confirmAttendance,
  deleteRegistration,
  getEntityEventRegistrations,
  entityApproveRegistration,
  entityRejectRegistration,
} = require('../controllers/registrationsController');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const isEntityOrAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'entity' || role === 'admin' || role === 'super_admin' || role === 'sub_admin') return next();
  return res.status(403).json({ error: 'صلاحيات الجهة مطلوبة' });
};

// Static routes first
router.get('/my', verifyToken, getMyRegistrations);                                      // Auth user
router.get('/entity/event/:eventId', verifyToken, isEntityOrAdmin, getEntityEventRegistrations); // Entity
router.patch('/:id/entity-approve', verifyToken, isEntityOrAdmin, entityApproveRegistration);   // Entity
router.patch('/:id/entity-reject', verifyToken, isEntityOrAdmin, entityRejectRegistration);     // Entity
router.patch('/:id/confirm', verifyToken, isAdmin, confirmAttendance);                   // Admin
router.get('/event/:eventId/participants', verifyToken, isAdmin, getEventRegistrations); // Admin
router.post('/event/:eventId', verifyToken, registerToEvent);                            // Auth user
router.delete('/:id', verifyToken, deleteRegistration);                                  // Auth user / Admin

module.exports = router;
