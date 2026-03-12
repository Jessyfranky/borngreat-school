const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  subject:     { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dueDate:     { type: String, default: '' },          // stored as string e.g. "Friday 20 March"
  className:   { type: String, required: true },        // which class it targets
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
