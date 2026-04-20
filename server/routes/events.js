const express = require('express');
const router = express.Router();
const {
  getEvents, getEventById, createEvent, updateEvent, deleteEvent
} = require('../controllers/eventsController');
const verifyToken = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', optionalAuth, getEvents);                                     // Public (auth aware)
router.get('/:id', optionalAuth, getEventById);                               // Public (auth aware)
router.post('/', verifyToken, isAdmin, createEvent);            // Admin only
router.put('/:id', verifyToken, isAdmin, updateEvent);          // Admin only
router.delete('/:id', verifyToken, isAdmin, deleteEvent);       // Admin only

module.exports = router;
