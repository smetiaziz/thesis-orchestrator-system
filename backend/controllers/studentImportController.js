
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { readExcelFile, cleanUp } = require('../utils/fileUtils');

// @desc    Import students from Excel
// @route   POST /api/import/students
// @access  Private (Admin, Teacher)
exports.importStudents = async (req, res, next) => {
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
        error: 'Please provide valid students data'
      });
    }

    // Validate required columns
    const requiredColumns = ['firstName', 'lastName', 'inscrNumber', 'subject', 'field'];
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
      emailsCreated: 0
    };

    // Find the teacher who is importing students
    let supervisorId = req.body.supervisorId;
    let department = req.body.department;
    
    // If no supervisor ID provided, use the logged-in user if they are a teacher
    if (!supervisorId && req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ email: req.user.email });
      if (teacher) {
        supervisorId = teacher._id;
        department = teacher.department;
      }
    }

    for (const row of data) {
      try {
        // Generate email if not provided
        let email = row.email;
        if (!email && row.inscrNumber) {
          email = `${row.inscrNumber.toLowerCase()}@student.example.com`;
        }
        
        // Check if student already exists
        let student = await Student.findOne({ inscrNumber: row.inscrNumber });
        
        if (student) {
          // Update existing student
          student = await Student.findByIdAndUpdate(
            student._id,
            {
              firstName: row.firstName,
              lastName: row.lastName,
              subject: row.subject,
              field: row.field,
              email: email,
              supervisorId: supervisorId,
              department: department || row.department
            },
            { new: true }
          );
        } else {
          // Create new student
          student = await Student.create({
            firstName: row.firstName,
            lastName: row.lastName,
            inscrNumber: row.inscrNumber,
            subject: row.subject,
            field: row.field,
            email: email,
            supervisorId: supervisorId,
            department: department || row.department
          });
        }

        // Create a user account if email is provided
        if (email) {
          const existingUser = await User.findOne({ email });
          
          if (!existingUser) {
            // Generate a temporary password
            const tempPassword = 'password';
            
            await User.create({
              firstName: row.firstName,
              lastName: row.lastName,
              email: email,
              password: tempPassword,
              role: 'student',
              department: department || row.department
            });
            
            importResults.emailsCreated++;
          }
        }

        importResults.imported++;
      } catch (error) {
        importResults.errors.push({
          row: `${row.firstName} ${row.lastName}`,
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
