const Jury = require('../models/Jury');
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const TimeSlot = require('../models/TimeSlot');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// @desc    Get all juries
// @route   GET /api/juries
// @access  Private



exports.getJuries = async (req, res, next) => {
  try {
    let query = Jury.find();

    // Conditional population based on query parameter
    if (!req.query.forParticipation) {
      query = query
        .populate('pfeTopicId')
        .populate('supervisorId', 'firstName lastName')
        .populate('presidentId', 'firstName lastName')
        .populate('reporterId', 'firstName lastName');
    } else {
      query = query.populate('pfeTopicId', 'department'); // Only populate necessary fields
    }
    // Filter by department (from PFE topic)
if (req.query.department && req.query.department != "all")  {
      department = await Department.findById(req.query.department);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'Department not found'
        });
      }
      const topics = await PFETopic.find({ department: department.name });
      console.log("topics in getJuries:",topics.length)
      const topicIds = topics.map(topic => topic._id);
      query = query.find({ pfeTopicId: { $in: topicIds } });

    } else{
      console.log("else in getJuries ")
    }

    // Filter by teacher
    if (req.query.teacherId) {
      query = query.find({
        $or: [
          { supervisorId: req.query.teacherId },
          { presidentId: req.query.teacherId },
          { reporterId: req.query.teacherId }
        ]
      });
    }

    // Filter by date
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      query = query.find({
        date: {
          $gte: date,
          $lt: nextDay
        }
      });
    }

    // Filter by status
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }

    const juries = await query.sort({ date: 1, startTime: 1 });
    console.log("juries.length" ,juries.length);
    res.status(200).json({
      success: true,
      count: juries.length,
      data: juries
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dates with scheduled juries
// @route   GET /api/juries/scheduled-dates
// @access  Private
exports.getScheduledDates = async (req, res, next) => {
  try {
    let query = {};
    
    // Filter by department
    if (req.query.department) {
      const topics = await PFETopic.find({ department: req.query.department }).select('_id');
      const topicIds = topics.map(topic => topic._id);
      query.pfeTopicId = { $in: topicIds };
    }
    
    // Get unique dates
    const juries = await Jury.find(query).distinct('date');
    
    // Format dates as strings
    const formattedDates = juries.map(date => date.toISOString().split('T')[0]);
    
    res.status(200).json({
      success: true,
      count: formattedDates.length,
      data: formattedDates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get juries for a specific date
// @route   GET /api/juries/date/:date
// @access  Private
exports.getJuriesByDate = async (req, res, next) => {
  try {
    const dateParam = req.params.date;
    if (!dateParam) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }

    // Create start and end date for the requested day
    const startDate = new Date(`${dateParam}T00:00:00.000Z`);
    const endDate   = new Date(`${dateParam}T23:59:59.999Z`);

    // Base query: juries on this day
    let query = Jury.find({
      date: {
        $gte: startDate,
        $lt:  endDate
      }
    });

    // If a department filter was passed, look it up and constrain by its PFE topics
    let department;
    if (req.query.department) {
      department = await Department.findById(req.query.department);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'Department not found'
        });
      }

      console.log('department found:', department.name);

      // Find all topics for that department
      const topics = await PFETopic
        .find({ department: department.name })
        .select('_id');
      const topicIds = topics.map(t => t._id);

      // Narrow the jury query to only those topics
      query = query.where('pfeTopicId').in(topicIds);
    }

    // Populate, sort, execute
    const juries = await query
      .populate({
        path: 'pfeTopicId',
        select: 'topicName studentName'
      })
      .sort({ startTime: 1 })
      .exec();

    res.status(200).json({
      success: true,
      data: juries
    });
  } catch (err) {
    next(err);
  }
};


// @desc    Get single jury
// @route   GET /api/juries/:id
// @access  Private
exports.getJury = async (req, res, next) => {
  try {
    const jury = await Jury.findById(req.params.id)
      .populate('pfeTopicId')
      .populate('supervisorId', 'firstName lastName')
      .populate('presidentId', 'firstName lastName')
      .populate('reporterId', 'firstName lastName');

    if (!jury) {
      return res.status(404).json({
        success: false,
        error: 'Jury not found'
      });
    }

    res.status(200).json({
      success: true,
      data: jury
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to check teacher availability
const isTeacherAvailable = async (teacherId, date, startTime, endTime, juryId = null) => {
  // Convert date and times to a common format
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  
  // Find any existing jury where this teacher is already participating at the same time
  const existingJury = await Jury.findOne({
    _id: { $ne: juryId }, // Exclude current jury when updating
    date: {
      $gte: new Date(`${dateStr}T00:00:00.000Z`),
      $lt: new Date(`${dateStr}T23:59:59.999Z`)
    },
    $or: [
      { supervisorId: teacherId },
      { presidentId: teacherId },
      { reporterId: teacherId }
    ],
    $and: [
      { 
        $or: [
          { 
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ] 
      }
    ]
  });

  if (existingJury) {
    return false;
  }

  // Check if teacher has marked this time as available
  const availableSlot = await TimeSlot.findOne({
    teacherId,
    date: {
      $gte: new Date(`${dateStr}T00:00:00.000Z`),
      $lt: new Date(`${dateStr}T23:59:59.999Z`)
    },
    startTime: { $lte: startTime },
    endTime: { $gte: endTime }
  });

  // If teacher has submitted availability data, require a matching slot
  const hasSubmittedAvailability = await TimeSlot.findOne({ teacherId });
  return !hasSubmittedAvailability || availableSlot;
};

// @desc    Create jury
// @route   POST /api/juries
// @access  Private (Admin, Department Head)
exports.createJury = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      pfeTopicId,
      supervisorId,
      presidentId,
      reporterId,
      date,
      startTime,
      endTime,
      location
    } = req.body;

    // Check if PFE topic exists
    const topic = await PFETopic.findById(pfeTopicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'PFE Topic not found'
      });
    }

    // Check for faculty member availabilities
    const supervisorAvailable = await isTeacherAvailable(supervisorId, date, startTime, endTime);
    if (!supervisorAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor is not available at the selected time'
      });
    }

    const presidentAvailable = await isTeacherAvailable(presidentId, date, startTime, endTime);
    if (!presidentAvailable) {
      return res.status(400).json({
        success: false,
        error: 'President is not available at the selected time'
      });
    }

    const reporterAvailable = await isTeacherAvailable(reporterId, date, startTime, endTime);
    if (!reporterAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Reporter is not available at the selected time'
      });
    }

    // Create jury
    const jury = await Jury.create(req.body);

    // Update PFE topic status
    await PFETopic.findByIdAndUpdate(pfeTopicId, {
      status: 'scheduled',
      presentationDate: date,
      presentationLocation: location
    });

    // Add jury participation to teachers
    const juryParticipation = [supervisorId, presidentId, reporterId];
    for (let teacherId of juryParticipation) {
      await Teacher.findByIdAndUpdate(
        teacherId,
        { $push: { juryParticipations: jury._id } }
      );
    }

    res.status(201).json({
      success: true,
      data: jury
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update jury
// @route   PUT /api/juries/:id
// @access  Private (Admin, Department Head)
exports.updateJury = async (req, res, next) => {
  try {
    let jury = await Jury.findById(req.params.id);

    if (!jury) {
      return res.status(404).json({
        success: false,
        error: 'Jury not found'
      });
    }

    const {
      pfeTopicId,
      supervisorId,
      presidentId,
      reporterId,
      date,
      startTime,
      endTime,
      location,
      status
    } = req.body;

    // Check availabilities when changing time or members
    if (date && startTime && endTime) {
      const dateToCheck = date || jury.date;
      const startTimeToCheck = startTime || jury.startTime;
      const endTimeToCheck = endTime || jury.endTime;

      // Check for faculty member availabilities
      if (supervisorId && supervisorId !== jury.supervisorId.toString()) {
        const supervisorAvailable = await isTeacherAvailable(
          supervisorId, 
          dateToCheck, 
          startTimeToCheck, 
          endTimeToCheck,
          jury._id
        );
        
        if (!supervisorAvailable) {
          return res.status(400).json({
            success: false,
            error: 'New supervisor is not available at the selected time'
          });
        }

        // Remove from old supervisor's participations
        await Teacher.findByIdAndUpdate(
          jury.supervisorId,
          { $pull: { juryParticipations: jury._id } }
        );

        // Add to new supervisor's participations
        await Teacher.findByIdAndUpdate(
          supervisorId,
          { $push: { juryParticipations: jury._id } }
        );
      }

      if (presidentId && presidentId !== jury.presidentId.toString()) {
        const presidentAvailable = await isTeacherAvailable(
          presidentId, 
          dateToCheck, 
          startTimeToCheck, 
          endTimeToCheck,
          jury._id
        );
        
        if (!presidentAvailable) {
          return res.status(400).json({
            success: false,
            error: 'New president is not available at the selected time'
          });
        }

        // Remove from old president's participations
        await Teacher.findByIdAndUpdate(
          jury.presidentId,
          { $pull: { juryParticipations: jury._id } }
        );

        // Add to new president's participations
        await Teacher.findByIdAndUpdate(
          presidentId,
          { $push: { juryParticipations: jury._id } }
        );
      }

      if (reporterId && reporterId !== jury.reporterId.toString()) {
        const reporterAvailable = await isTeacherAvailable(
          reporterId, 
          dateToCheck, 
          startTimeToCheck, 
          endTimeToCheck,
          jury._id
        );
        
        if (!reporterAvailable) {
          return res.status(400).json({
            success: false,
            error: 'New reporter is not available at the selected time'
          });
        }

        // Remove from old reporter's participations
        await Teacher.findByIdAndUpdate(
          jury.reporterId,
          { $pull: { juryParticipations: jury._id } }
        );

        // Add to new reporter's participations
        await Teacher.findByIdAndUpdate(
          reporterId,
          { $push: { juryParticipations: jury._id } }
        );
      }
    }

    jury = await Jury.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update PFE topic if status or location changed
    if (status || location) {
      await PFETopic.findByIdAndUpdate(jury.pfeTopicId, {
        status: status || jury.status,
        presentationLocation: location || jury.location
      });
    }

    res.status(200).json({
      success: true,
      data: jury
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete jury
// @route   DELETE /api/juries/:id
// @access  Private (Admin, Department Head)
exports.deleteJury = async (req, res, next) => {
  try {
    const jury = await Jury.findById(req.params.id);

    if (!jury) {
      return res.status(404).json({
        success: false,
        error: 'Jury not found'
      });
    }

    // Update PFE topic status
    await PFETopic.findByIdAndUpdate(jury.pfeTopicId, {
      status: 'pending',
      presentationDate: null,
      presentationLocation: null
    });

    // Remove jury participation from teachers
    const teacherIds = [jury.supervisorId, jury.presidentId, jury.reporterId];
    for (let teacherId of teacherIds) {
      await Teacher.findByIdAndUpdate(
        teacherId,
        { $pull: { juryParticipations: jury._id } }
      );
    }

    await jury.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
