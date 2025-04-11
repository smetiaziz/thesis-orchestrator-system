
# PFE Scheduling System

A comprehensive system for managing Final Year Project (PFE) presentations, jury assignments, and scheduling.

## Features

- User authentication with role-based access control (Admin, Department Head, Teacher, Student)
- Department management
- Teacher profiles and availability management
- PFE topic submission and management
- Jury assignment with validation of constraints
- Scheduling of presentations
- Real-time updates and notifications

## Project Structure

The project consists of two main parts:
- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn-ui components
- **Backend**: Node.js with Express, MongoDB, and JWT authentication

## Prerequisites

Before setting up this project, make sure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)
- Git (optional, for cloning the repository)

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd pfe-scheduling-system
```

### Step 2: Set Up the Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the provided `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB connection string and JWT secret:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pfe-scheduling
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=30d
```

5. Start the backend server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend API should now be running at http://localhost:5000.

### Step 3: Set Up the Frontend

1. Open a new terminal and navigate to the project root directory.

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

The frontend application should now be running at http://localhost:5173.

## Testing the Application

### Login Credentials

Use the following demo accounts to test different roles:

- **Admin**:
  - Email: admin@university.edu
  - Password: password

- **Department Head**:
  - Email: head@university.edu
  - Password: password

- **Teacher**:
  - Email: teacher@university.edu
  - Password: password

- **Student**:
  - Email: student@university.edu
  - Password: password

### Key Features to Test

1. **User Authentication**:
   - Login with different roles
   - View role-specific dashboards

2. **Department Management** (Admin):
   - Create, view, and edit departments
   - Assign department heads

3. **Teacher Management** (Admin, Department Head):
   - Add and manage teacher profiles
   - Import teacher data

4. **PFE Topic Management** (Admin, Department Head):
   - Create and manage PFE topics
   - Assign supervisors to topics

5. **Availability Management** (Teachers):
   - Set available time slots for presentations

6. **Jury Assignment** (Admin, Department Head):
   - Create juries following the business rules
   - Ensure proper role distribution

7. **Scheduling** (Admin, Department Head):
   - Schedule presentations based on availability
   - View and manage the presentation calendar

8. **Reporting** (Admin, Department Head):
   - Generate reports on participation and schedules

## API Documentation

The backend API is structured as follows:

- **Authentication**: `/api/auth`
  - POST `/register` - Register a new user
  - POST `/login` - Login user
  - GET `/me` - Get current logged-in user

- **Users**: `/api/users`
  - GET `/` - Get all users (admin only)
  - GET `/:id` - Get single user (admin only)
  - POST `/` - Create new user (admin only)
  - PUT `/:id` - Update user (admin only)
  - DELETE `/:id` - Delete user (admin only)

- **Departments**: `/api/departments`
  - GET `/` - Get all departments
  - POST `/` - Create new department (admin only)
  - PUT `/:id` - Update department (admin only)
  - DELETE `/:id` - Delete department (admin only)

- **Teachers**: `/api/teachers`
  - GET `/` - Get all teachers
  - POST `/` - Create new teacher (admin, departmentHead)
  - PUT `/:id` - Update teacher (admin, departmentHead)
  - DELETE `/:id` - Delete teacher (admin)
  - POST `/import` - Import teachers from data (admin)

- **PFE Topics**: `/api/topics`
  - GET `/` - Get all PFE topics
  - POST `/` - Create new PFE topic (admin, departmentHead)
  - PUT `/:id` - Update PFE topic (admin, departmentHead)
  - DELETE `/:id` - Delete PFE topic (admin, departmentHead)
  - POST `/import` - Import topics from data (admin, departmentHead)

- **Juries**: `/api/juries`
  - GET `/` - Get all juries
  - POST `/` - Create new jury (admin, departmentHead)
  - PUT `/:id` - Update jury (admin, departmentHead)
  - DELETE `/:id` - Delete jury (admin, departmentHead)

- **Time Slots**: `/api/timeslots`
  - GET `/` - Get time slots
  - POST `/` - Create time slot
  - PUT `/:id` - Update time slot
  - DELETE `/:id` - Delete time slot
  - POST `/bulk` - Bulk create time slots

## Business Rules & Constraints

1. Each teacher must participate in 3× the number of projects they supervise
2. No teacher can have overlapping presentation sessions
3. Teachers must submit available time slots
4. Each jury includes:
   - The Supervisor
   - A Jury President
   - A Reporter
5. Jury members cannot have the same role for a single presentation

## Troubleshooting

- **MongoDB Connection Issues**: Ensure your MongoDB server is running and the connection string in `.env` is correct
- **API Errors**: Check the server logs for detailed error messages
- **Authentication Issues**: Verify that your JWT_SECRET is properly set and tokens are being generated

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this project.

## License

This project is licensed under the MIT License.
