
const express = require('express');
const {
  getDepartmentStats,
  getScheduleReport,
  getParticipationReport
} = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Department stats
router.get(
  '/department/:departmentName',
  authorize('admin', 'departmentHead'),
  getDepartmentStats
);

// Schedule report for export
router.get(
  '/reports/schedule',
  authorize('admin', 'departmentHead', 'teacher'),
  getScheduleReport
);

// Teacher participation report
router.get(
  '/reports/participation',
  authorize('admin', 'departmentHead'),
  getParticipationReport
);

module.exports = router;
