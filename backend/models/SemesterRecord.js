const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name:    { type: String, default: "", trim: true },
    credits: { type: Number, required: true, min: 1 },
    grade:   { type: String, required: true, trim: true }
  },
  { _id: false }
);

const semesterRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },

    gpa: {
      type: Number,
      required: true
    },

    credits: {
      type: Number,
      required: true
    },

    courses: {
      type: [courseSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SemesterRecord", semesterRecordSchema);