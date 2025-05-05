const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Jury = require('../models/Jury');
const Department = require('../models/Department');
const TimeSlot = require('../models/TimeSlot');
// Controller: auto-generate juries without complex scoring
exports.autoGenerateJuries = async (req, res, next) => {
  
  try {
// 1. Avec le constructeur natif Date :
let startGenDate = new Date(req.body.startDate);

// 2. (Optionnel) Vérifier que c’est bien une date valide
if (isNaN(startGenDate.getTime())) {
  return res.status(400).json({
    success: false,
    error: 'Invalid startDate format'
  });
}

// 3. Remettre à minuit (facultatif selon votre logique)
startGenDate.setHours(0, 0, 0, 0);


    const departmentId = req.body.department || req.user.department;
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
      return res.status(400).json({ success: false, error: 'No pending topics' });
    }
    
    const results = {
      total: pendingTopics.length,
      scheduled: 0,
      failed: 0,
      errors: []
    };
    
    // Define default time slots (8 AM to 6 PM, 30 minute intervals)
    console.log("[autoGenerateJuries] Generating default time slots");
    const SLOTS_PER_DAY = (18 - 8) * 2 - 1; // e.g. 19 slots/day
    const daysNeeded = Math.ceil(pendingTopics.length / SLOTS_PER_DAY) + 1;
    console.log(
      `[autoGenerateJuries] daysNeeded = ${daysNeeded} ` +
      `(pendingTopics=${pendingTopics.length}, slotsPerDay=${SLOTS_PER_DAY})`
    );
    const defaultTimeSlots = [];
    for (let day = 0; day < daysNeeded; day++) {
      // Create a new date for each day to avoid mutation
      const date = new Date(startGenDate);
      date.setDate(date.getDate() + day + 1);
    
      // Skip weekends
      if ([0, 6].includes(date.getDay())) continue;
    
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate time slots for this date
      for (let h = 8; h < 18; h++) {
        ['00', '30'].forEach(min => {
          if (h === 17 && min === '30') return; // Skip 17:30
          const start = `${h.toString().padStart(2, '0')}:${min}`;
          const end = min === '30' 
            ? `${(h + 1).toString().padStart(2, '0')}:00`
            : `${h.toString().padStart(2, '0')}:30`;
          defaultTimeSlots.push({ date: dateStr, startTime: start, endTime: end });
        });
      }
    }
    console.log("[autoGenerateJuries] Generated time slots:", defaultTimeSlots.length);
    
    // PRE-LOAD ALL REQUIRED DATA TO AVOID REPEATED QUERIES
    
    // 1. Load all teachers with their supervised projects
    console.log("[autoGenerateJuries] Loading all department teachers");
    const allTeachers = await Teacher.find({ department: departmentName })
      .populate('supervisedProjects');
    console.log("[autoGenerateJuries] Teachers found:", allTeachers.length);
    
    // 2. Load all existing juries for checking conflicts
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // Two weeks ahead
    
    console.log("[autoGenerateJuries] Loading existing juries");
    const existingJuries = await Jury.find({
      date: { $gte: startDate, $lt: endDate }
    });
    console.log("[autoGenerateJuries] Existing juries found:", existingJuries.length);
    
    // 3. Load all teacher availability data at once
    console.log("[autoGenerateJuries] Loading teacher availability");
    const teacherTimeSlots = await TimeSlot.find({
      teacherId: { $in: allTeachers.map(t => t._id) },
      date: { $gte: startDate, $lt: endDate }
    });
    console.log("[autoGenerateJuries] Teacher time slots found:", teacherTimeSlots.length);
    
    // 4. Load all classrooms at once
    console.log("[autoGenerateJuries] Loading classrooms");
    const allClassrooms = await Classroom.find();
    console.log("[autoGenerateJuries] Classrooms found:", allClassrooms.length);
    
    // Create efficient lookup structures
    
    // Create teacher role count map
    const teacherRoleCounts = {};
    allTeachers.forEach(teacher => {
      const supervisedCount = teacher.supervisedProjects?.length || 0;
      
      teacherRoleCounts[teacher._id.toString()] = {
        teacher,
        supervisedCount, // Number of projects supervised (target for other roles)
        supervisor: 0,   // Current supervisor jury count
        president: 0,    // Current president jury count
        reporter: 0      // Current reporter jury count
      };
    });
    
    // Count existing jury participation
    existingJuries.forEach(jury => {
      if (jury.supervisorId) {
        const supId = jury.supervisorId.toString();
        if (teacherRoleCounts[supId]) {
          teacherRoleCounts[supId].supervisor++;
        }
      }
      
      if (jury.presidentId) {
        const presId = jury.presidentId.toString();
        if (teacherRoleCounts[presId]) {
          teacherRoleCounts[presId].president++;
        }
      }
      
      if (jury.reporterId) {
        const repId = jury.reporterId.toString();
        if (teacherRoleCounts[repId]) {
          teacherRoleCounts[repId].reporter++;
        }
      }
    });
    
    // Create a map of teacher availability by date and time
    const teacherAvailability = {};
    
    // If a teacher has submitted any availability, we'll respect it
    const teachersWithSubmittedAvailability = new Set();
    teacherTimeSlots.forEach(slot => {
      teachersWithSubmittedAvailability.add(slot.teacherId.toString());
    });
    
    // Initialize availability for all teachers for all time slots
    allTeachers.forEach(teacher => {
      const teacherId = teacher._id.toString();
      teacherAvailability[teacherId] = {};
      
      defaultTimeSlots.forEach(slot => {
        const dateKey = slot.date;
        if (!teacherAvailability[teacherId][dateKey]) {
          teacherAvailability[teacherId][dateKey] = {};
        }
        
        // Default to available unless teacher has submitted availability data
        const hasSubmittedAvailability = teachersWithSubmittedAvailability.has(teacherId);
        teacherAvailability[teacherId][dateKey][`${slot.startTime}-${slot.endTime}`] = !hasSubmittedAvailability;
      });
    });
    
    // Mark teacher availability based on their submitted time slots
    teacherTimeSlots.forEach(slot => {
      const teacherId = slot.teacherId.toString();
      const dateKey = slot.date.toISOString().split('T')[0];
      
      if (!teacherAvailability[teacherId]) {
        teacherAvailability[teacherId] = {};
      }
      
      if (!teacherAvailability[teacherId][dateKey]) {
        teacherAvailability[teacherId][dateKey] = {};
      }
      
      // Mark all time slots that fall within this availability
      defaultTimeSlots.forEach(timeSlot => {
        if (timeSlot.date === dateKey) {
          const slotStart = timeToMinutes(timeSlot.startTime);
          const slotEnd = timeToMinutes(timeSlot.endTime);
          const availStart = timeToMinutes(slot.startTime);
          const availEnd = timeToMinutes(slot.endTime);
          
          if (slotStart >= availStart && slotEnd <= availEnd) {
            teacherAvailability[teacherId][dateKey][`${timeSlot.startTime}-${timeSlot.endTime}`] = true;
          }
        }
      });
    });
    
    // Mark teachers as unavailable during existing juries
    existingJuries.forEach(jury => {
      const dateKey = jury.date.toISOString().split('T')[0];
      const timeKey = `${jury.startTime}-${jury.endTime}`;
      
      // Mark all teachers in this jury as unavailable
      [jury.supervisorId, jury.presidentId, jury.reporterId].forEach(teacherId => {
        if (teacherId && teacherAvailability[teacherId.toString()]) {
          if (teacherAvailability[teacherId.toString()][dateKey]) {
            teacherAvailability[teacherId.toString()][dateKey][timeKey] = false;
          }
        }
      });
    });
    
    // Create a map of classroom availability by date and time
    const classroomAvailability = {};
    
    // Initialize availability for all classrooms for all time slots
    allClassrooms.forEach(classroom => {
      const classroomId = classroom._id.toString();
      classroomAvailability[classroomId] = {};
      
      defaultTimeSlots.forEach(slot => {
        const dateKey = slot.date;
        if (!classroomAvailability[classroomId][dateKey]) {
          classroomAvailability[classroomId][dateKey] = {};
        }
        
        // Default to available
        classroomAvailability[classroomId][dateKey][`${slot.startTime}-${slot.endTime}`] = true;
      });
    });
    
    // Mark classrooms as unavailable during existing juries
    existingJuries.forEach(jury => {
      const dateKey = jury.date.toISOString().split('T')[0];
      const timeKey = `${jury.startTime}-${jury.endTime}`;
      
      // Find the classroom from the location
      const classroom = allClassrooms.find(c => 
        jury.location === `${c.name} - ${c.building}`
      );
      
      if (classroom) {
        const classroomId = classroom._id.toString();
        if (classroomAvailability[classroomId]?.[dateKey]) {
          classroomAvailability[classroomId][dateKey][timeKey] = false;
        }
      }
    });
    
    // Process each topic for scheduling
    console.log("[autoGenerateJuries] Starting to schedule topics");
    const juriesToCreate = [];
    const topicsToUpdate = [];
    const teacherUpdates = [];
    
    // Helper function to find the best teacher for a role
    const findBestTeacher = (role, supervisorId, date, timeSlot, excludeIds = []) => {
      const excludeSet = new Set(excludeIds.map(id => id.toString()));
      excludeSet.add(supervisorId.toString());
      
      const dateKey = date;
      const timeKey = `${timeSlot.startTime}-${timeSlot.endTime}`;
      
      const eligibleTeachers = allTeachers
        .filter(teacher => {
          const teacherId = teacher._id.toString();
          
          // Exclude specific teachers
          if (excludeSet.has(teacherId)) return false;
          
          // Check availability for this time slot
          return teacherAvailability[teacherId]?.[dateKey]?.[timeKey] === true;
        })
        .map(teacher => {
          const teacherId = teacher._id.toString();
          const roleData = teacherRoleCounts[teacherId];
          
          // Calculate deficit - how many more times this teacher needs to serve in this role
          // compared to their supervised project count
          const deficit = roleData.supervisedCount - roleData[role];
          
          return {
            teacher,
            deficit
          };
        })
        .filter(item => item.deficit > 0) // Only consider teachers who need more of this role
        .sort((a, b) => b.deficit - a.deficit); // Sort by highest deficit first
      
      return eligibleTeachers.length > 0 ? eligibleTeachers[0].teacher : null;
    };
    
    // Helper function to find available classroom
    const findAvailableClassroom = (date, timeSlot) => {
      const dateKey = date;
      const timeKey = `${timeSlot.startTime}-${timeSlot.endTime}`;
      
      return allClassrooms.find(classroom => {
        const classroomId = classroom._id.toString();
        return classroomAvailability[classroomId]?.[dateKey]?.[timeKey] === true;
      });
    };
    
    // Helper function to mark resources as used
    const markResourcesUsed = (date, timeSlot, classroom, supervisor, president, reporter) => {
      const dateKey = date;
      const timeKey = `${timeSlot.startTime}-${timeSlot.endTime}`;
      const classroomId = classroom._id.toString();
      
      // Mark classroom as unavailable
      if (classroomAvailability[classroomId]?.[dateKey]) {
        classroomAvailability[classroomId][dateKey][timeKey] = false;
      }
      
      // Mark teachers as unavailable
      [supervisor, president, reporter].forEach(teacher => {
        const teacherId = teacher._id.toString();
        if (teacherAvailability[teacherId]?.[dateKey]) {
          teacherAvailability[teacherId][dateKey][timeKey] = false;
        }
      });
      
      // Update role counts - increment only the roles being assigned
      // We DON'T increment supervisor count here because supervisors are already
      // determined by their existing projects
      teacherRoleCounts[president._id.toString()].president++;
      teacherRoleCounts[reporter._id.toString()].reporter++;
    };
    
    // Try to schedule each topic
    for (const topic of pendingTopics) {
      console.log("[autoGenerateJuries] Scheduling topic:", topic.topicName);
      try {
        const supervisor = topic.supervisorId;
        let scheduled = false;
        
        for (const slot of defaultTimeSlots) {
          const dateKey = slot.date;
          const timeKey = `${slot.startTime}-${slot.endTime}`;
          
          // Check if supervisor is available
          if (!teacherAvailability[supervisor._id.toString()]?.[dateKey]?.[timeKey]) {
            continue;
          }
          
          // Find president - must be a teacher who needs more president roles to match their supervised count
          const president = findBestTeacher('president', supervisor._id, dateKey, slot);
          if (!president) continue;
          
          // Find reporter - must be a teacher who needs more reporter roles to match their supervised count
          const reporter = findBestTeacher('reporter', supervisor._id, dateKey, slot, [president._id]);
          if (!reporter) continue;
          
          // Find classroom
          const classroom = findAvailableClassroom(dateKey, slot);
          if (!classroom) continue;
          
          console.log("[autoGenerateJuries] Found valid slot for topic", topic.topicName);
          
          // Create jury object for batch insertion
          juriesToCreate.push({
            pfeTopicId: topic._id,
            supervisorId: supervisor._id,
            presidentId: president._id,
            reporterId: reporter._id,
            date: new Date(dateKey),
            startTime: slot.startTime,
            endTime: slot.endTime,
            location: `${classroom.name} - ${classroom.building}`,
            status: 'scheduled'
          });
          
          // Update topic status
          topicsToUpdate.push({
            topicId: topic._id,
            updates: {
              status: 'scheduled',
              presentationDate: new Date(dateKey),
              presentationLocation: `${classroom.name} - ${classroom.building}`
            }
          });
          
          // Track teacher participation updates - for both jury and supervisor roles
          [
            { id: supervisor._id, role: 'supervisor' },
            { id: president._id, role: 'president' },
            { id: reporter._id, role: 'reporter' }
          ].forEach(({ id, role }) => {
            teacherUpdates.push({ teacherId: id, juryId: null }); // Will be filled with actual jury ID after insertion
          });
          
          // Mark resources as used
          markResourcesUsed(dateKey, slot, classroom, supervisor, president, reporter);
          
          scheduled = true;
          results.scheduled++;
          console.log("[autoGenerateJuries] Topic scheduled successfully", topic.topicName);
          break;
        }
        
        if (!scheduled) {
          console.log(
            `[autoGenerateJuries] Could NOT schedule topic "${topic.topicName}". ` +
            `Tried ${defaultTimeSlots.length} slots, ` +
            `teacher deficits:`, 
            teacherRoleCounts[topic.supervisorId.toString()]
          );
           results.failed++;
          results.errors.push(`Could not schedule topic: ${topic.topicName}. No suitable time slot found.`);
        }
      } catch (err) {
        console.error("[autoGenerateJuries] Error scheduling topic", topic.topicName, err);
        results.failed++;
        results.errors.push(`Could not schedule ${topic.topicName}`);
      }
    }
    
    // Batch create juries
    if (juriesToCreate.length > 0) {
      console.log("[autoGenerateJuries] Bulk creating", juriesToCreate.length, "juries");
      const createdJuries = await Jury.insertMany(juriesToCreate);
      
      // Fill in jury IDs for teacher updates
      createdJuries.forEach((jury, index) => {
        teacherUpdates[index * 3].juryId = jury._id;
        teacherUpdates[index * 3 + 1].juryId = jury._id;
        teacherUpdates[index * 3 + 2].juryId = jury._id;
      });
      
      // Batch update topics
      console.log("[autoGenerateJuries] Batch updating", topicsToUpdate.length, "topics");
      const topicUpdatePromises = topicsToUpdate.map(({ topicId, updates }) => 
        PFETopic.findByIdAndUpdate(topicId, updates)
      );
      await Promise.all(topicUpdatePromises);
      
      // Batch update teachers
      console.log("[autoGenerateJuries] Batch updating teacher participations");
      const teacherUpdatePromises = teacherUpdates.map(({ teacherId, juryId }) => 
        Teacher.findByIdAndUpdate(
          teacherId,
          { $push: { juryParticipations: juryId } }
        )
      );
      await Promise.all(teacherUpdatePromises);
    }
    
    console.log("[autoGenerateJuries] Final teacher role counts after scheduling:]");
Object.values(teacherRoleCounts).forEach(({ teacher, supervisedCount, reporter, president }) => {
  console.log(
    `  • ${teacher.name || teacher._id}: supervised=${supervisedCount}, ` +
    `reporter=${reporter}, president=${president}`
  );
});
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to convert time string to minutes for easier comparison
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
