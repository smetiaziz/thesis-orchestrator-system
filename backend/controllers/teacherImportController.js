
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @desc    Import teachers from Excel/JSON
// @route   POST /api/teachers/import
// @access  Private (Admin)
exports.importTeachers = async (req, res, next) => {
  try {
    const { teachers } = req.body;
    
    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid teachers data'
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
        errors.push(`Teacher ${i+1}: ${err.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      count: importedTeachers.length,
      data: importedTeachers,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    next(err);
  }
};
