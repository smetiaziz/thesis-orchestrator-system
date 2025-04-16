
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Jury = require('../models/Jury');
const TimeSlot = require('../models/TimeSlot');

// Helper function to check teacher availability
const isTeacherAvailable = async (teacherId, date, startTime, endTime) => {
  // Convert date and times to a common format
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  
  // Find any existing jury where this teacher is already participating at the same time
  const existingJury = await Jury.findOne({
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

// Helper function to calculate teacher participation score
// This helps ensure fair distribution of jury duties
const calculateParticipationScore = (teacher) => {
  const supervisedCount = teacher.supervisedProjects.length;
  const juryCount = teacher.juryParticipations.length;
  
  // Ideal ratio is 3 jury participations for each supervised project
  const idealJuryCount = supervisedCount * 3;
  const participationDeficit = idealJuryCount - juryCount;
  
  return participationDeficit;
};

// Helper function to find suitable teachers for jury roles
const findSuitableTeachers = async (supervisorId, department, date, startTime, endTime, excludeIds = []) => {
  // Get all teachers from the same department
  const teachers = await Teacher.find({ 
    department,
    _id: { $nin: [supervisorId, ...excludeIds] }
  });
  
  // Filter available teachers and sort by participation score
  const availableTeachers = [];
  
  for (const teacher of teachers) {
    const available = await isTeacherAvailable(teacher._id, date, startTime, endTime);
    
    if (available) {
      const score = calculateParticipationScore(teacher);
      availableTeachers.push({
        teacher,
        score
      });
    }
  }
  
  // Sort by participation score (higher deficit first)
  availableTeachers.sort((a, b) => b.score - a.score);
  
  return availableTeachers.map(item => item.teacher);
};

// Helper function to find available classroom
const findAvailableClassroom = async (department, date, startTime, endTime) => {
  // Get all classrooms for this department
  const classrooms = await Classroom.find({ department });
  
  // Check each classroom for availability
  for (const classroom of classrooms) {
    // Check if there's a jury scheduled at the same time in this classroom
    const existingJury = await Jury.findOne({
      date: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lt: new Date(`${date}T23:59:59.999Z`)
      },
      location: classroom.name + ' - ' + classroom.building,
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
    
    if (!existingJury) {
      return classroom;
    }
  }
  
  return null;
};

// @desc    Auto-generate juries
// @route   POST /api/juries/auto-generate
// @access  Private (Admin, Department Head)
exports.autoGenerateJuries = async (req, res, next) => {
  try {
    const department = req.query.department || req.user.department;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        error: 'Department is required'
      });
    }
    
    // Get all pending PFE topics for this department
    const pendingTopics = await PFETopic.find({
      department,
      status: 'pending'
    }).populate('supervisorId');
    
    if (pendingTopics.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending topics found for this department'
      });
    }
    
    const results = {
      total: pendingTopics.length,
      scheduled: 0,
      failed: 0,
      errors: []
    };
    
    // Define default time slots (8 AM to 6 PM, 30 minute intervals)
    const defaultTimeSlots = [];
    for (let day = 0; day < 5; day++) { // Monday to Friday
      const date = new Date();
      date.setDate(date.getDate() + ((day + 1) % 7) + 1); // Next week, starting Monday
      date.setHours(0, 0, 0, 0);
      
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === 17 && minute === 30) continue; // Skip 5:30 PM
          
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const endHour = minute === 30 ? hour + 1 : hour;
          const endMinute = minute === 30 ? 0 : 30;
          const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
          
          defaultTimeSlots.push({
            date: date.toISOString().split('T')[0],
            startTime,
            endTime
          });
        }
      }
    }
    
    // Try to schedule each topic
    for (const topic of pendingTopics) {
      try {
        // Get the supervisor
        const supervisor = topic.supervisorId;
        
        // Try each time slot until we find a suitable one
        let scheduled = false;
        
        for (const slot of defaultTimeSlots) {
          // Check supervisor availability
          const supervisorAvailable = await isTeacherAvailable(
            supervisor._id, 
            slot.date, 
            slot.startTime, 
            slot.endTime
          );
          
          if (!supervisorAvailable) continue;
          
          // Find president
          const presidents = await findSuitableTeachers(
            supervisor._id,
            department,
            slot.date,
            slot.startTime,
            slot.endTime
          );
          
          if (presidents.length === 0) continue;
          const president = presidents[0];
          
          // Find reporter
          const reporters = await findSuitableTeachers(
            supervisor._id,
            department,
            slot.date,
            slot.startTime,
            slot.endTime,
            [president._id]
          );
          
          if (reporters.length === 0) continue;
          const reporter = reporters[0];
          
          // Find classroom
          const classroom = await findAvailableClassroom(
            department,
            slot.date,
            slot.startTime,
            slot.endTime
          );
          
          if (!classroom) continue;
          
          // We have all the required elements, create the jury
          const jury = await Jury.create({
            pfeTopicId: topic._id,
            supervisorId: supervisor._id,
            presidentId: president._id,
            reporterId: reporter._id,
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            location: classroom.name + ' - ' + classroom.building,
            status: 'scheduled'
          });
          
          // Update PFE topic status
          await PFETopic.findByIdAndUpdate(topic._id, {
            status: 'scheduled',
            presentationDate: new Date(slot.date),
            presentationLocation: classroom.name + ' - ' + classroom.building
          });
          
          // Add jury participation to teachers
          const juryParticipation = [supervisor._id, president._id, reporter._id];
          for (let teacherId of juryParticipation) {
            await Teacher.findByIdAndUpdate(
              teacherId,
              { $push: { juryParticipations: jury._id } }
            );
          }
          
          scheduled = true;
          results.scheduled++;
          break;
        }
        
        if (!scheduled) {
          results.failed++;
          results.errors.push(`Could not schedule topic: ${topic.topicName}. No suitable time slot found.`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error scheduling topic ${topic.topicName}: ${err.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    next(err);
  }
};
