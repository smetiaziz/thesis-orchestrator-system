
const { upload } = require('../utils/fileUtils');
const { importTopics } = require('./topicImportController');

// Export the upload middleware and import functions
exports.upload = upload;
exports.importTopics = importTopics;
