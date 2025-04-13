
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const Jury = require('../models/Jury');
const TimeSlot = require('../models/TimeSlot');

// @desc    Get department dashboard statistics
// @route   GET /api/stats/department/:departmentName
// @access  Private (Admin, Department Head)
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const { departmentName } = req.params;
    
    // Get total topics
    const totalTopics = await PFETopic.countDocuments({ department: departmentName });
    
    // Get scheduled presentations
    const scheduledPresentations = await PFETopic.countDocuments({ 
      department: departmentName,
      status: 'scheduled'
    });
    
    // Get pending presentations
    const pendingPresentations = await PFETopic.countDocuments({ 
      department: departmentName,
      status: 'pending'
    });
    
    // Get total teachers
    const totalTeachers = await Teacher.countDocuments({ department: departmentName });
    
    // Get teachers without availability
    const teachersWithAvailability = await TimeSlot.distinct('teacherId');
    const allTeacherIds = await Teacher.distinct('_id', { department: departmentName });
    
    const teachersWithoutAvailability = allTeacherIds.filter(
      teacherId => !teachersWithAvailability.some(id => id.equals(teacherId))
    ).length;
    
    // Get scheduling conflicts
    const juries = await Jury.find({})
      .populate({
        path: 'pfeTopicId',
        match: { department: departmentName }
      })
      .populate('supervisorId')
      .populate('presidentId')
      .populate('reporterId');
    
    // Filter out juries from other departments
    const departmentJuries = juries.filter(jury => jury.pfeTopicId);
    
    // Check for scheduling conflicts
    let schedulingConflicts = 0;
    
    for (let i = 0; i < departmentJuries.length; i++) {
      const jury1 = departmentJuries[i];
      
      for (let j = i + 1; j < departmentJuries.length; j++) {
        const jury2 = departmentJuries[j];
        
        // Skip if not on the same date
        if (jury1.date.toDateString() !== jury2.date.toDateString()) {
          continue;
        }
        
        // Check for time overlap
        const jury1Start = jury1.startTime;
        const jury1End = jury1.endTime;
        const jury2Start = jury2.startTime;
        const jury2End = jury2.endTime;
        
        if (jury1Start < jury2End && jury1End > jury2Start) {
          // Check for same faculty member in both juries
          const jury1Teachers = [
            jury1.supervisorId._id.toString(),
            jury1.presidentId._id.toString(),
            jury1.reporterId._id.toString()
          ];
          
          const jury2Teachers = [
            jury2.supervisorId._id.toString(),
            jury2.presidentId._id.toString(),
            jury2.reporterId._id.toString()
          ];
          
          const commonTeachers = jury1Teachers.filter(teacher => jury2Teachers.includes(teacher));
          
          if (commonTeachers.length > 0) {
            schedulingConflicts++;
            break; // Count each jury with conflict only once
          }
        }
      }
    }
    
    // Get upcoming presentations (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingJuries = await Jury.find({
      date: { $gte: today, $lte: nextWeek }
    })
    .populate({
      path: 'pfeTopicId',
      match: { department: departmentName },
      select: 'topicName studentName'
    })
    .sort({ date: 1, startTime: 1 })
    .limit(5);
    
    // Filter out juries from other departments and format the result
    const upcomingPresentations = upcomingJuries
      .filter(jury => jury.pfeTopicId)
      .map(jury => ({
        _id: jury._id,
        topicName: jury.pfeTopicId.topicName,
        studentName: jury.pfeTopicId.studentName,
        date: jury.date,
        startTime: jury.startTime,
        location: jury.location
      }));
    
    res.status(200).json({
      success: true,
      data: {
        totalTopics,
        scheduledPresentations,
        pendingPresentations,
        totalTeachers,
        teachersWithoutAvailability,
        schedulingConflicts,
        upcomingPresentations
      }
    });
  } catch (err) {
    next(err);
  }
};
