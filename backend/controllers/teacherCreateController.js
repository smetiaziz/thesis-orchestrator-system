
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create teacher
// @route   POST /api/teachers
// @access  Private (Admin, Department Head)
exports.createTeacher = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if teacher exists by email
    const existingTeacher = await Teacher.findOne({ email: req.body.email });
    
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        error: 'Teacher with this email already exists'
      });
    }
    
    // Create user account if it doesn't exist
    let user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      user = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: 'password', // Default password
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
