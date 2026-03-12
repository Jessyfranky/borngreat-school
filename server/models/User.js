const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Common fields
  role: {
    type: String,
    enum: ['teacher', 'student', 'admin'],
    required: true
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  staffId: {
    type: String,
    unique: true,
    sparse: true
  },
  fullName: { type: String, required: true, trim: true },
  pin: { type: String, required: true },

  // Student-specific
  className: { type: String },
  section: { type: String },
  admissionYear: { type: Number },
  dateOfBirth: { type: Date },

  // Teacher-specific
  subject: { type: String },
  phone: { type: String },
  classes: [{ type: String }],

  // State
  isActive: { type: Boolean, default: true },
  mustChangePin: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

// Hash PIN before saving
userSchema.pre('save', async function () {
  if (!this.isModified('pin')) return;
  this.pin = await bcrypt.hash(this.pin, 10);
});

// Compare PIN
userSchema.methods.comparePin = async function (enteredPin) {
  return bcrypt.compare(enteredPin, this.pin);
};

// Auto-generate Student ID
userSchema.statics.generateStudentId = async function (year) {
  const y = year || new Date().getFullYear();
  let num = 1;
  while (true) {
    const studentId = `BG-${y}-${String(num).padStart(3, '0')}`;
    const exists = await this.findOne({ studentId });
    if (!exists) return studentId;
    num++;
  }
};

// Auto-generate Staff ID
userSchema.statics.generateStaffId = async function () {
  let num = 1;
  while (true) {
    const staffId = `BG-TCH-${String(num).padStart(3, '0')}`;
    const exists = await this.findOne({ staffId });
    if (!exists) return staffId;
    num++;
  }
};

// Auto-generate Admin ID
userSchema.statics.generateAdminId = async function () {
  let num = 1;
  while (true) {
    const staffId = `BG-ADM-${String(num).padStart(3, '0')}`;
    const exists = await this.findOne({ staffId });
    if (!exists) return staffId;
    num++;
  }
};

module.exports = mongoose.model('User', userSchema);