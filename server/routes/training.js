const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const isUniversity = require('../middleware/isUniversity');
const ctrl = require('../controllers/trainingController');

// Company offers
router.post('/offers', verifyToken, ctrl.createOffer);
router.get('/offers', verifyToken, ctrl.listOffers);
router.get('/company/offers', verifyToken, ctrl.listMyCompanyOffers);

// Student applications
router.post('/offers/:offerId/apply', verifyToken, ctrl.applyToOffer);
router.get('/my-applications', verifyToken, ctrl.listMyApplications);
router.get('/my-programs', verifyToken, ctrl.getMyPrograms);
router.get('/programs/:programId/sessions', verifyToken, ctrl.listProgramSessions);

// Company applications decision
router.get('/offers/:offerId/applications', verifyToken, ctrl.listOfferApplications);
router.patch('/applications/:applicationId/accept', verifyToken, ctrl.acceptApplication);
router.patch('/applications/:applicationId/reject', verifyToken, ctrl.rejectApplication);

// Smart check-in/out
router.post('/programs/:programId/sessions/check-in', verifyToken, ctrl.checkIn);
router.post('/programs/:programId/sessions/check-out', verifyToken, ctrl.checkOut);

// University approvals
router.get('/university/sessions', verifyToken, isUniversity, ctrl.universityListPendingSessions);
router.patch('/sessions/:sessionId/approve', verifyToken, isUniversity, ctrl.universityApproveSession);
router.get('/export-report', verifyToken, ctrl.exportTrainingReport);

// Completion & Reviews (MVP)
router.post('/programs/:programId/complete', verifyToken, ctrl.completeProgram);
router.post('/programs/:programId/reviews', verifyToken, ctrl.submitStudentReview);
router.get('/offers/:offerId/reviews', ctrl.listPublicReviewsForOffer);

// Management
router.delete('/offers/:id', verifyToken, ctrl.deleteOffer);
router.delete('/programs/:id', verifyToken, ctrl.deleteProgram);

module.exports = router;

