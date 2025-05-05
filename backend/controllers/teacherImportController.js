const Teacher = require('../models/Teacher');
const User = require('../models/User');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { readExcelFile, cleanUp } = require('../utils/fileUtils');
const { sendWelcomeEmail } = require('../utils/emailUtils');

// @desc    Import Teachers from Excel file
// @route   POST /api/import/teachers
// @access  Private (Admin, Department Head)
exports.importTeachers = async (req, res, next) => {
  // Start a session for transaction support
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const data = await readExcelFile(req.file.path);
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide valid teachers data' });
    }

    // Validate required columns
    const requiredColumns = ['firstName', 'lastName', 'email', 'department', 'rank'];
    const validationErrors = [];
    data.forEach((row, idx) => {
      const missing = requiredColumns.filter(col => !(col in row));
      if (missing.length) {
        validationErrors.push(`Row ${idx + 1}: missing columns – ${missing.join(', ')}`);
      }
      if (!row.email) {
        validationErrors.push(`Row ${idx + 1}: email is required`);
      }
    });
    if (validationErrors.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, error: 'Validation errors', details: validationErrors });
    }

    // Check for duplicate emails in file
    const emails = data.map(row => row.email.toLowerCase().trim());
    const uniqueEmails = new Set(emails);
    if (uniqueEmails.size !== emails.length) {
      const dupEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
      const dupErrors = dupEmails.map(email => 
        `Duplicate email ${email} found in rows ${emails.reduce((acc, e, i) => e === email ? [...acc, i + 1] : acc, []).join(', ')}`
      );
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, error: 'Duplicate emails found', details: dupErrors });
    }

    const importResults = {
      total: data.length,
      imported: 0,
      errors: [],
      emailsSent: 0,
      failedRows: []
    };

    // Batch process: first get all existing users and teachers by email
    const existingUsers = await User.find({ email: { $in: emails } }).lean().session(session);
    const existingTeachers = await Teacher.find({ email: { $in: emails } }).lean().session(session);
    
    // Create maps for quick lookups (normalize email keys to lowercase)
    const userMap = existingUsers.reduce((map, user) => {
      map[user.email.toLowerCase().trim()] = user;
      return map;
    }, {});
    
    const teacherMap = existingTeachers.reduce((map, teacher) => {
      map[teacher.email.toLowerCase().trim()] = teacher;
      return map;
    }, {});

    // Arrays to store new users/teachers and updates
    const newUsers = [];
    const newTeachers = [];
    const userUpdates = [];
    const teacherUpdates = [];
    const emailQueue = [];

    // Process data and prepare operations
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const email = row.email.toLowerCase().trim();
        
        // Generate a secure random password for new accounts
        //const password = crypto.randomBytes(4).toString('hex');
        const password = '$2a$10$y6UsKt0CN.sMPOVg96ApFudotEr.Y1ver4LeA.FWmNw6TFcLeJO4i';
        // Handle user creation/update
        const existingUser = userMap[email];
        let userId;
        
        if (existingUser) {
          // Update existing user
          userId = existingUser._id;
          userUpdates.push({
            updateOne: {
              filter: { _id: existingUser._id },
              update: { 
                $set: { 
                  password: password,
                  role: 'teacher', 
                  department: row.department 
                } 
              }
            }
          });
        } else {
          // Create new user
          const newUser = new User({
            email: email,
            firstName: row.firstName,
            lastName: row.lastName,
            role: 'teacher',
            department: row.department,
            password: password
          });
          
          // Add to list of users to save
          newUsers.push(newUser);
          userId = newUser._id;
          
          // Queue welcome email
          emailQueue.push({
            email: email,
            firstName: row.firstName,
            lastName: row.lastName,
            password
          });
        }
        
        // Handle teacher creation/update
        const teacherData = {
          userId: userId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: email,
          department: row.department,
          rank: row.rank,
          course: row.course ?? 0,
          td: row.td ?? 0,
          tp: row.tp ?? 0,
          coefficient: row.coefficient ?? 1,
          numSupervisionSessions: row.numSupervisionSessions ?? 0
        };
        
        const existingTeacher = teacherMap[email];
        if (existingTeacher) {
          teacherUpdates.push({
            updateOne: {
              filter: { _id: existingTeacher._id },
              update: { $set: teacherData }
            }
          });
        } else {
          const newTeacher = new Teacher(teacherData);
          newTeachers.push(newTeacher);
        }
        
        importResults.imported++;
      } catch (errRow) {
        const message = errRow.message || 'Unknown error';
        importResults.errors.push(`Row ${i + 1}: ${message}`);
        importResults.failedRows.push({ rowNumber: i + 1, rowData: data[i], error: message });
      }
    }

    // Execute operations
    // Save new users first to ensure they exist before creating teachers
    if (newUsers.length > 0) {
      const savedUsers = await User.insertMany(newUsers, { session });
      console.log(`${savedUsers.length} new users created`);
    }
    
    // Process user updates
    if (userUpdates.length > 0) {
      const userUpdateResult = await User.bulkWrite(userUpdates, { session });
      console.log(`${userUpdateResult.modifiedCount} users updated`);
    }
    
    // Save new teachers
    if (newTeachers.length > 0) {
      const savedTeachers = await Teacher.insertMany(newTeachers, { session });
      console.log(`${savedTeachers.length} new teachers created`);
    }
    
    // Process teacher updates
    if (teacherUpdates.length > 0) {
      const teacherUpdateResult = await Teacher.bulkWrite(teacherUpdates, { session });
      console.log(`${teacherUpdateResult.modifiedCount} teachers updated`);
    }
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Send welcome emails in parallel (outside transaction)
    if (emailQueue.length > 0) {
      const emailPromises = emailQueue.map(({ email, firstName, lastName, password }) => 
        sendWelcomeEmail(email, firstName, lastName, password)
      );
      
      const emailResults = await Promise.allSettled(emailPromises);
      importResults.emailsSent = emailResults.filter(result => result.status === 'fulfilled' && result.value).length;
    }

    // Clean up file
    cleanUp(req.file.path);

    // Respond with detailed results
    return res.status(200).json({ 
      success: true, 
      data: {
        ...importResults,
        newUsers: newUsers.length,
        updatedUsers: userUpdates.length,
        newTeachers: newTeachers.length,
        updatedTeachers: teacherUpdates.length
      }
    });
  } catch (error) {
    console.error('Import teachers error:', error);
    
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    
    if (req.file) cleanUp(req.file.path);
    
    return res.status(500).json({
      success: false,
      error: 'Teacher import failed',
      message: error.message || 'An unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};