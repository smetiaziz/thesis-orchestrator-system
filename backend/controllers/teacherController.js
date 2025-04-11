
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

// @desc    Import teachers from Excel/JSON
// @route   POST /api/teachers/import
// @access  Private (Admin)
exports.importTeachers = async (req, res, next) => {
  try {
    const { teachers } = req.body;
    
    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid teachers data'
      });
    }
    
    const importedTeachers = [];
    const errors = [];
    
    for (let i = 0; i < teachers.length; i++) {
      const teacherData = teachers[i];
      
      try {
        // Check if teacher exists
        const existingTeacher = await Teacher.findOne({ email: teacherData.email });
        
        if (existingTeacher) {
          // Update existing teacher
          const updatedTeacher = await Teacher.findOneAndUpdate(
            { email: teacherData.email },
            teacherData,
            { new: true, runValidators: true }
          );
          importedTeachers.push(updatedTeacher);
        } else {
          // Create user account if it doesn't exist
          let user = await User.findOne({ email: teacherData.email });
          
          if (!user) {
            user = await User.create({
              firstName: teacherData.firstName,
              lastName: teacherData.lastName,
              email: teacherData.email,
              password: 'password', // Default password
              role: 'teacher',
              department: teacherData.department
            });
          }
          
          // Create new teacher
          const newTeacher = await Teacher.create({
            ...teacherData,
            userId: user._id
          });
          
          importedTeachers.push(newTeacher);
        }
      } catch (err) {
        errors.push(`Teacher ${i+1}: ${err.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      count: importedTeachers.length,
      data: importedTeachers,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    next(err);
  }
};
