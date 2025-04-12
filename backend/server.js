
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const topicRoutes = require('./routes/topicRoutes');
const juryRoutes = require('./routes/juryRoutes');
const timeSlotRoutes = require('./routes/timeSlotRoutes');
const importRoutes = require('./routes/importRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/juries', juryRoutes);
app.use('/api/timeslots', timeSlotRoutes);
app.use('/api/import', importRoutes);
app.use('/api/stats', statsRoutes);

// Create default department head account if it doesn't exist
const User = require('./models/User');
const Department = require('./models/Department');

const createDefaultDepartmentHead = async () => {
  try {
    // Check if department head exists
    const existingUser = await User.findOne({ email: 'depthead@example.com' });
    
    if (!existingUser) {
      console.log('Creating default department head account...');
      
      // Create department head user
      const user = await User.create({
        firstName: 'Department',
        lastName: 'Head',
        email: 'depthead@example.com',
        password: 'password123', // This should be changed in production
        role: 'departmentHead',
        department: 'Computer Science'
      });
      
      // Check if department exists or create it
      let department = await Department.findOne({ name: 'Computer Science' });
      
      if (!department) {
        department = await Department.create({
          name: 'Computer Science',
          headId: user._id
        });
      } else {
        // Update department with head ID if it exists but has no head
        if (!department.headId) {
          department.headId = user._id;
          await department.save();
        }
      }
      
      console.log('Default department head account created:');
      console.log('Email: depthead@example.com');
      console.log('Password: password123');
    }
  } catch (err) {
    console.error('Error creating default department head:', err);
  }
};

// Call the function
createDefaultDepartmentHead();

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
