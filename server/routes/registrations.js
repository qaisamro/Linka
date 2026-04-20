const express = require('express');
const router = express.Router();
const {
  registerToEvent, getMyRegistrations,
  getEventRegistrations, confirmAttendance,
  deleteRegistration
} = require('../controllers/registrationsController');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.post('/event/:eventId', verifyToken, registerToEvent);                         // Auth user
router.get('/my', verifyToken, getMyRegistrations);                                   // Auth user
router.get('/event/:eventId/participants', verifyToken, isAdmin, getEventRegistrations); // Admin
router.patch('/:id/confirm', verifyToken, isAdmin, confirmAttendance);                // Admin
router.delete('/:id', verifyToken, deleteRegistration);                                   // Auth user / Admin

module.exports = router;
