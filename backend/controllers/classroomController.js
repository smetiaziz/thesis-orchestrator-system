
const Classroom = require('../models/Classroom');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private (Admin, Department Head)
exports.getClassrooms = async (req, res, next) => {
  try {
    let query = Classroom.find();
    
    // Filter by department
    if (req.query.department != "all") {
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
    
    // Filter by building
    if (req.query.building) {
      query = query.find({ building: req.query.building });
    }
    
    // Filter by capacity
    if (req.query.minCapacity) {
      query = query.find({ capacity: { $gte: parseInt(req.query.minCapacity) } });
    }
    
    const classrooms = await query.sort({ building: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single classroom
// @route   GET /api/classrooms/:id
// @access  Private (Admin, Department Head)
exports.getClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: classroom
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create classroom with department ID validation
// @route   POST /api/classrooms
// @access  Private
exports.createClassroom = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // ✅ Validate department by ID
    const department = await Department.findById(req.body.department);
    if (!department) {
      return res.status(400).json({
        success: false,
        error: 'Department does not exist'
      });
    }

    // ✅ Replace department ID with name
    req.body.department = department.name;

    const classroom = await Classroom.create(req.body);

    res.status(201).json({
      success: true,
      data: classroom
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
// @access  Private (Admin, Department Head)
exports.updateClassroom = async (req, res, next) => {
  try {
    let classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }
    
    classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: classroom
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private (Admin, Department Head)
exports.deleteClassroom = async (req, res, next) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }
    
    await classroom.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get buildings
// @route   GET /api/classrooms/buildings
// @access  Private (Admin, Department Head)
exports.getBuildings = async (req, res, next) => {
  try {
    let query = {};
    
    // Filter by department
    if (req.query.department) {
      query.department = req.query.department;
    }
    
    const buildings = await Classroom.distinct('building', query);
    
    res.status(200).json({
      success: true,
      count: buildings.length,
      data: buildings
    });
  } catch (err) {
    next(err);
  }
};
