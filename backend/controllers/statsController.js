
const { getDepartmentStats } = require('./departmentStatsController');
const { getScheduleReport } = require('./scheduleReportController');
const { getParticipationReport } = require('./participationReportController');

module.exports = {
  getDepartmentStats,
  getScheduleReport,
  getParticipationReport
};
