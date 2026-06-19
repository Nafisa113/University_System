const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 150
    },

    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: 3000
    },

    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "remote", "contract"],
      default: "full-time"
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120
    },

    applyLink: {
      type: String,
      default: "",
      trim: true
    },

    deadline: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open"
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);