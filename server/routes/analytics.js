const express = require('express');
const router  = express.Router();
const { getHeatmap } = require('../controllers/analyticsController');

// GET /api/analytics/heatmap — public (read-only)
router.get('/heatmap', getHeatmap);

module.exports = router;
