const express = require('express');
const router = express.Router();
const {
  getEvents, getEventById, createEvent, updateEvent, deleteEvent,
  createEntityEvent, getEntityEvents, getPendingEvents, approveEvent
} = require('../controllers/eventsController');
const verifyToken = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const isAdmin = require('../middleware/isAdmin');

// ─── Static routes MUST come before /:id to avoid Express matching them as IDs ─
router.get('/admin/pending', verifyToken, isAdmin, getPendingEvents);
router.get('/entity/my', verifyToken, getEntityEvents);
router.post('/entity/create', verifyToken, createEntityEvent);

// ─── Public ───────────────────────────────────────────────────────
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// ─── Admin only ───────────────────────────────────────────────────
router.post('/', verifyToken, isAdmin, createEvent);
router.put('/:id', verifyToken, isAdmin, updateEvent);
router.delete('/:id', verifyToken, isAdmin, deleteEvent);
router.patch('/:id/approve', verifyToken, isAdmin, approveEvent);

module.exports = router;
