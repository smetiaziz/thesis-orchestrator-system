
// This file is now just a re-export of specific import controllers
// Individual import controllers contain the actual implementation

// Re-export specific import controllers
const { importTopics } = require('./topicImportController');
const { importTeachers } = require('./teacherImportController');

exports.importTopics = importTopics;
exports.importTeachers = importTeachers;
