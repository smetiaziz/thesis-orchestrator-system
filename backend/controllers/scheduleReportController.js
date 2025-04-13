
const Jury = require('../models/Jury');

// @desc    Generate schedule report for export
// @route   GET /api/stats/reports/schedule
// @access  Private (Admin, Department Head)
exports.getScheduleReport = async (req, res, next) => {
  try {
    const { date, department } = req.query;
    
    let query = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.date = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const juries = await Jury.find(query)
      .populate({
        path: 'pfeTopicId',
        select: 'topicName studentName department'
      })
      .populate('supervisorId', 'firstName lastName')
      .populate('presidentId', 'firstName lastName')
      .populate('reporterId', 'firstName lastName')
      .sort({ date: 1, startTime: 1 });
    
    // Filter by department if specified
    const filteredJuries = department
      ? juries.filter(jury => jury.pfeTopicId && jury.pfeTopicId.department === department)
      : juries;
    
    const formattedJuries = filteredJuries.map(jury => ({
      date: jury.date.toISOString().split('T')[0],
      startTime: jury.startTime,
      endTime: jury.endTime,
      location: jury.location,
      topicName: jury.pfeTopicId ? jury.pfeTopicId.topicName : 'N/A',
      studentName: jury.pfeTopicId ? jury.pfeTopicId.studentName : 'N/A',
      department: jury.pfeTopicId ? jury.pfeTopicId.department : 'N/A',
      supervisor: `${jury.supervisorId.firstName} ${jury.supervisorId.lastName}`,
      president: `${jury.presidentId.firstName} ${jury.presidentId.lastName}`,
      reporter: `${jury.reporterId.firstName} ${jury.reporterId.lastName}`,
      status: jury.status
    }));
    
    res.status(200).json({
      success: true,
      data: formattedJuries
    });
  } catch (err) {
    next(err);
  }
};
