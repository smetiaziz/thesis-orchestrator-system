
const Department = require('../models/Department');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().populate('headId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate('headId', 'firstName lastName email');

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res, next) => {
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

    // If headId is provided, verify the user exists and is a departmentHead
    if (headId) {
      const user = await User.findById(headId);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found for department head'
        });
      }

      // Update user role to departmentHead if not already
      if (user.role !== 'departmentHead') {
        await User.findByIdAndUpdate(headId, { role: 'departmentHead' });
      }
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
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
exports.updateDepartment = async (req, res, next) => {
  try {
    const { name, headId } = req.body;
    
    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // If changing department head, verify the user exists and update roles
    if (headId && headId !== department.headId?.toString()) {
      // Verify new head exists
      const newHead = await User.findById(headId);
      if (!newHead) {
        return res.status(400).json({
          success: false,
          error: 'User not found for new department head'
        });
      }

      // Update new head's role
      if (newHead.role !== 'departmentHead') {
        await User.findByIdAndUpdate(headId, { role: 'departmentHead' });
      }

      // If there was a previous head, check if we need to remove their role
      if (department.headId) {
        // Check if previous head is head of any other department
        const otherDepartments = await Department.find({ 
          headId: department.headId,
          _id: { $ne: department._id }
        });

        if (otherDepartments.length === 0) {
          // Not a head of any other department, can be reverted to default role if needed
          // This might be a policy decision - here we're keeping them as departmentHead
        }
      }
    }

    department = await Department.findByIdAndUpdate(
      req.params.id, 
      { name, headId },
      { new: true, runValidators: true }
    ).populate('headId', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Remove departmentHead role if not assigned to other departments
    if (department.headId) {
      const otherDepartments = await Department.find({ 
        headId: department.headId,
        _id: { $ne: department._id }
      });

      if (otherDepartments.length === 0) {
        // Not a head of any other department
        // Note: Here, we're making a design decision to not automatically change the user's role
      }
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a department head account
// @route   POST /api/departments/create-head
// @access  Private (Admin)
exports.createDepartmentHead = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, departmentName } = req.body;

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create the user with departmentHead role
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'departmentHead',
      department: departmentName
    });

    // Create or update department with this head
    let department = await Department.findOne({ name: departmentName });
    
    if (department) {
      // Update existing department with new head
      department = await Department.findByIdAndUpdate(
        department._id,
        { headId: user._id },
        { new: true }
      );
    } else {
      // Create new department with this head
      department = await Department.create({
        name: departmentName,
        headId: user._id
      });
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        department
      }
    });
  } catch (err) {
    next(err);
  }
};
