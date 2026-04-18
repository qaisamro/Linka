const express = require('express');
const router = express.Router();
const {
    listJobs, createJob, getUserSkills, getRecommendations, getCareerPath,
} = require('../controllers/jobsController');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Optional auth helper (doesn't block, but adds user if token present)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return next();
    const jwt = require('jsonwebtoken');
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        // ignore invalid token for optional auth
    }
    next();
};

router.get('/', optionalAuth, listJobs);
router.post('/', verifyToken, isAdmin, createJob);
router.get('/recommend', verifyToken, getRecommendations);
router.get('/skills', verifyToken, getUserSkills);
router.get('/career-path', verifyToken, getCareerPath);

module.exports = router;
