
const TimeSlot = require('../models/TimeSlot');
const { validationResult } = require('express-validator');

// @desc    Get time slots for a teacher
// @route   GET /api/timeslots
// @access  Private
exports.getTimeSlots = async (req, res, next) => {
  try {
    let query = {};

    // Filter by teacher ID
    if (req.query.teacherId) {
      query.teacherId = req.query.teacherId;
    } else if (req.user.role === 'teacher') {
      // If teacher is logged in, only show their own time slots
      const teacherObj = await Teacher.findOne({ userId: req.user.id });
      if (teacherObj) {
        query.teacherId = teacherObj._id;
      }
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      query.date = {
        $gte: date,
        $lt: nextDay
      };
    }

    const timeSlots = await TimeSlot.find(query).sort({ date: 1, startTime: 1 });

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
// @access  Private (Teacher, Admin, Department Head)
exports.createTimeSlot = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if teacher can create this time slot
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || teacher._id.toString() !== req.body.teacherId) {
        return res.status(403).json({
          success: false,
          error: 'You can only add time slots for yourself'
        });
      }
    }

    // Check for overlapping time slots
    const { teacherId, date, startTime, endTime } = req.body;
    
    const dateObj = new Date(date);
    const overlap = await TimeSlot.findOne({
      teacherId,
      date: {
        $gte: new Date(dateObj.setHours(0, 0, 0)),
        $lt: new Date(dateObj.setHours(23, 59, 59))
      },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        error: 'This time slot overlaps with an existing one'
      });
    }

    const timeSlot = await TimeSlot.create(req.body);

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
// @access  Private (Teacher, Admin, Department Head)
exports.updateTimeSlot = async (req, res, next) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }

    // Check if teacher can update this time slot
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || teacher._id.toString() !== timeSlot.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own time slots'
        });
      }
    }

    // Check for overlapping time slots
    if (req.body.startTime || req.body.endTime) {
      const startTime = req.body.startTime || timeSlot.startTime;
      const endTime = req.body.endTime || timeSlot.endTime;
      
      const dateObj = new Date(timeSlot.date);
      const overlap = await TimeSlot.findOne({
        _id: { $ne: req.params.id },
        teacherId: timeSlot.teacherId,
        date: {
          $gte: new Date(dateObj.setHours(0, 0, 0)),
          $lt: new Date(dateObj.setHours(23, 59, 59))
        },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      if (overlap) {
        return res.status(400).json({
          success: false,
          error: 'This time slot would overlap with an existing one'
        });
      }
    }

    const updatedTimeSlot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedTimeSlot
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete time slot
// @route   DELETE /api/timeslots/:id
// @access  Private (Teacher, Admin, Department Head)
exports.deleteTimeSlot = async (req, res, next) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Time slot not found'
      });
    }

    // Check if teacher can delete this time slot
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || teacher._id.toString() !== timeSlot.teacherId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete your own time slots'
        });
      }
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
// @access  Private (Teacher, Admin, Department Head)
exports.bulkCreateTimeSlots = async (req, res, next) => {
  try {
    const { timeSlots } = req.body;
    
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid time slots data'
      });
    }
    
    // Check if teacher can create these time slots
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: 'Teacher profile not found'
        });
      }
      
      const invalidSlots = timeSlots.filter(
        slot => slot.teacherId !== teacher._id.toString()
      );
      
      if (invalidSlots.length > 0) {
        return res.status(403).json({
          success: false,
          error: 'You can only add time slots for yourself'
        });
      }
    }
    
    const createdSlots = [];
    const errors = [];
    
    for (const slot of timeSlots) {
      try {
        // Check for overlapping time slots
        const { teacherId, date, startTime, endTime } = slot;
        
        const dateObj = new Date(date);
        const overlap = await TimeSlot.findOne({
          teacherId,
          date: {
            $gte: new Date(dateObj.setHours(0, 0, 0)),
            $lt: new Date(dateObj.setHours(23, 59, 59))
          },
          $or: [
            {
              startTime: { $lt: endTime },
              endTime: { $gt: startTime }
            }
          ]
        });

        if (overlap) {
          errors.push(`Time slot (${date}, ${startTime}-${endTime}) overlaps with an existing one`);
          continue;
        }
        
        const timeSlot = await TimeSlot.create(slot);
        createdSlots.push(timeSlot);
      } catch (err) {
        errors.push(`Error creating time slot: ${err.message}`);
      }
    }
    
    res.status(201).json({
      success: true,
      count: createdSlots.length,
      data: createdSlots,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    next(err);
  }
};
