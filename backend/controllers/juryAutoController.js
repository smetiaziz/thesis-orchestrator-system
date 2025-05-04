const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Jury = require('../models/Jury');
const Department = require('../models/Department');
const TimeSlot = require('../models/TimeSlot');

// Helper: check if a teacher is available at a given slot
const isTeacherAvailable = async (teacherId, date, startTime, endTime) => {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;

  // Check existing juries
  const conflict = await Jury.findOne({
    date: { $gte: new Date(`${dateStr}T00:00:00.000Z`), $lt: new Date(`${dateStr}T23:59:59.999Z`) },
    $or: [ { supervisorId: teacherId }, { presidentId: teacherId }, { reporterId: teacherId } ],
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  });
  if (conflict) return false;

  // Check explicit availability slots
  const availCount = await TimeSlot.countDocuments({ teacherId });
  if (availCount === 0) return true; // no availability data → assume available

  const availableSlot = await TimeSlot.findOne({
    teacherId,
    date: { $gte: new Date(`${dateStr}T00:00:00.000Z`), $lt: new Date(`${dateStr}T23:59:59.999Z`) },
    startTime: { $lte: startTime },
    endTime: { $gte: endTime }
  });

  return !!availableSlot;
};

// Helper: find an available classroom
const findAvailableClassroom = async (date, startTime, endTime) => {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  const classrooms = await Classroom.find();
  for (const room of classrooms) {
    const conflict = await Jury.findOne({
      date: { $gte: new Date(`${dateStr}T00:00:00.000Z`), $lt: new Date(`${dateStr}T23:59:59.999Z`) },
      location: `${room.name} - ${room.building}`,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });
    if (!conflict) return room;
  }
  return null;
};

// Controller: auto-generate juries without complex scoring
exports.autoGenerateJuries = async (req, res, next) => {
  
  try {
    const departmentId = req.body.department || req.user.department;
    const department = await Department.findById(departmentId);
    if (!department) return res.status(400).json({ success: false, error: 'Department not found' });
    const deptName = department.name;

    // Fetch pending topics
    const pendingTopics = await PFETopic.find({ department: deptName, status: 'pending' })
      .populate('supervisorId');
    if (pendingTopics.length === 0) {
      return res.status(400).json({ success: false, error: 'No pending topics' });
    }

    // Build time slots (next 2 weekdays)
    const defaultTimeSlots = [];
    for (let d = 1; d <= 2; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      if ([0,6].includes(date.getDay())) continue;
      const dateStr = date.toISOString().split('T')[0];
      for (let h = 8; h < 18; h++) {
        ['00','30'].forEach(min => {
          if (h === 17 && min === '30') return;
          const start = `${h.toString().padStart(2,'0')}:${min}`;
          const end = min === '30'
            ? `${(h+1).toString().padStart(2,'0')}:00`
            : `${h.toString().padStart(2,'0')}:30`;
          defaultTimeSlots.push({ date: dateStr, startTime: start, endTime: end });
        });
      }
    }
 // Compute supervised count for each teacher
    const supervisedCount = {};
    pendingTopics.forEach(t => {
      const sid = t.supervisorId._id.toString();
      supervisedCount[sid] = (supervisedCount[sid] || 0) + 1;
    });

    // Preload all department teachers
    const allTeachers = await Teacher.find({ department: deptName }).select('_id').lean();

    // Initialize max assignment limits
    const maxPresidentMap = {};
    const maxReporterMap = {};
    allTeachers.forEach(t => {
      const id = t._id.toString();
      maxPresidentMap[id] = supervisedCount[id] !== undefined ? supervisedCount[id] : Infinity;
      maxReporterMap[id] = supervisedCount[id] !== undefined ? supervisedCount[id] : Infinity;
    });

    // Initialize role counters for all teachers
    const assignedPresident = {};
    const assignedReporter = {};
    allTeachers.forEach(t => {
      const id = t._id.toString();
      assignedPresident[id] = 0;
      assignedReporter[id] = 0;
    });

    // Helper: pick a teacher for a role with improved max handling
    async function pickRole(roleMap, maxRoleMap, excludeIds, slot) {
      const candidates = [];
      for (const t of allTeachers) {
        const id = t._id.toString();
        if (excludeIds.includes(id)) continue;
        const currentCount = roleMap[id] || 0;
        const maxAllowed = maxRoleMap[id] !== undefined ? maxRoleMap[id] : Infinity;
        if (currentCount >= maxAllowed) continue;

        const free = await isTeacherAvailable(t._id, slot.date, slot.startTime, slot.endTime);
        if (!free) continue;
        
        candidates.push({ id, used: currentCount });
      }
      // Prioritize teachers with the least assignments
      candidates.sort((a, b) => a.used - b.used);
      return candidates.length ? candidates[0].id : null;
    }

    const results = { total: pendingTopics.length, scheduled: 0, failed: 0, errors: [] };
    
    // Schedule each topic
    for (const topic of pendingTopics) {
      const supId = topic.supervisorId._id.toString();
      let success = false;

      for (const slot of defaultTimeSlots) {
        // Check supervisor availability
        const supFree = await isTeacherAvailable(topic.supervisorId._id, slot.date, slot.startTime, slot.endTime);
        if (!supFree) continue;

        // Find president and reporter
        const presId = await pickRole(assignedPresident, maxPresidentMap, [supId], slot);
        if (!presId) continue;
        const repId = await pickRole(assignedReporter, maxReporterMap, [supId, presId], slot);
        if (!repId) continue;

        // Find classroom
        const room = await findAvailableClassroom(slot.date, slot.startTime, slot.endTime);
        if (!room) continue;

        // Create jury
        await Jury.create({
          pfeTopicId: topic._id,
          supervisorId: supId,
          presidentId: presId,
          reporterId: repId,
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: `${room.name} - ${room.building}`,
          status: 'scheduled'
        });

        // Update topic status
        await PFETopic.findByIdAndUpdate(topic._id, {
          status: 'scheduled',
          presentationDate: new Date(slot.date),
          presentationLocation: `${room.name} - ${room.building}`
        });

        // Update counters
        assignedPresident[presId]++;
        assignedReporter[repId]++;

        success = true;
        results.scheduled++;
        break;
      }

      if (!success) {
        results.failed++;
        results.errors.push(`Could not schedule ${topic.topicName}`);
      }
    }

    return res.status(200).json({ success: true, data: results });

  } catch (err) {
    next(err);
  }
};