
const mongoose = require('mongoose');

const ClassroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a classroom name'],
    trim: true
  },
  building: {
    type: String,
    required: [true, 'Please provide a building name'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide classroom capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  department: {
    type: String,
    required: [true, 'Please provide a department']
  },
  hasProjector: {
    type: Boolean,
    default: true
  },
  hasComputers: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Classroom', ClassroomSchema);
