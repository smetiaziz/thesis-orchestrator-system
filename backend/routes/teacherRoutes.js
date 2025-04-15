
const express = require('express');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

const teacherValidation = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('department', 'Department is required').not().isEmpty(),
  check('rank', 'Rank is required').not().isEmpty(),
  check('email', 'Valid email is required').isEmail()
];

router
  .route('/')
  .get(authorize('admin', 'departmentHead'), getTeachers)
  .post(
    authorize('admin', 'departmentHead'),
    teacherValidation,
    createTeacher
  );

router
  .route('/:id')
  .get(authorize('admin', 'departmentHead'), getTeacher)
  .put(
    authorize('admin', 'departmentHead'),
    updateTeacher
  )
  .delete(
    authorize('admin'),
    deleteTeacher
  );

// Remove the import route from here, as it's now handled in importRoutes.js

module.exports = router;
