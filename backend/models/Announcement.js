const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 2000
    },

    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);