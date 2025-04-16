
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

// Route files
const auth = require('./routes/authRoutes');
const users = require('./routes/userRoutes');
const departments = require('./routes/departmentRoutes');
const teachers = require('./routes/teacherRoutes');
const topics = require('./routes/topicRoutes');
const juries = require('./routes/juryRoutes');
const imports = require('./routes/importRoutes');
const stats = require('./routes/statsRoutes');
const timeSlots = require('./routes/timeSlotRoutes');
const classrooms = require('./routes/classroomRoutes');
const students = require('./routes/studentRoutes');

const app = express();

// CORS
app.use(cors());

// Body parser
app.use(express.json());

// File uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/departments', departments);
app.use('/api/teachers', teachers);
app.use('/api/topics', topics);
app.use('/api/juries', juries);
app.use('/api/import', imports);
app.use('/api/stats', stats);
app.use('/api/timeslots', timeSlots);
app.use('/api/classrooms', classrooms);
app.use('/api/students', students);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
