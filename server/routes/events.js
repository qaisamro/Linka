const express = require('express');
const router = express.Router();
const {
  getEvents, getEventById, createEvent, updateEvent, deleteEvent
} = require('../controllers/eventsController');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', getEvents);                                     // Public
router.get('/:id', getEventById);                               // Public
router.post('/', verifyToken, isAdmin, createEvent);            // Admin only
router.put('/:id', verifyToken, isAdmin, updateEvent);          // Admin only
router.delete('/:id', verifyToken, isAdmin, deleteEvent);       // Admin only

module.exports = router;
