
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const fs = require('fs');

// Helper function to convert Excel file to JSON
const excelToJson = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error(`Error parsing Excel file: ${error.message}`);
  }
};

// @desc    Import teachers from Excel
// @route   POST /api/import/teachers
// @access  Private (Admin, Department Head)
exports.importTeachers = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No Excel file uploaded'
      });
    }

    // Convert Excel file to JSON
    const teachers = excelToJson(req.file.path);
    
    // Clean up file after processing
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid teachers data'
      });
    }

    // Validate required fields in teacher data
    const requiredFields = ['firstName', 'lastName', 'email', 'department', 'rank'];
    const missingFields = [];
    
    for (const teacher of teachers) {
      const missing = requiredFields.filter(field => !teacher[field]);
      if (missing.length > 0) {
        missingFields.push(`Row with email ${teacher.email || 'unknown'} is missing: ${missing.join(', ')}`);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid data format: ${missingFields.join('; ')}`
      });
    }
    
    const importedTeachers = [];
    const errors = [];
    
    // Create a transporter object for sending emails
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    for (let i = 0; i < teachers.length; i++) {
      const teacherData = teachers[i];
      
      try {
        // Check if teacher exists
        const existingTeacher = await Teacher.findOne({ email: teacherData.email });
        
        if (existingTeacher) {
          // Update existing teacher
          const updatedTeacher = await Teacher.findOneAndUpdate(
            { email: teacherData.email },
            teacherData,
            { new: true, runValidators: true }
          );
          importedTeachers.push(updatedTeacher);
        } else {
          // Create user account if it doesn't exist
          let user = await User.findOne({ email: teacherData.email });
          
          if (!user) {
            // Generate a random password
            const generatedPassword = crypto.randomBytes(8).toString('hex');
            
            user = await User.create({
              firstName: teacherData.firstName,
              lastName: teacherData.lastName,
              email: teacherData.email,
              password: generatedPassword,
              role: 'teacher',
              department: teacherData.department
            });
            
            // Send email with credentials
            const mailOptions = {
              from: process.env.EMAIL_FROM,
              to: teacherData.email,
              subject: 'Your New Account',
              text: `Hello ${teacherData.firstName} ${teacherData.lastName},\n\nAn account has been created for you. Your login details are:\n\nEmail: ${teacherData.email}\nPassword: ${generatedPassword}\n\nPlease change your password after logging in.\n\nRegards,\nAdmin`,
              html: `<p>Hello ${teacherData.firstName} ${teacherData.lastName},</p><p>An account has been created for you. Your login details are:</p><p><strong>Email:</strong> ${teacherData.email}<br><strong>Password:</strong> ${generatedPassword}</p><p>Please change your password after logging in.</p><p>Regards,<br>Admin</p>`
            };
            
            try {
              await transporter.sendMail(mailOptions);
            } catch (emailErr) {
              console.error('Failed to send email:', emailErr);
              // Continue with the import even if email fails
            }
          }
          
          // Create new teacher
          const newTeacher = await Teacher.create({
            ...teacherData,
            userId: user._id
          });
          
          importedTeachers.push(newTeacher);
        }
      } catch (err) {
        errors.push(`Teacher ${i+1} (${teacherData.email || 'unknown'}): ${err.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      count: importedTeachers.length,
      data: importedTeachers,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Import error:', err);
    next(err);
  }
};
