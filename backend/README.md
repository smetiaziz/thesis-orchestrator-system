
# PFE Scheduling System - Backend API

This is the backend API for the PFE (Final Year Project) Scheduling System.

## Tech Stack

- Node.js & Express
- MongoDB (Mongoose ODM)
- JWT Authentication
- Express Validator

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on the `.env.example` file
4. Run the application: `npm run dev` (development) or `npm start` (production)

## Environment Variables

Create a `.env` file in the root of the project with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pfe-scheduling
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current logged-in user

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Departments

- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create new department (admin only)
- `PUT /api/departments/:id` - Update department (admin only)
- `DELETE /api/departments/:id` - Delete department (admin only)

### Teachers

- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get single teacher
- `POST /api/teachers` - Create new teacher (admin, departmentHead)
- `PUT /api/teachers/:id` - Update teacher (admin, departmentHead)
- `DELETE /api/teachers/:id` - Delete teacher (admin)
- `POST /api/teachers/import` - Import teachers from data (admin)

### PFE Topics

- `GET /api/topics` - Get all PFE topics
- `GET /api/topics/:id` - Get single PFE topic
- `POST /api/topics` - Create new PFE topic (admin, departmentHead)
- `PUT /api/topics/:id` - Update PFE topic (admin, departmentHead)
- `DELETE /api/topics/:id` - Delete PFE topic (admin, departmentHead)
- `POST /api/topics/import` - Import topics from data (admin, departmentHead)

### Juries

- `GET /api/juries` - Get all juries
- `GET /api/juries/:id` - Get single jury
- `POST /api/juries` - Create new jury (admin, departmentHead)
- `PUT /api/juries/:id` - Update jury (admin, departmentHead)
- `DELETE /api/juries/:id` - Delete jury (admin, departmentHead)

### Time Slots

- `GET /api/timeslots` - Get time slots
- `POST /api/timeslots` - Create time slot
- `PUT /api/timeslots/:id` - Update time slot
- `DELETE /api/timeslots/:id` - Delete time slot
- `POST /api/timeslots/bulk` - Bulk create time slots

## Business Rules & Constraints

1. Each teacher must participate in 3× the number of projects they supervise
2. No teacher can have overlapping presentation sessions
3. Teachers must submit available time slots
4. Each jury includes:
   - The Supervisor
   - A Jury President
   - A Reporter
5. Jury members cannot have the same role for a single presentation
