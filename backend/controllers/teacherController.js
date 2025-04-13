
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
exports.getTeachers = async (req, res, next) => {
  try {
    let query = Teacher.find();

    // Filter by department if specified
    if (req.query.department) {
      query = query.find({ department: req.query.department });
    }

    const teachers = await query.sort({ lastName: 1, firstName: 1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('supervisedProjects')
      .populate('juryParticipations');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin, Department Head)
exports.updateTeacher = async (req, res, next) => {
  try {
    let teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update corresponding user if exists
    if (teacher.userId) {
      await User.findByIdAndUpdate(teacher.userId, {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        department: teacher.department
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
exports.deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    await teacher.deleteOne();

    // Note: We're not deleting the user account,
    // just the teacher profile

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// Import other teacher-related controllers
const { createTeacher } = require('./teacherCreateController');
const { importTeachers } = require('./teacherImportController');

// Re-export them
exports.createTeacher = createTeacher;
exports.importTeachers = importTeachers;
