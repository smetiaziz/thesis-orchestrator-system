
const express = require('express');
const { upload, importTopics } = require('../controllers/importController');
const { importTeachers } = require('../controllers/teacherImportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Import topics route
router.post(
  '/topics',
  authorize('admin', 'departmentHead'),
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next();
    });
  },
  importTopics
);

// Import teachers route - Modified to handle Excel files properly
router.post(
  '/teachers',
  authorize('admin', 'departmentHead'),
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      next();
    });
  },
  importTeachers
);

module.exports = router;
