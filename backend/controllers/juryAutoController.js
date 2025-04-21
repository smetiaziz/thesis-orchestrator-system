
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Jury = require('../models/Jury');
const TimeSlot = require('../models/TimeSlot');
const Department = require('../models/Department');
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

  const availabilityCount = await TimeSlot.countDocuments({ teacherId });
  if (availabilityCount === 0) {
    // no availability data → default to “available”
    return true;
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

// Helper function to calculate teacher participation score based on quota
const calculateParticipationScore = async (teacher) => {
  // Get supervised projects count
  const supervisedCount = teacher.supervisedProjects?.length || 0;
  
  // Get existing jury participations
  const juryParticipations = teacher.juryParticipations?.length || 0;
  
  // Count roles separately (president and reporter)
  const presidentRoles = await Jury.countDocuments({ presidentId: teacher._id });
  const reporterRoles = await Jury.countDocuments({ reporterId: teacher._id });
  
  // Calculate quotas
  const totalRequiredParticipations = supervisedCount * 3; // 1 supervisor + 1 president + 1 reporter
  const requiredPresidentRoles = supervisedCount;
  const requiredReporterRoles = supervisedCount;
  
  // Calculate deficits (higher means more need to participate in this role)
  const totalDeficit = Math.max(0, totalRequiredParticipations - juryParticipations);
  const presidentDeficit = Math.max(0, requiredPresidentRoles - presidentRoles);
  const reporterDeficit = Math.max(0, requiredReporterRoles - reporterRoles);
  
  return {
    totalDeficit,
    presidentDeficit,
    reporterDeficit,
    // Combined score - weighted to prioritize role balancing
    score: totalDeficit * 2 + presidentDeficit * 3 + reporterDeficit * 3
  };
};

// Helper function to find suitable teachers for jury roles
const findSuitableTeachers = async (role, supervisorId, departmentName, date, startTime, endTime, excludeIds = []) => {
  // Get all teachers from the same department
  const teachers = await Teacher  .find({
    department: departmentName,
    _id: { $nin: [supervisorId, ...excludeIds] }
  }).populate('supervisedProjects').populate('juryParticipations');

  console.log("teachers in the findSuitableTeachers",teachers.length) 

  // Filter available teachers and sort by participation score
  const availableTeachers = [];
  
  for (const teacher of teachers) {
    const available = await isTeacherAvailable(teacher._id, date, startTime, endTime);
    
    if (available) {
      const participationData = await calculateParticipationScore(teacher);
      
      // Adjust score based on role
      let roleScore = participationData.score;
      if (role === 'president') {
        roleScore += participationData.presidentDeficit * 5; // Prioritize president deficit
      } else if (role === 'reporter') {
        roleScore += participationData.reporterDeficit * 5; // Prioritize reporter deficit
      }
      
      availableTeachers.push({
        teacher,
        roleScore,
        totalScore: participationData.score
      });
    }
  }
  
  // Sort by role-specific score (higher deficit first)
  availableTeachers.sort((a, b) => b.roleScore - a.roleScore);
  
  return availableTeachers.map(item => item.teacher);
};

// Helper function to find available classroom
const findAvailableClassroom = async ( date, startTime, endTime) => {
  // Get all classrooms for this department
  const classrooms = await Classroom.find();
  console.log("classrooms in findAvailableClassroom:", classrooms.length)
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
    console.log("[autoGenerateJuries] Invoked");

    // Get department ID from request
    const departmentId = req.body.department || req.user.department;
    console.log("[autoGenerateJuries] Department ID:", departmentId);

    // Get full department document
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    const departmentName = department.name;
    console.log("[autoGenerateJuries] Department Name:", departmentName);
    // Get all pending PFE topics for this department
    console.log("[autoGenerateJuries] Fetching pending topics for department");
    const pendingTopics = await PFETopic.find({
      department: departmentName,
      status: 'pending'
    }).populate('supervisorId');
    console.log("[autoGenerateJuries] Pending topics found:", pendingTopics.length);
    

    if (pendingTopics.length === 0) {
      console.log("[autoGenerateJuries] No pending topics, returning 400");
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
    console.log("[autoGenerateJuries] Generating default time slots");
    const defaultTimeSlots = [];
    for (let day = 0; day < 2; day++) { // Extend to two weeks
      const date = new Date();
      date.setDate(date.getDate() + day + 1); // Starting tomorrow
      date.setHours(0, 0, 0, 0);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue; 
      
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
    console.log("[autoGenerateJuries] Generated time slots:", defaultTimeSlots.length);
    
    // First load all teachers' current participation data
    console.log("[autoGenerateJuries] Loading department teachers");
    const departmentTeachers = await Teacher.find({ 
      department: departmentName  
    }).populate('supervisedProjects juryParticipations');
    console.log("[autoGenerateJuries] Teachers found:", departmentTeachers.length);
      
    // Sort topics by supervisor participation deficit
    console.log("[autoGenerateJuries] Calculating participation scores for supervisors");
    const topicsWithPriority = await Promise.all(pendingTopics.map(async (topic) => {
      let supervisorScore = 0;
      
      if (topic.supervisorId) {
        const supervisor = departmentTeachers.find(
          t => t._id.toString() === topic.supervisorId._id.toString()
        );
        
        if (supervisor) {
          const participationData = await calculateParticipationScore(supervisor);
          supervisorScore = participationData.totalDeficit;
        }
      }
      return { topic, supervisorScore };
    }));
    console.log("[autoGenerateJuries] Topics with priority:", topicsWithPriority.length);
    
    // Sort by supervisor score (higher deficit first)
    topicsWithPriority.sort((a, b) => b.supervisorScore - a.supervisorScore);
    
    // Try to schedule each topic
    for (const { topic } of topicsWithPriority) {
      console.log("[autoGenerateJuries] Scheduling topic:", topic.topicName);
      try {
        const supervisor = topic.supervisorId;
        let scheduled = false;
        
        for (const slot of defaultTimeSlots) {
          console.log("[autoGenerateJuries] Checking slot", slot);
          const supervisorAvailable = await isTeacherAvailable(
            supervisor._id, 
            slot.date, 
            slot.startTime, 
            slot.endTime
          );
          if (!supervisorAvailable) continue;
          
          const presidents = await findSuitableTeachers(
            'president', supervisor._id, departmentName,
            slot.date, slot.startTime, slot.endTime
          );
          if (presidents.length === 0) continue;
          const president = presidents[0];
          
          const reporters = await findSuitableTeachers(
            'reporter', supervisor._id, departmentName,
            slot.date, slot.startTime, slot.endTime,
            [president._id]
          );
          if (reporters.length === 0) continue;
          const reporter = reporters[0];
          
          const classroom = await findAvailableClassroom(
         slot.date, slot.startTime, slot.endTime
          );
         console.log('[autoGenerateJuries]  classrooms found ', classroom)
          if (!classroom) continue;
          
          console.log("[autoGenerateJuries] Found valid slot for topic", topic.topicName);
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
          
          console.log("[autoGenerateJuries] Created jury", jury._id);
          await PFETopic.findByIdAndUpdate(topic._id, {
            status: 'scheduled',
            presentationDate: new Date(slot.date),
            presentationLocation: classroom.name + ' - ' + classroom.building
          });
          
          for (let teacherId of [supervisor._id, president._id, reporter._id]) {
            await Teacher.findByIdAndUpdate(
              teacherId,
              { $push: { juryParticipations: jury._id } }
            );
            console.log("[autoGenerateJuries] Updated teacher participation for", teacherId);
          }
          
          scheduled = true;
          results.scheduled++;
          console.log("[autoGenerateJuries] Topic scheduled successfully", topic.topicName);
          break;
        }
        
        if (!scheduled) {
          console.log("[autoGenerateJuries] Failed to schedule", topic.topicName);
          results.failed++;
          results.errors.push(`Could not schedule topic: ${topic.topicName}. No suitable time slot found.`);
        }
      } catch (err) {
        console.error("[autoGenerateJuries] Error scheduling topic", topic.topicName, err);
        results.failed++;
        results.errors.push(`Error scheduling topic ${topic.topicName}: ${err.message}`);
      }
    }

    console.log("[autoGenerateJuries] Final results:", results);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error("[autoGenerateJuries] Unhandled error:", err);
    next(err);
  }
};

