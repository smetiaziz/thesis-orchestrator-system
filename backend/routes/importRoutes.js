
const express = require('express');
const { upload } = require('../utils/fileUtils');
const { importTopics } = require('../controllers/topicImportController');
const { importTeachers } = require('../controllers/teacherImportController');
const { importStudents } = require('../controllers/studentImportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Import topics route
router.post(
  '/topics',
  authorize('admin', 'departmentHead'),
  upload,
  importTopics
);

// Import teachers route
router.post(
  '/teachers',
  authorize('admin', 'departmentHead'),
  upload,
  importTeachers
);

// Import students route
router.post(
  '/students',
  authorize('admin', 'departmentHead', 'teacher'),
  upload,
  importStudents
);

module.exports = router;
