
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const { readExcelFile, cleanUp } = require('../utils/fileUtils');

// @desc    Import PFE Topics from Excel file
// @route   POST /api/import/topics
// @access  Private (Admin, Department Head)
exports.importTopics = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const data = readExcelFile(req.file.path);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid topics data'
      });
    }

    // Validate required columns
    const requiredColumns = ['topicName', 'studentName', 'supervisorEmail', 'department'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length) {
      return res.status(400).json({
        success: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Process data
    const importResults = {
      total: data.length,
      imported: 0,
      errors: []
    };

    for (const row of data) {
      try {
        // Find supervisor by email
        let supervisor = await Teacher.findOne({ email: row.supervisorEmail });
        
        if (!supervisor) {
          importResults.errors.push(
            `Supervisor with email ${row.supervisorEmail} not found for topic "${row.topicName}"`
          );
          continue;
        }

        // Check if topic already exists
        const existingTopic = await PFETopic.findOne({
          topicName: row.topicName,
          studentName: row.studentName
        });

        if (existingTopic) {
          // Update existing topic
          await PFETopic.findByIdAndUpdate(existingTopic._id, {
            supervisorId: supervisor._id,
            supervisorName: `${supervisor.firstName} ${supervisor.lastName}`,
            department: row.department,
            studentEmail: row.studentEmail || existingTopic.studentEmail,
            status: row.status || existingTopic.status
          });
        } else {
          // Create new topic
          const newTopic = await PFETopic.create({
            topicName: row.topicName,
            studentName: row.studentName,
            studentEmail: row.studentEmail,
            supervisorId: supervisor._id,
            supervisorName: `${supervisor.firstName} ${supervisor.lastName}`,
            department: row.department,
            status: row.status || 'pending'
          });
          
          // Update teacher's supervisedProjects
          await Teacher.findByIdAndUpdate(
            supervisor._id,
            { $addToSet: { supervisedProjects: newTopic._id } }
          );
        }

        importResults.imported++;
      } catch (error) {
        importResults.errors.push(
          `Error with topic "${row.topicName}": ${error.message}`
        );
      }
    }

    // Clean up the uploaded file
    cleanUp(req.file.path);

    res.status(200).json({
      success: true,
      data: importResults
    });
  } catch (error) {
    // Clean up the uploaded file
    if (req.file) {
      cleanUp(req.file.path);
    }
    
    next(error);
  }
};
