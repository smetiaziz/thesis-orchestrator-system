
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name']
  },
  inscrNumber: {
    type: String,
    required: [true, 'Please add an inscription number']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  department: {
    type: String,
    required: [true, 'Please add a department']
  },
  field: {
    type: String,
  },
  subject: {
    type: String
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  pfeTopicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PFETopic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', StudentSchema);
