
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { readExcelFile, cleanUp } = require('../utils/fileUtils');
const { sendWelcomeEmail } = require('../utils/emailUtils');

// @desc    Import teachers from Excel
// @route   POST /api/import/teachers
// @access  Private (Admin, Department Head)
exports.importTeachers = async (req, res, next) => {
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
        error: 'Please provide valid teachers data'
      });
    }

    // Validate required columns
    const requiredColumns = ['firstName', 'lastName', 'email', 'department', 'rank'];
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
      errors: [],
      emailsSent: 0
    };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const row of data) {
        // Check if user already exists with this email
        let user = await User.findOne({ email: row.email });
        let newAccount = false;
        let password = "";
        
        if (!user) {
          // Generate a random password
          password = crypto.randomBytes(8).toString('hex');
          
          // Create new user with teacher role
          user = await User.create([{
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            role: 'teacher',
            department: row.department,
            password: password
          }], { session });
          
          user = user[0]; // Extract the user from the array
          newAccount = true;
        }

        // Check if teacher record already exists
        let teacher = await Teacher.findOne({ email: row.email });
        
        if (teacher) {
          // Update existing teacher
          await Teacher.findByIdAndUpdate(teacher._id, {
            userId: user._id,
            firstName: row.firstName,
            lastName: row.lastName,
            department: row.department,
            rank: row.rank,
            course: row.course || 0,
            td: row.td || 0,
            tp: row.tp || 0,
            coefficient: row.coefficient || 1,
            numSupervisionSessions: row.numSupervisionSessions || 0
          }, { session });
        } else {
          // Create new teacher
          await Teacher.create([{
            userId: user._id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            department: row.department,
            rank: row.rank,
            course: row.course || 0,
            td: row.td || 0,
            tp: row.tp || 0,
            coefficient: row.coefficient || 1,
            numSupervisionSessions: row.numSupervisionSessions || 0
          }], { session });
        }

        // Send welcome email to newly created accounts
        if (newAccount) {
          const emailSent = await sendWelcomeEmail(row.email, row.firstName, row.lastName, password);
          if (emailSent) {
            importResults.emailsSent++;
          }
        }

        importResults.imported++;
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
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
