
const express = require('express');
const { 
  getDepartments, 
  getDepartment, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  createDepartmentHead
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Department validation
const departmentValidation = [
  check('name', 'Department name is required').not().isEmpty()
];

// Department head validation
const departmentHeadValidation = [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('departmentName', 'Department name is required').not().isEmpty()
];

router
  .route('/')
  .get(getDepartments)
  .post(
    authorize('admin'),
    departmentValidation,
    createDepartment
  );

router
  .route('/:id')
  .get(getDepartment)
  .put(
    authorize('admin'),
    updateDepartment
  )
  .delete(
    authorize('admin'),
    deleteDepartment
  );

router
  .route('/create-head')
  .post(
    authorize('admin'),
    departmentHeadValidation,
    createDepartmentHead
  );

module.exports = router;
