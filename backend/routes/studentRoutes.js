
const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getSupervised
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Apply protection to all routes
router.use(protect);

const studentValidation = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('inscrNumber', 'Inscription number is required').not().isEmpty(),
  check('department', 'Department is required').not().isEmpty()
];

// Get supervised students (for teachers)
router.route('/supervised')
  .get(authorize('teacher'), getSupervised);

router.route('/')
  .get(authorize('admin', 'departmentHead', 'teacher'), getStudents)
  .post(
    authorize('admin', 'departmentHead', 'teacher'),
    studentValidation,
    createStudent
  );

router.route('/:id')
  .get(authorize('admin', 'departmentHead', 'teacher', 'student'), getStudent)
  .put(
    authorize('admin', 'departmentHead', 'teacher'),
    updateStudent
  )
  .delete(
    authorize('admin'),
    deleteStudent
  );

module.exports = router;
