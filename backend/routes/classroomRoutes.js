
const express = require('express');
const { 
  getClassrooms, 
  getClassroom, 
  createClassroom, 
  updateClassroom, 
  deleteClassroom,
  getBuildings
} = require('../controllers/classroomController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Classroom validation
const classroomValidation = [
  check('name', 'Classroom name is required').not().isEmpty(),
  check('building', 'Building name is required').not().isEmpty(),
  check('capacity', 'Capacity is required').isNumeric(),
  check('department', 'Department is required').not().isEmpty()
];

// Routes
router.route('/')
  .get(authorize('admin', 'departmentHead'), getClassrooms)
  .post(
    authorize('admin', 'departmentHead'),
    classroomValidation,
    createClassroom
  );

router.route('/buildings')
  .get(authorize('admin', 'departmentHead'), getBuildings);

router.route('/:id')
  .get(authorize('admin', 'departmentHead'), getClassroom)
  .put(
    authorize('admin', 'departmentHead'),
    updateClassroom
  )
  .delete(
    authorize('admin', 'departmentHead'),
    deleteClassroom
  );

module.exports = router;
