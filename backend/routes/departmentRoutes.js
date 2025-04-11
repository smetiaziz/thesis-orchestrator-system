
const express = require('express');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin)
router.post(
  '/',
  [
    authorize('admin'),
    check('name', 'Department name is required').not().isEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, headId } = req.body;

      // Check if department already exists
      const existingDepartment = await Department.findOne({ name });
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          error: 'Department with this name already exists'
        });
      }

      const department = await Department.create({
        name,
        headId
      });

      res.status(201).json({
        success: true,
        data: department
      });
    } catch (err) {
      next(err);
    }
  }
);

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
router.put(
  '/:id',
  authorize('admin'),
  async (req, res, next) => {
    try {
      let department = await Department.findById(req.params.id);

      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'Department not found'
        });
      }

      department = await Department.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: department
      });
    } catch (err) {
      next(err);
    }
  }
);

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
router.delete(
  '/:id',
  authorize('admin'),
  async (req, res, next) => {
    try {
      const department = await Department.findById(req.params.id);

      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'Department not found'
        });
      }

      await department.deleteOne();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
