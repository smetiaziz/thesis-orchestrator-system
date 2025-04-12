
const express = require('express');
const { 
  getDepartments, 
  getDepartment, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
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

module.exports = router;
