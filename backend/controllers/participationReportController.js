
const Teacher = require('../models/Teacher');

// @desc    Get teacher participation report
// @route   GET /api/stats/reports/participation
// @access  Private (Admin, Department Head)
exports.getParticipationReport = async (req, res, next) => {
  try {
    const { department } = req.query;
    
    let query = {};
    if (department) {
      query.department = department;
    }
    
    const teachers = await Teacher.find(query)
      .populate('supervisedProjects')
      .populate('juryParticipations');
    
    const formattedTeachers = teachers.map(teacher => {
      const supervisedCount = teacher.supervisedProjects.length;
      const participationCount = teacher.juryParticipations.length;
      const requiredParticipations = Math.max(supervisedCount * 3, 0);
      const percentage = requiredParticipations ? Math.round((participationCount / requiredParticipations) * 100) : 100;
      
      let status;
      if (percentage < 100) {
        status = 'Under Quota';
      } else if (percentage === 100) {
        status = 'Met Quota';
      } else {
        status = 'Exceeded Quota';
      }
      
      return {
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        department: teacher.department,
        supervisedCount,
        participationCount,
        requiredParticipations,
        percentage,
        status
      };
    });
    
    // Sort by participation percentage
    formattedTeachers.sort((a, b) => a.percentage - b.percentage);
    
    res.status(200).json({
      success: true,
      data: formattedTeachers
    });
  } catch (err) {
    next(err);
  }
};
