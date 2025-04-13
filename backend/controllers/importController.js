const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const PFETopic = require('../models/PFETopic');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter to only allow Excel files
const fileFilter = (req, file, cb) => {
  const filetypes = /xlsx|xls/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only Excel files are allowed'));
  }
};

// Helper function to read Excel file
const readExcelFile = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error) {
    throw new Error(`Error reading Excel file: ${error.message}`);
  }
};

// Helper function to clean up upload
const cleanUp = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error while cleaning up file:', error);
  }
};

// Upload middleware
exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
}).single('file');

// Helper function to send welcome email with credentials
const sendWelcomeEmail = async (email, firstName, lastName, password) => {
  try {
    // Create a test SMTP transporter object
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send email with defined transport object
    await transporter.sendMail({
      from: `"PFE Management System" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Welcome to PFE Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to PFE Management System</h2>
          <p>Hello ${firstName} ${lastName},</p>
          <p>Your account has been created in the PFE Management System.</p>
          <p>Please use the following credentials to log in:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>We recommend that you change your password after your first login.</p>
          <p>Thank you!</p>
        </div>
      `
    });

    console.log(`Welcome email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    return false;
  }
};

// Import PFE Topics
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
        // Check if topic already exists
        const existingTopic = await PFETopic.findOne({
          topicName: row.topicName,
          studentName: row.studentName
        });

        if (existingTopic) {
          // Update existing topic
          await PFETopic.findByIdAndUpdate(existingTopic._id, {
            supervisorId: row.supervisorId,
            supervisorName: row.supervisorName,
            department: row.department,
            studentEmail: row.studentEmail || existingTopic.studentEmail,
            status: row.status || existingTopic.status
          });
        } else {
          // Create new topic
          await PFETopic.create({
            topicName: row.topicName,
            studentName: row.studentName,
            studentEmail: row.studentEmail,
            supervisorId: row.supervisorId,
            supervisorName: row.supervisorName,
            department: row.department,
            status: row.status || 'pending'
          });
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

// Import Teachers
exports.importTeachers = async (req, res, next) => {
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
          password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          
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
