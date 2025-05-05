
const express = require('express');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  importTeachers,
  getTeacherByUserId
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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

// Add the new route for getting teacher by user ID
router.get('/by-user', authorize('admin', 'departmentHead', 'teacher'), getTeacherByUserId);

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
    authorize('admin', 'departmentHead'),
    deleteTeacher
  );

// Import route
router.post(
  '/import',
  authorize('admin', 'departmentHead'),
  upload.single('file'),
  importTeachers
);

module.exports = router;
