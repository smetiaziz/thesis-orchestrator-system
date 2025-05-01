
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const Jury = require('../models/Jury');
const TimeSlot = require('../models/TimeSlot');

// @desc    Get department dashboard stats
// @route   GET /api/stats/department/:departmentName
// @access  Private (Admin, Department Head)
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const department = req.params.departmentName;
    
    if (!department) {
      return res.status(400).json({
        success: false,
        error: 'Department is required'
      });
    }
    
    // Get total topics count
    const totalTopics = await PFETopic.countDocuments({ department });
    
    // Get scheduled presentations count
    const scheduledPresentations = await PFETopic.countDocuments({ 
      department,
      status: 'scheduled'
    });
    
    // Get pending presentations count
    const pendingPresentations = await PFETopic.countDocuments({ 
      department,
      status: 'pending'
    });
    
    // Get total teachers count
    const totalTeachers = await Teacher.countDocuments({ department });
    
    // Get teachers without availability data
    const teachersWithAvailability = await TimeSlot.distinct('teacherId');
    const allTeachers = await Teacher.find({ department }).select('_id');
    const teacherIds = allTeachers.map(teacher => teacher._id.toString());
    const teachersWithoutAvailability = teacherIds.filter(
      id => !teachersWithAvailability.map(id => id.toString()).includes(id)
    ).length;
    
    // Check for scheduling conflicts
    const juries = await Jury.find({
      date: { $gte: new Date() }
    }).populate('pfeTopicId');
    
    const juriesByDepartment = juries.filter(
      jury => jury.pfeTopicId && jury.pfeTopicId.department === department
    );
    
    const teacherSchedules = {};
    let schedulingConflicts = 0;
    
    for (const jury of juriesByDepartment) {
      const date = jury.date.toISOString().split('T')[0];
      const teachers = [jury.supervisorId, jury.presidentId, jury.reporterId].map(id => id.toString());
      
      for (const teacherId of teachers) {
        if (!teacherSchedules[teacherId]) {
          teacherSchedules[teacherId] = {};
        }
        
        if (!teacherSchedules[teacherId][date]) {
          teacherSchedules[teacherId][date] = [];
        }
        
        const timeRange = {
          start: jury.startTime,
          end: jury.endTime,
          juryId: jury._id
        };
        
        // Check for conflicts with existing schedules
        for (const existing of teacherSchedules[teacherId][date]) {
          if (
            (timeRange.start >= existing.start && timeRange.start < existing.end) ||
            (timeRange.end > existing.start && timeRange.end <= existing.end) ||
            (timeRange.start <= existing.start && timeRange.end >= existing.end)
          ) {
            schedulingConflicts++;
            break;
          }
        }
        
        teacherSchedules[teacherId][date].push(timeRange);
      }
    }
    
    // Get upcoming presentations
    const today = new Date();
    const upcomingPresentations = await Jury.find({
      date: { $gte: today }
    })
      .populate('pfeTopicId')
      .populate('supervisorId', 'firstName lastName')
      .populate('presidentId', 'firstName lastName')
      .populate('reporterId', 'firstName lastName')
      .sort({ date: 1, startTime: 1 })
      .limit(5);
    
    // Filter presentations for this department
    const filteredPresentations = upcomingPresentations
      .filter(jury => jury.pfeTopicId && jury.pfeTopicId.department === department)
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
        upcomingPresentations: filteredPresentations
      }
    });
  } catch (err) {
    next(err);
  }
};
