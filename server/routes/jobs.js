const express = require('express');
const router = express.Router();
const {
    listJobs, createJob, getUserSkills, getRecommendations, getCareerPath,
    applyToJob, getJobApplications, getMyJobApplications,
    updateJob, deleteJob, deleteJobApplication, updateApplicationStatus,
    contactApplicant
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

const isEntityOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'entity' || req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'sub_admin')) {
        return next();
    }
    return res.status(403).json({ error: 'غير مصرح لك' });
};

router.get('/', optionalAuth, listJobs);
router.post('/', verifyToken, isEntityOrAdmin, createJob);
router.get('/my-applications', verifyToken, getMyJobApplications);
router.get('/recommend', verifyToken, getRecommendations);
router.get('/skills', verifyToken, getUserSkills);
router.get('/career-path', verifyToken, getCareerPath);
router.post('/:id/apply', verifyToken, applyToJob);
router.get('/:id/applications', verifyToken, getJobApplications);

router.put('/:id', verifyToken, isEntityOrAdmin, updateJob);
router.delete('/:id', verifyToken, isEntityOrAdmin, deleteJob);
router.delete('/:id/applications/:appId', verifyToken, isEntityOrAdmin, deleteJobApplication);
router.patch('/:id/applications/:appId/status', verifyToken, isEntityOrAdmin, updateApplicationStatus);
router.post('/:id/applications/:appId/contact', verifyToken, isEntityOrAdmin, contactApplicant);

module.exports = router;
