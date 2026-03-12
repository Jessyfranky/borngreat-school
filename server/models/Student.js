const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  admissionNumber: { type: String, unique: true },
  class: String,
  password: String,
  role: {
    type: String,
    default: "student"
  }
});

module.exports = mongoose.model("Student", studentSchema);