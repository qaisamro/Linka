const express = require('express');
const router = express.Router();
const { getProfile, getLeaderboard, getDashboardStats, updateProfile, getCVData } = require('../controllers/usersController');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/profile', verifyToken, getProfile);
router.patch('/profile', verifyToken, updateProfile);
router.get('/cv-data', verifyToken, getCVData);
router.get('/leaderboard', getLeaderboard);                         // Public
router.get('/admin/stats', verifyToken, isAdmin, getDashboardStats); // Admin

module.exports = router;
