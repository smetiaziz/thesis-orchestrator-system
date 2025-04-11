
const TimeSlot = require('../models/TimeSlot');
const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');

// @desc    Get all time slots
// @route   GET /api/timeslots
// @access  Private
exports.getTimeSlots = async (req, res, next) => {
  try {
    // Get query parameters for filtering
    const { teacherId, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    if (teacherId) query.teacherId = teacherId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Get time slots with filters if provided
    const timeSlots = await TimeSlot.find(query).populate('teacherId', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: timeSlots.length,
      data: timeSlots
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create time slot
// @route   POST /api/timeslots
// @access  Private
exports.createTimeSlot = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { teacherId, date, startTime, endTime } = req.body;
    
    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }
    
    // Check if time slot overlaps with existing slots for this teacher
    const existingSlot = await TimeSlot.findOne({
      teacherId,
      date: new Date(date),
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
      ]
    });
    
    if (existingSlot) {
      return res.status(400).json({
        success: false,
        error: 'This time slot overlaps with an existing time slot for this teacher'
      });
    }
    
    const timeSlot = await TimeSlot.create({
      teacherId,
      date: new Date(date),
      startTime,
      endTime
    });
    
    res.status(201).json({
      success: true,
      data: timeSlot
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update time slot
// @route   PUT /api/timeslots/:id
// @access  Private
exports.updateTimeSlot = async (req, res, next) => {
  try {
    let timeSlot = await TimeSlot.findById(req.params.id);
    
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }
    
    // Check if user has permission to update - admin or the teacher who owns the time slot
    if (req.user.role !== 'admin' && 
        req.user.role !== 'departmentHead' && 
        timeSlot.teacherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this time slot'
      });
    }
    
    // Check for overlapping time slots if date or time is being updated
    if (req.body.date || req.body.startTime || req.body.endTime) {
      const teacherId = req.body.teacherId || timeSlot.teacherId;
      const date = req.body.date || timeSlot.date;
      const startTime = req.body.startTime || timeSlot.startTime;
      const endTime = req.body.endTime || timeSlot.endTime;
      
      const existingSlot = await TimeSlot.findOne({
        _id: { $ne: req.params.id },
        teacherId,
        date: new Date(date),
        $or: [
          { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
          { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
          { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
        ]
      });
      
      if (existingSlot) {
        return res.status(400).json({
          success: false,
          error: 'This time slot overlaps with an existing time slot for this teacher'
        });
      }
    }
    
    timeSlot = await TimeSlot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: timeSlot
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete time slot
// @route   DELETE /api/timeslots/:id
// @access  Private
exports.deleteTimeSlot = async (req, res, next) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);
    
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }
    
    // Check if user has permission to delete - admin or the teacher who owns the time slot
    if (req.user.role !== 'admin' && 
        req.user.role !== 'departmentHead' && 
        timeSlot.teacherId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this time slot'
      });
    }
    
    await timeSlot.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk create time slots
// @route   POST /api/timeslots/bulk
// @access  Private
exports.bulkCreateTimeSlots = async (req, res, next) => {
  try {
    const { teacherId, slots } = req.body;
    
    if (!teacherId || !slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide teacherId and a valid array of time slots'
      });
    }
    
    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }
    
    // Process and validate each slot
    const processedSlots = [];
    const errors = [];
    
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      
      // Check for required fields
      if (!slot.date || !slot.startTime || !slot.endTime) {
        errors.push({
          index: i,
          error: 'Date, startTime, and endTime are required for each slot'
        });
        continue;
      }
      
      // Check for overlapping slots
      const existingSlot = await TimeSlot.findOne({
        teacherId,
        date: new Date(slot.date),
        $or: [
          { startTime: { $lte: slot.startTime }, endTime: { $gt: slot.startTime } },
          { startTime: { $lt: slot.endTime }, endTime: { $gte: slot.endTime } },
          { startTime: { $gte: slot.startTime }, endTime: { $lte: slot.endTime } }
        ]
      });
      
      if (existingSlot) {
        errors.push({
          index: i,
          error: `Time slot overlaps with existing slot on ${new Date(slot.date).toDateString()} from ${existingSlot.startTime} to ${existingSlot.endTime}`
        });
        continue;
      }
      
      processedSlots.push({
        teacherId,
        date: new Date(slot.date),
        startTime: slot.startTime,
        endTime: slot.endTime
      });
    }
    
    // If there are errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Create all slots
    const createdSlots = await TimeSlot.insertMany(processedSlots);
    
    res.status(201).json({
      success: true,
      count: createdSlots.length,
      data: createdSlots
    });
  } catch (err) {
    next(err);
  }
};
