
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const PFETopic = require('../models/PFETopic');
const { validationResult } = require('express-validator');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res, next) => {
  try {
    let query = Student.find();

    // Filter by department if specified
    if (req.query.department) {
      query = query.find({ department: req.query.department });
    }

    // Filter by supervisor
    if (req.query.supervisorId) {
      query = query.find({ supervisorId: req.query.supervisorId });
    }

    // Filter by field
    if (req.query.field) {
      query = query.find({ field: req.query.field });
    }

    const students = await query.sort({ lastName: 1, firstName: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('supervisorId')
      .populate('pfeTopicId');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new student
// @route   POST /api/students
// @access  Private (Admin, Teacher)
exports.createStudent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if the supervisor exists if provided
    if (req.body.supervisorId) {
      const supervisor = await Teacher.findById(req.body.supervisorId);
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          error: 'Supervisor not found'
        });
      }
    }

    // Create student
    const student = await Student.create(req.body);

    // Create a user account if email is provided and doesn't exist
    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      
      if (!existingUser) {
        // Generate a temporary password
        const tempPassword = 'password';
        
        await User.create({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          password: tempPassword,
          role: 'student',
          department: req.body.department
        });
        
        // Here you could add code to send an email with login instructions
      }
    }

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin, Teacher)
exports.updateStudent = async (req, res, next) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check if changing supervisor
    if (req.body.supervisorId && req.body.supervisorId !== student.supervisorId?.toString()) {
      const newSupervisor = await Teacher.findById(req.body.supervisorId);
      if (!newSupervisor) {
        return res.status(404).json({
          success: false,
          error: 'New supervisor not found'
        });
      }
    }

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update user if exists
    if (student.email) {
      const user = await User.findOne({ email: student.email });
      if (user) {
        user.firstName = student.firstName;
        user.lastName = student.lastName;
        user.department = student.department;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    await student.deleteOne();

    // Note: We're not deleting the user account,
    // just the student record

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get students supervised by a specific teacher
// @route   GET /api/students/supervised
// @access  Private (Teacher)
exports.getSupervised = async (req, res, next) => {
  try {
    // Find the teacher corresponding to the logged-in user
    const teacher = await Teacher.findOne({ email: req.user.email });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher profile not found'
      });
    }
    
    // Get all students supervised by this teacher
    const students = await Student.find({ supervisorId: teacher._id })
      .populate('pfeTopicId')
      .sort({ lastName: 1, firstName: 1 });
      
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};
