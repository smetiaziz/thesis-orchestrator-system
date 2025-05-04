
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
exports.getTeachers = async (req, res, next) => {
  try {

   let query = Teacher.find();
       console.log("dept:00",req.query.department)
       // Filter by department
       if (req.query.department && req.query.department != "all") {
         department = await Department.findById(req.query.department);
         if (!department) {
           return res.status(404).json({
             success: false,
             error: 'Department not found'
           });
         }
         console.log('Department found:', department.name);
         query = query.find({ department: department.name });
       }

    const teachers = await query.sort({ lastName: 1, firstName: 1 });
    console.log("✅ Found teachers:", teachers.length);
    
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

// @desc    Create a new teacher
// @route   POST /api/teachers
// @access  Private (Admin, Department Head)
exports.createTeacher = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // First create a user account if it doesn't exist
    let user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      user = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: 'password', // Generate random password
        role: 'teacher',
        department: req.body.department
      });
    }

    // Create teacher profile
    const teacher = await Teacher.create({
      ...req.body,
      userId: user._id
    });

    res.status(201).json({
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
const { importTeachers } = require('./teacherImportController');

// Re-export them
exports.importTeachers = importTeachers;
