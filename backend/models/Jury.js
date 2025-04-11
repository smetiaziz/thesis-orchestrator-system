
const mongoose = require('mongoose');

const JurySchema = new mongoose.Schema({
  pfeTopicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PFETopic',
    required: [true, 'Please add a PFE topic ID']
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Please add a supervisor ID']
  },
  presidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Please add a president ID']
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Please add a reporter ID']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date']
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that president and reporter are not the same as supervisor
JurySchema.path('presidentId').validate(function(value) {
  return String(value) !== String(this.supervisorId);
}, 'President cannot be the same as supervisor');

JurySchema.path('reporterId').validate(function(value) {
  return String(value) !== String(this.supervisorId);
}, 'Reporter cannot be the same as supervisor');

// Validate that president and reporter are not the same person
JurySchema.path('reporterId').validate(function(value) {
  return String(value) !== String(this.presidentId);
}, 'Reporter cannot be the same as president');

module.exports = mongoose.model('Jury', JurySchema);
