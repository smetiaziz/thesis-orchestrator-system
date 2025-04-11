
const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name']
  },
  department: {
    type: String,
    required: [true, 'Please add a department']
  },
  rank: {
    type: String,
    required: [true, 'Please add a rank']
  },
  course: {
    type: Number,
    default: 0
  },
  td: {
    type: Number,
    default: 0
  },
  tp: {
    type: Number,
    default: 0
  },
  coefficient: {
    type: Number,
    default: 1
  },
  numSupervisionSessions: {
    type: Number,
    default: 0
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  supervisedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PFETopic'
  }],
  juryParticipations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jury'
  }]
});

module.exports = mongoose.model('Teacher', TeacherSchema);
