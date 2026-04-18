const express = require('express');
const router = express.Router();
const {
    getReport, getStudentTranscript, getUniversities,
    getMyStudents, addStudent, verifyAttendance,
    getDashboardStats, issueCertificate, generateEventCode,
} = require('../controllers/universityController');
const verifyToken = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const isUniversity = require('../middleware/isUniversity');

// ── Public ────────────────────────────────────────────────────────
router.get('/list', getUniversities);

// ── Admin only ────────────────────────────────────────────────────
router.get('/report', verifyToken, isAdmin, getReport);
router.get('/student/:userId', verifyToken, isAdmin, getStudentTranscript);
router.post('/generate-code', verifyToken, isAdmin, generateEventCode);

// ── University (or admin) ─────────────────────────────────────────
router.get('/my-students', verifyToken, isUniversity, getMyStudents);
router.post('/add-student', verifyToken, isUniversity, addStudent);
router.post('/verify-attendance', verifyToken, isUniversity, verifyAttendance);
router.get('/dashboard-stats', verifyToken, isUniversity, getDashboardStats);
router.get('/certificate/:userId', verifyToken, isUniversity, issueCertificate);

module.exports = router;
