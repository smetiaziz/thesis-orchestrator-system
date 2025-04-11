
const mongoose = require('mongoose');

const PFETopicSchema = new mongoose.Schema({
  topicName: {
    type: String,
    required: [true, 'Please add a topic name'],
    trim: true
  },
  studentName: {
    type: String,
    required: [true, 'Please add a student name']
  },
  studentEmail: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Please add a supervisor ID']
  },
  supervisorName: {
    type: String,
    required: [true, 'Please add a supervisor name']
  },
  department: {
    type: String,
    required: [true, 'Please add a department']
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed'],
    default: 'pending'
  },
  presentationDate: {
    type: Date
  },
  presentationLocation: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PFETopic', PFETopicSchema);
