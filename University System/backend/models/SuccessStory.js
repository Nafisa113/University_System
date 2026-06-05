const mongoose = require("mongoose");

const successStorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true
    },

    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true
    },

    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true
    },

    companyLogo: {
      type: String,
      default: ""
    },

    studentImage: {
      type: String,
      default: ""
    },

    profileLink: {
      type: String,
      default: "",
      trim: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SuccessStory", successStorySchema);