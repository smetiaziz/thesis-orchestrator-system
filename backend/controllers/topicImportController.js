
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
    
    if (!data.length) {
      return res.status(400).json({
        success: false,
        error: 'Excel file is empty'
      });
    }

    // Validate required columns
    const requiredColumns = ['topicName', 'studentName', 'supervisorId', 'department'];
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
        // Find supervisor by ID or create a mapping for them
        let supervisorId = row.supervisorId;
        let supervisorName = row.supervisorName;
        
        if (!supervisorId && row.supervisorEmail) {
          // Try to find supervisor by email
          const supervisor = await Teacher.findOne({ email: row.supervisorEmail });
          if (supervisor) {
            supervisorId = supervisor._id;
            supervisorName = `${supervisor.firstName} ${supervisor.lastName}`;
          }
        }
        
        if (!supervisorId) {
          importResults.errors.push({
            row: row.topicName,
            error: 'Supervisor ID or email is required'
          });
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
            supervisorId: supervisorId,
            supervisorName: supervisorName || row.supervisorName,
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
            supervisorId: supervisorId,
            supervisorName: supervisorName || row.supervisorName,
            department: row.department,
            status: row.status || 'pending'
          });
          
          // Update teacher's supervisedProjects
          await Teacher.findByIdAndUpdate(
            supervisorId,
            { $addToSet: { supervisedProjects: newTopic._id } }
          );
        }

        importResults.imported++;
      } catch (error) {
        importResults.errors.push({
          row: row.topicName,
          error: error.message
        });
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
