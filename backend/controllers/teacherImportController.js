const Teacher = require('../models/Teacher');
const User = require('../models/User');
const crypto = require('crypto');
const { readExcelFile, cleanUp } = require('../utils/fileUtils');
const { sendWelcomeEmail } = require('../utils/emailUtils');

// @desc    Import Teachers from Excel file
// @route   POST /api/import/teachers
// @access  Private (Admin, Department Head)
exports.importTeachers = async (req, res, next) => {
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
      return res.status(400).json({ success: false, error: 'Validation errors', details: validationErrors });
    }

    // Check for duplicate emails in file
    const seen = new Set();
    const dupErrors = [];
    data.forEach((row, idx) => {
      if (seen.has(row.email)) {
        dupErrors.push(`Row ${idx + 1}: duplicate email ${row.email}`);
      } else {
        seen.add(row.email);
      }
    });
    if (dupErrors.length) {
      return res.status(400).json({ success: false, error: 'Duplicate emails found', details: dupErrors });
    }

    const importResults = {
      total: data.length,
      imported: 0,
      errors: [],
      emailsSent: 0,
      failedRows: []
    };

    // Process each row sequentially
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Find or create user
        let user = await User.findOne({ email: row.email });
        let newAccount = false;
        let password = '';

        if (!user) {
          password = crypto.randomBytes(8).toString('hex');
          user = new User({ ...row, role: 'teacher', password });
          await user.save();
          newAccount = true;
        } else {
          user.role = 'teacher';
          user.department = row.department;
          await user.save();
        }

        // Find or update teacher
        const teacherData = {
          userId: user._id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          department: row.department,
          rank: row.rank,
          course: row.course ?? 0,
          td: row.td ?? 0,
          tp: row.tp ?? 0,
          coefficient: row.coefficient ?? 1,
          numSupervisionSessions: row.numSupervisionSessions ?? 0
        };

        let teacher = await Teacher.findOne({ email: row.email });
        if (teacher) {
          await Teacher.findByIdAndUpdate(teacher._id, teacherData);
        } else {
          teacher = new Teacher(teacherData);
          await teacher.save();
        }

        // Send welcome email for new accounts
        if (newAccount) {
          const sent = await sendWelcomeEmail(row.email, row.firstName, row.lastName, password);
          if (sent) importResults.emailsSent++;
        }

        importResults.imported++;
      } catch (errRow) {
        const message = errRow.message || 'Unknown error';
        importResults.errors.push(`Row ${i + 1}: ${message}`);
        importResults.failedRows.push({ rowNumber: i + 1, rowData: row, error: message });
      }
    }

    // Clean up file
    cleanUp(req.file.path);

    // Respond with detailed results
    return res.status(200).json({ success: true, data: importResults });
  } catch (error) {
    if (req.file) cleanUp(req.file.path);
    next(error);
  }
};
